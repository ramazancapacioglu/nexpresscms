import { DomUtils, parseDocument } from "htmlparser2";
import type { AnyNode, Element } from "domhandler";
import type { BlockNode, DesignTokens, FooterConfig, HeaderConfig, NavigationMenuItem } from "@nexpress/core";
import { convertWpHtml } from "./html";
import { rewriteAbsoluteUrl } from "./links";

/**
 * Yayımlanmış sayfanın kabuğunu NexPress jeton, üst/alt şerit ve bloklarına çevirir.
 * Uzak CSS ve JavaScript alınmaz. Kadence satırları kart ızgarasına, akordeon SSS'ye,
 * ilk başlık vitrine çözülür. Geri kalan metin mevcut HTML dönüştürücüsüne gider.
 */
export interface PublicShell {
  title: string;
  description: string;
  phone: string;
  email: string;
  tokens: DesignTokens;
  header: HeaderConfig;
  footer: FooterConfig;
  menu: NavigationMenuItem[];
  blocks: BlockNode[];
  warnings: string[];
}

const squash = (s: string) => s.replace(/\s+/g, " ").replace(/Genişletmek/g, "").trim();

function textOf(nodes: AnyNode[]): string {
  return squash(nodes.map((n) => (n.type === "text" ? n.data : n.type === "tag" ? textOf(n.children) : "")).join(" "));
}

function cls(el: Element): string {
  return el.attribs.class ?? "";
}

function has(el: Element, part: string): boolean {
  return cls(el).includes(part);
}

function localHref(raw: string, origin: string, locale: string): string {
  const value = raw.trim();
  if (!value || value.startsWith("#") || value.startsWith("javascript:")) return "";
  if (value.startsWith("tel:") || value.startsWith("mailto:")) return value;
  try {
    const u = new URL(value, origin);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    if (u.origin !== new URL(origin).origin) return u.toString();
    const path = decodeURIComponent(u.pathname).replace(/\/+$/, "") || "/";
    return path === "/" ? `/${locale}` : `/${locale}${path}`;
  } catch {
    return "";
  }
}

