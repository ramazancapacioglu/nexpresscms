"use server";

import { headers } from "next/headers";
import { cloneStarterBlocks, isTemplateKind, readTemplateMeta, sanitizeBehavior, sanitizeConditions, STARTER_TEMPLATES, validateTemplate, type BlockNode, type TemplateKind } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { invalidateSite, revalidatePath } from "@/lib/cache";
import { requireUser } from "@/lib/auth/session";

export type TemplateResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function ctx(audit: string) {
  const session = await requireUser({ audit });
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale ?? "tr";
  return { session, siteId, repo, locale };
}

async function refresh(siteId: string) {
  await invalidateSite(siteId);
  await revalidatePath("/admin/appearance/templates");
  await revalidatePath("/admin/themes");
}

function buildCustomSkeletonBlocks(
  kind: TemplateKind,
  layoutMode: "full" | "right-sidebar" | "left-sidebar",
  suffix: string
): BlockNode[] {
  const id = (name: string) => `tpl_${name}_${suffix}`;

  if (kind === "header") {
    return [
      {
        id: id("hdr_row"),
        type: "columns",
        props: { ratio: "4+8", gap: "1.5rem", verticalAlign: "center" },
        children: [
          { id: id("hdr_c1"), type: "column", props: { widthPct: 33 }, children: [{ id: id("logo"), type: "tpl_site_logo", props: { showTagline: false } }] },
          { id: id("hdr_c2"), type: "column", props: { widthPct: 67 }, children: [{ id: id("menu"), type: "tpl_menu", props: { align: "right" } }] },
        ],
      },
    ];
  }

  if (kind === "footer") {
    return [
      { id: id("ftr_div"), type: "divider_spacer", props: { style: "line", heightPx: 24 } },
      { id: id("ftr_copy"), type: "tpl_copyright", props: {} },
    ];
  }

  if (kind === "sidebar") {
    return [
      { id: id("sb_search"), type: "search_box", props: { placeholder: "Sitede ara…", buttonText: "Ara" } },
      { id: id("sb_recent"), type: "dynamic_list", props: { title: "Son Yazılar", source: "post", count: 4, layout: "list", showImage: false, showExcerpt: false, showDate: true, excludeCurrent: true } },
      { id: id("sb_info"), type: "info_box", props: { icon: "megaphone", title: "Özel Kampanya", text: "Kurumsal paketlerde sınırlı süreli fırsatları inceleyin.", linkText: "Fırsatları Gör", linkHref: "/tr/magaza", tone: "primary" } },
    ];
  }

  const mainChildren: BlockNode[] =
    kind === "category" || kind === "tag" || kind === "shop" || kind === "product_category" || kind === "search"
      ? [
          { id: id("arch_title"), type: "tpl_archive_title", props: { showCount: true, showDescription: true } },
          { id: id("arch_list"), type: "tpl_archive_list", props: { columns: layoutMode === "full" ? 3 : 2, layout: "grid", showImage: true, showExcerpt: true, showDate: kind !== "shop" && kind !== "product_category" } },
        ]
      : kind === "product"
        ? [
            { id: id("prd_bc"), type: "tpl_breadcrumb", props: {} },
            { id: id("prd_title"), type: "tpl_post_title", props: { level: "h1", showTldr: true } },
            { id: id("prd_img"), type: "tpl_featured_image", props: { rounded: true, aspect: "16/9" } },
            { id: id("prd_buy"), type: "tpl_product_buy", props: { buttonText: "Sepete Ekle", showStock: true, showSku: true } },
            { id: id("prd_body"), type: "tpl_post_content", props: {} },
          ]
        : [
            { id: id("pst_bc"), type: "tpl_breadcrumb", props: {} },
            { id: id("pst_title"), type: "tpl_post_title", props: { level: "h1", showTldr: true } },
            ...(kind === "post" ? [{ id: id("pst_meta"), type: "tpl_post_meta" as const, props: { showAuthor: true, showDate: true, showReadingTime: true } }] : []),
            { id: id("pst_img"), type: "tpl_featured_image", props: { rounded: true, aspect: "16/9" } },
            { id: id("pst_body"), type: "tpl_post_content", props: {} },
          ];

  if (layoutMode === "full") {
    return mainChildren;
  }

  const sideWidgets: BlockNode[] = [
    { id: id("side_search"), type: "search_box", props: { placeholder: "Ara…", buttonText: "Ara" } },
    { id: id("side_posts"), type: "dynamic_list", props: { title: kind === "product" || kind === "shop" || kind === "product_category" ? "Öne Çıkan Ürünler" : "Son Yazılar", source: kind === "product" || kind === "shop" || kind === "product_category" ? "product" : "post", count: 4, layout: "list", showImage: false, showExcerpt: false, showDate: true, excludeCurrent: true } },
    { id: id("side_camp"), type: "info_box", props: { icon: "megaphone", title: "Özel Kampanya", text: "Yeni sezon ve kurumsal fırsatları kaçırmayın.", linkText: "İncele", linkHref: "/tr/magaza", tone: "primary" } },
  ];

  const mainCol: BlockNode = { id: id("col_main"), type: "column", props: { widthPct: 67 }, children: mainChildren };
  const sideCol: BlockNode = { id: id("col_side"), type: "column", props: { widthPct: 33 }, children: sideWidgets };

  return [
    {
      id: id("row_layout"),
      type: "columns",
      props: { ratio: layoutMode === "left-sidebar" ? "4+8" : "8+4", gap: "2rem", verticalAlign: "top" },
      children: layoutMode === "left-sidebar" ? [sideCol, mainCol] : [mainCol, sideCol],
    },
  ];
}

