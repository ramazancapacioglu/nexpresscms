import type { CommentReviewDto } from "./types";
import { eq, and, desc } from "drizzle-orm";
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
    parentId?: string | null;
    tags?: string[];
  }): Promise<CommentReviewDto> {
    const id = input.id ?? `rev_${Date.now()}`;
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
      isVerified: true,
      parentId: input.parentId || null,
      tags: (input.tags ?? []).slice(0, 8),
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
          status: record.status,
          rating: record.rating,
          title: record.title,
          body: record.body,
          ...(input.parentId !== undefined ? { parentId: input.parentId || null } : {}),
          ...(input.tags ? { tags: record.tags } : {}),
        },
      });
  
    return record;
  }
}
