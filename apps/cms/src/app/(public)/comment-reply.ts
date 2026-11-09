"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolvePublishing } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { siteLocaleBase } from "@/lib/locale-url";

/** Ziyaretçi yanıtı. Onay bekler; yıldız yazılmaz. */
export async function submitCommentReply(formData: FormData): Promise<void> {
  if (String(formData.get("company") ?? "").trim()) return;
  const contentId = String(formData.get("contentId") ?? "");
  const parentId = String(formData.get("parentId") ?? "");
  const authorName = String(formData.get("authorName") ?? "").trim().slice(0, 80);
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const locale = String(formData.get("locale") ?? "tr");
  const slug = String(formData.get("slug") ?? "");
  if (!contentId.startsWith("cnt_") || !parentId || authorName.length < 2 || body.length < 2 || !slug) return;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const content = await repo.getContentById(contentId, locale);
  if (!content || content.status !== "published" || resolvePublishing(content.schemaAttributes).allowComments === false) return;
  const siblings = await repo.listCommentsReviews(contentId);
  if (!siblings.some((item) => item.id === parentId && item.status === "approved")) return;
  await repo.saveCommentReview({
    contentId,
    parentId,
    authorName,
    entryType: "comment",
    body,
    status: "pending",
  });
  const lb = await siteLocaleBase(siteId, locale);
  redirect(`${lb}/${slug}?yorum=bekliyor`);
}
