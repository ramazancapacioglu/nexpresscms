/**
 * Yayımlanmış bir sitenin sayfa ve yazılarını NexPress bloklarına yeniden çizer.
 * Uzak CSS/JS kopyalanmaz. Sayfa ve yazı kayıtları, en az bir ana sayfa ve
 * yeterli sayıda başarılı dönüşüm hazır olduktan sonra silinip yenisi yazılır.
 *
 * Kullanım: tsx apps/cms/scripts/redraw-public-site.ts /tmp/akin-import
 * Klasördeki *.txt dosyaları iki satırdır: tür (page|post) ve adres. Yanındaki *.html gövdedir.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getScopedRepository } from "@nexpress/database";
import { blocksFromPublicHtml, readPublicShell } from "@nexpress/wp-importer";
import { slugify } from "@nexpress/seo-core";

const dir = process.argv[2];
if (!dir) {
  console.error("Klasör gerekli.");
  process.exit(1);
}

const locale = "tr";
const origin = "https://www.akinsoftizmir.com.tr";
const files = readdirSync(dir).filter((f) => f.endsWith(".txt"));

interface Draft {
  kind: "page" | "post";
  url: string;
  slug: string;
  title: string;
  description: string;
  blocks: ReturnType<typeof blocksFromPublicHtml>["blocks"];
}

const drafts: Draft[] = [];
const failed: string[] = [];
let homeHtml = "";

for (const file of files) {
  const [kindRaw, url] = readFileSync(path.join(dir, file), "utf8").trim().split("\n");
  const kind = kindRaw === "post" ? "post" : "page";
  const htmlPath = path.join(dir, file.replace(/\.txt$/, ".html"));
  let html = "";
  try {
    html = readFileSync(htmlPath, "utf8");
  } catch {
    failed.push(url ?? file);
    continue;
  }
  if (url === `${origin}/` || url === origin) homeHtml = html;
  const converted = blocksFromPublicHtml(html, url || origin, locale);
  if (converted.blocks.length === 0) {
    failed.push(url ?? file);
    continue;
  }
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = (titleMatch?.[1] ?? "Sayfa").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.replace(/\s+/g, " ").trim().slice(0, 300) ?? "";
  const pathname = new URL(url || origin).pathname.replace(/\/+$/, "");
  const rawSlug = !pathname || pathname === "/" ? "ana-sayfa" : pathname.split("/").filter(Boolean).pop() ?? "sayfa";
  const slug = slugify(decodeURIComponent(rawSlug), locale).slice(0, 80) || "sayfa";
  const hero = converted.blocks.find((b) => b.type === "hero");
  drafts.push({
    kind,
    url: url ?? "",
    slug,
    title: hero ? String(hero.props.title ?? title).slice(0, 160) : title,
    description: desc,
    blocks: converted.blocks,
  });
}

async function main() {
const home = drafts.find((d) => d.slug === "ana-sayfa" && d.kind === "page");
if (!home || !homeHtml || drafts.length < 40) {
  console.error(`Dönüşüm yetersiz (taslak ${drafts.length}, ana sayfa ${home ? "var" : "yok"}, hata ${failed.length}). Silme yapılmadı.`);
  process.exit(1);
}

const used = new Set<string>();
const ordered = [...drafts.filter((d) => d.kind === "page"), ...drafts.filter((d) => d.kind === "post")];
for (const d of ordered) {
  let slug = d.slug;
  let n = 2;
  while (used.has(slug)) slug = `${d.slug}-${n++}`;
  d.slug = slug;
  used.add(slug);
}

const shell = readPublicShell(homeHtml, `${origin}/`, locale);
const repo = getScopedRepository("default");
const pages = await repo.listContents({ locale, type: "page" });
const posts = await repo.listContents({ locale, type: "post" });
const ids = [...pages, ...posts].map((c) => c.contentId);
console.log(`Silinecek sayfa ${pages.length}, yazı ${posts.length}. Yeni taslak ${drafts.length}, atlanan ${failed.length}.`);
for (let i = 0; i < ids.length; i += 40) await repo.deleteContents(ids.slice(i, i + 40));

let written = 0;
for (const d of drafts) {
  const first = d.blocks.find((b) => b.type === "paragraph" || b.type === "hero");
  const tldr = String(first?.props.subtitle ?? first?.props.text ?? d.description).replace(/<[^>]+>/g, "").slice(0, 280);
  const image = d.blocks.find((b) => b.type === "image_figure");
  await repo.saveContent({
    contentId: `cnt_redraw_${d.kind}_${d.slug}`.slice(0, 80),
    type: d.kind,
    status: "published",
    locale,
    slug: d.slug,
    title: d.title || d.slug,
    excerpt: d.description.slice(0, 300),
    tldr,
    blocks: d.blocks,
    featuredImage: image ? String(image.props.url ?? "") : null,
    schemaType: d.kind === "post" ? "Article" : "WebPage",
    importanceScore: d.slug === "ana-sayfa" ? 9 : 6,
    metaDescription: d.description.slice(0, 160),
  });
  written++;
}

await repo.saveDesignTokens(shell.tokens);
await repo.saveNavigationLayout({
  locale,
  headerConfig: shell.header,
  footerConfig: shell.footer,
  menuItems: shell.menu,
});
console.log(`Yazıldı ${written}. Menü ${shell.menu.length}. Palet ${shell.tokens.colors.primary}.`);
if (failed.length) console.log(`Atlanan: ${failed.slice(0, 8).join(" · ")}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
