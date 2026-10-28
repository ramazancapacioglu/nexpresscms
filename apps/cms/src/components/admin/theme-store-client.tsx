"use client";

import React from "react";
import { useThemeStore, type ThemeStoreClientProps } from "./use-theme-store";
import { ThemeStoreToast } from "./theme-store-toast";
import { ThemeStoreHeader } from "./theme-store-header";
import { ThemeStoreCustomizer } from "./theme-store-customizer";

export type { ThemeStoreClientProps } from "./use-theme-store";

export function ThemeStoreClient(props: ThemeStoreClientProps) {
  const s = useThemeStore(props);
  return (
    <div className="space-y-4">
      <ThemeStoreToast s={s} />
      <ThemeStoreHeader s={s} />
      <ThemeStoreCustomizer s={s} />
    </div>
  );
}
