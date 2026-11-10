import type { LayoutNode } from "./bridge-draw";

export type BridgeKind = "begin" | "site" | "content" | "media" | "forms" | "design" | "seo" | "redirects";

export interface BridgeContentItem {
  wpId: string;
  kind: "page" | "post" | "other";
  status: "publish" | "draft" | "private" | "pending" | "future";
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  author: string;
  link: string;
  featured: string;
  front: boolean;
  postsPage: boolean;
  categories: Array<{ slug: string; name: string; parent: string }>;
  tags: Array<{ slug: string; name: string }>;
  seo: { title: string; description: string; keyword: string; canonical: string; noindex: boolean; schemaType: string };
  schema: { type: string; name: string; description: string; os: string; category: string; price: string; currency: string; faqs: Array<{ q: string; a: string }> };
  layout: LayoutNode[];
  html: string;
  comments: Array<{ wpId: string; author: string; email: string; body: string; date: string; status: string; parentWpId: string }>;
}

export interface BridgeFormItem {
  wpId: string;
  name: string;
  notify: string;
  fields: Array<{ label: string; type: string; required: boolean; options: string[] }>;
}

export interface BridgeMenuItem {
  label: string;
  href: string;
  children: BridgeMenuItem[];
}

export interface BridgeMenu {
  name: string;
  location: string;
  items: BridgeMenuItem[];
}

export type BridgePush =
  | { kind: "begin" }
  | { kind: "site"; title: string; tagline: string }
  | { kind: "content"; items: BridgeContentItem[] }
  | { kind: "media"; items: Array<{ url: string; alt: string; title: string; caption: string; description: string }> }
  | { kind: "forms"; items: BridgeFormItem[] }
  | { kind: "design"; menus: BridgeMenu[]; logoText: string; phone: string; email: string; address: string; container: number }
  | { kind: "seo"; titleTemplate: string; description: string; organizationName: string; organizationLogo: string; sameAs: string[] }
  | { kind: "redirects"; items: Array<{ from: string; to: string }> };

export interface ParseNotes {
  dropped: number;
  products: number;
}

const str = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const obj = (value: unknown) => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const list = (value: unknown, max: number) => (Array.isArray(value) ? value.slice(0, max) : []);

function layoutNode(value: unknown, depth: number): LayoutNode | null {
  if (!value || typeof value !== "object" || depth > 8) return null;
  const row = value as Record<string, unknown>;
  const children = list(row.children, 40).map((child) => layoutNode(child, depth + 1)).filter((child): child is LayoutNode => Boolean(child));
  return {
    type: str(row.type, 40),
    text: str(row.text, 4000),
    html: str(row.html, 20000),
    level: typeof row.level === "number" ? row.level : undefined,
    url: str(row.url, 500),
    alt: str(row.alt, 180),
    href: str(row.href, 500),
    label: str(row.label, 80),
    full: row.full === true,
    background: str(row.background, 20),
    overlay: str(row.overlay, 20),
    color: str(row.color, 20),
    padding: typeof row.padding === "number" ? row.padding : undefined,
    ordered: row.ordered === true,
    wpId: str(row.wpId, 20),
    items: Array.isArray(row.items) ? row.items.slice(0, 40) : undefined,
    children,
  };
}

function schemaBag(value: unknown): BridgeContentItem["schema"] {
  const row = obj(value);
  const faqs = list(row.faqs, 20)
    .map((item) => {
      const faq = obj(item);
      return { q: str(faq.q, 240), a: str(faq.a, 2000) };
    })
    .filter((item) => item.q && item.a);
  return {
    type: str(row.type, 40),
    name: str(row.name, 180),
    description: str(row.description, 500),
    os: str(row.os, 80),
    category: str(row.category, 80),
    price: str(row.price, 20),
    currency: str(row.currency, 8),
    faqs,
  };
}

function menuItems(value: unknown, depth: number): BridgeMenuItem[] {
  if (depth > 3) return [];
  return list(value, 40)
    .map((item) => {
      const row = obj(item);
      const label = str(row.label, 120);
      const href = str(row.href, 500);
      if (!label || !href) return null;
      return { label, href, children: menuItems(row.children, depth + 1) };
    })
    .filter((item): item is BridgeMenuItem => Boolean(item));
}

