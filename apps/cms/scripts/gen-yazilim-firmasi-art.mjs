// Yazılım Firması Teması demo verisinin temsili görselleri. Çalıştırma: node apps/cms/scripts/gen-yazilim-firmasi-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = new URL("../public/demo/yazilim-firmasi/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const W = 800;
const H = 520;
const bars = (c, n = 7) => Array.from({ length: n }, (_, i) => { const h = 60 + ((i * 53) % 130); return `<rect x="${70 + i * 46}" y="${330 - h}" width="28" height="${h}" rx="6" fill="${c}" opacity="${0.45 + (i % 3) * 0.2}"/>`; }).join("");
const line = (c) => `<polyline points="70,300 140,250 210,270 280,200 350,220 420,150 490,170 560,110 640,130" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
const rows = (c, n = 5) => Array.from({ length: n }, (_, i) => `<rect x="70" y="${150 + i * 40}" width="${420 - (i % 3) * 60}" height="14" rx="7" fill="#d2d2d7"/><rect x="520" y="${150 + i * 40}" width="${70 + (i % 2) * 30}" height="14" rx="7" fill="${c}"/>`).join("");
const cards = (c) => [0, 1, 2].map((i) => `<rect x="${70 + i * 200}" y="150" width="170" height="110" rx="14" fill="#fff" stroke="#e6e6ea"/><rect x="${90 + i * 200}" y="172" width="60" height="10" rx="5" fill="${c}"/><rect x="${90 + i * 200}" y="200" width="120" height="22" rx="6" fill="#1d1d1f" opacity=".85"/>`).join("") + bars(c, 6).replaceAll('y="', 'y="40').replace(/y="40(\d+)"/g, (_, v) => `y="${Number(v) + 70}"`);
const donut = (c) => `<circle cx="260" cy="250" r="85" fill="none" stroke="#e6e6ea" stroke-width="34"/><circle cx="260" cy="250" r="85" fill="none" stroke="${c}" stroke-width="34" stroke-dasharray="340 534" transform="rotate(-90 260 250)"/><rect x="430" y="170" width="200" height="14" rx="7" fill="#d2d2d7"/><rect x="430" y="210" width="150" height="14" rx="7" fill="${c}"/><rect x="430" y="250" width="180" height="14" rx="7" fill="#d2d2d7"/><rect x="430" y="290" width="120" height="14" rx="7" fill="${c}"/>`;
const phone = (c) => `<rect x="300" y="90" width="200" height="380" rx="30" fill="#1d1d1f"/><rect x="312" y="110" width="176" height="340" rx="20" fill="#fff"/><rect x="326" y="130" width="90" height="12" rx="6" fill="${c}"/>${[0, 1, 2, 3].map((i) => `<rect x="326" y="${165 + i * 62}" width="148" height="50" rx="12" fill="${i % 2 ? "#f5f5f7" : c}" opacity="${i % 2 ? 1 : 0.18}"/>`).join("")}`;
const doc = (c) => `<rect x="250" y="80" width="300" height="400" rx="16" fill="#fff" stroke="#e6e6ea"/><rect x="280" y="115" width="110" height="16" rx="8" fill="${c}"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="280" y="${160 + i * 36}" width="${240 - (i % 3) * 50}" height="10" rx="5" fill="#d2d2d7"/>`).join("")}<circle cx="480" cy="420" r="28" fill="${c}"/><path d="M468 420l8 8 16-18" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const cloud = (c) => `<path d="M250 330a70 70 0 0 1 20-136 100 100 0 0 1 190-10 80 80 0 0 1 60 146z" fill="#fff"/><path d="M250 330a70 70 0 0 1 20-136 100 100 0 0 1 190-10 80 80 0 0 1 60 146z" fill="${c}" opacity=".15"/>${[0, 1, 2].map((i) => `<rect x="${290 + i * 80}" y="390" width="50" height="40" rx="8" fill="${c}" opacity="${0.4 + i * 0.25}"/>`).join("")}`;
const badge = (t, c) => `<rect x="70" y="170" width="660" height="200" rx="28" fill="#fff" opacity=".12"/><text x="400" y="300" font-family="Inter,Arial,sans-serif" font-size="120" font-weight="800" fill="#fff" text-anchor="middle">${t}</text><rect x="300" y="340" width="200" height="12" rx="6" fill="#fff" opacity=".5"/>`;
const scene = (c) => `<circle cx="620" cy="140" r="60" fill="#fff" opacity=".35"/><path d="M0 420 L180 260 L320 360 L480 220 L640 340 L800 250 V520 H0z" fill="#fff" opacity=".25"/><path d="M0 470 L220 340 L400 430 L600 330 L800 420 V520 H0z" fill="#fff" opacity=".4"/>`;

const FRAME = (c, body) => `<rect x="40" y="50" width="720" height="420" rx="22" fill="#fff" stroke="#e6e6ea"/><rect x="40" y="50" width="720" height="48" rx="22" fill="#f5f5f7"/><circle cx="72" cy="74" r="6" fill="#ff5f57"/><circle cx="94" cy="74" r="6" fill="#febc2e"/><circle cx="116" cy="74" r="6" fill="#28c840"/><rect x="70" y="112" width="140" height="18" rx="9" fill="${c}"/>${body}`;

const ART = {
  dashboard: ["#0071e3", "#00ac48", (c) => FRAME(c, cards(c))],
  erp: ["#084f9e", "#0071e3", (c) => FRAME(c, bars(c) + line("#00ac48"))],
  crm: ["#0071e3", "#7c3aed", (c) => FRAME(c, donut(c))],
  ik: ["#00ac48", "#084f9e", (c) => FRAME(c, rows(c))],
  muhasebe: ["#084f9e", "#00ac48", (c) => FRAME(c, rows(c, 5) + line(c))],
  bulut: ["#0071e3", "#00c2ff", cloud],
  eticaret: ["#f97316", "#ec4899", (c) => FRAME(c, cards(c))],
  mobil: ["#7c3aed", "#0071e3", phone],
  sektor: ["#00ac48", "#007d79", (c) => FRAME(c, bars(c, 8) + line("#084f9e"))],
  fatura: ["#084f9e", "#0071e3", doc],
  arsiv: ["#007d79", "#00ac48", doc],
  irsaliye: ["#f97316", "#084f9e", doc],
  defter: ["#1d1d1f", "#084f9e", doc],
  mutabakat: ["#7c3aed", "#0071e3", doc],
  "kampanya-1": ["#0071e3", "#084f9e", () => badge("%40", "#fff")],
  "kampanya-2": ["#00ac48", "#007d79", () => badge("%35", "#fff")],
  "kampanya-3": ["#f97316", "#ec4899", () => badge("%70", "#fff")],
  "kampanya-4": ["#7c3aed", "#ec4899", () => badge("%30", "#fff")],
  "kampanya-5": ["#007d79", "#0071e3", () => badge("%25", "#fff")],
  "kampanya-6": ["#1d1d1f", "#084f9e", () => badge("%20", "#fff")],
  "haber-1": ["#084f9e", "#00ac48", scene],
  "haber-2": ["#7c3aed", "#0071e3", scene],
  "haber-3": ["#007d79", "#0071e3", scene],
  ofis: ["#1d1d1f", "#424245", scene],
  harita: ["#0071e3", "#00ac48", (c) => scene(c) + `<circle cx="400" cy="250" r="22" fill="#fff"/><circle cx="400" cy="250" r="8" fill="${c}"/>`],
};

for (const [name, [a, b, draw]] of Object.entries(ART)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Temsili görsel"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>${draw(a)}</svg>`;
  writeFileSync(new URL(`${name}.svg`, OUT), svg);
}
console.log(`${Object.keys(ART).length} görsel yazıldı`);
