/**
 * Header şerit yerleşimi (saf mantık).
 * Sol / orta / sağ diziler `HeaderBarSlotConfig` içinde durur.
 * Eski şablon kimlikleri (mega_menu, cta_button, contact_info) kanonik öğeye çevrilir.
 * Üç dizi de boşsa veya yalnızca bilinmeyen kimlik varsa şeridin varsayılanı kullanılır.
 */

export const HEADER_WIDGETS = [
  "announcement",
  "contact",
  "logo",
  "menu",
  "search",
  "cta",
  "links",
  "phone",
  "email",
  "button2",
  "social",
  "cart",
  "html",
  "divider",
] as const;

export type HeaderWidgetId = (typeof HEADER_WIDGETS)[number];

/** Yerleşim kurucusunun öğe listesi: kısa ad ve tek satırlık ipucu. Her öğe her şeritte kullanılabilir. */
export const HEADER_WIDGET_META: Record<HeaderWidgetId, { label: string; hint: string }> = {
  logo: { label: "Logo", hint: "Site adı veya logo görseli" },
  menu: { label: "Ana menü", hint: "Menü sekmesindeki ana menü" },
  search: { label: "Arama", hint: "Site içi arama bağlantısı" },
  cta: { label: "Ana düğme", hint: "Etiket, adres ve biçim" },
  button2: { label: "İkinci düğme", hint: "Çerçeveli ikincil eylem" },
  phone: { label: "Telefon", hint: "Tıklayınca arar" },
  email: { label: "E-posta", hint: "Tıklayınca e-posta açar" },
  social: { label: "Sosyal bağlantılar", hint: "SEO > Kuruluş > sameAs adresleri" },
  cart: { label: "Sepet", hint: "Mağaza sepet bağlantısı" },
  announcement: { label: "Duyuru", hint: "Kısa duyuru metni" },
  contact: { label: "Telefon + e-posta", hint: "İletişim bilgileri tek grupta" },
  links: { label: "Kısayollar", hint: "Alt şerit bağlantıları" },
  html: { label: "Kısa metin", hint: "Düz metin (HTML yok)" },
  divider: { label: "Ayırıcı", hint: "İnce dikey çizgi" },
};

export interface HeaderZones {
  left: HeaderWidgetId[];
  center: HeaderWidgetId[];
  right: HeaderWidgetId[];
}

export type HeaderBarKey = "top" | "main" | "bottom";

/** Eski kayıtlar ve hazır şablonlar aynı öğeyi farklı adlarla yazmıştı. */
const ALIASES: Record<string, HeaderWidgetId> = {
  announcement: "announcement",
  contact: "contact",
  contact_info: "contact",
  logo: "logo",
  menu: "menu",
  mega_menu: "menu",
  search: "search",
  search_bar: "search",
  cta: "cta",
  cta_button: "cta",
  links: "links",
  campaign_links: "links",
  category_drawer: "links",
  phone: "phone",
  email: "email",
  button2: "button2",
  social: "social",
  cart: "cart",
  html: "html",
  divider: "divider",
};

export const DEFAULT_HEADER_ZONES: Record<HeaderBarKey, HeaderZones> = {
  top: { left: ["announcement"], center: [], right: ["contact"] },
  main: { left: ["logo"], center: ["menu"], right: ["cta"] },
  bottom: { left: [], center: ["links"], right: [] },
};

export interface HeaderBarWidgets {
  leftWidgets?: string[];
  centerWidgets?: string[];
  rightWidgets?: string[];
  /** Küçük ekran. Üçü de yoksa masaüstü dizisinden türetilir. */
  mobileLeftWidgets?: string[];
  mobileCenterWidgets?: string[];
  mobileRightWidgets?: string[];
}

function take(ids: string[] | undefined, used: Set<HeaderWidgetId>): HeaderWidgetId[] {
  const out: HeaderWidgetId[] = [];
  for (const raw of ids ?? []) {
    const id = ALIASES[raw];
    if (!id || used.has(id)) continue;
    used.add(id);
    out.push(id);
  }
  return out;
}