/** Hazır şablondan veya özel ad/yerleşimle yeni şablon oluşturur. */
export async function createTemplateAction(input: {
  starterId?: string;
  kind?: TemplateKind;
  customName?: string;
  customDescription?: string;
  layoutMode?: "full" | "right-sidebar" | "left-sidebar";
  makeDefault?: boolean;
}): Promise<TemplateResult<{ id: string; name: string; kind: TemplateKind }>> {
  const { session, siteId, repo, locale } = await ctx("template.create");
  const suffix = Math.random().toString(36).slice(2, 8);

  const starter = input.starterId
    ? STARTER_TEMPLATES.find((s) => s.id === input.starterId)
    : undefined;

  const targetKind: TemplateKind | undefined = starter?.kind ?? input.kind;
  if (!targetKind || !isTemplateKind(targetKind)) {
    return { ok: false, error: "Geçerli bir şablon türü seçilmedi." };
  }

  const name =
    input.customName?.trim() ||
    starter?.name ||
    `Yeni ${targetKind.toUpperCase()} Şablonu`;
  const description =
    input.customDescription?.trim() ||
    starter?.description ||
    "Özel görünüm şablonu";

  const blocks = starter
    ? cloneStarterBlocks(starter.blocks, suffix)
    : buildCustomSkeletonBlocks(targetKind, input.layoutMode ?? "full", suffix);

  const res = await repo.saveContent({
    actor: { id: session.sub, email: session.email },
    type: "template",
    status: "draft",
    importanceScore: 1,
    schemaType: "WebPage",
    schemaAttributes: { template: { kind: targetKind, isDefault: false } },
    locale,
    region: "TR",
    slug: `tpl-${suffix}`,
    title: name,
    tldr: description,
    blocks,
  } as never);

  if (input.makeDefault) {
    await setDefaultTemplateAction({ id: res.contentId, makeDefault: true });
  } else {
    await refresh(siteId);
  }

  return { ok: true, id: res.contentId, name, kind: targetKind };
}

/** Mevcut bir şablonu çoğaltır (kopyalar). */
export async function duplicateTemplateAction(input: { id: string }): Promise<TemplateResult<{ id: string; name: string; kind: TemplateKind }>> {
  const { session, siteId, repo, locale } = await ctx("template.duplicate");
  const all = await repo.listContents({ locale, type: "template" });
  const source = all.find((c) => c.contentId === input.id);
  const meta = source ? readTemplateMeta(source.schemaAttributes) : null;
  if (!source || !meta) return { ok: false, error: "Kopyalanacak şablon bulunamadı." };
  const suffix = Math.random().toString(36).slice(2, 8);
  const newName = `${source.title} (Kopya)`;
  const res = await repo.saveContent({
    actor: { id: session.sub, email: session.email },
    type: "template",
    status: "draft",
    importanceScore: 1,
    schemaType: "WebPage",
    schemaAttributes: { template: { ...meta, isDefault: false } },
    locale,
    region: "TR",
    slug: `tpl-${suffix}`,
    title: newName,
    tldr: source.tldr ?? "",
    blocks: cloneStarterBlocks(source.blocks, suffix),
  } as never);
  await refresh(siteId);
  return { ok: true, id: res.contentId, name: newName, kind: meta.kind };
}

