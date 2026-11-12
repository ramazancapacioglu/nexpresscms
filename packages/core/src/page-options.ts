/**
 * Sayfa başına görünüm seçenekleri (`schemaAttributes._page`): şeffaf/gizli header, gizli footer, içerik genişliği,
 * başlığı gizleme, üst/alt boşluğu kaldırma ve kenar çubuğu. Hepsi isteğe bağlıdır; kayıt yoksa sitenin ayarı geçerlidir.
 * Yalnızca varsayılandan farklı değerler yazılır, böylece eski içerik ve JSON-LD etkilenmez (`_` önekli anahtar şemaya girmez).
 */
export type PageHeaderMode = "default" | "transparent" | "hidden";
export type PageWidth = "default" | "narrow" | "wide" | "full";
export type PageSidebar = "default" | "none" | "left" | "right";

export interface PageOptions {
  header: PageHeaderMode;
  /** Şeffaf header'da yazı rengi: `light` açık (koyu zemin üstünde), `dark` koyu (açık zemin üstünde). */
  headerTone: "light" | "dark";
  footer: "default" | "hidden";
  width: PageWidth;
  /** Yerleşik makale düzeninde başlık satırını görsel olarak gizler (h1 ekran okuyucu için kalır). */
  hideTitle: boolean;
  /** İçerik alanının üst ve alt boşluğunu kaldırır (tam genişlik bantlar için). */
  flush: boolean;
  sidebar: PageSidebar;
  /** `Üyelere özel` içerikte gereken üyelik kademesi (`general.membership.tiers` kimliği); boş = her üye. */
  memberTier: string;
}

export const DEFAULT_PAGE_OPTIONS: PageOptions = {
  header: "default",
  headerTone: "light",
  footer: "default",
  width: "default",
  hideTitle: false,
  flush: false,
  sidebar: "default",
  memberTier: "",
};

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);

type Attrs = Record<string, unknown> | null | undefined;

/** Kayıtlı seçenekleri güvenle okur. `_sidebar.position` eski anahtarı da kenar çubuğu değeri olarak kabul edilir. */
export function readPageOptions(attrs: Attrs): PageOptions {
  const raw = (attrs?._page ?? {}) as Record<string, unknown>;
  const legacySidebar = (attrs?._sidebar as { position?: unknown } | undefined)?.position;
  return {
    header: pick(raw.header, ["default", "transparent", "hidden"] as const, "default"),
    headerTone: pick(raw.headerTone, ["light", "dark"] as const, "light"),
    footer: pick(raw.footer, ["default", "hidden"] as const, "default"),
    width: pick(raw.width, ["default", "narrow", "wide", "full"] as const, "default"),
    hideTitle: raw.hideTitle === true,
    flush: raw.flush === true,
    sidebar: pick(raw.sidebar ?? legacySidebar, ["default", "none", "left", "right"] as const, "default"),
    memberTier: typeof raw.memberTier === "string" && /^[a-z][a-z0-9_-]{1,19}$/.test(raw.memberTier) ? raw.memberTier : "",
  };
}

/** Seçenekleri öznitelik nesnesine yazar: yalnızca varsayılandan farklılar saklanır; hepsi varsayılansa anahtar kalkar. */
export function writePageOptions(attrs: Attrs, options: PageOptions): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(attrs ?? {}) };
  const diff: Record<string, unknown> = {};
  for (const key of Object.keys(DEFAULT_PAGE_OPTIONS) as Array<keyof PageOptions>) {
    if (options[key] === DEFAULT_PAGE_OPTIONS[key]) continue;
    // Ton yalnızca şeffaf header'da anlamlıdır
    if (key === "headerTone" && options.header !== "transparent") continue;
    diff[key] = options[key];
  }
  if (Object.keys(diff).length > 0) next._page = diff;
  else delete next._page;
  // Eski `_sidebar` anahtarı yeni anahtara taşındı; çift kaynak kalmasın
  if (next._page && (next._page as Record<string, unknown>).sidebar !== undefined) delete next._sidebar;
  return next;
}

/** İçerik alanının en çok genişliği. `default` için `undefined` (site ayarı geçerli). */
export function pageMaxWidth(width: PageWidth): string | undefined {
  if (width === "narrow") return "760px";
  if (width === "wide") return "1440px";
  if (width === "full") return "100%";
  return undefined;
}
