import type { BlockNode } from "@nexpress/core";
import type { ThemeDemoEntry, ThemeDemoPack } from "./demo-pack";

/**
 * Resmi temaların demo içeriği: her tema kendi sektörüne uygun, düzenlenebilir bir başlangıç sitesi getirir
 * (ana sayfa, hakkında, hizmetler, fiyat, iletişim ve üç yazı). Tüm bloklar standart bloklardır; tema yalnızca rengi,
 * şeridi ve blok görünümünü değiştirir. Sayılar ve fiyatlar örnektir; aktarılan kayıtlar "Demo verisi" etiketi taşır.
 */
export interface GenericDemoCopy {
  themeId: string;
  /** Ana sayfa adresi; mevcut `ana-sayfa` kaydına dokunmaz. */
  homeSlug: string;
  brand: string;
  summary: string;
  hero: { badge: string; title: string; subtitle: string; cta: [string, string]; secondary?: [string, string] };
  tldr: string;
  stats: Array<[string, string]>;
  features: { title: string; subtitle: string; items: Array<{ icon: string; title: string; description: string }> };
  steps: { title: string; items: Array<[string, string]> };
  plans?: { title: string; items: Array<{ name: string; price: string; description: string; ctaLabel: string; featured?: boolean }> };
  faq: Array<[string, string]>;
  about: { title: string; lead: string; paragraphs: string[]; values: Array<{ icon: string; title: string; text: string }> };
  contact: { phone: string; email: string; address: string };
  closing: { title: string; subtitle: string; button: string };
  posts: Array<{ slug: string; title: string; tldr: string; category: string; sections: Array<[string, string]> }>;
  /** Ana sayfada son yazıları listele. */
  showPosts?: boolean;
}

let seq = 0;
const node = (type: string, props: Record<string, unknown>, extra: Partial<BlockNode> = {}): BlockNode =>
  ({ id: `gd_${++seq}`, type, props, ...extra }) as BlockNode;

const heading = (text: string, level: 2 | 3 = 2) => node("heading_element", { text, level: `h${level}` });
const para = (text: string) => node("paragraph_element", { text });

const hero = (c: GenericDemoCopy) =>
  node("hero", {
    badge: c.hero.badge,
    title: c.hero.title,
    subtitle: c.hero.subtitle,
    primaryCtaLabel: c.hero.cta[0],
    primaryCtaHref: c.hero.cta[1],
    ...(c.hero.secondary ? { secondaryCtaLabel: c.hero.secondary[0], secondaryCtaHref: c.hero.secondary[1] } : {}),
  });

const pageHead = (title: string, lead: string, badge?: string) => node("hero", { ...(badge ? { badge } : {}), title, subtitle: lead });

const cta = (c: GenericDemoCopy, href: string) =>
  node("cta_banner", { title: c.closing.title, subtitle: c.closing.subtitle, buttonLabel: c.closing.button, buttonHref: href });

const faq = (c: GenericDemoCopy) =>
  node("faq_accordion", { title: "Sık sorulan sorular", items: c.faq.map(([question, answer]) => ({ question, answer })) });

const entry = (type: "page" | "post", slug: string, title: string, tldr: string, blocks: BlockNode[], extra: Partial<ThemeDemoEntry> = {}): ThemeDemoEntry => ({
  type,
  slug,
  title,
  tldr,
  schemaType: type === "post" ? "BlogPosting" : "WebPage",
  blocks,
  ...extra,
});

export function buildGenericDemo(c: GenericDemoCopy): ThemeDemoPack {
  const p = (slug: string) => `${c.homeSlug.split("-")[0]}-${slug}`;
  const contactHref = `/tr/${p("iletisim")}`;
  const home = entry(
    "page",
    c.homeSlug,
    `${c.brand} — Ana sayfa`,
    c.tldr,
    [
      hero(c),
      node("tldr_box", { summary: c.tldr }),
      node("stats_strip", { stats: c.stats.map(([value, label]) => ({ value, label })) }),
      node("bento_features", { title: c.features.title, subtitle: c.features.subtitle, columns: 3, items: c.features.items }),
      node("howto_steps", { title: c.steps.title, steps: c.steps.items.map(([title, description]) => ({ title, description })) }),
      ...(c.plans ? [node("pricing_table", { title: c.plans.title, plans: c.plans.items })] : []),
      ...(c.showPosts ? [heading("Son yazılar"), node("dynamic_list", { source: "posts", limit: 3, orderBy: "newest", layout: "cards", columns: 3, showImage: true, showExcerpt: true, showDate: true })] : []),
      faq(c),
      cta(c, contactHref),
    ],
  );
  const about = entry("page", p("hakkimizda"), `${c.brand} hakkında`, c.about.lead, [
    pageHead(c.about.title, c.about.lead, "Hakkımızda"),
    ...c.about.paragraphs.map(para),
    heading("Değerlerimiz"),
    node("icon_list", { columns: 2, items: c.about.values.map((v) => ({ icon: v.icon, title: v.title, text: v.text })) }),
    cta(c, contactHref),
  ]);
  const services = entry("page", p("hizmetler"), `${c.brand} hizmetleri`, c.features.subtitle, [
    pageHead(c.features.title, c.features.subtitle, "Hizmetler"),
    node("bento_features", { columns: 2, items: c.features.items }),
    node("howto_steps", { title: c.steps.title, steps: c.steps.items.map(([title, description]) => ({ title, description })) }),
    cta(c, contactHref),
  ]);
  const pricing = c.plans
    ? [entry("page", p("fiyatlar"), `${c.brand} fiyatları`, `${c.plans.title}: ${c.brand} planlarını karşılaştırın. Fiyatlar örnektir.`, [pageHead(c.plans.title, "Planları ihtiyacınıza göre değiştirebilirsiniz. Fiyatlar örnektir.", "Fiyatlar"), node("pricing_table", { title: c.plans.title, plans: c.plans.items }), faq(c), cta(c, contactHref)])]
    : [];
  const contact = entry("page", p("iletisim"), "İletişim", `${c.brand} ekibine telefon, e-posta veya adres bilgisiyle ulaşabilir, sorularınızı iletebilirsiniz.`, [
    pageHead("Bize ulaşın", "Sorularınızı yanıtlamak için buradayız. Aşağıdaki kanallardan bize yazın veya arayın.", "İletişim"),
    node("columns", { layout: "4+4+4", gap: "24px", verticalAlign: "top", stackAt: "tablet" }, {
      children: [
        node("column", {}, { children: [node("info_box", { icon: "phone", title: "Telefon", text: c.contact.phone, href: `tel:${c.contact.phone.replace(/[^\d+]/g, "")}`, linkLabel: "Hemen ara" })] }),
        node("column", {}, { children: [node("info_box", { icon: "mail", title: "E-posta", text: c.contact.email, href: `mailto:${c.contact.email}`, linkLabel: "E-posta gönder" })] }),
        node("column", {}, { children: [node("info_box", { icon: "map-pin", title: "Adres", text: c.contact.address })] }),
      ],
    }),
    faq(c),
  ]);
  const posts = c.posts.map((post) =>
    entry("post", post.slug, post.title, post.tldr, [
      node("tldr_box", { summary: post.tldr }),
      ...post.sections.flatMap(([title, body]) => [heading(title), para(body)]),
    ], { canvas: false, categories: [post.category] }),
  );
  return { themeId: c.themeId, homeSlug: c.homeSlug, title: `${c.brand} demo`, summary: c.summary, entries: [home, about, services, ...pricing, contact, ...posts] };
}
