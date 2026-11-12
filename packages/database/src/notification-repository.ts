import { and, desc, eq, inArray, like, lt, notInArray, or, isNull } from "drizzle-orm";
import { canSeeNotification, getCmsContext, NOTIFICATION_DEFAULT_WINDOW_MS, SYSTEM_KEY_PREFIX, type DbDialect, type NotificationInput, type NotificationSeverity, type UserRole } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export interface NotificationDto {
  id: string;
  kind: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  href: string;
  count: number;
  audience: string;
  resolved: boolean;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type Role = UserRole;
const VISIBLE_DAYS = 30;

/** Bildirim merkezi deposu; her sorgu `siteId` kapsamlıdır. Okundu durumu kullanıcıya özeldir. */
export class NotificationRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  /**
   * Bildirim ekler. `dedupeKey` varsa: çözülmemiş son satır pencere içindeyse sayaç artar (okundu durumu korunur),
   * `window: "open"` ise (sistem uyarıları) içerik güncellenir ve sayaç artmaz. Yeni satır yalnızca pencere dışında açılır.
   */
  public async emit(input: NotificationInput, now: Date = new Date()): Promise<string> {
    const { db, t } = this.backend;
    if (input.dedupeKey) {
      const rows = await db
        .select()
        .from(t.notifications)
        .where(and(eq(t.notifications.siteId, this.siteId), eq(t.notifications.dedupeKey, input.dedupeKey), isNull(t.notifications.resolvedAt)))
        .orderBy(desc(t.notifications.updatedAt))
        .limit(1);
      const cur = rows[0];
      const win = input.window ?? NOTIFICATION_DEFAULT_WINDOW_MS;
      if (cur && (win === "open" || now.getTime() - new Date(cur.updatedAt).getTime() < win)) {
        await db
          .update(t.notifications)
          .set({ severity: input.severity, title: input.title.slice(0, 200), body: (input.body ?? "").slice(0, 600), href: input.href ?? cur.href, updatedAt: now, ...(win === "open" ? {} : { count: cur.count + 1 }) })
          .where(and(eq(t.notifications.siteId, this.siteId), eq(t.notifications.id, cur.id)));
        return cur.id;
      }
    }
    const id = `ntf_${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    await db.insert(t.notifications).values({
      id,
      siteId: this.siteId,
      kind: input.kind.slice(0, 60),
      severity: input.severity,
      title: input.title.slice(0, 200),
      body: (input.body ?? "").slice(0, 600),
      href: input.href ?? "",
      dedupeKey: input.dedupeKey ?? null,
      count: 1,
      audience: input.audience ?? "admin",
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }

  /** Sistem uyarılarından (`sys:` anahtarlı) artık geçerli olmayanları çözülmüş yapar. */
  public async resolveSystemExcept(activeKeys: string[], now: Date = new Date()): Promise<number> {
    const { db, t } = this.backend;
    const where = and(
      eq(t.notifications.siteId, this.siteId),
      like(t.notifications.dedupeKey, `${SYSTEM_KEY_PREFIX}%`),
      isNull(t.notifications.resolvedAt),
      activeKeys.length ? notInArray(t.notifications.dedupeKey, activeKeys) : undefined
    );
    const stale = await db.select({ id: t.notifications.id }).from(t.notifications).where(where);
    if (stale.length === 0) return 0;
    await db.update(t.notifications).set({ resolvedAt: now, updatedAt: now }).where(and(eq(t.notifications.siteId, this.siteId), inArray(t.notifications.id, stale.map((s) => s.id))));
    return stale.length;
  }

  private async visibleRows(role: Role, now: Date, limit: number, offset = 0) {
    const { db, t } = this.backend;
    const since = new Date(now.getTime() - VISIBLE_DAYS * 86_400_000);
    const rows = await db
      .select()
      .from(t.notifications)
      .where(and(eq(t.notifications.siteId, this.siteId), or(eq(t.notifications.audience, "all"), role === "admin" ? eq(t.notifications.audience, "admin") : undefined)))
      .orderBy(desc(t.notifications.updatedAt))
      .limit(limit + 200)
      .offset(offset);
    return rows.filter((r) => new Date(r.updatedAt) >= since && canSeeNotification(r.audience, role));
  }

  private async readSet(userId: string, ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const { db, t } = this.backend;
    const reads = await db
      .select({ n: t.notificationReads.notificationId })
      .from(t.notificationReads)
      .where(and(eq(t.notificationReads.siteId, this.siteId), eq(t.notificationReads.userId, userId), inArray(t.notificationReads.notificationId, ids)));
    return new Set(reads.map((r) => r.n));
  }

  public async list(userId: string, role: Role, opts: { unreadOnly?: boolean; limit?: number; now?: Date } = {}): Promise<NotificationDto[]> {
    const now = opts.now ?? new Date();
    const limit = Math.min(opts.limit ?? 50, 200);
    const rows = await this.visibleRows(role, now, limit);
    const read = await this.readSet(userId, rows.map((r) => r.id));
    return rows
      .map((r) => ({
        id: r.id,
        kind: r.kind,
        severity: r.severity as NotificationSeverity,
        title: r.title,
        body: r.body,
        href: r.href,
        count: r.count,
        audience: r.audience,
        resolved: r.resolvedAt != null,
        read: read.has(r.id) || r.resolvedAt != null,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }))
      .filter((n) => !opts.unreadOnly || !n.read)
      .slice(0, limit);
  }

  /** Okunmamış (ve çözülmemiş) bildirim sayısı + en yüksek önem. */
  public async unread(userId: string, role: Role, now: Date = new Date()): Promise<{ count: number; top: NotificationSeverity | null }> {
    const list = await this.list(userId, role, { unreadOnly: true, limit: 200, now });
    const rank = { critical: 3, warning: 2, info: 1 } as const;
    const top = list.reduce<NotificationSeverity | null>((m, n) => (!m || rank[n.severity] > rank[m] ? n.severity : m), null);
    return { count: list.length, top };
  }

  public async markRead(userId: string, ids: string[], now: Date = new Date()): Promise<number> {
    if (ids.length === 0) return 0;
    const { db, t } = this.backend;
    // Yalnızca bu kiracıya ait bildirimler işaretlenir
    const own = await db.select({ id: t.notifications.id }).from(t.notifications).where(and(eq(t.notifications.siteId, this.siteId), inArray(t.notifications.id, ids.slice(0, 200))));
    const already = await this.readSet(userId, own.map((o) => o.id));
    const fresh = own.filter((o) => !already.has(o.id));
    for (const o of fresh) await db.insert(t.notificationReads).values({ id: `${o.id}:${userId}`, siteId: this.siteId, notificationId: o.id, userId, readAt: now }).onConflictDoNothing();
    return fresh.length;
  }

  public async markAllRead(userId: string, role: Role, now: Date = new Date()): Promise<number> {
    const unread = await this.list(userId, role, { unreadOnly: true, limit: 200, now });
    return this.markRead(userId, unread.map((n) => n.id), now);
  }

  /** Eski kayıtları siler: çözülmüş olanlar 14 gün, diğerleri 60 gün sonra (okundu kayıtlarıyla birlikte). */
  public async purge(now: Date = new Date()): Promise<number> {
    const { db, t } = this.backend;
    const old = await db
      .select({ id: t.notifications.id, resolvedAt: t.notifications.resolvedAt, updatedAt: t.notifications.updatedAt })
      .from(t.notifications)
      .where(and(eq(t.notifications.siteId, this.siteId), lt(t.notifications.updatedAt, new Date(now.getTime() - 14 * 86_400_000))));
    const doomed = old
      .filter((r) => (r.resolvedAt ? true : new Date(r.updatedAt).getTime() < now.getTime() - 60 * 86_400_000))
      .map((r) => r.id);
    if (doomed.length === 0) return 0;
    await db.delete(t.notificationReads).where(and(eq(t.notificationReads.siteId, this.siteId), inArray(t.notificationReads.notificationId, doomed)));
    await db.delete(t.notifications).where(and(eq(t.notifications.siteId, this.siteId), inArray(t.notifications.id, doomed)));
    return doomed.length;
  }
}

export function getNotificationRepository(siteIdOverride?: string): NotificationRepository {
  return new NotificationRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
