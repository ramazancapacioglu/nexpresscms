import "server-only";
import { headers } from "next/headers";
import type { DesignTokens } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { OFFICIAL_THEME_STORE, YF_LEGACY_THEME_ID, YF_THEME_ID } from "@nexpress/themes";
import { cachedRead } from "./cache";

/** Resmi tema kimliği. Yüklenen tema ve bilinmeyen kimlik `null` döner; ilk resmi temaya düşülmez. */
export function officialPreviewId(id: string | null | undefined): string | null {
  if (!id) return null;
  const canonical = id === YF_LEGACY_THEME_ID ? YF_THEME_ID : id;
  return OFFICIAL_THEME_STORE.some((theme) => theme.id === canonical) ? canonical : null;
}

/** Etkin tema yüklenen bir veri temasıysa kapsamlanmış CSS'i; her yazmada önbellek düşer. */
export const getActiveSkin = cachedRead("active-skin", (siteId: string) => getScopedRepository(siteId).activeSkin());

export interface PreviewTheme {
  themeId: string;
  tokens: DesignTokens;
  css: string;
}

/**
 * `?nx_preview=<tema>` (middleware yalnızca oturumlu kullanıcıda başlığı koyar).
 * Resmi tema manifestodan, yüklenen tema satırdan okunur. Kayıt yazılmaz, önbelleğe alınmaz.
 */
export async function getPreviewTheme(siteId: string): Promise<PreviewTheme | null> {
  const id = (await headers()).get("x-nexpress-preview-theme");
  if (!id) return null;
  const officialId = officialPreviewId(id);
  if (officialId) {
    const theme = OFFICIAL_THEME_STORE.find((item) => item.id === officialId);
    return theme ? { themeId: theme.id, tokens: theme.tokens, css: "" } : null;
  }
  const theme = await getScopedRepository(siteId).getUploadedTheme(id);
  return theme ? { themeId: theme.themeId, tokens: theme.tokens, css: theme.css } : null;
}
