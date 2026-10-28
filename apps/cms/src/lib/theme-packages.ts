import "server-only";
import { getScopedRepository, type UploadedThemeDto } from "@nexpress/database";
import { OFFICIAL_THEME_STORE } from "@nexpress/themes/registry";
import { buildThemePackage, FooterSchema, HeaderSchema, parseThemePackage, ThemeJsonSchema, TokensSchema, type ThemeFooter, type ThemeHeader } from "@nexpress/themes/package";
import { requireAdminApi } from "@/lib/admin-api";
export { requireAdminApi };
import { invalidateSite } from "@/lib/cache";

export type InstallReport =
  | { ok: true; replaced: boolean; theme: { id: string; name: string; version: string }; warnings: string[]; pages: number; hasChrome: boolean; hasCss: boolean }
  | { ok: false; errors: string[]; warnings: string[] };

/** Paketi doğrular ve (geçerliyse) kurar. Etkinleştirmez; mevcut hiçbir içeriğe dokunmaz. */
export async function installThemePackage(siteId: string, bytes: Uint8Array): Promise<InstallReport> {
  const parsed = parseThemePackage(bytes);
  if (!parsed.ok) return { ok: false, errors: parsed.errors, warnings: parsed.warnings };
  const { theme, tokens, css, rawCss, header, footer, pages, screenshot, checksum } = parsed.value;
  if (OFFICIAL_THEME_STORE.some((t) => t.id === theme.id)) {
    return { ok: false, errors: [`"${theme.id}" kimliği resmi bir temaya ait; paketin theme.json içindeki id alanını değiştirin.`], warnings: parsed.warnings };
  }
  const res = await getScopedRepository(siteId).installUploadedTheme({
    themeId: theme.id,
    name: theme.name,
    version: theme.version,
    author: theme.author,
    tagline: theme.tagline,
    description: theme.description,
    recommendedProfile: theme.recommendedProfile,
    tokens,
    css,
    rawCss,
    header: header ?? null,
    footer: footer ?? null,
    pages,
    screenshot: screenshot?.dataUri ?? null,
    checksum,
  });
  if (!res.ok) return { ok: false, errors: [res.error], warnings: parsed.warnings };
  await invalidateSite(siteId);
  return { ok: true, replaced: res.replaced, theme: { id: theme.id, name: theme.name, version: theme.version }, warnings: parsed.warnings, pages: pages.length, hasChrome: Boolean(header || footer), hasCss: Boolean(css) };
}

export function exportUploaded(theme: UploadedThemeDto): Uint8Array {
  const meta = ThemeJsonSchema.parse({ id: theme.themeId, name: theme.name, version: theme.version, author: theme.author, tagline: theme.tagline, description: theme.description, recommendedProfile: theme.recommendedProfile });
  return buildThemePackage({
    theme: meta,
    tokens: TokensSchema.parse(theme.tokens),
    css: theme.rawCss,
    header: theme.header ? HeaderSchema.parse(theme.header) : undefined,
    footer: theme.footer ? FooterSchema.parse(theme.footer) : undefined,
    pages: theme.pages as never,
    screenshot: theme.screenshot ? { mime: theme.screenshot.slice(5, theme.screenshot.indexOf(";")), dataUri: theme.screenshot } : undefined,
  });
}

/** Sitenin geçerli tasarımını (token + üst/alt şablon) `.nxtheme` olarak dışa aktarır. */
export async function exportCurrentDesign(siteId: string): Promise<{ ok: true; bytes: Uint8Array; id: string; warnings: string[] } | { ok: false; error: string }> {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  if (!site?.designTokens) return { ok: false, error: "Site tasarımı bulunamadı." };
  const tokens = TokensSchema.safeParse(site.designTokens);
  if (!tokens.success) return { ok: false, error: `Tasarım token'ları paket biçimine uymuyor: ${tokens.error.issues[0]?.path.join(".")}` };
  const id = `${(site.name || "tasarim").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 28) || "tasarim"}-tasarimi`;
  const warnings: string[] = [];
  const nav = await repo.getNavigationLayout(site.defaultLocale);
  let header: ThemeHeader | undefined;
  let footer: ThemeFooter | undefined;
  if (nav) {
    const h = HeaderSchema.safeParse(nav.headerConfig);
    const f = FooterSchema.safeParse(nav.footerConfig);
    if (h.success) header = h.data as ThemeHeader;
    else warnings.push("Üst şablon paket biçimine uymadığı için dışarıda bırakıldı.");
    if (f.success) footer = f.data as ThemeFooter;
    else warnings.push("Alt şablon paket biçimine uymadığı için dışarıda bırakıldı.");
  }
  const meta = ThemeJsonSchema.parse({ id, name: `${site.name} tasarımı`, version: "1.0.0", author: "", description: "Site tasarımından dışa aktarıldı.", recommendedProfile: site.siteProfile });
  return { ok: true, id, bytes: buildThemePackage({ theme: meta, tokens: tokens.data as never, header, footer }), warnings };
}
