import type { CommentReviewDto } from "./types";
import { eq, and, desc, inArray } from "drizzle-orm";
import { incrementCommentUpvoteTag, parseCommentTags } from "@nexpress/core";
import { CmsMediaRepository } from "./media";

export class CmsCommentsRepository extends CmsMediaRepository {
  /**
   * Yorum ve 5 Yıldızlı İncelemeleri listeler (`siteId` korumalı).
   */
  public async listCommentsReviews(contentId?: string): Promise<CommentReviewDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.commentsReviews)
      .where(
        and(
          eq(t.commentsReviews.siteId, this.siteId),
          contentId ? eq(t.commentsReviews.contentId, contentId) : undefined
        )
      )
      .orderBy(desc(t.commentsReviews.createdAt));
    return rows.map((r) => ({
      ...r,
      pros: r.pros ?? [],
      cons: r.cons ?? [],
      tags: r.tags ?? [],
      parentId: r.parentId ?? null,
    }));
  }

  /**
   * Yeni yorum veya yıldızlı inceleme kaydeder (`siteId` korumalı).
   */
  public async saveCommentReview(input: {
    id?: string;
    contentId: string;
    authorName: string;
    authorEmail?: string;
    entryType: "comment" | "review";
    rating?: number;
    title?: string;
    body: string;
    pros?: string[];
    cons?: string[];
    status?: string;
    isVerified?: boolean;
    parentId?: string | null;
    tags?: string[];
  }): Promise<CommentReviewDto> {
    const id = input.id ?? `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const record = {
      id,
      siteId: this.siteId,
      contentId: input.contentId,
      authorName: input.authorName,
      authorEmail: input.authorEmail ?? null,
      entryType: input.entryType,
      // Yorum yıldız değildir. İnceleme 1–5 aralığında kalır; boş inceleme 5 sayılır.
      rating: input.entryType === "comment" ? 0 : Math.min(5, Math.max(1, input.rating ?? 5)),
      title: input.title ?? null,
      body: input.body,
      pros: input.pros ?? [],
      cons: input.cons ?? [],
      status: input.status ?? "approved",
      isVerified: input.isVerified ?? true,
      parentId: input.parentId || null,
      tags: (input.tags ?? []).slice(0, 12),
      createdAt: now,
    };

    const { db, t } = this.backend;
    await db
      .insert(t.commentsReviews)
      .values(record)
      .onConflictDoUpdate({
        target: t.commentsReviews.id,
        setWhere: eq(t.commentsReviews.siteId, this.siteId),
        set: {
          authorName: record.authorName,
          status: record.status,
          rating: record.rating,
          title: record.title,
          body: record.body,
          pros: record.pros,
          cons: record.cons,
          ...(input.isVerified !== undefined ? { isVerified: record.isVerified } : {}),
          ...(input.parentId !== undefined ? { parentId: input.parentId || null } : {}),
          ...(input.tags ? { tags: record.tags } : {}),
        },
      });

    return record;
  }

  /**
   * Seçilen yorum veya incelemeleri kalıcı olarak siler (`siteId` korumalı).
   */
  public async deleteCommentReviews(ids: string[]): Promise<number> {
    const cleanIds = ids.map((id) => id.trim()).filter(Boolean);
    if (cleanIds.length === 0) return 0;
    const { db, t } = this.backend;
    await db
      .delete(t.commentsReviews)
      .where(and(eq(t.commentsReviews.siteId, this.siteId), inArray(t.commentsReviews.id, cleanIds)));
    return cleanIds.length;
  }

  /**
   * Yorum veya incelemenin "Faydalı" (`_up:N`) sayacını 1 artırır (`siteId` korumalı).
   */
  public async voteCommentHelpful(id: string): Promise<number | null> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.commentsReviews)
      .where(and(eq(t.commentsReviews.siteId, this.siteId), eq(t.commentsReviews.id, id)))
      .limit(1);
    const existing = rows[0];
    if (!existing || existing.status !== "approved") return null;
    const nextTags = incrementCommentUpvoteTag(existing.tags ?? []);
    await db
      .update(t.commentsReviews)
      .set({ tags: nextTags })
      .where(and(eq(t.commentsReviews.siteId, this.siteId), eq(t.commentsReviews.id, id)));
    return parseCommentTags(nextTags).upvotes;
  }
}
