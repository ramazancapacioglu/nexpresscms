// Çalışan uygulamanın ziyaretçi çıktısını SEO sözleşmesine göre denetler (CI: derleme + başlatma sonrası).
// Her içerik için: dolu ve anlamlı <title>, tek <h1>, canonical, og:title, geçerli JSON-LD ve içe aktarma izi sızıntısı yok.
// Yazılarda ayrıca datePublished, yazar ve og:type=article. Kullanım: SEO_BASE_URL=http://localhost:3000 node scripts/seo-contract.mjs
const base = (process.env.SEO_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const LIMIT = Number(process.env.SEO_CONTRACT_LIMIT || 40);
const failures = [];
const fail = (url, msg) => failures.push(`${url}: ${msg}`);

const get = async (path) => {
  const res = await fetch(base + path, { headers: { "User-Agent": "nexpress-seo-contract" } });
  return { status: res.status, text: await res.text() };
};

const sitemap = JSON.parse((await get("/ai-sitemap.json")).text);
const urls = (sitemap.items ?? []).map((i) => i.url).slice(0, LIMIT);
if (urls.length === 0) fail("/ai-sitemap.json", "denetlenecek içerik yok");

const first = (re, html) => (re.exec(html) ?? [])[1]?.trim() ?? "";
const LEAK = /"(wpId|wpKind|migratedFrom|importedAt)"\s*:/;

for (const url of urls) {
  const path = new URL(url).pathname || "/";
  const { status, text: html } = await get(path);
  if (status !== 200) { fail(path, `HTTP ${status}`); continue; }
  const title = first(/<title>([\s\S]*?)<\/title>/i, html);
  if (!/[\p{L}\p{N}]/u.test(title)) fail(path, `başlık anlamsız: "${title}"`);
  if (title.length > 120) fail(path, `başlık çok uzun (${title.length})`);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) fail(path, `h1 sayısı ${h1} (1 olmalı)`);
  if (!first(/<link rel="canonical" href="([^"]+)"/i, html)) fail(path, "canonical yok");
  if (!first(/<meta property="og:title" content="([^"]*)"/i, html)) fail(path, "og:title yok");
  const desc = first(/<meta name="description" content="([^"]*)"/i, html);
  if (desc && desc.length >= 150 && /[\p{L}\p{N},;:-]$/u.test(desc)) fail(path, `açıklama yarıda kesik: "...${desc.slice(-24)}"`);
  const scripts = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  if (scripts.length === 0) fail(path, "JSON-LD yok");
  for (const raw of scripts) {
    let data;
    try { data = JSON.parse(raw); } catch { fail(path, "JSON-LD geçersiz"); continue; }
    if (LEAK.test(raw)) fail(path, "JSON-LD'ye içe aktarma izi sızmış");
    for (const node of data["@graph"] ?? []) {
      if (/Article|BlogPosting/.test(String(node["@type"]))) {
        if (!node.datePublished) fail(path, `${node["@type"]} datePublished yok`);
        if (!node.author) fail(path, `${node["@type"]} author yok`);
        if (first(/<meta property="og:type" content="([^"]*)"/i, html) !== "article") fail(path, "yazıda og:type=article değil");
      }
    }
  }
}

if (failures.length) {
  console.error(`SEO sözleşmesi ihlalleri (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`SEO sözleşmesi tamam: ${urls.length} adres denetlendi.`);
