import "server-only";
import type { BlockNode, NavigationMenuItem, SiteMenuRecord } from "@nexpress/core";
import { isPluginModuleEnabled } from "@nexpress/core";
import { getFormDefinitionRepository, getRedirectRepository, getScopedRepository } from "@nexpress/database";
import { slugify } from "@nexpress/seo-core";
import { drawLayout, expandSeoTemplate, parseBridgePush, resolveAssetUrl, rewriteAbsoluteUrl, rewriteBlockLinks, schemaFromBridge, type BridgeContentItem, type BridgeMenuItem, type BridgePush } from "@nexpress/wp-importer";
import { revalidatePath } from "@/lib/cache";
import { WP_BRIDGE_PLUGIN_ID } from "@/plugins/wp-bridge";
import { ingestImages, remapContentImages } from "./media";
import { addBridgeReport, readMediaMap } from "./store";

const FIELD: Record<string, string> = {
  email: "email",
  tel: "tel",
  phone: "tel",
  url: "url",
  number: "number",
  textarea: "textarea",
  select: "select",
  radio: "radio",
  checkbox: "checkbox",
  checkboxes: "checkboxes",
};

const contentIdFor = (wpId: string) => `cnt_wp_${wpId}`;

function menuNodes(items: BridgeMenuItem[], origin: string, prefix: string): NavigationMenuItem[] {
  return items.slice(0, 40).map((item, index) => ({
    id: `${prefix}_${index}`,
    label: item.label,
    href: rewriteAbsoluteUrl(item.href, origin, ""),
    source: { kind: "custom" as const },
    children: menuNodes(item.children, origin, `${prefix}_${index}`),
  }));
}

async function open(siteId: string, kind: BridgePush["kind"]): Promise<boolean> {
  const moduleId =
    kind === "content" ? "content" : kind === "media" ? "media" : kind === "forms" ? "forms" : kind === "design" ? "design" : kind === "seo" || kind === "redirects" ? "seo" : "connect";
  return isPluginModuleEnabled(siteId, WP_BRIDGE_PLUGIN_ID, moduleId);
}

