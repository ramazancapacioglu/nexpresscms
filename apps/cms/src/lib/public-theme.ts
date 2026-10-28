import "server-only";
import { headers } from "next/headers";
import type { DesignTokens } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { cachedRead } from "./cache";

/** Etkin tema yüklenen bir veri temasıysa kapsamlanmış CSS'i; her yazmada önbellek düşer. */
export const getActiveSkin = cachedRead("active-skin", (siteId: string) => getScopedRepository(siteId).activeSkin());

export interface PreviewTheme {
  themeId: string;
  tokens: DesignTokens;
  css: string;
}

/**
 * `?nx_preview=<tema>` (middleware yalnızca oturumlu kullanıcıda başlığı koyar): yüklenen temanın
 * token ve skin'i ziyaretçi sayfasına geçici uygulanır; hiçbir şey kaydedilmez. Önbelleğe alınmaz.
 */
export async function getPreviewTheme(siteId: string): Promise<PreviewTheme | null> {
  const id = (await headers()).get("x-nexpress-preview-theme");
  if (!id) return null;
  const theme = await getScopedRepository(siteId).getUploadedTheme(id);
  return theme ? { themeId: theme.themeId, tokens: theme.tokens, css: theme.css } : null;
}
