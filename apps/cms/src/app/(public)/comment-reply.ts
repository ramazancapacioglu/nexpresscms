"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createRateLimiter,
  resolvePublishing,
  validatePublicCommentSubmission,
} from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { revalidatePath } from "@/lib/cache";
import { siteLocaleBase } from "@/lib/locale-url";

const submitLimiter = createRateLimiter(5, 60_000);
const voteLimiter = createRateLimiter(15, 60_000);
const VOTE_COOKIE = "nx_helpful_votes";

function clientIp(reqHeaders: Headers): string {
  return (
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    reqHeaders.get("x-real-ip")?.trim() ||
    "local"
  );
}

/**
 * Ziyaretçi kök yorumu, yanıtı veya 5 yıldızlı değerlendirmesi.
 * Spam/honeypot/hız sınırından geçer, `pending` ve `isVerified: false` olarak kaydedilir.
 */
export async function submitPublicDiscussionAction(formData: FormData): Promise<void> {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const ip = clientIp(reqHeaders);

  const locale = String(formData.get("locale") ?? "tr").trim() || "tr";
  const slug = String(formData.get("slug") ?? "").trim();
  const contentId = String(formData.get("contentId") ?? "").trim();
  if (!contentId.startsWith("cnt_") || !slug) return;

  if (!submitLimiter.take(`${siteId}:${ip}`)) return;

  const entryTypeRaw = String(formData.get("entryType") ?? "comment").trim();
  const validation = validatePublicCommentSubmission({
    contentId,
    authorName: String(formData.get("authorName") ?? ""),
    authorEmail: String(formData.get("authorEmail") ?? ""),
    body: String(formData.get("body") ?? ""),
    entryType: entryTypeRaw === "review" ? "review" : "comment",
    rating: Number(formData.get("rating") ?? 5),
    title: String(formData.get("title") ?? ""),
    prosText: String(formData.get("prosText") ?? ""),
    consText: String(formData.get("consText") ?? ""),
    parentId: String(formData.get("parentId") ?? ""),
    honeypot: String(formData.get("company") ?? ""),
  });

  if (!validation.ok) return;
  const data = validation.data;

  const repo = getScopedRepository(siteId);
  const content = await repo.getContentById(contentId, locale);
  if (!content || content.status !== "published") return;

  const pub = resolvePublishing(content.schemaAttributes);
  if (data.entryType === "comment" && pub.allowComments === false) return;
  if (data.entryType === "review" && pub.allowReviews === false) return;

  if (data.parentId) {
    const siblings = await repo.listCommentsReviews(contentId);
    if (!siblings.some((item) => item.id === data.parentId && item.status === "approved")) {
      return;
    }
  }

  await repo.saveCommentReview({
    contentId,
    parentId: data.parentId,
    authorName: data.authorName,
    authorEmail: data.authorEmail,
    entryType: data.entryType,
    rating: data.rating,
    title: data.title,
    body: data.body,
    pros: data.pros,
    cons: data.cons,
    status: "pending",
    isVerified: false,
  });

  const lb = await siteLocaleBase(siteId, locale);
  redirect(`${lb}/${slug}?yorum=bekliyor#tartisma`);
}

/** Geriye dönük uyumluluk için mevcut isim korunur. */
export const submitCommentReply = submitPublicDiscussionAction;

/**
 * Ziyaretçi "Faydalı (👍)" oylaması.
 * Çerez ile aynı yorumun tekrar tekrar oylanmasını engeller ve kiracı önbelleğini yeniler.
 */
export async function voteCommentHelpfulAction(formData: FormData): Promise<void> {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const ip = clientIp(reqHeaders);

  const commentId = String(formData.get("commentId") ?? "").trim();
  const locale = String(formData.get("locale") ?? "tr").trim() || "tr";
  const slug = String(formData.get("slug") ?? "").trim();
  if (!commentId || !slug) return;

  const lb = await siteLocaleBase(siteId, locale);
  const targetPath = `${lb}/${slug}`;

  if (!voteLimiter.take(`${siteId}:${ip}`)) {
    redirect(`${targetPath}#comment-${commentId}`);
  }

  const jar = await cookies();
  const existingCookie = jar.get(VOTE_COOKIE)?.value ?? "";
  const votedIds = existingCookie ? existingCookie.split(",").filter(Boolean) : [];

  if (!votedIds.includes(commentId)) {
    const repo = getScopedRepository(siteId);
    const updated = await repo.voteCommentHelpful(commentId);
    if (updated !== null) {
      const nextVoted = [...votedIds.slice(-39), commentId];
      jar.set(VOTE_COOKIE, nextVoted.join(","), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
      await revalidatePath(targetPath);
    }
  }

  redirect(`${targetPath}#comment-${commentId}`);
}
