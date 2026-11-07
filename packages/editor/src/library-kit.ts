import type { BlockNode } from "@nexpress/core";
import type { DesignLibraryItem } from "./library-types";

/** Kütüphane bölümlerinin ortak kurucuları. Her çağrı yeni kimlik üretir; eklenirken kimlikler zaten yeniden yazılır. */
export const SPAN = { desktop: 12, tablet: 12, mobile: 12 };
export type LibNode = Omit<BlockNode, "id"> & { id?: string };

let seq = 0;
export const n = (type: string, props: Record<string, unknown>, extra: Partial<BlockNode> = {}): BlockNode =>
  ({ id: `lk_${++seq}`, type, props, ...extra }) as BlockNode;

/** Başlık hizası blok stilindeki `textAlign` ile aynı kalır (başlık kendi hiza sınıfını taşır). */
export const heading = (text: string, level = "h2", extra: Partial<BlockNode> = {}) =>
  n("heading_element", { text, level, align: extra.style?.textAlign ?? "left" }, extra);
export const para = (text: string, extra: Partial<BlockNode> = {}) => n("paragraph_element", { text }, extra);
export const button = (label: string, href: string, styleVariant: "primary" | "secondary" | "outline" = "primary", align: "left" | "center" = "left") =>
  n("button_element", { label, href, styleVariant, align });
export const image = (url: string, alt: string, props: Record<string, unknown> = {}, style?: BlockNode["style"]) =>
  n("image_figure", { url, altText: alt, borderRadius: "lg", ...props }, style ? { style } : {});
export const col = (children: BlockNode[], style?: BlockNode["style"]) => n("column", {}, { children, ...(style ? { style } : {}) });
export const cols = (layout: string, children: BlockNode[], opts: Record<string, unknown> = {}) =>
  n("columns", { layout, gap: "24px", verticalAlign: "top", stackAt: "tablet", ...opts }, { children });

/** Tam genişlikli bant: degrade/arka plan, metin rengi ve telefonda daha dar boşluk. */
export const band = (style: NonNullable<BlockNode["style"]>, children: BlockNode[], pad = 88): LibNode => ({
  type: "section",
  gridSpan: SPAN,
  props: { containerMode: "boxed" },
  children,
  style: {
    fullWidth: true,
    paddingTop: `${pad}px`,
    paddingBottom: `${pad}px`,
    paddingLeft: "20px",
    paddingRight: "20px",
    mobile: { paddingTop: `${Math.round(pad / 2)}px`, paddingBottom: `${Math.round(pad / 2)}px` },
    ...style,
  },
});

export const GRAD = {
  night: "linear-gradient(135deg,#0b1020 0%,#1e1b4b 55%,#312e81 100%)",
  aurora: "linear-gradient(135deg,#0f172a 0%,#0e7490 55%,#10b981 100%)",
  sunset: "linear-gradient(135deg,#7c3aed 0%,#db2777 55%,#f97316 100%)",
  ocean: "linear-gradient(135deg,#1d4ed8 0%,#0891b2 100%)",
  soft: "linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%)",
};

/** Kart: yuvarlak köşe, ince kenarlık, hover'da hafif yükselme. */
export const cardStyle = (extra: NonNullable<BlockNode["style"]> = {}): NonNullable<BlockNode["style"]> => ({
  paddingTop: "24px",
  paddingBottom: "24px",
  paddingLeft: "24px",
  paddingRight: "24px",
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  borderWidth: "1px",
  borderColor: "#e2e8f0",
  boxShadow: "sm",
  hover: { translateY: "-4px", boxShadow: "lg" },
  ...extra,
});

const enc = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

type ArtKind = "dashboard" | "phone" | "cloud" | "chart" | "people" | "grid" | "globe" | "doc";

