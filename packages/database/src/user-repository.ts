import { randomUUID } from "node:crypto";
import { and, asc, eq, isNull, lt, or, sql } from "drizzle-orm";
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
  /** İki adımlı doğrulama açık mı (anahtar ve kodlar arayüze verilmez) */
  twoFactorEnabled: boolean;
}

export interface UserDto extends Omit<UserSummaryDto, "twoFactorEnabled"> {
  passwordHash: string;
  /** Son parola değişimi; hesap bağlantısı belirteçleri buna bağlıdır (tek kullanım). */
  passwordChangedAt: Date | null;
  /** `secret-box` ile şifreli TOTP anahtarı (kurulum bekliyorsa da dolu olabilir) */
  totpSecret: string | null;
  totpEnabledAt: Date | null;
  totpLastStep: number | null;
  /** Kurtarma kodu özetleri (JSON dizi) */
  recoveryCodes: string | null;
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
  totpSecret: string | null;
  totpEnabledAt: Date | null;
  totpLastStep: number | null;
  recoveryCodes: string | null;
};

const toDto = (r: Row): UserDto => ({ ...r });
export const toSummary = ({ passwordHash: _h, passwordChangedAt: _p, totpSecret: _s, totpLastStep: _l, recoveryCodes: _r, totpEnabledAt, ...rest }: UserDto): UserSummaryDto => ({ ...rest, twoFactorEnabled: totpEnabledAt !== null });

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
      totpSecret: null,
      totpEnabledAt: null,
      totpLastStep: null,
      recoveryCodes: null,
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
    // Hesap bağlantısı belirteçleri parola zamanını SANİYE çözünürlüğüyle karşılaştırır: aynı saniyede iki değişim
    // (ör. davetle açılıp hemen parola belirleme) belirteci bayatlatmazdı; zaman damgası her zaman önceki saniyeyi geçer.
    const prev = (await this.findById(id))?.passwordChangedAt?.getTime() ?? 0;
    const at = new Date(Math.max(Date.now(), (Math.floor(prev / 1000) + 1) * 1000));
    await this.patch(id, { passwordHash, passwordChangedAt: at });
    return this.revokeSessions(id);
  }
  /** Kurulum başlatır: şifreli anahtarı yazar, açık 2FA'yı kapatır (kurulum bitene kadar giriş ikinci adım istemez). */
  public setTotpPending(id: string, encryptedSecret: string) {
    return this.patch(id, { totpSecret: encryptedSecret, totpEnabledAt: null, totpLastStep: null, recoveryCodes: null });
  }
  /** Kurulum doğrulanınca 2FA'yı açar ve kurtarma kodu özetlerini yazar. */
  public enableTotp(id: string, step: number, recoveryHashes: string[]) {
    return this.patch(id, { totpEnabledAt: new Date(), totpLastStep: step, recoveryCodes: JSON.stringify(recoveryHashes) });
  }
  /** 2FA'yı kapatır, anahtarı ve kodları siler; oturumlar kapanır. */
  public async disableTotp(id: string) {
    await this.patch(id, { totpSecret: null, totpEnabledAt: null, totpLastStep: null, recoveryCodes: null });
    await this.revokeSessions(id);
  }
  /** Adımı atomik "ilerlet": yalnızca daha yeni bir adımsa başarılı olur (aynı kodun yarışla iki kez kabulü olmaz). */
  public async advanceTotpStep(id: string, step: number): Promise<boolean> {
    const { db, users } = this.b;
    const rows = await db
      .update(users)
      .set({ totpLastStep: step })
      .where(this.scope(and(eq(users.id, id), or(isNull(users.totpLastStep), lt(users.totpLastStep, step)))!))
      .returning({ id: users.id });
    return rows.length > 0;
  }
  /** Kurtarma kodu listesini karşılaştır-ve-değiştir ile günceller (kullanılan kod tek seferlik). */
  public async replaceRecoveryCodes(id: string, expectedJson: string | null, hashes: string[]): Promise<boolean> {
    const { db, users } = this.b;
    const cond = expectedJson === null ? isNull(users.recoveryCodes) : eq(users.recoveryCodes, expectedJson);
    const rows = await db
      .update(users)
      .set({ recoveryCodes: JSON.stringify(hashes) })
      .where(this.scope(and(eq(users.id, id), cond)!))
      .returning({ id: users.id });
    return rows.length > 0;
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
