// Ziyaretçi stil sayfasının (`public.css`) yönetim stil sayfasında (`admin.css`) bulunup kendisinde eksik olmayan sınıf
// bırakmadığını denetler: ziyaretçi sayfalarının HTML'indeki her sınıf, tam Tailwind taramasında tanımlıysa ziyaretçi
// CSS'inde de tanımlı olmalı. Yeni bir ziyaretçi kaynak klasörü `src/app/public.css` içindeki `@source` listesine eklenmezse
// bu denetim düşer. Kullanım (derleme ve başlatma sonrası): SEO_BASE_URL=http://localhost:3000 node scripts/check-public-css.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, process.env.NEXT_DIST_DIR || ".next", "static", "css");
const base = (process.env.SEO_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".css")).map((f) => ({ f, css: fs.readFileSync(path.join(dir, f), "utf8") })).sort((a, b) => a.css.length - b.css.length);
if (files.length < 2) { console.error("Beklenen iki stil sayfası (ziyaretçi + yönetim) bulunamadı."); process.exit(2); }
const [pub, admin] = files;
const classes = (css) => new Set([...css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)].map((m) => m[1].replace(/\\(.)/g, "$1")));
const P = classes(pub.css), A = classes(admin.css);

const sitemap = await (await fetch(`${base}/ai-sitemap.json`)).json();
const paths = ["/", "/magaza", "/magaza/sepet", "/ara?q=a", "/kategori", "/etiket", "/kampanyalar", "/olmayan-sayfa-xyz", ...(sitemap.items ?? []).map((i) => new URL(i.url).pathname)];
const missing = new Map();
for (const p of paths) {
  const html = await (await fetch(base + p)).text();
  for (const m of html.matchAll(/class="([^"]*)"/g)) for (const t of m[1].split(/\s+/).filter(Boolean)) if (A.has(t) && !P.has(t)) missing.set(t, p);
}
if (missing.size) {
  console.error(`Ziyaretçi CSS'inde eksik ${missing.size} sınıf (yönetim CSS'inde var):\n- ${[...missing].slice(0, 30).map(([c, p]) => `${c}  (${p})`).join("\n- ")}\n\`src/app/public.css\` içindeki @source listesine ilgili klasörü ekleyin.`);
  process.exit(1);
}
const gz = (s) => Math.round(Buffer.byteLength(s) / 1024);
console.log(`Ziyaretçi CSS tamam: ${P.size} sınıf, ${gz(pub.css)} KB ham (yönetim ${gz(admin.css)} KB); ${paths.length} sayfa denetlendi.`);