async function writeContent(siteId: string, origin: string, items: BridgeContentItem[], linksOn: boolean) {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale || "tr";
  const redirects = getRedirectRepository(siteId);
  const map = await readMediaMap(siteId);
  const existingRows = await repo.listContents({ locale });
  const slugOwner = new Map(existingRows.map((row) => [`${row.type}:${row.slug}`, row.id]));
  const delta = { created: 0, updated: 0, failed: 0, links: 0, unknown: 0, images: 0, redirects: 0 };
  const imageQueue: Array<{ url: string; alt: string }> = [];

  for (const item of items) {
    for (const term of [...item.categories.map((term) => ({ ...term, type: "category" as const })), ...item.tags.map((term) => ({ ...term, type: "tag" as const, parent: "" }))]) {
      const have = (await repo.listTaxonomies()).find((row) => row.taxonomyType === term.type && row.slug === term.slug);
      if (!have) await repo.saveTaxonomy({ taxonomyType: term.type, slug: term.slug, name: term.name, parentId: undefined });
    }
  }
  const terms = await repo.listTaxonomies();
  for (const item of items) {
    for (const term of item.categories) {
      if (!term.parent) continue;
      const id = terms.find((row) => row.taxonomyType === "category" && row.slug === term.slug)?.id;
      const parentId = terms.find((row) => row.taxonomyType === "category" && row.slug === term.parent)?.id;
      if (id && parentId) await repo.saveTaxonomy({ id, taxonomyType: "category", slug: term.slug, name: term.name, parentId });
    }
  }

  for (const item of items) {
    try {
      const contentId = contentIdFor(item.wpId);
      const existing = existingRows.find((row) => row.id === contentId) ?? null;
      const type = item.kind === "post" ? "post" : "page";
      let slug = item.front ? "ana-sayfa" : slugify(item.slug || item.title, locale).slice(0, 100) || `icerik-${item.wpId}`;
      if (!existing) {
        let n = 2;
        const base = slug;
        while (slugOwner.has(`${type}:${slug}`) && slugOwner.get(`${type}:${slug}`) !== contentId) slug = `${base.slice(0, 90)}-${n++}`;
        slugOwner.set(`${type}:${slug}`, contentId);
      } else slug = existing.slug;
      const drawn = item.layout.length
        ? drawLayout(item.layout, { baseUrl: origin })
        : drawLayout(item.html ? [{ type: "html", html: item.html }] : [], { baseUrl: origin });
      delta.unknown += drawn.unknown;
      let blocks = drawn.blocks;
      if (linksOn) {
        const rewritten = rewriteBlockLinks(blocks, origin, "");
        blocks = rewritten.blocks;
        delta.links += rewritten.count;
      }
      const featuredAbs = item.featured ? resolveAssetUrl(item.featured, origin) : "";
      for (const url of [featuredAbs, ...drawn.images]) {
        if (url.startsWith("http") && !map[url] && !imageQueue.some((image) => image.url === url)) imageQueue.push({ url, alt: "" });
      }
      const featured = featuredAbs ? map[featuredAbs] ?? featuredAbs : null;
      const published = item.status === "publish" || item.status === "private";
      const siteName = (await repo.getSite())?.name ?? "";
      const mapped = schemaFromBridge({
        kind: type === "post" ? "post" : "page",
        schemaType: item.schema.type || item.seo.schemaType,
        name: item.schema.name,
        description: item.schema.description,
        os: item.schema.os,
        category: item.schema.category || item.categories[0]?.name || "",
        price: item.schema.price,
        currency: item.schema.currency,
        faqs: item.schema.faqs,
        slug,
      });
      const date = item.date ? new Date(item.date.replace(" ", "T")) : null;
      await repo.saveContent({
        contentId,
        type,
        authorName: item.author || undefined,
        status: published ? "published" : "draft",
        importanceScore: type === "page" ? 7 : 6,
        schemaType: mapped.schemaType,
        schemaAttributes: {
          ...(existing?.schemaAttributes ?? {}),
          migratedFrom: "wordpress",
          wpId: item.wpId,
          wpKind: item.kind,
          originalPermalink: item.link,
          ...(mapped.richSchema ? { richSchema: mapped.richSchema } : {}),
          _publishing: {
            visibility: item.status === "private" ? "private" : "public",
            authorName: item.author || undefined,
            categories: item.categories.map((term) => term.slug),
            tags: item.tags.map((term) => term.slug),
            featuredImageUrl: featured || undefined,
            focusKeyword: item.seo.keyword || undefined,
            allowComments: true,
          },
        },
        featuredImage: featured,
        locale,
        slug,
        title: item.title,
        excerpt: item.excerpt || undefined,
        tldr: (item.excerpt || item.title).slice(0, 260),
        blocks: blocks as BlockNode[],
        metaTitle: expandSeoTemplate(item.seo.title, { title: item.title, siteName, category: item.categories[0]?.name }) || undefined,
        metaDescription: expandSeoTemplate(item.seo.description, { title: item.title, siteName, category: item.categories[0]?.name }) || undefined,
        canonicalUrl: item.seo.canonical || undefined,
        noIndex: item.seo.noindex,
        ...(!existing && date && !Number.isNaN(date.getTime()) ? { publishedAt: date } : {}),
      });
      if (existing) delta.updated += 1;
      else delta.created += 1;
      for (const comment of item.comments) {
        await repo.saveCommentReview({
          id: `cmt_wp_${comment.wpId}`,
          contentId,
          authorName: comment.author || "Ziyaretçi",
          authorEmail: comment.email || undefined,
          entryType: "comment",
          body: comment.body,
          status: comment.status === "approve" || comment.status === "approved" || comment.status === "1" ? "approved" : "pending",
        });
      }
      if (published && item.status !== "private" && item.link) {
        let from = "";
        try {
          from = new URL(item.link).pathname;
        } catch {
          from = "";
        }
        const to = item.front || slug === "ana-sayfa" ? "/" : `/${slug}`;
        if (from && from !== to && from !== "/") {
          const saved = await redirects.save({ fromPath: from, toPath: to, code: 301, note: "WordPress köprüsü" });
          if (saved.ok) delta.redirects += 1;
        }
      }
      await revalidatePath(slug === "ana-sayfa" ? "/" : `/${slug}`);
    } catch {
      delta.failed += 1;
    }
  }
  const images = await ingestImages(siteId, imageQueue.slice(0, 8));
  delta.images += images.downloaded;
  if (images.downloaded) await remapContentImages(siteId, locale);
  await addBridgeReport(siteId, delta);
  return { ...delta, imageFailed: images.failed, waiting: Math.max(0, imageQueue.length - 8) };
}