/** Temsili çizim (satır içi SVG, 800×520). Ek dosya gerektirmez; her temada ve dışa aktarmada çalışır. */
export function art(kind: ArtKind, a = "#6366f1", b = "#06b6d4"): string {
  const bars = [40, 80, 60, 120, 100, 140, 110].map((h, i) => `<rect x="${86 + i * 48}" y="${410 - h}" width="30" height="${h}" rx="8" fill="${a}" opacity="${0.35 + (i % 3) * 0.25}"/>`).join("");
  const frame = (body: string) => `<rect x="50" y="60" width="700" height="400" rx="24" fill="#fff"/><rect x="50" y="60" width="700" height="46" rx="24" fill="#f1f5f9"/><circle cx="82" cy="83" r="6" fill="#fb7185"/><circle cx="104" cy="83" r="6" fill="#fbbf24"/><circle cx="126" cy="83" r="6" fill="#34d399"/>${body}`;
  const bodies: Record<ArtKind, string> = {
    dashboard: frame(`<rect x="86" y="130" width="150" height="14" rx="7" fill="${a}"/>${[0, 1, 2].map((i) => `<rect x="${86 + i * 210}" y="160" width="190" height="80" rx="14" fill="#f8fafc" stroke="#e2e8f0"/><rect x="${104 + i * 210}" y="180" width="70" height="10" rx="5" fill="${b}"/><rect x="${104 + i * 210}" y="204" width="110" height="20" rx="6" fill="#0f172a" opacity=".85"/>`).join("")}${bars}`),
    chart: frame(`<polyline points="90,360 190,300 290,330 390,240 490,270 590,180 690,200" fill="none" stroke="${a}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><polyline points="90,390 190,360 290,370 390,320 490,330 590,290 690,300" fill="none" stroke="${b}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>${[0, 1, 2, 3].map((i) => `<rect x="${90 + i * 160}" y="140" width="130" height="10" rx="5" fill="#e2e8f0"/>`).join("")}`),
    phone: `<rect x="290" y="30" width="220" height="460" rx="36" fill="#0f172a"/><rect x="302" y="54" width="196" height="412" rx="26" fill="#fff"/><rect x="318" y="76" width="100" height="12" rx="6" fill="${a}"/>${[0, 1, 2, 3].map((i) => `<rect x="318" y="${108 + i * 80}" width="164" height="64" rx="14" fill="${i % 2 ? "#f1f5f9" : a}" opacity="${i % 2 ? 1 : 0.18}"/>`).join("")}`,
    cloud: `<path d="M230 360a80 80 0 0 1 24-156 115 115 0 0 1 218-12 92 92 0 0 1 70 168z" fill="#fff"/><path d="M230 360a80 80 0 0 1 24-156 115 115 0 0 1 218-12 92 92 0 0 1 70 168z" fill="${a}" opacity=".15"/>${[0, 1, 2].map((i) => `<rect x="${290 + i * 90}" y="420" width="58" height="44" rx="10" fill="${b}" opacity="${0.4 + i * 0.25}"/>`).join("")}`,
    people: `${[0, 1, 2].map((i) => `<circle cx="${250 + i * 150}" cy="${220 + (i % 2) * 20}" r="${52 - (i % 2) * 6}" fill="#fff" opacity=".92"/><rect x="${200 + i * 150}" y="${290 + (i % 2) * 20}" width="100" height="120" rx="40" fill="#fff" opacity=".75"/>`).join("")}`,
    grid: `${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${90 + (i % 3) * 210}" y="${110 + Math.floor(i / 3) * 170}" width="190" height="150" rx="22" fill="#fff" opacity="${0.55 + (i % 3) * 0.15}"/><circle cx="${130 + (i % 3) * 210}" cy="${150 + Math.floor(i / 3) * 170}" r="16" fill="${i % 2 ? a : b}"/>`).join("")}`,
    globe: `<circle cx="400" cy="260" r="170" fill="#fff" opacity=".9"/><ellipse cx="400" cy="260" rx="70" ry="170" fill="none" stroke="${a}" stroke-width="5" opacity=".5"/><ellipse cx="400" cy="260" rx="170" ry="60" fill="none" stroke="${a}" stroke-width="5" opacity=".5"/><circle cx="470" cy="190" r="12" fill="${b}"/><circle cx="330" cy="310" r="12" fill="${b}"/>`,
    doc: `<rect x="250" y="60" width="300" height="400" rx="20" fill="#fff"/><rect x="284" y="100" width="120" height="16" rx="8" fill="${a}"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="284" y="${150 + i * 40}" width="${230 - (i % 3) * 50}" height="11" rx="5" fill="#cbd5e1"/>`).join("")}<circle cx="500" cy="420" r="30" fill="${b}"/><path d="M487 420l9 9 17-20" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  };
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="520" fill="url(#g)"/>${bodies[kind]}</svg>`);
}

/** Küçük yuvarlak avatar görseli (kişi kartları için). */
export const avatar = (a = "#6366f1", b = "#ec4899") =>
  enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/><circle cx="60" cy="48" r="22" fill="#fff" opacity=".9"/><path d="M20 112c4-26 22-38 40-38s36 12 40 38z" fill="#fff" opacity=".8"/></svg>`);

/** Kayıt üretici: kimlik öneki ve rozet sabit kalır. */
export const itemFactory = (prefix: string, badge: string) =>
  (id: string, name: string, category: DesignLibraryItem["category"], description: string, previewKind: DesignLibraryItem["previewKind"], block: LibNode, extraBadge?: string): DesignLibraryItem =>
    ({ id: `${prefix}${id}`, name, category, description, badge: extraBadge ?? badge, previewKind, block });
