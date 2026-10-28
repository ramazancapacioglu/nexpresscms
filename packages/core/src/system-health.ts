/** Sistem sağlığı değerlendirmesi (saf mantık): ortam değişkenleri ve eşikler. Sır değerleri asla çıktıya girmez. */
export type HealthLevel = "ok" | "warn" | "fail" | "info";

export interface HealthCheck {
  id: string;
  group: string;
  label: string;
  level: HealthLevel;
  detail: string;
}

const PLACEHOLDER_SECRETS = ["nexpress-super-secret-jwt-key-change-in-production-2026", "changeme", "secret", "ci-only-secret"];

/** Yalnızca varlık/biçim bilgisi üretir; hiçbir değeri (anahtar, parola) döndürmez. */
export function evaluateEnv(env: Record<string, string | undefined>, isProduction: boolean): HealthCheck[] {
  const has = (k: string) => Boolean(env[k]?.trim());
  const out: HealthCheck[] = [];
  const add = (id: string, label: string, level: HealthLevel, detail: string) => out.push({ id, group: "Ortam", label, level, detail });

  const secret = env.AUTH_SECRET?.trim() ?? "";
  if (!secret) add("auth-secret", "AUTH_SECRET", isProduction ? "fail" : "warn", "Tanımlı değil: oturum imzası geçici anahtara düşer, yeniden başlatmada herkes çıkış yapar.");
  else if (secret.length < 32) add("auth-secret", "AUTH_SECRET", "warn", `Çok kısa (${secret.length} karakter); en az 32 önerilir.`);
  else if (PLACEHOLDER_SECRETS.some((p) => secret.toLowerCase().includes(p))) add("auth-secret", "AUTH_SECRET", isProduction ? "fail" : "warn", "Örnek dosyadaki yer tutucu değer kullanılıyor; benzersiz bir değerle değiştirin.");
  else add("auth-secret", "AUTH_SECRET", "ok", "Tanımlı ve yeterince uzun.");

  const url = env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!url) add("app-url", "NEXT_PUBLIC_APP_URL", "warn", "Tanımlı değil: sitemap, canonical ve besleme adresleri localhost'a düşer.");
  else if (isProduction && !/^https:\/\//i.test(url)) add("app-url", "NEXT_PUBLIC_APP_URL", "warn", "Üretimde https:// olmalı.");
  else if (/localhost|127\.0\.0\.1/.test(url) && isProduction) add("app-url", "NEXT_PUBLIC_APP_URL", "warn", "Üretimde yerel adres kullanılıyor.");
  else add("app-url", "NEXT_PUBLIC_APP_URL", "ok", url);

  add("openai", "OPENAI_API_KEY", has("OPENAI_API_KEY") ? "ok" : "info", has("OPENAI_API_KEY") ? "Tanımlı: gerçek gömme ve AI yazım asistanı açık." : "Tanımlı değil: arama yerel gömmeyle çalışır, AI yazım asistanı kapalı.");
  add("mcp-key", "MCP_AGENT_KEY", has("MCP_AGENT_KEY") ? "ok" : "info", has("MCP_AGENT_KEY") ? "Tanımlı: ajan talepleri (lead/destek/demo) kabul edilir." : "Tanımlı değil: ajan yazma araçları anahtarsız reddeder.");
  add("cron", "CRON_SECRET", has("CRON_SECRET") ? "ok" : "info", has("CRON_SECRET") ? "Tanımlı: /api/cron/scheduled kesin zamanlama için açık." : "Tanımlı değil: zamanlanmış yayın yalnızca ziyaretçi trafiğiyle (dakikada bir) tetiklenir.");
  add("indexnow", "INDEXNOW_API_KEY", has("INDEXNOW_API_KEY") ? "ok" : "info", has("INDEXNOW_API_KEY") ? "Tanımlı." : "Tanımlı değil: Bing/Yandex'e anında bildirim kapalı.");
  const dialect = env.DB_DIALECT?.trim().toLowerCase() === "sqlite" ? "sqlite" : "postgresql";
  if (dialect === "postgresql" && !has("DATABASE_URL")) add("database-url", "DATABASE_URL", "fail", "PostgreSQL seçili ama DATABASE_URL tanımlı değil.");
  return out;
}

/** Bayat/eksik arama dizini özeti: yayındaki içerik sayısına göre. */
export function evaluateIndex(input: { published: number; indexedContents: number; activeModel: string; models: Array<{ model: string; chunks: number }> }): HealthCheck {
  const base = { id: "search-index", group: "Arama dizini", label: "Dizin kapsamı" } as const;
  if (input.published === 0) return { ...base, level: "info", detail: "Yayında içerik yok." };
  const active = input.models.find((m) => m.model === input.activeModel);
  if (!active || active.chunks === 0) return { ...base, level: "warn", detail: `Etkin model (${input.activeModel}) için dizin yok; Dizini yeniden oluşturun.` };
  const missing = Math.max(0, input.published - input.indexedContents);
  if (missing > 0) return { ...base, level: "warn", detail: `${missing} yayındaki içerik dizinde yok (${input.indexedContents}/${input.published}).` };
  const stale = input.models.filter((m) => m.model !== input.activeModel && m.chunks > 0);
  return { ...base, level: stale.length ? "info" : "ok", detail: `${input.indexedContents}/${input.published} içerik dizinli${stale.length ? `; eski modelden ${stale.reduce((n, m) => n + m.chunks, 0)} parça kaldı` : ""}.` };
}
