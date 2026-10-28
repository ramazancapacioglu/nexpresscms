import "server-only";
import { statfs } from "node:fs/promises";
import { access, constants } from "node:fs";
import { promisify } from "node:util";
import { evaluateEnv, evaluateIndex, type HealthCheck } from "@nexpress/core";
import { getBotStatsRepository, getChunkRepository, getFormSubmissionRepository, getDbDialect, getAgentRequestRepository, getRedirectRepository, getScopedRepository, migrationStatus } from "@nexpress/database";
import { providerFromEnv } from "@nexpress/rag";
import { mediaRoot } from "@/lib/media/storage";

const accessP = promisify(access);

async function safe<T>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 160) : "bilinmeyen hata" };
  }
}

const fmtBytes = (n: number) => (n > 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GB` : `${Math.round(n / 1024 ** 2)} MB`);

/** Yönetim paneli "Sistem durumu": tek yerde sağlık denetimleri. Sır değerleri gösterilmez. */
export async function collectSystemStatus(siteId: string): Promise<{ checks: HealthCheck[]; info: Array<[string, string]> }> {
  const checks: HealthCheck[] = [];
  const add = (group: string, id: string, label: string, level: HealthCheck["level"], detail: string) => checks.push({ id, group, label, level, detail });
  const repo = getScopedRepository(siteId);

  // Veritabanı
  const t0 = performance.now();
  const site = await safe(() => repo.getSite());
  const ms = Math.round(performance.now() - t0);
  if (!site.ok) add("Veritabanı", "db", "Bağlantı", "fail", `Sorgu başarısız: ${site.error}`);
  else add("Veritabanı", "db", "Bağlantı", ms > 500 ? "warn" : "ok", `${getDbDialect()} · sorgu ${ms} ms${site.value ? "" : " · site kaydı yok (seed çalıştırın)"}`);
  const mig = await safe(() => migrationStatus());
  if (!mig.ok) add("Veritabanı", "migrations", "Göçler", "warn", `Durum okunamadı: ${mig.error}`);
  else if (mig.value.pending > 0 || mig.value.legacy) add("Veritabanı", "migrations", "Göçler", "warn", mig.value.legacy ? "Eski (push) veritabanı: pnpm db:migrate çalıştırın." : `${mig.value.pending} bekleyen göç var: pnpm db:migrate`);
  else add("Veritabanı", "migrations", "Göçler", "ok", `${mig.value.total} göçün tamamı uygulanmış.`);

  // Ortam
  checks.push(...evaluateEnv(process.env, process.env.NODE_ENV === "production"));

  // Disk / medya
  const media = mediaRoot();
  const writable = await accessP(media, constants.W_OK).then(() => true, () => false);
  const fsInfo = await safe(() => statfs(media));
  if (!writable) add("Depolama", "media-dir", "Medya klasörü", "warn", `Yazılamıyor veya yok: ${media}`);
  else if (fsInfo.ok) {
    const free = Number(fsInfo.value.bavail) * Number(fsInfo.value.bsize);
    add("Depolama", "media-dir", "Medya klasörü", free < 512 * 1024 ** 2 ? "warn" : "ok", `Yazılabilir · ${fmtBytes(free)} boş`);
  } else add("Depolama", "media-dir", "Medya klasörü", "ok", "Yazılabilir.");

  // Arama dizini
  const provider = providerFromEnv();
  const [stats, published] = await Promise.all([safe(() => getChunkRepository(siteId).stats()), safe(() => repo.listContents({ locale: site.ok && site.value ? site.value.defaultLocale : "tr", status: "published" }))]);
  if (stats.ok && published.ok) checks.push(evaluateIndex({ published: published.value.length, indexedContents: stats.value.contents, activeModel: provider.model, models: stats.value.models }));
  else add("Arama dizini", "search-index", "Dizin kapsamı", "warn", "Dizin durumu okunamadı.");

  // İçerik yaşam döngüsü ve gelen kutuları
  const scheduled = await safe(() => repo.listScheduled());
  if (scheduled.ok) {
    const overdue = scheduled.value.filter((s) => s.due).length;
    const dateless = scheduled.value.filter((s) => !s.dueAt).length;
    add("İçerik", "scheduled", "Zamanlanmış yayın", overdue > 0 || dateless > 0 ? "warn" : "ok", `${scheduled.value.length} zamanlanmış${overdue ? ` · ${overdue} gecikmiş (zamanlayıcı henüz çalışmadı)` : ""}${dateless ? ` · ${dateless} tarihsiz` : ""}`);
  }
  const trash = await safe(() => repo.listTrashed());
  if (trash.ok) add("İçerik", "trash", "Çöp kutusu", "info", `${trash.value.length} içerik (30 gün sonra silinir)`);
  const nf = await safe(() => getRedirectRepository(siteId).countNotFound());
  if (nf.ok) add("İçerik", "404", "404 izleyici", nf.value > 50 ? "warn" : "info", `${nf.value} farklı bulunamayan adres`);
  const forms = await safe(() => getFormSubmissionRepository(siteId).counts());
  if (forms.ok) add("İçerik", "forms", "Form gönderimleri", "info", `${forms.value.new} yeni · ${forms.value.spam} spam · ${forms.value.read + forms.value.archived} işlenmiş`);
  const reqs = await safe(() => getAgentRequestRepository(siteId).countNew());
  if (reqs.ok) add("İçerik", "requests", "Ajan talepleri", reqs.value > 0 ? "info" : "ok", `${reqs.value} yeni talep`);
  const bots = await safe(() => getBotStatsRepository(siteId).summary(7));
  if (bots.ok) add("İçerik", "bots", "Bot telemetrisi (7 gün)", "info", `${bots.value.reduce((n, b) => n + b.total, 0)} bot isteği · ${bots.value.length} farklı bot`);

  const info: Array<[string, string]> = [
    ["Node", process.version],
    ["Ortam", process.env.NODE_ENV ?? "development"],
    ["Kiracı", siteId],
    ["Çalışma süresi", `${Math.round(process.uptime() / 60)} dk`],
    ["Bellek (RSS)", fmtBytes(process.memoryUsage().rss)],
    ["Gömme modeli", provider.model],
  ];
  return { checks, info };
}
