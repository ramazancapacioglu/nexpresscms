import type { BlockNode } from "@nexpress/core";

/** Demo görselleri `apps/cms/public/demo/yazilim-firmasi` altındadır (temsili çizimler). */
export const YF_ART = "/demo/yazilim-firmasi";

let seq = 0;
const node = (type: string, props: Record<string, unknown>, extra: Partial<BlockNode> = {}): BlockNode =>
  ({ id: `yf_${++seq}`, type, props, ...extra }) as BlockNode;

export const heading = (text: string, align?: "center", level = "h2") => node("heading_element", { text, level, ...(align ? { align } : {}) });
export const text = (value: string) => node("paragraph_element", { text: value });
export const button = (label: string, href: string, styleVariant: "primary" | "outline" = "primary", align: "left" | "center" = "left") =>
  node("button_element", { label, href, styleVariant, align });
export const image = (name: string, alt: string, wide = false) =>
  node("image_figure", { url: `${YF_ART}/${name}.svg`, altText: alt, borderRadius: "lg", aspectRatio: "3:2", ...(wide ? { maxWidth: "900px", align: "center" } : {}) });
export const tag = (label: string) => node("paragraph_element", { text: label }, { style: { cssClass: "yf-tag" } });

/** Tam genişlikli bant. `dark | soft | navy | ""` sınıfı skin CSS'inden gelir; metinler `center` ile ortalanır. */
export const band = (tone: "dark" | "soft" | "navy" | "", children: BlockNode[], center = false, pad = 72): BlockNode =>
  node("section", { containerMode: "boxed" }, {
    children,
    style: { fullWidth: true, paddingTop: `${pad}px`, paddingBottom: `${pad}px`, cssClass: ["yf-band", tone && `yf-${tone}`, center && "yf-center"].filter(Boolean).join(" ") },
  });

const LAYOUTS: Record<number, string> = { 1: "12", 2: "6+6", 3: "4+4+4", 4: "3+3+3+3" };

export const column = (children: BlockNode[], cls = ""): BlockNode =>
  node("column", {}, { children, ...(cls ? { style: { cssClass: cls } } : {}) });

export const row = (cols: BlockNode[], layout?: string, vAlign: "center" | "top" = "top"): BlockNode =>
  node("columns", { layout: layout ?? LAYOUTS[cols.length] ?? "6+6", gap: "24px", verticalAlign: vAlign, stackAt: "tablet" }, { children: cols });

/** Kart ızgarası: dörtlü satırlar halinde. */
export interface Card { title: string; text: string; href?: string; art?: string; cta?: string; badge?: string }
export function cards(items: Card[], per = 3): BlockNode[] {
  const rows: BlockNode[] = [];
  for (let i = 0; i < items.length; i += per) {
    const slice = items.slice(i, i + per);
    const cols = slice.map((c) => column([
      ...(c.art ? [image(c.art, c.title)] : []),
      ...(c.badge ? [tag(c.badge)] : []),
      heading(c.title, undefined, "h3"),
      text(c.text),
      ...(c.href ? [node("paragraph_element", { html: `<a href="${c.href}">${c.cta ?? "Detaylı bilgi"} →</a>` }, { style: { cssClass: "yf-link" } })] : []),
    ], "yf-card"));
    while (cols.length < per) cols.push(column([]));
    const r = row(cols, LAYOUTS[per]);
    if (per === 4) r.style = { cssClass: "yf-rowwrap" }; // dörtlü kartlar telefonda ikişerli
    rows.push(r);
  }
  return rows;
}

/** Sayaç satırı: telefonda ikişerli dizilir (`yf-rowwrap`). */
export const stats = (items: Array<[string, string]>) => {
  const r = row(items.map(([v, l]) => column([heading(v, "center", "h3"), text(l)], "yf-stat")), LAYOUTS[items.length]);
  r.style = { cssClass: "yf-rowwrap" };
  return r;
};

export const hero = (title: string, subtitle: string, primary: [string, string], secondary?: [string, string], badge?: string): BlockNode =>
  node("hero", {
    ...(badge ? { badge } : {}),
    title,
    subtitle,
    primaryCtaLabel: primary[0],
    primaryCtaHref: primary[1],
    ...(secondary ? { secondaryCtaLabel: secondary[0], secondaryCtaHref: secondary[1] } : {}),
  }, { style: { fullWidth: true } });

export const tldr = (summary: string) => node("tldr_box", { summary });
export const faq = (title: string, items: Array<[string, string]>) => node("faq_accordion", { title, items: items.map(([question, answer]) => ({ question, answer })) });
export const cta = (title: string, subtitle: string, label = "Ücretsiz tanıtım iste", href = "/tr/ucretsiz-tanitim") =>
  node("cta_banner", { title, subtitle, buttonLabel: label, buttonHref: href });
export const steps = (title: string, items: Array<[string, string]>) => node("howto_steps", { title, steps: items.map(([t, description]) => ({ title: t, description })) });
export const table = (title: string, headers: string[], rows: string[][]) => node("comparison_table", { title, headers, rows });
export const form = (title: string, fields: Array<[string, string, string, string?]>, submitLabel = "Formu gönder") =>
  node("form_block", {
    title,
    submitLabel,
    appearance: { columns: 2, labels: "top", density: "comfortable", buttonAlign: "left", surface: "inline" },
    fields: fields.map(([name, label, type, width]) => ({ id: name, name, label, type, required: type !== "textarea", width: width ?? "half" })),
  });
export const iconList = (items: Array<[string, string]>) => node("icon_list", { items: items.map(([title, t]) => ({ icon: "check-circle", title, text: t })) });
export const posts = (limit = 9) => node("dynamic_list", { source: "posts", limit, orderBy: "newest", layout: "cards", cardStyle: "default", columns: 3, showImage: true, showExcerpt: true, showDate: true, showSearch: true, showFilters: true, paginate: true });

/** Kampanyalar eklentisinden beslenen vitrin: yayındaki ve süresi dolmamış kampanyalar. */
export const showcase = (layout: "carousel" | "grid" | "spotlight" | "ticker" = "grid", limit = 3, heading = "Güncel Kampanyalar", subheading = "İşletmenizi bir adım öne taşıyacak ayrıcalıklar.") =>
  node("campaign_showcase", { heading, subheading, layout, limit, columns: 3, filter: "active", showDiscountBadge: true, showCountdown: true, showGift: true, showCta: true, emptyText: "Şu anda yayında aktif bir kampanya bulunmamaktadır." });
