"use client";

import { ThemeProvider } from "next-themes";

/**
 * Açık/koyu tema yalnızca yönetim ve giriş ekranlarında vardır. Kök düzende değil, burada
 * tutulur; ziyaretçi sayfaları `next-themes` JS'ini hiç indirmez (docs/12 P0-6).
 */
export function ThemeBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
