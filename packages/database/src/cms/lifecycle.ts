import { and, eq, inArray } from "drizzle-orm";
import {
  cmsHooks,
  isScheduleDue,
  readTrashMeta,
  resolvePublishing,
  resolveSiteSettings,
  trashExpired,
  zonedLocalToUtc,
  type ContentStatus,
} from "@nexpress/core";
import { CmsThemeRepository } from "./themes";

export interface TrashedItem {
  contentId: string;
  title: string;
  slug: string;
  type: string;
  previousStatus: string;
  deletedAt: Date;
  deletedBy: string;
}

export interface ScheduledItem {
  contentId: string;
  title: string;
  slug: string;
  type: string;
  /** Yazarın girdiği yerel tarih-saat (`YYYY-MM-DDTHH:mm`) */
  scheduledAt: string;
  /** Sitenin saat dilimine göre UTC an; tarih geçersizse null */
  dueAt: Date | null;
  due: boolean;
}

/** Çöp kutusu (yumuşak silme) ve zamanlanmış yayın yaşam döngüsü. */
export class CmsLifecycleRepository extends CmsThemeRepository {
  private async rawContents(ids?: string[]) {
    const { db, t } = this.backend;
    const where = ids?.length
      ? and(eq(t.contents.siteId, this.siteId), inArray(t.contents.id, ids))
      : eq(t.contents.siteId, this.siteId);
    return db.select().from(t.contents).where(where);
  }

  /** İçerikleri çöp kutusuna taşır (tüm dillerle birlikte). Önceki durum geri yükleme için saklanır. */
  public async trashContents(ids: string[], actorEmail = ""): Promise<number> {
    if (ids.length === 0) return 0;
    const { db, t } = this.backend;
    let n = 0;
    for (const row of await this.rawContents(ids)) {
      if (row.status === "trashed") continue;
      const attrs = { ...((row.schemaAttributes as Record<string, unknown>) ?? {}), _trash: { previousStatus: row.status, deletedAt: new Date().toISOString(), deletedBy: actorEmail } };
      await db.update(t.contents).set({ status: "trashed", schemaAttributes: attrs, updatedAt: new Date() }).where(and(eq(t.contents.siteId, this.siteId), eq(t.contents.id, row.id)));
      n++;
    }
    return n;
  }

  /** Çöpten geri yükler: güvenli olsun diye **taslak** olarak döner (anında yayına girmez). */
  public async restoreContents(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const { db, t } = this.backend;
    let n = 0;
    for (const row of await this.rawContents(ids)) {
      if (row.status !== "trashed") continue;
      const { _trash: _drop, ...attrs } = (row.schemaAttributes as Record<string, unknown>) ?? {};
      await db.update(t.contents).set({ status: "draft" as ContentStatus, schemaAttributes: attrs, updatedAt: new Date() }).where(and(eq(t.contents.siteId, this.siteId), eq(t.contents.id, row.id)));
      n++;
    }
    return n;
  }

  public async listTrashed(): Promise<TrashedItem[]> {
    const rows = (await this.rawContents()).filter((r) => r.status === "trashed");
    const site = await this.getSite();
    const trans = await this.listContents({ locale: site?.defaultLocale ?? "tr", status: "trashed" });
    const byId = new Map(trans.map((c) => [c.contentId, c]));
    return rows
      .map((r) => {
        const meta = readTrashMeta(r.schemaAttributes as Record<string, unknown>);
        const c = byId.get(r.id);
        return { contentId: r.id, title: c?.title ?? r.id, slug: c?.slug ?? "", type: r.type, previousStatus: meta?.previousStatus ?? "draft", deletedAt: new Date(meta?.deletedAt ?? r.updatedAt), deletedBy: meta?.deletedBy ?? "" };
      })
      .sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
  }

  /** Süresi (30 gün) dolan çöpü kalıcı siler; silinen sayıyı döner. */
  public async purgeExpiredTrash(now: Date = new Date()): Promise<number> {
    const expired = (await this.listTrashed()).filter((i) => trashExpired(i.deletedAt.toISOString(), now)).map((i) => i.contentId);
    return this.deleteContents(expired);
  }

  public async emptyTrash(): Promise<number> {
    return this.deleteContents((await this.listTrashed()).map((i) => i.contentId));
  }

  /** Zamanlanmış içerikler (tarihi geçersiz/eksik olanlar `dueAt: null` ile birlikte). */
  public async listScheduled(now: Date = new Date()): Promise<ScheduledItem[]> {
    const site = await this.getSite();
    const tz = resolveSiteSettings(site?.settings).general.timezone;
    const items = await this.listContents({ locale: site?.defaultLocale ?? "tr", status: "scheduled" });
    return items
      .map((c) => {
        const scheduledAt = resolvePublishing(c.schemaAttributes).scheduledAt;
        const dueAt = scheduledAt ? zonedLocalToUtc(scheduledAt, tz) : null;
        return { contentId: c.contentId, title: c.title, slug: c.slug, type: c.type, scheduledAt, dueAt, due: isScheduleDue(scheduledAt, tz, now) };
      })
      .sort((a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity));
  }

  /**
   * Zamanı gelen zamanlanmış içerikleri yayınlar (içerik satırı `published`, `publishedAt` = planlanan an) ve
   * her yayındaki çeviri için `content:afterPublish` kancasını çalıştırır (arama dizini, IndexNow). Tarihi
   * eksik/geçersiz olanlar yayınlanmaz. Yayınlananların kimliklerini döner.
   */
  public async publishDue(now: Date = new Date()): Promise<string[]> {
    const due = (await this.listScheduled(now)).filter((i) => i.due && i.dueAt);
    if (due.length === 0) return [];
    const { db, t } = this.backend;
    const published: string[] = [];
    for (const item of due) {
      await db.update(t.contents).set({ status: "published", publishedAt: item.dueAt!, updatedAt: now }).where(and(eq(t.contents.siteId, this.siteId), eq(t.contents.id, item.contentId), eq(t.contents.status, "scheduled")));
      published.push(item.contentId);
      for (const tr of await this.getTranslationsForContent(item.contentId)) {
        if (tr.translationStatus !== "published") continue;
        try {
          await cmsHooks.runAction("content:afterPublish", { siteId: this.siteId, contentId: item.contentId, locale: tr.locale, slug: tr.slug, url: `/${tr.locale}/${tr.slug}` });
        } catch (error) {
          console.warn("[scheduler] afterPublish:", error instanceof Error ? error.message : error);
        }
      }
    }
    return published;
  }

  /** Zamanlamayı kaldırır (taslak) veya hemen yayınlar. */
  public async setScheduledOutcome(contentId: string, outcome: "draft" | "published"): Promise<boolean> {
    const { db, t } = this.backend;
    const row = (await this.rawContents([contentId]))[0];
    if (!row || row.status !== "scheduled") return false;
    await db.update(t.contents).set({ status: outcome, ...(outcome === "published" ? { publishedAt: new Date() } : {}), updatedAt: new Date() }).where(and(eq(t.contents.siteId, this.siteId), eq(t.contents.id, contentId)));
    if (outcome === "published") {
      for (const tr of await this.getTranslationsForContent(contentId)) {
        if (tr.translationStatus === "published") await cmsHooks.runAction("content:afterPublish", { siteId: this.siteId, contentId, locale: tr.locale, slug: tr.slug, url: `/${tr.locale}/${tr.slug}` });
      }
    }
    return true;
  }
}