function contentItem(value: unknown, notes: ParseNotes): BridgeContentItem | null {
  const row = obj(value);
  const kindRaw = str(row.kind, 40).toLowerCase();
  if (kindRaw === "product" || kindRaw.includes("order") || kindRaw.includes("coupon")) {
    notes.products += 1;
    return null;
  }
  const wpId = str(row.wpId, 20).replace(/[^0-9]/g, "");
  const title = str(row.title, 300);
  if (!wpId || !title) {
    notes.dropped += 1;
    return null;
  }
  const statusRaw = str(row.status, 20);
  const status = (["publish", "draft", "private", "pending", "future"] as const).find((item) => item === statusRaw) ?? "draft";
  const seo = obj(row.seo);
  return {
    wpId,
    kind: kindRaw === "post" ? "post" : kindRaw === "page" ? "page" : "other",
    status,
    title,
    slug: str(row.slug, 120),
    excerpt: str(row.excerpt, 400),
    date: str(row.date, 40),
    author: str(row.author, 80),
    link: str(row.link, 500),
    featured: str(row.featured, 500),
    front: row.front === true,
    postsPage: row.postsPage === true,
    categories: list(row.categories, 20).map((item) => {
      const term = obj(item);
      return { slug: str(term.slug, 80), name: str(term.name, 120), parent: str(term.parent, 80) };
    }).filter((term) => term.slug && term.name),
    tags: list(row.tags, 30).map((item) => {
      const term = obj(item);
      return { slug: str(term.slug, 80), name: str(term.name, 120) };
    }).filter((term) => term.slug && term.name),
    seo: {
      title: str(seo.title, 180),
      description: str(seo.description, 320),
      keyword: str(seo.keyword, 80),
      canonical: str(seo.canonical, 500),
      noindex: seo.noindex === true,
      schemaType: str(seo.schemaType, 40),
    },
    schema: schemaBag(row.schema),
    layout: list(row.layout, 80).map((item) => layoutNode(item, 0)).filter((item): item is LayoutNode => Boolean(item)),
    html: str(row.html, 350000),
    comments: list(row.comments, 100).map((item) => {
      const comment = obj(item);
      return {
        wpId: str(comment.wpId, 20).replace(/[^0-9]/g, ""),
        author: str(comment.author, 80),
        email: str(comment.email, 120),
        body: str(comment.body, 4000),
        date: str(comment.date, 40),
        status: str(comment.status, 20),
        parentWpId: str(comment.parentWpId, 20).replace(/[^0-9]/g, ""),
      };
    }).filter((comment) => comment.wpId && comment.body),
  };
}

/** Paket gövdesini sınırlar. Ürün ve sipariş düşer. Geçersiz düğüm paketi bozmaz. */
export function parseBridgePush(body: unknown): { push: BridgePush; notes: ParseNotes } | { error: string } {
  const row = obj(body);
  const kind = str(row.kind, 20) as BridgeKind;
  const notes: ParseNotes = { dropped: 0, products: 0 };
  if (kind === "begin") return { push: { kind }, notes };
  if (kind === "site") return { push: { kind, title: str(row.title, 160), tagline: str(row.tagline, 240) }, notes };
  if (kind === "content") {
    const items = list(row.items, 12).map((item) => contentItem(item, notes)).filter((item): item is BridgeContentItem => Boolean(item));
    return { push: { kind, items }, notes };
  }
  if (kind === "media") {
    const items = list(row.items, 8)
      .map((item) => {
        const row = obj(item);
        return {
          url: str(row.url, 500),
          alt: str(row.alt, 180),
          title: str(row.title, 180),
          caption: str(row.caption, 300),
          description: str(row.description, 2000),
        };
      })
      .filter((item) => item.url.startsWith("https://") || item.url.startsWith("http://"));
    return { push: { kind, items }, notes };
  }
  if (kind === "forms") {
    const items = list(row.items, 20).map((item) => {
      const form = obj(item);
      const wpId = str(form.wpId, 20).replace(/[^0-9]/g, "");
      const name = str(form.name, 100);
      if (!wpId || !name) return null;
      const fields = list(form.fields, 40).map((field) => {
        const f = obj(field);
        return {
          label: str(f.label, 120),
          type: str(f.type, 20),
          required: f.required === true,
          options: list(f.options, 30).map((option) => str(option, 80)).filter(Boolean),
        };
      }).filter((field) => field.label);
      return { wpId, name, notify: str(form.notify, 120), fields };
    }).filter((item): item is BridgeFormItem => Boolean(item));
    return { push: { kind, items }, notes };
  }
  if (kind === "design") {
    const menus = list(row.menus, 12).map((item) => {
      const menu = obj(item);
      const name = str(menu.name, 80);
      if (!name) return null;
      return { name, location: str(menu.location, 40), items: menuItems(menu.items, 0) };
    }).filter((item): item is BridgeMenu => Boolean(item));
    const container = typeof row.container === "number" ? Math.round(row.container) : 0;
    return {
      push: {
        kind,
        menus,
        logoText: str(row.logoText, 160),
        phone: str(row.phone, 40),
        email: str(row.email, 120),
        address: str(row.address, 240),
        container: container >= 800 && container <= 1600 ? container : 0,
      },
      notes,
    };
  }
  if (kind === "seo") {
    return {
      push: {
        kind,
        titleTemplate: str(row.titleTemplate, 120),
        description: str(row.description, 320),
        organizationName: str(row.organizationName, 160),
        organizationLogo: str(row.organizationLogo, 500),
        sameAs: list(row.sameAs, 8).map((item) => str(item, 300)).filter((item) => item.startsWith("https://")),
      },
      notes,
    };
  }
  if (kind === "redirects") {
    const items = list(row.items, 50)
      .map((item) => ({ from: str(obj(item).from, 300), to: str(obj(item).to, 300) }))
      .filter((item) => item.from.startsWith("/") && (item.to.startsWith("/") || item.to.startsWith("https://")));
    return { push: { kind, items }, notes };
  }
  return { error: "Paket türü tanınmadı." };
}
