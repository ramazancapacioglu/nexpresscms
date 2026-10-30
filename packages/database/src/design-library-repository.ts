import { and, desc, eq } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export type DesignKind = "section" | "page" | "theme";
export const DESIGN_KINDS: DesignKind[] = ["section", "page", "theme"];

export interface DesignItemDto {
  id: string;
  kind: DesignKind;
  name: string;
  description: string;
  category: string;
  payload: Record<string, unknown>;
  source: "ai" | "manual";
  prompt: string;
  report: Record<string, unknown>;
  placeholderData: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DesignItemInput {
  kind: DesignKind;
  name: string;
  description?: string;
  category?: string;
  payload: Record<string, unknown>;
  source: "ai" | "manual";
  prompt?: string;
  report?: Record<string, unknown>;
  placeholderData?: boolean;
  createdBy?: string;
}

export const DESIGN_LIBRARY_MAX_ITEMS = 300;
const MAX_PAYLOAD_BYTES = 400_000;

/** Kiracıya kapalı tasarım kütüphanesi. İçerik doğrulaması (`core/ai-design`) çağıranın işidir; burada boyut ve sayı sınırı uygulanır. */
export class DesignLibraryRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  private toDto(r: Record<string, any>): DesignItemDto {
    return {
      id: r.id,
      kind: r.kind as DesignKind,
      name: r.name,
      description: r.description,
      category: r.category,
      payload: (r.payload ?? {}) as Record<string, unknown>,
      source: r.source === "ai" ? "ai" : "manual",
      prompt: r.prompt,
      report: (r.report ?? {}) as Record<string, unknown>,
      placeholderData: Boolean(r.placeholderData),
      createdBy: r.createdBy,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    };
  }

  public async list(kind?: DesignKind): Promise<DesignItemDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.designLibrary)
      .where(and(eq(t.designLibrary.siteId, this.siteId), kind ? eq(t.designLibrary.kind, kind) : undefined))
      .orderBy(desc(t.designLibrary.updatedAt));
    return rows.map((r) => this.toDto(r));
  }

  public async get(id: string): Promise<DesignItemDto | null> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.designLibrary).where(and(eq(t.designLibrary.siteId, this.siteId), eq(t.designLibrary.id, id))).limit(1);
    return rows[0] ? this.toDto(rows[0]) : null;
  }

  public async create(input: DesignItemInput): Promise<{ ok: true; item: DesignItemDto } | { ok: false; error: string }> {
    if (!DESIGN_KINDS.includes(input.kind)) return { ok: false, error: "Geçersiz tasarım türü." };
    const name = input.name.replace(/\s+/g, " ").trim().slice(0, 80);
    if (!name) return { ok: false, error: "Ad boş olamaz." };
    if (JSON.stringify(input.payload).length > MAX_PAYLOAD_BYTES) return { ok: false, error: "Tasarım çok büyük." };
    if ((await this.list()).length >= DESIGN_LIBRARY_MAX_ITEMS) return { ok: false, error: `Kütüphane en çok ${DESIGN_LIBRARY_MAX_ITEMS} tasarım tutar; eskileri silin.` };
    const { db, t } = this.backend;
    const id = `dsg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();
    await db.insert(t.designLibrary).values({
      id,
      siteId: this.siteId,
      kind: input.kind,
      name,
      description: (input.description ?? "").slice(0, 300),
      category: (input.category ?? "text").slice(0, 30),
      payload: input.payload as never,
      source: input.source,
      prompt: (input.prompt ?? "").slice(0, 2000),
      report: (input.report ?? {}) as never,
      placeholderData: input.placeholderData ?? false,
      createdBy: (input.createdBy ?? "").slice(0, 120),
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true, item: (await this.get(id))! };
  }

  public async rename(id: string, patch: { name?: string; description?: string }): Promise<boolean> {
    const cur = await this.get(id);
    if (!cur) return false;
    const { db, t } = this.backend;
    await db
      .update(t.designLibrary)
      .set({ name: (patch.name ?? cur.name).replace(/\s+/g, " ").trim().slice(0, 80) || cur.name, description: (patch.description ?? cur.description).slice(0, 300), updatedAt: new Date() })
      .where(and(eq(t.designLibrary.siteId, this.siteId), eq(t.designLibrary.id, id)));
    return true;
  }

  public async remove(id: string): Promise<boolean> {
    if (!(await this.get(id))) return false;
    const { db, t } = this.backend;
    await db.delete(t.designLibrary).where(and(eq(t.designLibrary.siteId, this.siteId), eq(t.designLibrary.id, id)));
    return true;
  }
}

export function getDesignLibraryRepository(siteIdOverride?: string): DesignLibraryRepository {
  return new DesignLibraryRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
