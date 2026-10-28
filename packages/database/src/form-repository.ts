import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export type FormStatus = "new" | "read" | "spam" | "archived";
export const FORM_STATUSES: FormStatus[] = ["new", "read", "spam", "archived"];

export interface FormFieldValue {
  name: string;
  label: string;
  value: string;
  /** Alan türü (analiz için); eski kayıtlarda yok */
  type?: string;
  /** checkboxes: seçilen seçenekler */
  values?: string[];
}

export type NotifyStatus = "" | "sent" | "failed" | "skipped";

export interface FormSubmissionDto {
  id: string;
  pagePath: string;
  locale: string;
  formId: string;
  formTitle: string;
  fields: FormFieldValue[];
  status: FormStatus;
  notifyStatus: NotifyStatus;
  notifyError: string;
  createdAt: Date;
}

export interface FormSubmissionInput {
  pagePath: string;
  locale: string;
  formId: string;
  formTitle: string;
  fields: FormFieldValue[];
  status?: FormStatus;
  ipHash?: string;
  notifyStatus?: NotifyStatus;
}

/** Form gelen kutusu; her sorgu `siteId` kapsamlıdır. */
export class FormSubmissionRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  public async create(input: FormSubmissionInput): Promise<string> {
    const { db, t } = this.backend;
    const id = `fs_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(t.formSubmissions).values({
      id,
      siteId: this.siteId,
      pagePath: input.pagePath.slice(0, 300),
      locale: input.locale,
      formId: input.formId.slice(0, 80),
      formTitle: input.formTitle.slice(0, 160),
      fields: input.fields,
      status: input.status ?? "new",
      ipHash: input.ipHash ?? "",
      notifyStatus: input.notifyStatus ?? "",
      createdAt: new Date(),
    });
    return id;
  }

  public async list(options: { status?: FormStatus; formId?: string; limit?: number; offset?: number } = {}): Promise<FormSubmissionDto[]> {
    const { db, t } = this.backend;
    const where = and(eq(t.formSubmissions.siteId, this.siteId), options.status ? eq(t.formSubmissions.status, options.status) : undefined, options.formId ? eq(t.formSubmissions.formId, options.formId) : undefined);
    const rows = await db.select().from(t.formSubmissions).where(where).orderBy(desc(t.formSubmissions.createdAt)).limit(options.limit ?? 100).offset(options.offset ?? 0);
    return rows.map((r) => ({
      id: r.id,
      pagePath: r.pagePath,
      locale: r.locale,
      formId: r.formId,
      formTitle: r.formTitle,
      fields: (r.fields ?? []) as FormFieldValue[],
      status: r.status as FormStatus,
      notifyStatus: (r.notifyStatus || "") as NotifyStatus,
      notifyError: r.notifyError,
      createdAt: new Date(r.createdAt),
    }));
  }

  public async counts(formId?: string): Promise<Record<FormStatus, number>> {
    const { db, t } = this.backend;
    const rows = await db
      .select({ status: t.formSubmissions.status, n: sql<number>`count(*)` })
      .from(t.formSubmissions)
      .where(and(eq(t.formSubmissions.siteId, this.siteId), formId ? eq(t.formSubmissions.formId, formId) : undefined))
      .groupBy(t.formSubmissions.status);
    const out: Record<FormStatus, number> = { new: 0, read: 0, spam: 0, archived: 0 };
    for (const r of rows) if (r.status in out) out[r.status as FormStatus] = Number(r.n);
    return out;
  }

  /** Form başına gönderim sayıları: toplam, yeni ve son 30 gün (spam hariç). */
  public async summaryByForm(now: Date = new Date()): Promise<Record<string, { total: number; new: number; last30: number; last: Date | null }>> {
    const { db, t } = this.backend;
    const rows = await db
      .select({ formId: t.formSubmissions.formId, status: t.formSubmissions.status, createdAt: t.formSubmissions.createdAt })
      .from(t.formSubmissions)
      .where(eq(t.formSubmissions.siteId, this.siteId));
    const cutoff = now.getTime() - 30 * 86_400_000;
    const out: Record<string, { total: number; new: number; last30: number; last: Date | null }> = {};
    for (const r of rows) {
      const o = (out[r.formId] ??= { total: 0, new: 0, last30: 0, last: null });
      const at = new Date(r.createdAt);
      o.total++;
      if (r.status === "new") o.new++;
      if (r.status !== "spam" && at.getTime() >= cutoff) o.last30++;
      if (!o.last || at > o.last) o.last = at;
    }
    return out;
  }

  /** Analiz için bir formun gönderimleri (en yeni önce, üst sınırlı). */
  public async listForAnalytics(formId: string, limit = 5000): Promise<FormSubmissionDto[]> {
    return this.list({ formId, limit });
  }

  public async setNotify(id: string, status: NotifyStatus, error = ""): Promise<void> {
    const { db, t } = this.backend;
    await db.update(t.formSubmissions).set({ notifyStatus: status, notifyError: error.slice(0, 300) }).where(and(eq(t.formSubmissions.siteId, this.siteId), eq(t.formSubmissions.id, id)));
  }

  public async setStatus(ids: string[], status: FormStatus): Promise<number> {
    if (ids.length === 0) return 0;
    const { db, t } = this.backend;
    await db.update(t.formSubmissions).set({ status }).where(and(eq(t.formSubmissions.siteId, this.siteId), inArray(t.formSubmissions.id, ids)));
    const rows = await db.select({ id: t.formSubmissions.id }).from(t.formSubmissions).where(and(eq(t.formSubmissions.siteId, this.siteId), inArray(t.formSubmissions.id, ids), eq(t.formSubmissions.status, status)));
    return rows.length;
  }

  public async remove(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const { db, t } = this.backend;
    const before = await db.select({ id: t.formSubmissions.id }).from(t.formSubmissions).where(and(eq(t.formSubmissions.siteId, this.siteId), inArray(t.formSubmissions.id, ids)));
    await db.delete(t.formSubmissions).where(and(eq(t.formSubmissions.siteId, this.siteId), inArray(t.formSubmissions.id, ids)));
    return before.length;
  }

  /** Son `sinceMs` içinde aynı (günlük tuzlu) IP özetinden kaç gönderim geldi: hız sınırı. */
  public async recentFromIp(ipHash: string, sinceMs: number): Promise<number> {
    if (!ipHash) return 0;
    const { db, t } = this.backend;
    const rows = await db
      .select({ n: sql<number>`count(*)` })
      .from(t.formSubmissions)
      .where(and(eq(t.formSubmissions.siteId, this.siteId), eq(t.formSubmissions.ipHash, ipHash), gte(t.formSubmissions.createdAt, new Date(Date.now() - sinceMs))));
    return Number(rows[0]?.n ?? 0);
  }

  /** Saklama süresi dolan gönderimleri siler (KVKK: gereğinden uzun tutulmaz). */
  public async purgeOlderThan(days: number, now: Date = new Date()): Promise<number> {
    const { db, t } = this.backend;
    const cutoff = new Date(now.getTime() - days * 86_400_000);
    const old = await db.select({ id: t.formSubmissions.id }).from(t.formSubmissions).where(and(eq(t.formSubmissions.siteId, this.siteId), lt(t.formSubmissions.createdAt, cutoff)));
    if (old.length === 0) return 0;
    await db.delete(t.formSubmissions).where(and(eq(t.formSubmissions.siteId, this.siteId), lt(t.formSubmissions.createdAt, cutoff)));
    return old.length;
  }
}

export function getFormSubmissionRepository(siteIdOverride?: string): FormSubmissionRepository {
  return new FormSubmissionRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
