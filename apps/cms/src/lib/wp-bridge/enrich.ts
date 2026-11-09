import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { BlockNode } from "@nexpress/core";
import { hashPassword } from "@nexpress/core/password";
import { getScopedRepository, getUserRepository } from "@nexpress/database";
import { expandSeoTemplate, schemaFromBridge } from "@nexpress/wp-importer";

interface EnrichFile {
  users: Array<{ email: string; name: string }>;
  media: Array<{ url: string; path?: string; alt: string; title: string; caption: string; description: string; names?: string[] }>;
  posts: Array<{
    wpId: string;
    author: string;
    seoTitle: string;
    seoDescription: string;
    schemaType: string;
    name: string;
    description: string;
    os: string;
    category: string;
    price: string;
    currency: string;
    faqs: Array<{ q: string; a: string }>;
  }>;
}

function baseName(url: string): string {
  try {
    return decodeURIComponent(new URL(url, "https://yerel.invalid").pathname.split("/").pop() ?? "").toLocaleLowerCase("tr");
  } catch {
    return "";
  }
}

function paintBlocks(
  blocks: BlockNode[],
  byUrl: Map<string, { alt: string; title: string; caption: string }>,
  byName: Map<string, { alt: string; title: string; caption: string }>
): { blocks: BlockNode[]; changed: boolean } {
  let changed = false;
  const walk = (nodes: BlockNode[]): BlockNode[] =>
    nodes.map((node) => {
      const children = node.children ? walk(node.children) : node.children;
      if (node.type !== "image_figure") return children === node.children ? node : { ...node, children };
      const props = { ...(node.props ?? {}) } as Record<string, unknown>;
      const source = String(props.url ?? "");
      const fact = byUrl.get(source) ?? byName.get(baseName(source));
      if (!fact) return children === node.children ? node : { ...node, children };
      if (!String(props.altText ?? "").trim() && fact.alt) {
        props.altText = fact.alt;
        changed = true;
      }
      if (!String(props.titleText ?? "").trim() && fact.title) {
        props.titleText = fact.title;
        changed = true;
      }
      if (!String(props.caption ?? "").trim() && fact.caption) {
        props.caption = fact.caption;
        changed = true;
      }
      return { ...node, props, children };
    });
  return { blocks: walk(blocks), changed };
}

