// Ziyaretçi sayfaları için istemci JS bütçesi: saf ölçüm ve değerlendirme (dosya sistemi dışarıdan verilir).

const isPublicPage = (key) => key.startsWith("/(public)/") && key.endsWith("/page");

/** Bir sayfanın atalarının düzenleri: "/layout" ve her ara "/(public)/.../layout". */
export function layoutKeysFor(pageKey) {
  const parts = pageKey.replace(/\/page$/, "").split("/").filter(Boolean);
  const keys = ["/layout"];
  for (let i = 1; i <= parts.length; i++) keys.push(`/${parts.slice(0, i).join("/")}/layout`);
  return keys;
}

/**
 * @param pages  app-build-manifest.json içindeki `pages` nesnesi
 * @param sizeOf (file) => { gzip:number, text:string|null }  (JS için metin; CSS için null olabilir)
 */
export function measure(pages, sizeOf) {
  const routes = [];
  for (const key of Object.keys(pages).filter(isPublicPage)) {
    const files = new Set();
    for (const k of [...layoutKeysFor(key), key]) for (const f of pages[k] ?? []) files.add(f);
    let js = 0;
    let own = 0;
    const forbidden = [];
    for (const file of files) {
      if (!file.endsWith(".js")) continue;
      const { gzip, text } = sizeOf(file);
      js += gzip;
      if (file.startsWith("static/chunks/app/")) own += gzip;
      if (/static\/chunks\/app\/(admin|login)\b/.test(file)) forbidden.push(`yönetim parçası: ${file}`);
      if (text) for (const marker of FORBIDDEN_MARKERS) if (text.includes(marker)) forbidden.push(`"${marker}" içeriği: ${file}`);
    }
    routes.push({ route: key, jsKb: js / 1024, ownKb: own / 1024, forbidden });
  }
  return routes.sort((a, b) => b.jsKb - a.jsKb);
}

/** Ziyaretçi paketinde asla bulunmaması gereken kütüphane izleri (editör, tema değiştirici). */
export const FORBIDDEN_MARKERS = ["ProseMirror", "tiptap", "next-themes"];

export function evaluate(routes, budget) {
  const failures = [];
  if (routes.length === 0) failures.push("Ziyaretçi rotası bulunamadı (manifest biçimi değişmiş olabilir).");
  for (const r of routes) {
    if (r.jsKb > budget.publicFirstLoadGzipKb) failures.push(`${r.route}: ${r.jsKb.toFixed(1)} kB > ${budget.publicFirstLoadGzipKb} kB (toplam gzip JS)`);
    if (r.ownKb > budget.publicOwnGzipKb) failures.push(`${r.route}: rota/düzen kodu ${r.ownKb.toFixed(2)} kB > ${budget.publicOwnGzipKb} kB`);
    for (const f of r.forbidden) failures.push(`${r.route}: yasak ${f}`);
  }
  return failures;
}