/** Türün varsayılan şablonunu değiştirir (türde yalnızca bir varsayılan). Hatalı şablon (zorunlu yuva yok) varsayılan yapılamaz. */
export async function setDefaultTemplateAction(input: { id: string; makeDefault: boolean }): Promise<TemplateResult> {
  const { session, siteId, repo, locale } = await ctx("template.default");
  const all = await repo.listContents({ locale, type: "template" });
  const target = all.find((c) => c.contentId === input.id);
  const meta = target ? readTemplateMeta(target.schemaAttributes) : null;
  if (!target || !meta) return { ok: false, error: "Şablon bulunamadı." };
  if (input.makeDefault) {
    const errors = validateTemplate(meta.kind, target.blocks).filter((i) => i.level === "error");
    if (errors.length) return { ok: false, error: `Varsayılan yapılamaz: ${errors[0]!.message}` };
  }
  for (const c of all) {
    const m = readTemplateMeta(c.schemaAttributes);
    if (!m || m.kind !== meta.kind) continue;
    const want = c.contentId === input.id ? input.makeDefault : false;
    if (m.isDefault === want) continue;
    await repo.saveContent({
      actor: { id: session.sub, email: session.email },
      contentId: c.contentId,
      type: "template",
      status: "draft",
      importanceScore: c.importanceScore,
      schemaType: c.schemaType,
      schemaAttributes: { ...c.schemaAttributes, template: { ...m, isDefault: want } },
      locale,
      region: "TR",
      slug: c.slug,
      title: c.title,
      tldr: c.tldr ?? "",
      blocks: c.blocks,
    } as never);
  }
  await refresh(siteId);
  return { ok: true };
}

export async function deleteTemplateAction(input: { id: string }): Promise<TemplateResult> {
  const { siteId, repo, locale } = await ctx("template.delete");
  const all = await repo.listContents({ locale, type: "template" });
  if (!all.some((c) => c.contentId === input.id)) return { ok: false, error: "Şablon bulunamadı." };
  await repo.deleteContents([input.id]);
  await refresh(siteId);
  return { ok: true };
}

/** Bir kategori/etiketin arşiv şablonunu seçer (boş = türün varsayılanı, "none" = yerleşik görünüm). */
export async function assignTaxonomyTemplateAction(input: { taxonomyId: string; templateId: string | null }): Promise<TemplateResult> {
  const { siteId, repo, locale } = await ctx("template.assign");
  const term = (await repo.listTaxonomies()).find((t) => t.id === input.taxonomyId);
  if (!term) return { ok: false, error: "Terim bulunamadı." };
  const kind = term.taxonomyType;
  if (!isTemplateKind(kind) || (kind !== "category" && kind !== "tag")) return { ok: false, error: "Bu terim türü şablon desteklemiyor." };
  if (input.templateId && input.templateId !== "none") {
    const t = (await repo.listContents({ locale, type: "template" })).find((c) => c.contentId === input.templateId);
    if (!t || readTemplateMeta(t.schemaAttributes)?.kind !== kind) return { ok: false, error: "Seçilen şablon bu terim türüne uygun değil." };
  }
  await repo.saveTaxonomy({ id: term.id, taxonomyType: term.taxonomyType, slug: term.slug, name: term.name, description: term.description ?? undefined, parentId: term.parentId, imageUrl: term.imageUrl, sortOrder: term.sortOrder, color: term.color ?? undefined, seoTitle: term.seoTitle ?? undefined, seoDescription: term.seoDescription ?? undefined, templateId: input.templateId || null });
  await refresh(siteId);
  await revalidatePath("/admin/taxonomies");
  return { ok: true };
}

/** Şablonun görüntüleme koşullarını ve (header için) yapışkan/cam davranışını kaydeder. Koşullar doğrulanır ve sınırlanır. */
export async function updateTemplateSettingsAction(input: { id: string; conditions: unknown; behavior?: unknown }): Promise<TemplateResult> {
  const { session, siteId, repo, locale } = await ctx("template.settings");
  const target = (await repo.listContents({ locale, type: "template" })).find((c) => c.contentId === input.id);
  const meta = target ? readTemplateMeta(target.schemaAttributes) : null;
  if (!target || !meta) return { ok: false, error: "Şablon bulunamadı." };
  const conditions = sanitizeConditions(input.conditions);
  const clean = sanitizeBehavior(input.behavior);
  // Alanlar türe göre: header davranışı yalnızca header'a, içerik genişliği yalnızca sayfa/yazı/ürün şablonuna yazılır
  const behavior = !clean ? undefined : meta.kind === "header" ? { ...clean, contentWidth: undefined } : ["page", "post", "product"].includes(meta.kind) ? { contentWidth: clean.contentWidth } : undefined;
  const { conditions: _c, behavior: _b, ...rest } = meta;
  await repo.saveContent({
    actor: { id: session.sub, email: session.email },
    contentId: target.contentId,
    type: "template",
    status: "draft",
    importanceScore: target.importanceScore,
    schemaType: target.schemaType,
    schemaAttributes: { ...target.schemaAttributes, template: { ...rest, ...(conditions.include.length || conditions.exclude.length ? { conditions } : {}), ...(sanitizeBehavior(behavior) ? { behavior: sanitizeBehavior(behavior) } : {}) } },
    locale,
    region: "TR",
    slug: target.slug,
    title: target.title,
    tldr: target.tldr ?? "",
    blocks: target.blocks,
  } as never);
  await refresh(siteId);
  return { ok: true };
}
