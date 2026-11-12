import { and, asc, eq, sql } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { backendFor } from "./dialect";
import { getDbDialect } from "./client";

export type MemberStatus = "active" | "pending" | "disabled";

export interface MemberDto {
  id: string;
  siteId: string;
  email: string;
  name: string;
  status: MemberStatus;
  emailVerifiedAt: Date | null;
  linkSeq: number;
  sessionVersion: number;
  consentAt: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}

/** Ziyaretçi üyeleri (parolasız). Her sorgu `siteId` kapsamlıdır; e-posta küçük harfle saklanır. */
export class MemberRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get b() {
    const { db, t } = backendFor(this.dialect);
    return { db, m: t.members };
  }

  private scope(extra: ReturnType<typeof eq>) {
    const { m } = this.b;
    return and(eq(m.siteId, this.siteId), extra);
  }

  public async findByEmail(email: string): Promise<MemberDto | null> {
    const { db, m } = this.b;
    const rows = await db.select().from(m).where(this.scope(eq(m.email, email.trim().toLowerCase()))).limit(1);
    return (rows[0] as MemberDto | undefined) ?? null;
  }

  public async findById(id: string): Promise<MemberDto | null> {
    const { db, m } = this.b;
    const rows = await db.select().from(m).where(this.scope(eq(m.id, id))).limit(1);
    return (rows[0] as MemberDto | undefined) ?? null;
  }

  public async list(): Promise<MemberDto[]> {
    const { db, m } = this.b;
    return (await db.select().from(m).where(eq(m.siteId, this.siteId)).orderBy(asc(m.createdAt))) as MemberDto[];
  }

  public async create(input: { id: string; email: string; name?: string; status: MemberStatus; consent: boolean }): Promise<MemberDto> {
    const { db, m } = this.b;
    const now = new Date();
    const record = {
      id: input.id,
      siteId: this.siteId,
      email: input.email.trim().toLowerCase(),
      name: input.name?.trim().slice(0, 80) ?? "",
      status: input.status,
      emailVerifiedAt: null,
      linkSeq: 0,
      sessionVersion: 0,
      consentAt: input.consent ? now : null,
      createdAt: now,
      lastLoginAt: null,
    };
    await db.insert(m).values(record);
    return record as MemberDto;
  }

  /** Yeni giriş bağlantısı sırası (atomik): eski bağlantılar geçersizleşir. */
  public async beginLink(id: string): Promise<number> {
    const { db, m } = this.b;
    await db.update(m).set({ linkSeq: sql`${m.linkSeq} + 1` }).where(this.scope(eq(m.id, id)));
    return (await this.findById(id))?.linkSeq ?? 0;
  }

  /**
   * Bağlantıyı tüketir (atomik, koşullu): sıra eşleşmeli ve hesap devre dışı olmamalı. Başarılıysa sıra artar (tek kullanım),
   * e-posta doğrulanır, `pending` hesap `active` olur ve son giriş yazılır. Çifte kullanım (yarış) tek kazanan bırakır.
   */
  public async consumeLink(id: string, seq: number): Promise<MemberDto | null> {
    const { db, m } = this.b;
    const now = new Date();
    const rows = await db
      .update(m)
      .set({ linkSeq: sql`${m.linkSeq} + 1`, status: "active", emailVerifiedAt: now, lastLoginAt: now })
      .where(this.scope(and(eq(m.id, id), eq(m.linkSeq, seq), sql`${m.status} <> 'disabled'`)!))
      .returning({ id: m.id });
    return rows.length > 0 ? this.findById(id) : null;
  }

  /** Oturum sürümünü artırır: açık çerezler düşer. */
  public async revokeSessions(id: string): Promise<void> {
    const { db, m } = this.b;
    await db.update(m).set({ sessionVersion: sql`${m.sessionVersion} + 1` }).where(this.scope(eq(m.id, id)));
  }

  public async setStatus(id: string, status: MemberStatus): Promise<void> {
    const { db, m } = this.b;
    await db.update(m).set({ status }).where(this.scope(eq(m.id, id)));
    await this.revokeSessions(id);
  }

  public async setName(id: string, name: string): Promise<void> {
    const { db, m } = this.b;
    await db.update(m).set({ name: name.trim().slice(0, 80) }).where(this.scope(eq(m.id, id)));
  }

  /** Gerçek silme (KVKK: silme hakkı). */
  public async delete(id: string): Promise<boolean> {
    const { db, m } = this.b;
    const rows = await db.delete(m).where(this.scope(eq(m.id, id))).returning({ id: m.id });
    return rows.length > 0;
  }
}

export function getMemberRepository(siteIdOverride?: string): MemberRepository {
  return new MemberRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
