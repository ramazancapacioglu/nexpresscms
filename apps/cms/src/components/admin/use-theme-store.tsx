import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_CUSTOMIZER_SETTINGS,
  catalogEntry,
  fontStack,
  primaryFamily,
  type DesignTokens,
  type SiteCustomizerSettings,
  type SiteSettings,
  type TemplateKind,
} from "@nexpress/core";
import { GLOBAL_TYPOGRAPHY_PAIRS, type ThemeManifest } from "@nexpress/themes";
import { saveThemeCustomizerAction } from "@/app/admin/actions";
import { installFontAction } from "@/app/admin/themes/font-actions";

export interface CustomizerTemplateSummary {
  id: string;
  name: string;
  kind: TemplateKind;
  isDefault: boolean;
  blocks: number;
}

export interface ThemeStoreClientProps {
  themes: ThemeManifest[];
  activeThemeId: string;
  currentTokens: DesignTokens;
  currentSettings?: SiteSettings;
  initialTemplates?: CustomizerTemplateSummary[];
}

export type CustomizerTabId =
  | "themes"
  | "colors"
  | "typography"
  | "layout"
  | "chrome"
  | "templates";

export type PreviewPageType =
  | "home"
  | "post"
  | "category"
  | "tag"
  | "page"
  | "product"
  | "shop"
  | "search";

/** ThemeStoreClient durum ve davranışları; JSX bölümleri bu nesneyi `s` olarak alır. */
export function useThemeStore({
  themes,
  activeThemeId: initialThemeId,
  currentTokens,
  currentSettings,
  initialTemplates = [],
}: ThemeStoreClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedThemeId, setSelectedThemeId] =
    useState<string>(initialThemeId);
  const [tokens, setTokens] = useState<DesignTokens>(currentTokens);
  const [customizer, setCustomizer] = useState<SiteCustomizerSettings>(
    currentSettings?.customizer ?? DEFAULT_CUSTOMIZER_SETTINGS
  );
  const [templatesList, setTemplatesList] = useState<CustomizerTemplateSummary[]>(initialTemplates);

  // Tema seçimi varsayılan olarak gizlidir; kullanıcı isterse "Temaları Göster / Gizle" ile açar
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false);
  // Sol özelleştirici panelini gizleyip canlı önizlemeyi tam ekran yapma durumu
  const [hideControlPanel, setHideControlPanel] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<CustomizerTabId>("colors");
  const [previewDevice, setPreviewDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [previewPageType, setPreviewPageType] =
    useState<PreviewPageType>("home");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const handleSelectTheme = (thm: ThemeManifest) => {
    setSelectedThemeId(thm.id);
    setTokens(thm.tokens);
    showToast(`"${thm.name}" tasarım tokenları önizlemeye yüklendi.`);
  };

  const handleApplyPalette = (
    paletteId: string,
    colors: DesignTokens["colors"]
  ) => {
    setTokens((prev) => ({ ...prev, colors: { ...colors } }));
    setCustomizer((prev) => ({ ...prev, activePaletteId: paletteId }));
    showToast("Global renk paleti uygulandı.");
  };

  /** Katalogdaki aileleri sunucuya indirir (zaten inenler atlanır) ve özelleştirici ayarına işler. */
  const ensureFonts = async (families: string[]) => {
    const have = new Set((customizer.typography.fonts ?? []).map((f) => f.family));
    for (const family of new Set(families)) {
      if (!catalogEntry(family) || have.has(family)) continue;
      const res = await installFontAction({ family });
      if (!res.ok) {
        showToast(`${family}: ${res.error}`);
        continue;
      }
      setCustomizer((prev) => ({ ...prev, typography: { ...prev.typography, fonts: [...(prev.typography.fonts ?? []).filter((f) => f.family !== family), res.font] } }));
    }
  };

  /** Başlık, gövde veya kod yazı tipini katalogdan seçer; dosya inene kadar sistem yedeği görünür. */
  const setFontFamily = (role: "headingFont" | "bodyFont" | "monoFont", family: string) => {
    const stack = fontStack(family);
    if (!stack) return;
    setTokens((prev) => ({ ...prev, typography: { ...prev.typography, [role]: stack } }));
    startTransition(async () => {
      await ensureFonts([family]);
    });
  };

  const handleApplyTypographyPair = (
    pair: (typeof GLOBAL_TYPOGRAPHY_PAIRS)[number]
  ) => {
    setTokens((prev) => ({
      ...prev,
      typography: {
        headingFont: pair.headingFont,
        bodyFont: pair.bodyFont,
        monoFont: pair.monoFont,
        baseSizePx: pair.baseSizePx,
        scaleRatio: pair.scaleRatio,
      },
    }));
    showToast(`"${pair.name}" tipografi çifti uygulandı.`);
    startTransition(async () => {
      await ensureFonts([primaryFamily(pair.headingFont), primaryFamily(pair.bodyFont), primaryFamily(pair.monoFont)]);
    });
  };

  const handleSaveAll = () => {
    startTransition(async () => {
      const targetManifest =
        themes.find((t) => t.id === selectedThemeId) ?? themes[0]!;
      await saveThemeCustomizerAction({
        themeId: selectedThemeId,
        siteProfile: targetManifest.recommendedProfile,
        tokens,
        customizer,
      });
      showToast("Tema ve özelleştirici ayarları kaydedildi.");
      router.refresh();
    });
  };

  const btnRadius =
    customizer.buttons.style === "pill"
      ? "9999px"
      : customizer.buttons.style === "sharp"
        ? "2px"
        : tokens.geometry.borderRadius;

  return {
    themes,
    initialThemeId,
    currentTokens,
    currentSettings,
    isPending,
    startTransition,
    selectedThemeId,
    setSelectedThemeId,
    tokens,
    setTokens,
    customizer,
    setCustomizer,
    templatesList,
    setTemplatesList,
    showThemeSelector,
    setShowThemeSelector,
    hideControlPanel,
    setHideControlPanel,
    activeTab,
    setActiveTab,
    previewDevice,
    setPreviewDevice,
    previewPageType,
    setPreviewPageType,
    toastMsg,
    setToastMsg,
    router,
    showToast,
    handleSelectTheme,
    handleApplyPalette,
    handleApplyTypographyPair,
    setFontFamily,
    handleSaveAll,
    btnRadius,
  };
}

export type ThemeStoreState = ReturnType<typeof useThemeStore>;