/** Şeridin basılacak öğe dizisi. Aynı öğe birden fazla bölgedeyse soldan sağa ilk konum kalır. */
export function resolveHeaderZones(bar: HeaderBarWidgets | undefined, fallback: HeaderZones): HeaderZones {
  const used = new Set<HeaderWidgetId>();
  const left = take(bar?.leftWidgets, used);
  const center = take(bar?.centerWidgets, used);
  const right = take(bar?.rightWidgets, used);
  if (left.length + center.length + right.length === 0) return fallback;
  return { left, center, right };
}

export function zonesToWidgets(zones: HeaderZones): Required<Pick<HeaderBarWidgets, "leftWidgets" | "centerWidgets" | "rightWidgets">> {
  return {
    leftWidgets: zones.left,
    centerWidgets: zones.center,
    rightWidgets: zones.right,
  };
}

/** Telefonda kendiliğinden gelmeyen öğeler: dar şeritte yer yemez, isterse mobil düzende elle eklenir. */
const DESKTOP_ONLY: ReadonlySet<HeaderWidgetId> = new Set(["phone", "email", "button2", "social", "html", "divider"]);

/** Masaüstü dizisinden telefon düzeni: logo ve duyuru solda, menü/çağrı/arama sağda, orta boş. Geniş öğeler atlanır. */
export function deriveMobileZones(desktop: HeaderZones): HeaderZones {
  const all = [...desktop.left, ...desktop.center, ...desktop.right];
  return {
    left: all.filter((id) => id === "logo" || id === "announcement"),
    center: [],
    right: all.filter((id) => id !== "logo" && id !== "announcement" && !DESKTOP_ONLY.has(id)),
  };
}

/** Üç mobil diziden biri yazılmışsa düzen açıktır. Boş dizi de açık sayılır. */
export function hasExplicitMobileZones(bar: HeaderBarWidgets | undefined): boolean {
  if (!bar) return false;
  return bar.mobileLeftWidgets !== undefined || bar.mobileCenterWidgets !== undefined || bar.mobileRightWidgets !== undefined;
}

/** Yazılı mobil dizi varsa onu basar; yoksa masaüstünden türetir. */
export function resolveMobileHeaderZones(bar: HeaderBarWidgets | undefined, desktop: HeaderZones): HeaderZones {
  if (!hasExplicitMobileZones(bar)) return deriveMobileZones(desktop);
  return resolveHeaderZones(
    {
      leftWidgets: bar?.mobileLeftWidgets,
      centerWidgets: bar?.mobileCenterWidgets,
      rightWidgets: bar?.mobileRightWidgets,
    },
    deriveMobileZones(desktop),
  );
}

export function mobileZonesToWidgets(zones: { left: readonly string[]; center: readonly string[]; right: readonly string[] }): Required<Pick<HeaderBarWidgets, "mobileLeftWidgets" | "mobileCenterWidgets" | "mobileRightWidgets">> {
  return {
    mobileLeftWidgets: [...zones.left],
    mobileCenterWidgets: [...zones.center],
    mobileRightWidgets: [...zones.right],
  };
}

const SOCIAL_NAMES: Array<[RegExp, string]> = [
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/(^|\.)(x|twitter)\.com$/, "X"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)facebook\.com$/, "Facebook"],
  [/(^|\.)youtube\.com$/, "YouTube"],
  [/(^|\.)github\.com$/, "GitHub"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)wa\.me$/, "WhatsApp"],
];

/** `sameAs` adreslerinden "Sosyal bağlantılar" öğesinin listesi: yalnızca https, en çok 6, tekrarsız. */
export function socialLinksFromSameAs(urls: readonly string[] | undefined): Array<{ label: string; href: string }> {
  const out: Array<{ label: string; href: string }> = [];
  for (const raw of urls ?? []) {
    let url: URL;
    try {
      url = new URL(raw.trim());
    } catch {
      continue;
    }
    if (url.protocol !== "https:" || out.some((item) => item.href === url.href)) continue;
    const host = url.hostname.replace(/^www\./, "");
    out.push({ label: SOCIAL_NAMES.find(([re]) => re.test(host))?.[1] ?? host, href: url.href });
    if (out.length >= 6) break;
  }
  return out;
}

