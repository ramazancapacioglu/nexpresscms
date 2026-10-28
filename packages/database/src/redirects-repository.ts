import { and, desc, eq, sql } from "drizzle-orm";
import { getCmsContext, REDIRECT_CODES, validateRedirect, type DbDialect, type RedirectCode } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor, upsertScoped } from "./dialect";

export interface RedirectDto {
  id: string;
  fromPath: string;
  toPath: string;
  code: RedirectCode;
  enabled: boolean;
  hits: number;
  note: string;
  createdAt: Date;
  lastHitAt: Date | null;
}

export interface NotFoundDto {
  path: string;
  hits: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastReferrer: string;
}

/** Kiracı başına 404 günlüğü satır sınırı: en az isabetli eski satırlar budanır. */
export const NOT_FOUND_MAX_ROWS = 2000;

export type RedirectResult = { ok: true; id: string } | { ok: false; error: string };

/** Elle yönetilen yönlendirmeler ve 404 izleyici (her sorgu `siteId` kapsamlı). */
export class RedirectRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  public async list(): Promise<RedirectDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.redirects).where(eq(t.redirects.siteId, this.siteId)).orderBy(desc(t.redirects.createdAt));
    return rows.map((r) => ({
      id: r.id,
      fromPath: r.fromPath,
      toPath: r.toPath,
      code: r.code as RedirectCode,
      enabled: Boolean(r.enabled),
      hits: r.hits,
      note: r.note,
      createdAt: new Date(r.createdAt),
      lastHitAt: r.lastHitAt ? new Date(r.lastHitAt) : null,
    }));
  }

  /** Etkin kurallar: kaynak yol → {hedef, kod} (çözümleyici için). */
  public async activeMap(): Promise<Map<string, { to: string; code: RedirectCode }>> {
    return new Map((await this.list()).filter((r) => r.enabled).map((r) => [r.fromPath, { to: r.toPath, code: r.code }]));
  }

  /** Aynı kaynak yol varsa günceller. Doğrulama: rezerve yol, kendine yönlendirme, hedef türü, kod. */
  public async save(input: { fromPath: string; toPath: string; code?: number; note?: string; enabled?: boolean }): Promise<RedirectResult> {
    const v = validateRedirect(input.fromPath, input.toPath);
    if (!v.ok) return v;
    const code = (input.code ?? 301) as RedirectCode;
    if (!REDIRECT_CODES.includes(code)) return { ok: false, error: "Durum kodu 301, 302, 307 veya 308 olmalı." };
    // Döngü: yeni kural mevcut kurallarla zincir oluşturup başa dönmesin
    const rules = await this.activeMap();
    rules.set(v.from, { to: v.to, code });
    const seen = new Set<string>([v.from]);
    let cur = v.to;
    for (let i = 0; i < 6 && !/^https?:\/\//i.test(cur); i++) {
      const next = rules.get(cur.split(/[?#]/)[0] ?? cur);
      if (!next) break;
      if (seen.has(next.to.split(/[?#]/)[0] ?? next.to)) return { ok: false, error: "Bu kural bir yönlendirme döngüsü oluşturur." };
      seen.add(cur);
      cur = next.to;
    }
    const { db, t } = this.backend;
    const now = new Date();
    const id = `rd_${this.siteId}_${v.from}`;
    await upsertScoped(db, t.redirects, this.siteId, { id, siteId: this.siteId, fromPath: v.from, toPath: v.to, code, enabled: input.enabled ?? true, hits: 0, note: (input.note ?? "").slice(0, 200), createdAt: now, updatedAt: now, lastHitAt: null }, {
      toPath: v.to,
      code,
      enabled: input.enabled ?? true,
      note: (input.note ?? "").slice(0, 200),
      updatedAt: now,
    });
    return { ok: true, id };
  }

  public async setEnabled(id: string, enabled: boolean): Promise<boolean> {
    const { db, t } = this.backend;
    await db.update(t.redirects).set({ enabled, updatedAt: new Date() }).where(and(eq(t.redirects.id, id), eq(t.redirects.siteId, this.siteId)));
    return (await this.list()).some((r) => r.id === id && r.enabled === enabled);
  }

  public async remove(id: string): Promise<boolean> {
    const { db, t } = this.backend;
    await db.delete(t.redirects).where(and(eq(t.redirects.id, id), eq(t.redirects.siteId, this.siteId)));
    return !(await this.list()).some((r) => r.id === id);
  }

  /** Uygulanan yönlendirme sayacı (en iyi çaba). */
  public async recordHit(fromPath: string): Promise<void> {
    const { db, t } = this.backend;
    await db
      .update(t.redirects)
      .set({ hits: sql`${t.redirects.hits} + 1`, lastHitAt: new Date() })
      .where(and(eq(t.redirects.siteId, this.siteId), eq(t.redirects.fromPath, fromPath)));
  }

  // ---- 404 izleyici ----

  /** Bulunamayan yolu sayar (sorgu/çapa atılmış yol; yönlendiren yalnızca alan adı). Tablo şişmesin diye budanır. */
  public async recordNotFound(path: string, referrerHost = ""): Promise<void> {
    const clean = path.split(/[?#]/)[0]!.slice(0, 300);
    if (!clean.startsWith("/")) return;
    const { db, t } = this.backend;
    const now = new Date();
    const id = `${this.siteId}|${clean}`;
    await db
      .insert(t.notFoundLog)
      .values({ id, siteId: this.siteId, path: clean, hits: 1, firstSeenAt: now, lastSeenAt: now, lastReferrer: referrerHost.slice(0, 100), ignored: false })
      .onConflictDoUpdate({ target: t.notFoundLog.id, set: { hits: sql`${t.notFoundLog.hits} + 1`, lastSeenAt: now, lastReferrer: referrerHost.slice(0, 100) } });
  }

  /** En çok isabet alanlar önce; yok sayılanlar hariç. */
  public async listNotFound(limit = 200): Promise<NotFoundDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.notFoundLog)
      .where(and(eq(t.notFoundLog.siteId, this.siteId), eq(t.notFoundLog.ignored, false)))
      .orderBy(desc(t.notFoundLog.hits), desc(t.notFoundLog.lastSeenAt))
      .limit(limit);
    return rows.map((r) => ({ path: r.path, hits: r.hits, firstSeenAt: new Date(r.firstSeenAt), lastSeenAt: new Date(r.lastSeenAt), lastReferrer: r.lastReferrer }));
  }

  public async countNotFound(): Promise<number> {
    const { db, t } = this.backend;
    const rows = await db.select({ n: sql<number>`count(*)` }).from(t.notFoundLog).where(and(eq(t.notFoundLog.siteId, this.siteId), eq(t.notFoundLog.ignored, false)));
    return Number(rows[0]?.n ?? 0);
  }

  public async ignoreNotFound(path: string): Promise<void> {
    const { db, t } = this.backend;
    await db.update(t.notFoundLog).set({ ignored: true }).where(and(eq(t.notFoundLog.siteId, this.siteId), eq(t.notFoundLog.path, path)));
  }

  public async clearNotFound(): Promise<void> {
    const { db, t } = this.backend;
    await db.delete(t.notFoundLog).where(eq(t.notFoundLog.siteId, this.siteId));
  }

  /** Kiracı başına satır sınırını aşan en düşük isabetli/en eski satırları siler; silinen sayıyı döner. */
  public async pruneNotFound(max = NOT_FOUND_MAX_ROWS): Promise<number> {
    const { db, t } = this.backend;
    const rows = await db
      .select({ id: t.notFoundLog.id })
      .from(t.notFoundLog)
      .where(eq(t.notFoundLog.siteId, this.siteId))
      .orderBy(desc(t.notFoundLog.hits), desc(t.notFoundLog.lastSeenAt))
      .limit(100000);
    const drop = rows.slice(max).map((r) => r.id);
    for (let i = 0; i < drop.length; i += 200) {
      const chunk = drop.slice(i, i + 200);
      for (const id of chunk) await db.delete(t.notFoundLog).where(and(eq(t.notFoundLog.siteId, this.siteId), eq(t.notFoundLog.id, id)));
    }
    return drop.length;
  }
}

export function getRedirectRepository(siteIdOverride?: string): RedirectRepository {
  return new RedirectRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
