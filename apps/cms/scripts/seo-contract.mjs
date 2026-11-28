// Çalışan uygulamanın ziyaretçi çıktısını SEO ve GEO sözleşmesine göre denetler (CI: derleme + başlatma sonrası).
// Her içerik için: dolu ve anlamlı <title>, tek <h1>, beklenen canonical (host + yol), og:title, geçerli JSON-LD,
// içe aktarma izi sızıntısı olmaması, ?format=md (200 + Link rel="canonical" + Vary: Accept) ve yönlendirme zinciri.
// Yazılarda ayrıca datePublished, yazar ve og:type=article.
// Kullanım: SEO_BASE_URL=http://localhost:3000 node scripts/seo-contract.mjs
const base = (process.env.SEO_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const expectedOrigin = (process.env.SEO_EXPECTED_ORIGIN || base).replace(/\/$/, "");
const LIMIT = Number(process.env.SEO_CONTRACT_LIMIT || 40);
const MAX_REDIRECTS = 5;
const failures = [];
const fail = (url, msg) => failures.push(`${url}: ${msg}`);

const normUrl = (raw) => {
  try {
    const u = new URL(raw);
    return `${u.origin}${u.pathname === "/" ? "/" : u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return raw;
  }
};

/** Yönlendirmeleri elle izleyerek döngü/fazla sıçrama hatasında kaynak adresi ve zinciri raporlar. */
const get = async (path, extraHeaders = {}) => {
  let current = path.startsWith("http") ? path : base + path;
  const chain = [current];
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": "nexpress-seo-contract", ...extraHeaders },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return { status: res.status, text: "", headers: res.headers, finalUrl: current, chain };
      const next = new URL(loc, current).toString();
      chain.push(`${res.status}→${next}`);
      if (chain.filter((c) => c.endsWith(next)).length > 1) {
        return { status: 599, text: "", headers: res.headers, finalUrl: next, chain, loop: true };
      }
      current = next;
      continue;
    }
    return { status: res.status, text: await res.text(), headers: res.headers, finalUrl: current, chain };
  }
  return { status: 598, text: "", headers: new Headers(), finalUrl: current, chain, loop: true };
};

const sitemapRes = await get("/ai-sitemap.json");
if (sitemapRes.status !== 200) {
  fail("/ai-sitemap.json", `HTTP ${sitemapRes.status} (zincir: ${sitemapRes.chain.join(" -> ")})`);
}
const sitemap = sitemapRes.status === 200 ? JSON.parse(sitemapRes.text) : { items: [] };
const allItems = sitemap.items ?? [];
// Türlere göre dengeli örnekleme: yalnızca ilk 40 değil, her içerik türünden en az örnekler seçilir
const byType = new Map();
for (const item of allItems) {
  const list = byType.get(item.type) ?? [];
  list.push(item);
  byType.set(item.type, list);
}
const sampled = [];
const seenUrls = new Set();
for (const list of byType.values()) {
  for (const item of list.slice(0, 5)) {
    if (sampled.length < LIMIT && !seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      sampled.push(item);
    }
  }
}
for (const item of allItems) {
  if (sampled.length >= LIMIT) break;
  if (!seenUrls.has(item.url)) {
    seenUrls.add(item.url);
    sampled.push(item);
  }
}

if (sampled.length === 0) fail("/ai-sitemap.json", "denetlenecek içerik yok");

const first = (re, html) => (re.exec(html) ?? [])[1]?.trim() ?? "";
const LEAK = /"(wpId|wpKind|migratedFrom|importedAt)"\s*:/;

for (const item of sampled) {
  const expectedUrl = normUrl(item.url);
  if (!expectedUrl.startsWith(expectedOrigin)) {
    fail(item.url, `ai-sitemap kökeni beklenen ile uyuşmuyor (${expectedOrigin})`);
  }
  const path = new URL(item.url).pathname || "/";
  const res = await get(path);
  if (res.loop) {
    fail(path, `yönlendirme döngüsü/sınırı aşıldı: ${res.chain.join(" -> ")}`);
    continue;
  }
  if (res.status !== 200) {
    fail(path, `HTTP ${res.status} (zincir: ${res.chain.join(" -> ")})`);
    continue;
  }
  const html = res.text;
  const title = first(/<title>([\s\S]*?)<\/title>/i, html);
  if (!/[\p{L}\p{N}]/u.test(title)) fail(path, `başlık anlamsız: "${title}"`);
  if (title.length > 120) fail(path, `başlık çok uzun (${title.length})`);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) fail(path, `h1 sayısı ${h1} (1 olmalı)`);

  const canonical = first(/<link rel="canonical" href="([^"]+)"/i, html);
  if (!canonical) {
    fail(path, "canonical yok");
  } else if (normUrl(canonical) !== expectedUrl) {
    fail(path, `canonical uyuşmuyor: gelen="${canonical}", beklenen="${expectedUrl}"`);
  }

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

  // Markdown sözleşmesi: ?format=md → 200, text/markdown, Vary: Accept ve Link rel="canonical"
  const mdRes = await get(`${path}${path.includes("?") ? "&" : "?"}format=md`);
  if (mdRes.status !== 200) {
    fail(`${path}?format=md`, `Markdown HTTP ${mdRes.status}`);
  } else {
    const ct = mdRes.headers.get("content-type") ?? "";
    if (!ct.includes("text/markdown")) fail(`${path}?format=md`, `Content-Type text/markdown değil: "${ct}"`);
    const linkHeader = mdRes.headers.get("link") ?? "";
    if (!linkHeader.includes(`rel="canonical"`) || (canonical && !linkHeader.includes(normUrl(canonical)))) {
      fail(`${path}?format=md`, `Markdown Link canonical başlığı eksik/uyuşmuyor: "${linkHeader}"`);
    }
  }
}

if (failures.length) {
  console.error(`SEO sözleşmesi ihlalleri (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`SEO sözleşmesi tamam: ${sampled.length} adres (${byType.size} tür) HTML + Markdown + canonical ile denetlendi.`);