/** Kaynak siteden gelen görsel SEO, şema, yazar, kullanıcı ve yorum yıldızını yerinde tamamlar. */
export async function enrichImportedFacts(siteId: string, filePath: string): Promise<Record<string, number>> {
  const file = JSON.parse(await readFile(filePath, "utf8")) as EnrichFile;
  const repo = getScopedRepository(siteId);
  const users = getUserRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale || "tr";
  const siteName = site?.name ?? "";
  const counts = { users: 0, media: 0, pages: 0, comments: 0 };

  for (const person of file.users ?? []) {
    const email = person.email.trim().toLowerCase();
    if (!email.includes("@") || email.endsWith("@ova-tools.top")) continue;
    if (await users.findByEmail(email)) continue;
    const created = await users.create({
      email,
      name: person.name,
      role: "editor",
      passwordHash: await hashPassword(randomBytes(24).toString("base64url")),
    });
    await users.setStatus(created.id, "disabled");
    counts.users += 1;
  }

  const assets = await repo.listMediaAssets();
  const byName = new Map<string, (typeof assets)[number]>();
  for (const asset of assets) {
    const name = asset.filename.toLocaleLowerCase("tr");
    if (name) byName.set(name, asset);
  }
  const byUrl = new Map<string, { alt: string; title: string; caption: string }>();
  const factByName = new Map<string, { alt: string; title: string; caption: string }>();
  for (const item of file.media ?? []) {
    const names = (item.names?.length ? item.names : [baseName(item.url)]).map((name) => name.toLocaleLowerCase("tr"));
    const fact = { alt: item.alt.trim(), title: item.title.trim(), caption: item.caption.trim() };
    for (const name of names) if (name && !factByName.has(name)) factByName.set(name, fact);
    const asset = names.map((name) => byName.get(name)).find((found) => found);
    if (!asset && item.path) {
      const filename = baseName(item.path) || names[0] || "gorsel";
      const id = `med_wp_${createHash("sha1").update(item.path).digest("hex").slice(0, 16)}`;
      const url = `https://www.akinsoftizmir.com.tr/wp-content/uploads/${item.path.replace(/^\/+/, "")}`;
      await repo.saveMediaAsset({
        id,
        filename,
        url,
        altText: fact.alt || fact.title || filename,
        titleText: fact.title || undefined,
        caption: fact.caption || undefined,
        description: item.description.trim() || undefined,
      });
      byUrl.set(url, fact);
      counts.media += 1;
      continue;
    }
    if (!asset) continue;
    const alt = item.alt.trim();
    const title = item.title.trim();
    const caption = item.caption.trim();
    const description = item.description.trim();
    if (alt === asset.altText && title === (asset.titleText ?? "") && caption === (asset.caption ?? "") && description === (asset.description ?? "")) continue;
    await repo.saveMediaAsset({
      id: asset.id,
      filename: asset.filename,
      url: asset.url,
      mimeType: asset.mimeType,
      width: asset.width,
      height: asset.height,
      sizeBytes: asset.sizeBytes,
      altText: alt || asset.altText,
      titleText: title || asset.titleText || undefined,
      caption: caption || asset.caption || undefined,
      description: description || asset.description || undefined,
      kind: asset.kind,
      focalPoint: asset.focalPoint,
      folderId: asset.folderId,
    });
    byUrl.set(asset.url, { alt: alt || asset.altText, title: title || asset.titleText || "", caption: caption || asset.caption || "" });
    counts.media += 1;
  }
  for (const asset of assets) {
    if (!byUrl.has(asset.url)) byUrl.set(asset.url, { alt: asset.altText, title: asset.titleText ?? "", caption: asset.caption ?? "" });
  }

  const posts = new Map((file.posts ?? []).map((post) => [post.wpId, post]));
  const contents = await repo.listContents({ locale });
  for (const content of contents) {
    const wpId = String((content.schemaAttributes as Record<string, unknown> | null)?.wpId ?? "");
    const source = posts.get(wpId);
    const kind = content.type === "post" ? "post" : "page";
    const incomingType = source?.schemaType || (content.schemaType === "WebPage" || content.schemaType === "Article" ? "" : content.schemaType);
    const mapped = schemaFromBridge({
      kind,
      schemaType: incomingType,
      name: source?.name ?? "",
      description: source?.description ?? "",
      os: source?.os ?? "",
      category: source?.category ?? "",
      price: source?.price ?? "",
      currency: source?.currency ?? "",
      faqs: (source?.faqs ?? []).filter((item) => item.q && item.a && !item.q.includes("%") && !item.a.includes("%")),
      slug: content.slug,
    });
    const seoTitle = source ? expandSeoTemplate(source.seoTitle, { title: content.title, siteName, category: source.category }) : "";
    const seoDescription = source ? expandSeoTemplate(source.seoDescription, { title: content.title, siteName, category: source.category }) : "";
    const author = source?.author || "";
    const painted = paintBlocks(content.blocks, byUrl, factByName);
    const featured = content.featuredImage ? byUrl.get(content.featuredImage) : undefined;
    const titleChanged = Boolean(seoTitle) && seoTitle !== content.metaTitle;
    const descriptionChanged = Boolean(seoDescription) && seoDescription !== content.metaDescription;
    const authorChanged = Boolean(author) && author !== content.authorName;
    const schemaChanged = mapped.schemaType !== content.schemaType || Boolean(mapped.richSchema);
    if (!titleChanged && !descriptionChanged && !authorChanged && !schemaChanged && !painted.changed && !featured?.alt) continue;
    await repo.stampImportedMeta({
      contentId: content.id,
      locale,
      ...(authorChanged ? { authorName: author } : {}),
      ...(schemaChanged ? { schemaType: mapped.schemaType, richSchema: mapped.richSchema } : {}),
      ...(titleChanged ? { metaTitle: seoTitle } : {}),
      ...(descriptionChanged ? { metaDescription: seoDescription } : {}),
      ...(featured?.alt ? { featuredImageAlt: featured.alt } : {}),
      ...(featured?.caption ? { featuredImageCaption: featured.caption } : {}),
      ...(painted.changed ? { blocks: painted.blocks } : {}),
    });
    counts.pages += 1;
  }

  const comments = await repo.listCommentsReviews();
  for (const comment of comments) {
    if (comment.entryType !== "comment" || comment.rating === 0) continue;
    await repo.saveCommentReview({
      id: comment.id,
      contentId: comment.contentId,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail ?? undefined,
      entryType: "comment",
      body: comment.body,
      title: comment.title ?? undefined,
      status: comment.status,
    });
    counts.comments += 1;
  }
  return counts;
}
