/**
 * Footer satır stilleri (saf mantık). Footer üç satırdır: üst bant (`topBanner`), orta satır (bileşen sütunları) ve alt çubuk
 * (telif + bağlantılar). Orta ve alt satırın zemini, yazı tonu, dikey boşluğu, ayracı ve genişliği ayrı ayrı seçilir.
 * Değerler çizim anında `resolveFooterStyle` ile beyaz listeye indirilir: kayıtlı bozuk değer CSS'e sızmaz.
 */

export const FOOTER_BACKGROUNDS = ["default", "muted", "primary", "dark", "custom"] as const;
export type FooterBackground = (typeof FOOTER_BACKGROUNDS)[number];

export const FOOTER_BACKGROUND_LABEL: Record<FooterBackground, string> = {
  default: "Sayfa zemini",
  muted: "Açık gri",
  primary: "Marka rengi",
  dark: "Koyu",
  custom: "Özel renk",
};

export interface FooterRowStyle {
  background?: FooterBackground;
  /** Yalnızca `custom`: `#rgb` / `#rrggbb`. */
  customColor?: string;
  /** Üst-alt boşluk (px), 8–120. */
  paddingY?: number;
  /** Satırın üstünde ince ayraç çizgisi. */
  divider?: boolean;
  /** `full`: zemin ekranın tam genişliği, içerik yine kapsayıcıda. */
  width?: "contained" | "full";
}

export const FOOTER_SOCIAL_NETWORKS = ["x", "linkedin", "instagram", "youtube", "github", "facebook"] as const;
export type FooterSocialNetwork = (typeof FOOTER_SOCIAL_NETWORKS)[number];
export const FOOTER_SOCIAL_LABEL: Record<FooterSocialNetwork, string> = { x: "X", linkedin: "LinkedIn", instagram: "Instagram", youtube: "YouTube", github: "GitHub", facebook: "Facebook" };

export interface FooterBottomStyle extends FooterRowStyle {
  /** Alt çubukta gösterilecek sosyal bağlantılar (ağ → https adresi). */
  socials?: Partial<Record<FooterSocialNetwork, string>>;
  /** Alt çubukta gösterilecek menü (`footerConfig.menus` kaydının kimliği; ilk düzey, en çok 6 öğe). */
  menuId?: string;
  /** `split`: telif solda, bağlantılar sağda. `centered`: ikisi de ortada. */
  layout?: "split" | "centered";
  /** Sayfa başına dönen bağlantı (JS'siz çapa). */
  backToTop?: boolean;
}

export interface FooterOptions {
  main?: FooterRowStyle;
  bottom?: FooterBottomStyle;
  /** Sütunlar arası boşluk. */
  gap?: "sm" | "md" | "lg";
}

function safeSocialUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" && !u.username && !u.password ? u.href.slice(0, 300) : "";
  } catch {
    return "";
  }
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export interface ResolvedFooterRow {
  background: FooterBackground;
  customColor: string | null;
  paddingY: number;
  divider: boolean;
  full: boolean;
}

export interface ResolvedFooterStyle {
  main: ResolvedFooterRow;
  bottom: ResolvedFooterRow & { centered: boolean; backToTop: boolean; socials: Array<{ id: FooterSocialNetwork; label: string; href: string }>; menuId: string | null };
  gapPx: number;
}

const GAP_PX = { sm: 20, md: 32, lg: 48 } as const;

function row(raw: FooterRowStyle | undefined, fallback: { paddingY: number; divider: boolean }): ResolvedFooterRow {
  const background = FOOTER_BACKGROUNDS.find((b) => b === raw?.background) ?? "default";
  const customColor = background === "custom" && typeof raw?.customColor === "string" && HEX_RE.test(raw.customColor) ? raw.customColor : null;
  const pad = typeof raw?.paddingY === "number" && Number.isFinite(raw.paddingY) ? Math.min(120, Math.max(8, Math.round(raw.paddingY))) : fallback.paddingY;
  return {
    // Geçersiz özel renk sayfa zeminine düşer
    background: background === "custom" && !customColor ? "default" : background,
    customColor,
    paddingY: pad,
    divider: typeof raw?.divider === "boolean" ? raw.divider : fallback.divider,
    full: raw?.width === "full",
  };
}

export function resolveFooterStyle(options: FooterOptions | undefined | null): ResolvedFooterStyle {
  const bottom = row(options?.bottom, { paddingY: 20, divider: true });
  return {
    main: row(options?.main, { paddingY: 48, divider: false }),
    bottom: {
      ...bottom,
      centered: options?.bottom?.layout === "centered",
      backToTop: options?.bottom?.backToTop === true,
      // Yalnızca https adresleri; geçersiz değer atılır (javascript:/data: asla bağlantı olmaz)
      socials: FOOTER_SOCIAL_NETWORKS.flatMap((id) => {
        const href = safeSocialUrl(options?.bottom?.socials?.[id]);
        return href ? [{ id, label: FOOTER_SOCIAL_LABEL[id], href }] : [];
      }),
      menuId: typeof options?.bottom?.menuId === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(options.bottom.menuId) ? options.bottom.menuId : null,
    },
    gapPx: GAP_PX[options?.gap ?? "md"] ?? GAP_PX.md,
  };
}

/** Telif metnindeki `{year}` ve `{site}` yer tutucularını doldurur. */
export const expandFooterText = (text: string | undefined, siteName: string, year: number): string =>
  (text ?? "").replace(/\{year\}/gi, String(year)).replace(/\{site\}/gi, siteName);

/** Zemin renginden okunaklı yazı rengi: koyu ve marka zemininde açık, diğerlerinde `null` (sayfa yazı rengi). */
export interface FooterColors {
  background: string | null;
  color: string | null;
}

export function footerRowColors(
  r: Pick<ResolvedFooterRow, "background" | "customColor">,
  tokens: { primary: string; primaryForeground: string; muted: string }
): FooterColors {
  switch (r.background) {
    case "muted":
      return { background: tokens.muted, color: null };
    case "primary":
      return { background: tokens.primary, color: tokens.primaryForeground };
    case "dark":
      return { background: "#0f172a", color: "#e2e8f0" };
    case "custom": {
      const hex = r.customColor ?? "#ffffff";
      const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
      const lum = (0.299 * parseInt(full.slice(1, 3), 16) + 0.587 * parseInt(full.slice(3, 5), 16) + 0.114 * parseInt(full.slice(5, 7), 16)) / 255;
      return { background: hex, color: lum < 0.55 ? "#f8fafc" : "#0f172a" };
    }
    default:
      return { background: null, color: null };
  }
}
