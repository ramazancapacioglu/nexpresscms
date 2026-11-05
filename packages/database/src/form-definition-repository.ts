import { and, desc, eq } from "drizzle-orm";
import { getCmsContext, normalizeFormSpec, normalizeNotify, type DbDialect, type FormNotifySettings, type FormSpec } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export type FormDefinitionStatus = "active" | "paused" | "archived";
export const FORM_DEFINITION_STATUSES: FormDefinitionStatus[] = ["active", "paused", "archived"];

export interface FormDefinitionDto {
  id: string;
  name: string;
  status: FormDefinitionStatus;
  templateId: string | null;
  spec: FormSpec;
  notify: FormNotifySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormDefinitionInput {
  name: string;
  status?: FormDefinitionStatus;
  templateId?: string | null;
  spec: unknown;
  notify?: unknown;
  /** Tema kabuğu gibi kalıcı kimlik. Boşsa üretilir. */
  id?: string;
}

/** Sürükle-bırak kurucunun form tanımları; her sorgu `siteId` kapsamlıdır, okuma/yazma `core` normalleştiricisinden geçer. */
export class FormDefinitionRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  private toDto(r: { id: string; name: string; status: string; templateId: string | null; spec: unknown; notify: unknown; createdAt: Date; updatedAt: Date }): FormDefinitionDto {
    const spec = normalizeFormSpec(r.spec);
    return {
      id: r.id,
      name: r.name,
      status: (FORM_DEFINITION_STATUSES as string[]).includes(r.status) ? (r.status as FormDefinitionStatus) : "active",
      templateId: r.templateId,
      spec,
      notify: normalizeNotify(r.notify, spec.fields),
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    };
  }

  public async list(options: { includeArchived?: boolean } = {}): Promise<FormDefinitionDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.forms).where(eq(t.forms.siteId, this.siteId)).orderBy(desc(t.forms.updatedAt));
    return rows.map((r) => this.toDto(r)).filter((f) => options.includeArchived || f.status !== "archived");
  }

  public async get(id: string): Promise<FormDefinitionDto | null> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.forms).where(and(eq(t.forms.siteId, this.siteId), eq(t.forms.id, id))).limit(1);
    return rows[0] ? this.toDto(rows[0]) : null;
  }

  public async getMany(ids: string[]): Promise<FormDefinitionDto[]> {
    const wanted = new Set(ids);
    return wanted.size === 0 ? [] : (await this.list({ includeArchived: true })).filter((f) => wanted.has(f.id));
  }

  public async create(input: FormDefinitionInput): Promise<FormDefinitionDto> {
    const wanted = input.id && /^frm_[a-z0-9_]{1,40}$/.test(input.id) ? input.id : "";
    if (wanted && (await this.get(wanted))) return (await this.get(wanted))!;
    const id = wanted || `frm_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();
    const spec = normalizeFormSpec(input.spec);
    const { db, t } = this.backend;
    await db.insert(t.forms).values({
      id,
      siteId: this.siteId,
      name: input.name.trim().slice(0, 100) || "Adsız form",
      status: input.status ?? "active",
      templateId: input.templateId ?? null,
      spec: spec as never,
      notify: normalizeNotify(input.notify, spec.fields) as never,
      createdAt: now,
      updatedAt: now,
    });
    return (await this.get(id))!;
  }

  /** Kiracıya kapalı güncelleme: başka kiracının kimliği asla değişmez. */
  public async update(id: string, input: FormDefinitionInput): Promise<FormDefinitionDto | null> {
    const current = await this.get(id);
    if (!current) return null;
    const spec = normalizeFormSpec(input.spec);
    const { db, t } = this.backend;
    await db
      .update(t.forms)
      .set({
        name: input.name.trim().slice(0, 100) || current.name,
        status: input.status ?? current.status,
        templateId: input.templateId === undefined ? current.templateId : input.templateId,
        spec: spec as never,
        notify: normalizeNotify(input.notify ?? current.notify, spec.fields) as never,
        updatedAt: new Date(),
      })
      .where(and(eq(t.forms.siteId, this.siteId), eq(t.forms.id, id)));
    return this.get(id);
  }

  public async setStatus(id: string, status: FormDefinitionStatus): Promise<boolean> {
    const { db, t } = this.backend;
    await db.update(t.forms).set({ status, updatedAt: new Date() }).where(and(eq(t.forms.siteId, this.siteId), eq(t.forms.id, id)));
    return (await this.get(id))?.status === status;
  }

  public async remove(id: string): Promise<boolean> {
    const { db, t } = this.backend;
    const had = await this.get(id);
    if (!had) return false;
    await db.delete(t.forms).where(and(eq(t.forms.siteId, this.siteId), eq(t.forms.id, id)));
    return true;
  }
}

export function getFormDefinitionRepository(siteIdOverride?: string): FormDefinitionRepository {
  return new FormDefinitionRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
