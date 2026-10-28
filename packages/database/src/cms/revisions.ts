import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { compileBlocksToMarkdown, countWords, fnv1a64, type BlockNode, type ContentStatus } from "@nexpress/core";
import { CmsContentReadRepository } from "./content-read";

/** Bir kaydın geri yüklenebilir tam görüntüsü. */
export interface RevisionSnapshot {
  title: string;
  slug: string;
  tldr: string | null;
  status: ContentStatus;
  blocks: BlockNode[];
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  featuredImage: string | null;
  schemaType: string;
  importanceScore: number;
  schemaAttributes: Record<string, unknown>;
}

export interface RevisionActor {
  id: string | null;
  email: string;
}

export interface RevisionSummary {
  id: string;
  createdAt: Date;
  authorEmail: string;
  status: ContentStatus;
  title: string;
  blockCount: number;
  wordCount: number;
}

export const MAX_REVISIONS_PER_CONTENT = 50;

/** Aynı içeriğin art arda aynı görüntüsünü iki kez saklamamak için kararlı özet. */
export function snapshotHash(snapshot: RevisionSnapshot): string {
  return fnv1a64(JSON.stringify(snapshot));
}

/**
 * Revizyon geçmişi: her kayıtta (içerik gerçekten değiştiyse) görüntü saklanır, içerik başına
 * en çok `MAX_REVISIONS_PER_CONTENT` tutulur. Kiracıya kapalıdır.
 */
export class CmsRevisionRepository extends CmsContentReadRepository {
  /** Yeni görüntüyü kaydeder; son revizyonla aynıysa kaydetmez. Kaydedildiyse `true`. */
  protected async recordRevision(contentId: string, locale: string, snapshot: RevisionSnapshot, actor?: RevisionActor): Promise<boolean> {
    const { db, t } = this.backend;
    const hash = snapshotHash(snapshot);
    const latest = await db
      .select({ hash: t.contentRevisions.snapshotHash })
      .from(t.contentRevisions)
      .where(and(eq(t.contentRevisions.siteId, this.siteId), eq(t.contentRevisions.contentId, contentId), eq(t.contentRevisions.locale, locale)))
      .orderBy(desc(t.contentRevisions.createdAt))
      .limit(1);
    if (latest[0]?.hash === hash) return false;

    await db.insert(t.contentRevisions).values({
      id: randomUUID(),
      siteId: this.siteId,
      contentId,
      locale,
      createdAt: new Date(),
      authorId: actor?.id ?? null,
      authorEmail: actor?.email.toLowerCase() ?? "",
      status: snapshot.status,
      title: snapshot.title,
      snapshot: snapshot as unknown as Record<string, unknown>,
      snapshotHash: hash,
      blockCount: snapshot.blocks.length,
      wordCount: countWords(compileBlocksToMarkdown(snapshot.blocks)),
    });

    // En eskileri buda
    const old = await db
      .select({ id: t.contentRevisions.id })
      .from(t.contentRevisions)
      .where(and(eq(t.contentRevisions.siteId, this.siteId), eq(t.contentRevisions.contentId, contentId), eq(t.contentRevisions.locale, locale)))
      .orderBy(desc(t.contentRevisions.createdAt))
      .limit(1000)
      .offset(MAX_REVISIONS_PER_CONTENT);
    if (old.length > 0) {
      await db.delete(t.contentRevisions).where(and(eq(t.contentRevisions.siteId, this.siteId), inArray(t.contentRevisions.id, old.map((r) => r.id))));
    }
    return true;
  }

  /** En yeniden eskiye revizyon özetleri (görüntüyü yüklemeden). */
  public async listRevisions(contentId: string, locale = "tr", limit = 30): Promise<RevisionSummary[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select({
        id: t.contentRevisions.id,
        createdAt: t.contentRevisions.createdAt,
        authorEmail: t.contentRevisions.authorEmail,
        status: t.contentRevisions.status,
        title: t.contentRevisions.title,
        blockCount: t.contentRevisions.blockCount,
        wordCount: t.contentRevisions.wordCount,
      })
      .from(t.contentRevisions)
      .where(and(eq(t.contentRevisions.siteId, this.siteId), eq(t.contentRevisions.contentId, contentId), eq(t.contentRevisions.locale, locale)))
      .orderBy(desc(t.contentRevisions.createdAt))
      .limit(Math.min(limit, MAX_REVISIONS_PER_CONTENT));
    return rows.map((r) => ({ ...r, status: r.status as ContentStatus }));
  }

  public async getRevision(id: string): Promise<{ id: string; contentId: string; createdAt: Date; authorEmail: string; snapshot: RevisionSnapshot } | null> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.contentRevisions)
      .where(and(eq(t.contentRevisions.siteId, this.siteId), eq(t.contentRevisions.id, id)))
      .limit(1);
    const r = rows[0];
    return r ? { id: r.id, contentId: r.contentId, createdAt: r.createdAt, authorEmail: r.authorEmail, snapshot: r.snapshot as unknown as RevisionSnapshot } : null;
  }
}