export function paletteFromHtml(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of html.matchAll(/(--global-palette\d+)\s*:\s*(#[0-9a-fA-F]{6})/g)) out[m[1]!] = m[2]!.toLowerCase();
  return out;
}

/** Kadence paletinden jeton. Yazı tipi dosyası istenmez; sistem yığını kullanılır. */
export function tokensFromPalette(html: string): DesignTokens {
  const p = paletteFromHtml(html);
  const primary = p["--global-palette1"] ?? "#0c644e";
  const accent = p["--global-palette2"] ?? "#09589a";
  const foreground = p["--global-palette3"] ?? "#1a202c";
  const muted = p["--global-palette8"] ?? "#f7fafc";
  const background = p["--global-palette9"] ?? "#ffffff";
  const secondary = p["--global-palette7"] ?? "#f4f5f7";
  return {
    colors: {
      primary,
      primaryForeground: "#ffffff",
      secondary,
      secondaryForeground: foreground,
      accent,
      accentForeground: "#ffffff",
      background,
      foreground,
      muted,
      mutedForeground: "#334155",
      border: "#94a3b8",
    },
    darkColors: {
      primary: "#6ee7b7",
      primaryForeground: "#042f2e",
      secondary: "#1e293b",
      secondaryForeground: "#e2e8f0",
      accent: "#93c5fd",
      accentForeground: "#0b1120",
      background: "#0b1120",
      foreground: "#e2e8f0",
      muted: "#1e293b",
      mutedForeground: "#cbd5e1",
      border: "#64748b",
    },
    typography: {
      headingFont: "system-ui, sans-serif",
      bodyFont: "system-ui, sans-serif",
      monoFont: "ui-monospace, monospace",
      baseSizePx: 17,
      scaleRatio: 1.25,
    },
    geometry: { borderRadius: "12px", containerMaxWidth: "1120px", sectionSpacingY: "64px", cardShadow: "sm" },
  };
}

function find(root: AnyNode[], pred: (el: Element) => boolean): Element | null {
  return DomUtils.findOne(pred, root) ?? null;
}

function infoBox(el: Element, origin: string, locale: string): { title: string; description: string; href: string } | null {
  const title = textOf(DomUtils.findAll((e) => cls(e).includes("kt-blocks-info-box-title"), [el])).slice(0, 60);
  const description = textOf(DomUtils.findAll((e) => cls(e).includes("kt-blocks-info-box-text"), [el])).slice(0, 200);
  const link = DomUtils.findOne((e) => e.name === "a" && Boolean(e.attribs.href), [el]);
  const href = link ? localHref(link.attribs.href ?? "", origin, locale) : "";
  if (!title) return null;
  return { title, description: description || title, href };
}

function faqFrom(el: Element): Array<{ question: string; answer: string }> {
  const panes = DomUtils.findAll((e) => cls(e).includes("kt-accordion-pane"), [el]);
  const items: Array<{ question: string; answer: string }> = [];
  for (const pane of panes) {
    const question = textOf(DomUtils.findAll((e) => cls(e).includes("kt-blocks-accordion-title"), [pane])).slice(0, 140);
    const panel = DomUtils.findOne((e) => cls(e).includes("kt-accordion-panel"), [pane]);
    const answer = (panel ? textOf(panel.children) : "").slice(0, 420);
    if (question && answer) items.push({ question, answer });
  }
  return items.slice(0, 8);
}

function fragmentBlocks(html: string, origin: string): BlockNode[] {
  const converted = convertWpHtml(html, { baseUrl: origin });
  return converted.blocks.filter((b) => b.type !== "heading" || String(b.props.text ?? "").length > 0);
}

/**
 * Gövde HTML'ini bloklara çevirir. İlk h1 vitrin olur. Bilgi kutuları kart ızgarası,
 * akordeon SSS olur. Stil etiketleri yok sayılır.
 */
export function blocksFromPublicHtml(html: string, origin: string, locale = "tr"): { blocks: BlockNode[]; warnings: string[] } {
  const warnings: string[] = [];
  const cleaned = html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "");
  const doc = parseDocument(cleaned, { decodeEntities: true });
  const entry = find(doc.children, (e) => cls(e).includes("entry-content")) ?? find(doc.children, (e) => e.name === "main") ?? find(doc.children, (e) => e.name === "body");
  if (!entry) return { blocks: [], warnings: ["Sayfa gövdesi bulunamadı."] };

  const blocks: BlockNode[] = [];
  let n = 0;
  const id = () => `sh_${++n}`;
  let hero = false;
  const skip = new Set<Element>();

  const push = (type: BlockNode["type"], props: Record<string, unknown>) => {
    blocks.push({ id: id(), type, props, gridSpan: { desktop: 12, tablet: 12, mobile: 12 } });
  };

  const flushBoxes = (boxes: Element[], heading: string) => {
    const fresh = boxes.filter((b) => !skip.has(b));
    const items = fresh.map((b) => infoBox(b, origin, locale)).filter((x): x is NonNullable<typeof x> => Boolean(x));
    for (let i = 0; i < items.length; i += 6) {
      const slice = items.slice(i, i + 6);
      if (slice.length === 1) {
        const one = slice[0]!;
        push("info_box", { title: one.title, text: one.description, ...(one.href ? { href: one.href, linkLabel: one.title } : {}) });
      } else if (slice.length >= 2) {
        push("bento_features", {
          title: (heading || "Öne çıkanlar").slice(0, 90),
          items: slice.map((it) => ({ icon: "layers", title: it.title, description: it.description })),
        });
      }
    }
    fresh.forEach((b) => skip.add(b));
  };

  let lastHeading = "";
  const visit = (el: Element) => {
    if (skip.has(el)) return;
    if (has(el, "wp-block-kadence-rowlayout")) {
      const boxes = DomUtils.findAll((e) => cls(e).includes("wp-block-kadence-infobox"), [el]);
      if (boxes.length >= 2) flushBoxes(boxes, lastHeading);
    }
    if (has(el, "wp-block-kadence-accordion")) {
      const items = faqFrom(el);
      if (items.length >= 2) push("faq_accordion", { title: lastHeading || "Sıkça sorulan sorular", items });
      else warnings.push("Akordeon iki sorudan kısa olduğu için atlandı.");
      return;
    }
    if (el.name === "h1" && !hero) {
      const title = textOf(el.children).slice(0, 120);
      let sib = el.next as AnyNode | null;
      while (sib && sib.type === "text") sib = sib.next ?? null;
      const subtitle = sib && sib.type === "tag" && sib.name === "p" ? textOf(sib.children).slice(0, 260) : "";
      if (title) {
        push("hero", { title, ...(subtitle ? { subtitle } : {}) });
        hero = true;
        if (sib && sib.type === "tag") skip.add(sib);
      }
      return;
    }
    if ((el.name === "h2" || el.name === "h3") && !has(el, "kt-accordion")) {
      const t = textOf(el.children);
      if (t && !/çerez/i.test(t)) lastHeading = t.slice(0, 90);
    }
    if (has(el, "wp-block-kadence-infobox")) return;
    const leaf = ["p", "h2", "h3", "h4", "ul", "ol", "blockquote", "pre", "table", "figure", "img"].includes(el.name);
    const insideBox = Boolean(DomUtils.findOne((e) => skip.has(e), [el.parent as Element].filter(Boolean)));
    if (leaf && !insideBox && !has(el, "kt-blocks-info-box") && !has(el, "kt-accordion")) {
      const piece = fragmentBlocks(DomUtils.getOuterHTML(el), origin).filter((b) => {
        if (b.type !== "heading") return true;
        const t = String(b.props.text ?? "");
        return t.length > 0 && !/çerez/i.test(t);
      });
      for (const b of piece) blocks.push({ ...b, id: id() });
      return;
    }
    for (const child of el.children) if (child.type === "tag") visit(child as Element);
  };

  visit(entry);
  if (!hero) warnings.push("Vitrin başlığı bulunamadı.");
  if (blocks.length === 0) warnings.push("Gövdeden blok çıkmadı.");
  return { blocks: blocks.slice(0, 80), warnings };
}

function headerLinks(header: Element, origin: string, locale: string): NavigationMenuItem[] {
  const seen = new Set<string>();
  const items: NavigationMenuItem[] = [];
  for (const a of DomUtils.findAll((e) => e.name === "a" && Boolean(e.attribs.href), [header])) {
    const href = localHref(a.attribs.href ?? "", origin, locale);
    const label = textOf(a.children).slice(0, 40);
    if (!label || !href.startsWith(`/${locale}`) || href === `/${locale}` || seen.has(href)) continue;
    seen.add(href);
    items.push({ id: `m_${items.length + 1}`, label, href });
    if (items.length >= 12) break;
  }
  return items;
}

function footerColumns(footer: Element | null, origin: string, locale: string): FooterConfig["columns"] {
  if (!footer) return [];
  const areas = DomUtils.findAll((e) => cls(e).includes("footer-widget-area"), [footer]).slice(0, 4);
  const columns: FooterConfig["columns"] = [];
  areas.forEach((area, i) => {
    const links: Array<{ label: string; href: string }> = [];
    const seen = new Set<string>();
    for (const a of DomUtils.findAll((e) => e.name === "a" && Boolean(e.attribs.href), [area])) {
      const href = localHref(a.attribs.href ?? "", origin, locale);
      const label = textOf(a.children).slice(0, 80);
      if (!label || !href.startsWith("/") || seen.has(href)) continue;
      seen.add(href);
      links.push({ label, href });
      if (links.length >= 8) break;
    }
    if (links.length) columns.push({ id: `f_${i + 1}`, title: links[0]!.label.slice(0, 40), colSpan: 1, links });
  });
  return columns;
}

function menuHref(raw: string, origin: string): string {
  const value = raw.trim();
  if (!value || value.startsWith("#") || /^javascript:/i.test(value)) return "";
  if (/^(tel:|mailto:)/i.test(value)) return value;
  return rewriteAbsoluteUrl(value, origin, "");
}

function readMenuList(ul: Element, origin: string, depth: number): NavigationMenuItem[] {
  if (depth > 2) return [];
  const items: NavigationMenuItem[] = [];
  for (const node of ul.children) {
    if (node.type !== "tag" || node.name !== "li") continue;
    const link = node.children.find((child) => child.type === "tag" && child.name === "a") as Element | undefined;
    const nested = node.children.find((child) => child.type === "tag" && child.name === "ul") as Element | undefined;
    const label = link ? textOf(link.children).slice(0, 80) : "";
    if (!label) continue;
    const children = nested ? readMenuList(nested, origin, depth + 1).slice(0, 24) : [];
    items.push({
      id: `m_${depth}_${items.length}`,
      label,
      href: link ? menuHref(link.attribs.href ?? "", origin) || "/" : "/",
      source: { kind: "custom" },
      ...(children.length ? { children } : {}),
    });
    if (items.length >= 16) break;
  }
  return items;
}

/** Üst menüyü alt öğeleriyle okur. Adres yerel yola iner; başka site, telefon ve e-posta durur. */
export function menuFromPublicHtml(html: string, origin: string): NavigationMenuItem[] {
  const doc = parseDocument(html.replace(/<script[\s\S]*?<\/script>/gi, ""), { decodeEntities: true });
  const header = find(doc.children, (el) => el.name === "header" || cls(el).includes("site-header") || el.attribs.id === "masthead");
  if (!header) return [];
  const list =
    find([header], (el) => el.name === "ul" && /menu|primary|nav/i.test(`${cls(el)} ${el.attribs.id ?? ""}`)) ??
    find([header], (el) => el.name === "ul");
  if (!list) return [];
  return readMenuList(list, origin, 0);
}

/** Ana sayfa HTML'inden tema kabuğu ve gövde blokları. Yazma yapmaz. */
export function readPublicShell(html: string, pageUrl: string, locale = "tr"): PublicShell {
  const origin = new URL(pageUrl).origin;
  const doc = parseDocument(html.replace(/<style[\s\S]*?<\/style>/gi, ""), { decodeEntities: true });
  const title = squash(textOf(find(doc.children, (e) => e.name === "title")?.children ?? [])).slice(0, 160);
  const descEl = find(doc.children, (e) => e.name === "meta" && (e.attribs.name ?? "").toLowerCase() === "description");
  const description = squash(descEl?.attribs.content ?? "").slice(0, 300);
  const phone = (html.match(/tel:(\+?[0-9]{8,16})/)?.[1] ?? "").slice(0, 20);
  const email = (html.match(/mailto:([^\s"'<>]+)/)?.[1] ?? "").slice(0, 80);
  const headerEl = find(doc.children, (e) => e.name === "header" && (e.attribs.id === "masthead" || cls(e).includes("site-header")));
  const footerEl = find(doc.children, (e) => e.attribs.id === "colophon" || cls(e).includes("site-footer"));
  const menu = headerEl ? headerLinks(headerEl, origin, locale) : [];
  const demo = menu.find((m) => /demo/i.test(m.label) || /demo/i.test(m.href));
  const body = blocksFromPublicHtml(html, origin, locale);
  const header: HeaderConfig = {
    topBar: {
      enabled: Boolean(phone),
      announcementText: "",
      contactPhone: phone,
      contactEmail: email,
      leftWidgets: [],
      centerWidgets: [],
      rightWidgets: phone ? ["contact"] : [],
    },
    mainBar: {
      enabled: true,
      sticky: true,
      glassmorphism: false,
      leftWidgets: ["logo"],
      centerWidgets: ["menu"],
      rightWidgets: demo ? ["cta"] : [],
      ctaLabel: demo ? demo.label : "",
      ctaHref: demo ? demo.href : "",
    },
    bottomBar: { enabled: false, leftWidgets: [], centerWidgets: [], rightWidgets: [], links: [] },
  };
  const columns = footerColumns(footerEl, origin, locale);
  const footer: FooterConfig = {
    columns,
    showNewsletter: false,
    showLocalBusinessCard: false,
    copyrightText: title ? `© ${new Date().getFullYear()} ${title.split("|")[0]!.trim().slice(0, 80)}` : "",
    bottomLinks: menu.slice(0, 4).map((m) => ({ label: m.label, href: m.href })),
  };
  const warnings = [...body.warnings];
  if (!/--global-palette1\s*:\s*#[0-9a-fA-F]{6}/.test(html)) warnings.push("Palet rengi bulunamadı; varsayılan yeşil kullanıldı.");
  return { title, description, phone, email, tokens: tokensFromPalette(html), header, footer, menu, blocks: body.blocks, warnings };
}
