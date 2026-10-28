import "server-only";
import { verifyDraftPreviewToken } from "@nexpress/core/draft-preview";
import { getScopedRepository } from "@nexpress/database";
import { getAuthSecret } from "@/lib/auth/config";

/** `?nx_draft=<belirteç>` geçerliyse ve belirteç tam bu sayfanın içeriğine aitse taslağı (yayın durumundan bağımsız) döner. */
export async function resolveDraftPreview(siteId: string, locale: string, slug: string, token: string | undefined) {
  if (!token) return null;
  const contentId = verifyDraftPreviewToken(getAuthSecret(), siteId, token);
  if (!contentId) return null;
  const content = await getScopedRepository(siteId).getContentBySlug(slug, locale, { publicOnly: false });
  return content && content.id === contentId ? content : null;
}
