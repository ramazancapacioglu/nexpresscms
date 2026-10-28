"use server";

import { getScopedRepository, type RevisionSnapshot, type RevisionSummary } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";

export type RevisionListResult = { ok: true; revisions: RevisionSummary[] } | { ok: false; error: string };
export type RevisionGetResult =
  | { ok: true; revision: { id: string; createdAt: Date; authorEmail: string; snapshot: RevisionSnapshot } }
  | { ok: false; error: string };

/** İçeriğin revizyon özetleri (görüntü yüklenmez). Okuma olduğu için denetim kaydı yazılmaz. */
export async function listRevisionsAction(input: { contentId: string; locale?: string }): Promise<RevisionListResult> {
  const session = await requireUser();
  if (!input.contentId) return { ok: false, error: "İçerik kimliği gerekli." };
  return { ok: true, revisions: await getScopedRepository(session.siteId).listRevisions(input.contentId, input.locale && /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(input.locale) ? input.locale : "tr") };
}

/**
 * Bir revizyonun tam görüntüsü. Yalnızca editöre yüklenir; kaydetmek ayrı ve bilinçli bir adımdır
 * (yüklemek veritabanını değiştirmez).
 */
export async function getRevisionAction(input: { id: string }): Promise<RevisionGetResult> {
  const session = await requireUser();
  const rev = await getScopedRepository(session.siteId).getRevision(input.id);
  if (!rev) return { ok: false, error: "Revizyon bulunamadı." };
  return { ok: true, revision: { id: rev.id, createdAt: rev.createdAt, authorEmail: rev.authorEmail, snapshot: rev.snapshot } };
}
