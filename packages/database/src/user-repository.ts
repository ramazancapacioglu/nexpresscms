import { randomUUID } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { getCmsContext, type DbDialect, type UserRole } from "@nexpress/core";
import { backendFor } from "./dialect";
import { getDbDialect } from "./client";

export type UserStatus = "active" | "disabled";

/** Parola özeti içermeyen, arayüze verilebilir kullanıcı kaydı. */
export interface UserSummaryDto {
  id: string;
  siteId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  sessionVersion: number;
  uiLocale: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface UserDto extends UserSummaryDto {
  passwordHash: string;
  /** Son parola değişimi; hesap bağlantısı belirteçleri buna bağlıdır (tek kullanım). */
  passwordChangedAt: Date | null;
}

type Row = {
  id: string;
  siteId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  sessionVersion: number;
  uiLocale: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
};

const toDto = (r: Row): UserDto => ({ ...r });
export const toSummary = ({ passwordHash: _h, passwordChangedAt: _p, ...rest }: UserDto): UserSummaryDto => rest;

export class UserRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get b() {
    return backendFor(this.dialect);
  }

  private scope(extra: ReturnType<typeof eq>) {
    const { users } = this.b;
    return and(eq(users.siteId, this.siteId), extra);
  }

  public async findByEmail(email: string): Promise<UserDto | null> {
    const { db, users } = this.b;
    const rows = await db.select().from(users).where(this.scope(eq(users.email, email.trim().toLowerCase()))).limit(1);
    return rows[0] ? toDto(rows[0] as Row) : null;
  }

  public async findById(id: string): Promise<UserDto | null> {
    const { db, users } = this.b;
    const rows = await db.select().from(users).where(this.scope(eq(users.id, id))).limit(1);
    return rows[0] ? toDto(rows[0] as Row) : null;
  }

  public async list(): Promise<UserDto[]> {
    const { db, users } = this.b;
    const rows = await db.select().from(users).where(eq(users.siteId, this.siteId)).orderBy(asc(users.createdAt));
    return (rows as Row[]).map(toDto);
  }

  public async count(): Promise<number> {
    const { db, users } = this.b;
    const rows = await db.select({ n: sql<number>`count(*)` }).from(users).where(eq(users.siteId, this.siteId));
    return Number(rows[0]?.n ?? 0);
  }

  public async create(input: { email: string; name?: string; passwordHash: string; role: UserRole }): Promise<UserDto> {
    const { db, users } = this.b;
    const now = new Date();
    const record = {
      id: randomUUID(),
      siteId: this.siteId,
      email: input.email.trim().toLowerCase(),
      name: input.name?.trim() ?? "",
      passwordHash: input.passwordHash,
      role: input.role,
      status: "active" as const,
      sessionVersion: 0,
      uiLocale: null,
      createdAt: now,
      lastLoginAt: null,
      passwordChangedAt: now,
    };
    await db.insert(users).values(record);
    return toDto(record);
  }

  private async patch(id: string, set: Partial<typeof this.b.users.$inferInsert>): Promise<void> {
    const { db, users } = this.b;
    await db.update(users).set(set).where(this.scope(eq(users.id, id)));
  }

  public touchLogin(id: string) {
    return this.patch(id, { lastLoginAt: new Date() });
  }
  public setUiLocale(id: string, locale: string | null) {
    return this.patch(id, { uiLocale: locale });
  }
  public setName(id: string, name: string) {
    return this.patch(id, { name: name.trim() });
  }
  /** Rol değişince oturum sürümü de artar: eski oturumlar yeni yetkiyle devam etmez. */
  public async setRole(id: string, role: UserRole) {
    await this.patch(id, { role });
    await this.revokeSessions(id);
  }
  public async setStatus(id: string, status: UserStatus) {
    await this.patch(id, { status });
    await this.revokeSessions(id);
  }
  /** Parolayı değiştirir ve tüm mevcut oturumları geçersiz kılar; yeni sürümü döner. */
  public async setPassword(id: string, passwordHash: string): Promise<number> {
    await this.patch(id, { passwordHash, passwordChangedAt: new Date() });
    return this.revokeSessions(id);
  }
  /** Oturum sürümünü artırır (atomik) ve yeni değeri döner. */
  public async revokeSessions(id: string): Promise<number> {
    const { db, users } = this.b;
    await db
      .update(users)
      .set({ sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(this.scope(eq(users.id, id)));
    return (await this.findById(id))?.sessionVersion ?? 0;
  }
}

export function getUserRepository(siteIdOverride?: string): UserRepository {
  return new UserRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