/** Doğrulanmış paketi yazar. Kapalı modül ve ürün reddedilir. */
export async function applyBridgePush(siteId: string, body: unknown, origin: string): Promise<{ ok: true; detail: unknown } | { ok: false; error: string }> {
  const parsed = parseBridgePush(body);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const push = parsed.push;
  if (!(await open(siteId, push.kind))) return { ok: false, error: "Bu modül kapalı." };
  const linksOn = await isPluginModuleEnabled(siteId, WP_BRIDGE_PLUGIN_ID, "links");
  const repo = getScopedRepository(siteId);

  if (push.kind === "begin" || push.kind === "site") {
    return { ok: true, detail: { title: push.kind === "site" ? push.title : "", products: parsed.notes.products } };
  }

  if (push.kind === "content") {
    const detail = await writeContent(siteId, origin, push.items, linksOn);
    return { ok: true, detail: { ...detail, products: parsed.notes.products, dropped: parsed.notes.dropped } };
  }

  if (push.kind === "media") {
    const images = await ingestImages(siteId, push.items);
    const locale = (await repo.getSite())?.defaultLocale || "tr";
    if (images.downloaded) await remapContentImages(siteId, locale);
    await addBridgeReport(siteId, { images: images.downloaded });
    return { ok: true, detail: images };
  }

  if (push.kind === "forms") {
    const forms = getFormDefinitionRepository(siteId);
    let saved = 0;
    for (const form of push.items) {
      const id = `frm_wp_${form.wpId}`;
      const spec = {
        fields: form.fields.map((field, index) => ({
          id: `f_${index}`,
          name: `alan_${index + 1}`,
          label: field.label,
          type: FIELD[field.type] ?? "text",
          required: field.required,
          placeholder: "",
          help: "",
          width: "full",
          options: field.options,
        })),
        submitLabel: "Gönder",
        successMessage: "İletiniz alındı.",
        redirectUrl: "",
      };
      const notify = form.notify.includes("@") ? { enabled: true, to: [form.notify] } : undefined;
      const current = await forms.get(id);
      if (current) await forms.update(id, { name: form.name, spec, notify });
      else await forms.create({ id, name: form.name, spec, notify });
      saved += 1;
    }
    await addBridgeReport(siteId, { forms: saved });
    return { ok: true, detail: { forms: saved } };
  }

  if (push.kind === "design") {
    const locale = (await repo.getSite())?.defaultLocale || "tr";
    const layout = await repo.getNavigationLayout(locale);
    if (!layout) return { ok: false, error: "Üst şerit kaydı yok." };
    const menus: SiteMenuRecord[] = [...(layout.footerConfig.menus ?? [])];
    let headerItems: NavigationMenuItem[] | null = null;
    push.menus.forEach((menu, menuIndex) => {
      const items = menuNodes(menu.items, origin, `m_${menuIndex + 1}`);
      const header = /header|primary|main|ust/i.test(menu.location);
      const named = menus.findIndex((row) => row.name.toLocaleLowerCase("tr") === menu.name.toLocaleLowerCase("tr"));
      const target = header ? (menus.findIndex((row) => row.header) >= 0 ? menus.findIndex((row) => row.header) : named) : named;
      if (header) headerItems = items;
      if (target >= 0) menus[target] = { ...menus[target]!, items, header: menus[target]!.header || header };
      else menus.push({ id: `menu_wp_${menus.length + 1}`, name: menu.name, header, items });
    });
    const footer = {
      ...layout.footerConfig,
      menus,
      widgets: (layout.footerConfig.widgets ?? []).map((widget) =>
        widget.type === "contact_card"
          ? {
              ...widget,
              settings: {
                ...widget.settings,
                ...(push.phone ? { phone: push.phone } : {}),
                ...(push.email ? { email: push.email } : {}),
                ...(push.address ? { address: push.address } : {}),
              },
            }
          : widget
      ),
    };
    const header = {
      ...layout.headerConfig,
      topBar: {
        ...layout.headerConfig.topBar,
        ...(push.phone ? { contactPhone: push.phone } : {}),
        ...(push.email ? { contactEmail: push.email } : {}),
      },
    };
    await repo.saveNavigationLayout({
      locale,
      headerConfig: header,
      footerConfig: footer,
      ...(headerItems ? { menuItems: headerItems } : {}),
      menus,
    });
    if (push.logoText || push.container) {
      await repo.saveSiteSettings({
        customizer: {
          header: push.logoText ? { logoText: push.logoText } : {},
          layout: push.container ? { articleWidth: `${push.container}px` } : {},
        },
      });
    }
    await addBridgeReport(siteId, { menus: push.menus.length });
    await revalidatePath("/");
    return { ok: true, detail: { menus: push.menus.length } };
  }

  if (push.kind === "seo") {
    await repo.saveSiteSettings({
      seo: {
        ...(push.titleTemplate.includes("%") ? { titleTemplate: push.titleTemplate } : {}),
        ...(push.description ? { defaultMetaDescription: push.description } : {}),
        ...(push.organizationName ? { organizationName: push.organizationName } : {}),
        ...(push.organizationLogo.startsWith("https://") ? { organizationLogo: push.organizationLogo } : {}),
        ...(push.sameAs.length ? { sameAs: push.sameAs } : {}),
      },
    });
    return { ok: true, detail: { seo: true } };
  }

  const redirects = getRedirectRepository(siteId);
  let saved = 0;
  for (const item of push.items) {
    const to = item.to.startsWith("http") ? item.to : rewriteAbsoluteUrl(item.to, origin, "") || item.to;
    const result = await redirects.save({ fromPath: item.from, toPath: to, code: 301, note: "WordPress köprüsü" });
    if (result.ok) saved += 1;
  }
  await addBridgeReport(siteId, { redirects: saved });
  return { ok: true, detail: { redirects: saved } };
}
