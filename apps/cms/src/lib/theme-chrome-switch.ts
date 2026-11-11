import { resolveSiteSettings, type ChromeSnapshot, type FooterConfig, type HeaderConfig } from "@nexpress/core";
import { getThemeChromePreset, YF_LEGACY_THEME_ID, YF_THEME_ID } from "@nexpress/themes";
import { getScopedRepository } from "@nexpress/database";
import { applyYazilimFirmasiChrome, restoreChromeAfterYazilimFirmasi, restoreChromeSnapshot } from "@/lib/apply-yazilim-firmasi-theme";

const canonicalThemeId = (id: string) => (id === YF_LEGACY_THEME_ID ? YF_THEME_ID : id);

type Repo = ReturnType<typeof getScopedRepository>;

/** Şu anki şerit, menü ve düğme/başlık davranışını tema kimliğiyle damgalı anlık görüntüye çevirir. */
async function captureCurrent(repo: Repo, themeId: string, locale: string): Promise<ChromeSnapshot | null> {
  const nav = await repo.getNavigationLayout(locale);
  if (!nav) return null;
  const settings = resolveSiteSettings((await repo.getSite())?.settings);
  return {
    capturedFromThemeId: themeId,
    headerConfig: nav.headerConfig,
    menuItems: nav.menuItems,
    menus: nav.footerConfig.menus ?? [],
    footerConfig: nav.footerConfig,
    sidebarConfig: nav.sidebarConfig,
    customizer: {
      buttons: settings.customizer.buttons,
      header: settings.customizer.header,
      footer: settings.customizer.footer,
      layout: settings.customizer.layout,
    },
  };
}

/** Anlık görüntüyü yayına yazar. Renk jetonlarına dokunmaz; onlar temadan gelir. */
async function restore(repo: Repo, snap: ChromeSnapshot, locale: string) {
  await repo.saveNavigationLayout({
    locale,
    headerConfig: snap.headerConfig,
    menuItems: snap.menuItems,
    menus: snap.menus,
    footerConfig: snap.footerConfig,
    sidebarConfig: snap.sidebarConfig,
  });
  await repo.saveSiteSettings({ customizer: snap.customizer });
}

const filled = (value: string | undefined) => Boolean(value && value.trim());
/** Hazır şablonların örnek çağrısı (`/admin`) ziyaretçiye taşınmasın. */
const usableHref = (value: string | undefined) => filled(value) && !String(value).startsWith("/admin");

/** Temanın düzenini uygular; kullanıcının metin ve bağlantı içeriği (menü, çağrı, iletişim, sütun bağlantıları) korunur. */
async function applyPreset(repo: Repo, themeId: string, locale: string): Promise<boolean> {
  const preset = getThemeChromePreset(themeId);
  const nav = await repo.getNavigationLayout(locale);
  if (!preset || !nav) return false;

  const cur = nav.headerConfig;
  const header: HeaderConfig = structuredClone(preset.header);
  if (filled(cur.mainBar?.ctaLabel) && usableHref(cur.mainBar?.ctaHref)) {
    header.mainBar = { ...header.mainBar, ctaLabel: cur.mainBar.ctaLabel, ctaHref: cur.mainBar.ctaHref };
  } else if (!usableHref(header.mainBar.ctaHref)) {
    header.mainBar = { ...header.mainBar, ctaLabel: "", ctaHref: "" };
  }
  if (header.topBar.enabled) {
    header.topBar = {
      ...header.topBar,
      announcementText: filled(cur.topBar?.announcementText) ? cur.topBar.announcementText : header.topBar.announcementText,
      contactPhone: filled(cur.topBar?.contactPhone) ? cur.topBar.contactPhone : header.topBar.contactPhone,
      contactEmail: filled(cur.topBar?.contactEmail) ? cur.topBar.contactEmail : header.topBar.contactEmail,
    };
  }

  const curFooter = nav.footerConfig;
  const footer: FooterConfig = {
    ...structuredClone(preset.footer),
    menus: curFooter.menus ?? [],
    columns: curFooter.columns?.length ? curFooter.columns : preset.footer.columns,
    bottomLinks: curFooter.bottomLinks?.length ? curFooter.bottomLinks : preset.footer.bottomLinks,
    copyrightText: filled(curFooter.copyrightText) ? curFooter.copyrightText : preset.footer.copyrightText,
  };

  await repo.saveNavigationLayout({ locale, headerConfig: header, menuItems: nav.menuItems, footerConfig: footer, sidebarConfig: nav.sidebarConfig });
  await repo.saveSiteSettings({ customizer: preset.customizer });
  return true;
}

/**
 * Tema değişince şeridi (başlık, altlık, menü, düğme/başlık davranışı) tema başına yönetir:
 * 1. ayrılan temanın şu anki düzeni `general.themeChrome[eskiTema]` altına saklanır;
 * 2. yeni temanın saklı düzeni varsa geri yazılır (kullanıcının düzenlemeleri kaybolmaz);
 * 3. yoksa temanın hazır düzeni uygulanır (Yazılım Firması kendi uygulayıcısını kullanır);
 * 4. yüklenen veri temaları kendi şablonunu ayrıca uygular (bkz. `activateUploadedThemeAction`).
 * Renkler `activateTheme` ile temaya aittir; sayfa içerikleri silinmez.
 */
export async function switchThemeChrome(siteId: string, previousRaw: string, nextRaw: string, locale = "tr"): Promise<void> {
  const previousId = previousRaw ? canonicalThemeId(previousRaw) : "";
  const nextId = canonicalThemeId(nextRaw);
  if (previousId === nextId) return;
  const repo = getScopedRepository(siteId);

  const settings = resolveSiteSettings((await repo.getSite())?.settings);
  const map: Record<string, ChromeSnapshot> = { ...(settings.general.themeChrome ?? {}) };

  if (previousId) {
    const snap = await captureCurrent(repo, previousId, locale);
    if (snap) map[previousId] = snap;
  }
  await repo.saveSiteSettings({ general: { themeChrome: map } });

  const saved = map[nextId];
  if (saved) {
    await restore(repo, saved, locale);
    return;
  }
  if (nextId === YF_THEME_ID) {
    await applyYazilimFirmasiChrome(siteId, locale);
    return;
  }
  if (previousId === YF_THEME_ID) {
    // Eski sürüm anlık görüntüsü (yalnızca Yazılım Firması öncesi) varsa onu, yoksa sade şeridi kullan
    if (await restoreChromeSnapshot(siteId, locale)) return;
    await restoreChromeAfterYazilimFirmasi(siteId, locale);
  }
  await applyPreset(repo, nextId, locale);
}
