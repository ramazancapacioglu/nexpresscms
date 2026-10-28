import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_CUSTOMIZER_SETTINGS, type DesignTokens, type SiteCustomizerSettings, type SiteSettings } from "@nexpress/core";
import { GLOBAL_TYPOGRAPHY_PAIRS, type ThemeManifest } from "@nexpress/themes";
import { saveThemeCustomizerAction } from "@/app/admin/actions";

export interface ThemeStoreClientProps {
  themes: ThemeManifest[];
  activeThemeId: string;
  currentTokens: DesignTokens;
  currentSettings?: SiteSettings;
}

/** ThemeStoreClient durum ve davranışları; JSX bölümleri bu nesneyi `s` olarak alır. */
export function useThemeStore({
  themes,
  activeThemeId: initialThemeId,
  currentTokens,
  currentSettings,
}: ThemeStoreClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedThemeId, setSelectedThemeId] =
    useState<string>(initialThemeId);
  const [tokens, setTokens] = useState<DesignTokens>(currentTokens);
  const [customizer, setCustomizer] = useState<SiteCustomizerSettings>(
    currentSettings?.customizer ?? DEFAULT_CUSTOMIZER_SETTINGS
  );

  const [activeTab, setActiveTab] = useState<
    "themes" | "colors" | "typography" | "layout"
  >("themes");
  const [previewDevice, setPreviewDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
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

  return { themes, initialThemeId, currentTokens, currentSettings, isPending, startTransition, selectedThemeId, setSelectedThemeId, tokens, setTokens, customizer, setCustomizer, activeTab, setActiveTab, previewDevice, setPreviewDevice, toastMsg, setToastMsg, router, showToast, handleSelectTheme, handleApplyPalette, handleApplyTypographyPair, handleSaveAll, btnRadius };
}

export type ThemeStoreState = ReturnType<typeof useThemeStore>;
