import type { UserRole } from "./session-token";

/**
 * Hesap kuralları (saf): parola politikası ve "son yöneticiyi koru" denetimi.
 * Politika NIST 800-63B çizgisindedir: uzunluk esastır, zorunlu karakter türü kuralı yoktur;
 * yaygın, tahmin edilebilir veya hesapla ilgili parolalar reddedilir.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const COMMON = new Set([
  "password1234", "password12345", "123456789012", "1234567890123", "qwertyuiop12", "qwerty123456",
  "admin1234567", "administrator", "letmein12345", "welcome12345", "iloveyou1234", "changeme1234",
  "nexpress1234", "nexpresscms1", "sifre1234567", "parola123456", "123456789abc", "abcdefghijkl",
  "admin123!admin", "adminadmin12", "passw0rd1234",
]);

export type PasswordProblem = "short" | "long" | "common" | "repetitive" | "sequential" | "contains_identity";

export const PASSWORD_PROBLEM_MESSAGES: Record<PasswordProblem, string> = {
  short: `Parola en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`,
  long: `Parola en çok ${PASSWORD_MAX_LENGTH} karakter olabilir.`,
  common: "Bu parola çok yaygın; tahmin edilmesi kolay.",
  repetitive: "Aynı karakterin tekrarı çok fazla.",
  sequential: "Ardışık dizilerden (123456…, abcdef…) oluşan parola kabul edilmez.",
  contains_identity: "Parola e-posta adresinizi veya adınızı içermemeli.",
};

function isSequential(p: string): boolean {
  let run = 1;
  for (let i = 1; i < p.length; i++) {
    const d = p.charCodeAt(i) - p.charCodeAt(i - 1);
    run = d === 1 || d === -1 ? run + 1 : 1;
    if (run >= 8) return true;
  }
  return false;
}

export function validatePassword(password: string, identity: { email?: string; name?: string } = {}): PasswordProblem[] {
  const problems: PasswordProblem[] = [];
  const lower = password.toLocaleLowerCase("tr");
  if (password.length < PASSWORD_MIN_LENGTH) problems.push("short");
  if (password.length > PASSWORD_MAX_LENGTH) problems.push("long");
  if (COMMON.has(lower)) problems.push("common");
  if (new Set(lower).size <= 3 && password.length >= PASSWORD_MIN_LENGTH) problems.push("repetitive");
  if (isSequential(lower)) problems.push("sequential");
  const local = identity.email?.split("@")[0]?.toLocaleLowerCase("tr") ?? "";
  const name = identity.name?.trim().toLocaleLowerCase("tr") ?? "";
  if ((local.length >= 4 && lower.includes(local)) || (name.length >= 4 && lower.includes(name))) problems.push("contains_identity");
  return problems;
}

export interface AccountLite {
  id: string;
  role: UserRole;
  status: "active" | "disabled";
}

/**
 * Bu değişiklik sitedeki son etkin yöneticiyi yok eder mi?
 * (rol düşürme, devre dışı bırakma veya silme sonrası etkin `admin` sayısı 0 olur mu)
 */
export function wouldRemoveLastAdmin(
  users: AccountLite[],
  targetId: string,
  change: { role?: UserRole; status?: "active" | "disabled" }
): boolean {
  const after = users.map((u) => (u.id === targetId ? { ...u, ...change } : u));
  const before = users.filter((u) => u.role === "admin" && u.status === "active").length;
  const remaining = after.filter((u) => u.role === "admin" && u.status === "active").length;
  return before > 0 && remaining === 0;
}
