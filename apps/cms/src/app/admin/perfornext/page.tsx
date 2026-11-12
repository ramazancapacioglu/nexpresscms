import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { isPluginModuleEnabled, localeBase } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { cacheSnapshot } from "@/lib/cache";
import { pluginEnabled } from "@/lib/plugin-gate";
import { hydratePerfornextCache } from "@/lib/perfornext/hydrate";
import { loadCruxState } from "@/lib/perfornext/crux";
import { CruxSection } from "./crux-section";
import {
  budgetPerformanceReport,
  contentReport,
  databaseReport,
  mediaPerformanceReport,
} from "@/lib/perfornext/report";
import { PERFORNEXT_PLUGIN_ID } from "@/plugins/perfornext";
import {
  analyzeDatabaseAction,
  clearLogsAndTrashAction,
  flushCacheAction,
  pruneRevisionsAction,
  recompileMarkdownAction,
  saveCacheTtlAction,
  warmCacheAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const BAND = { critical: "Kritik", heavy: "Ağır", light: "Hafif" } as const;
const BAND_STYLE = {
  critical: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  heavy: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  light: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
} as const;

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveNotice(done: string | undefined, settings: Record<string, unknown>): string {
  switch (done) {
    case "cache":
      return "Ziyaretçi önbelleği ve büyük yük belleği düşürüldü.";
    case "warm":
      return `Tüm dillerde ziyaretçi önbelleği ön ısıtıldı (${Number(settings.lastWarmMs ?? 0)} ms).`;
    case "analyze":
      return `Veritabanı istatistiği ve WAL kontrol noktası güncellendi (${String(settings.lastAnalyzeStatement ?? "ANALYZE")}).`;
    case "ttl":
      return "Önbellek süresi kaydedildi ve çalışan sürece uygulandı.";
    case "revisions":
      return `Eski revizyonlar budandı (${Number(settings.lastPruneRevisionsDeleted ?? 0)} kayıt silindi).`;
    case "cleanup":
      return `404 günlükleri (${Number(settings.lastCleanupNotFound ?? 0)}) ve süresi dolmuş çöp kutusu öğeleri (${Number(settings.lastCleanupTrash ?? 0)}) temizlendi.`;
    case "markdown":
      return `Markdown önbelleği yeniden derlendi (${Number(settings.lastRecompileCount ?? 0)} çeviri güncellendi).`;
    default:
      return "";
  }
}

export default async function PerfornextPage({ searchParams }: { searchParams: Promise<{ done?: string; m?: string }> }) {
  const me = await requireAdminPage();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? me.siteId;
  if (!(await pluginEnabled(siteId, PERFORNEXT_PLUGIN_ID))) {
    return (
      <div className="space-y-2">
        <h1 className="text-[18px] font-semibold">Perfornext kapalı</h1>
        <p className="text-[13px] text-[#5F6570]">Önbellek, veritabanı bakımı ve içerik ağırlığı (Core Web Vitals risk tahmini) bu eklentidedir. Gerçek ölçüm için PageSpeed Insights / Lighthouse kullanın.</p>
        <Link href="/admin/plugins" className="text-[13px] text-[#1D5ED8] hover:underline">Eklentiler</Link>
      </div>
    );
  }
  await hydratePerfornextCache(siteId);
  const sp = await searchParams;
  const done = sp.done;
  const site = await getScopedRepository(siteId).getSite();
  const defaultLocale = site?.defaultLocale ?? "tr";
  const baseHref = localeBase(site, defaultLocale);
  const plugin = await getScopedRepository(siteId).getSitePlugin(PERFORNEXT_PLUGIN_ID);
  const settings = plugin?.settings ?? {};

  const [
    modBudget,
    modCache,
    modDb,
    modMedia,
    modContent,
    cache,
    db,
    content,
    media,
    budget,
  ] = await Promise.all([
    isPluginModuleEnabled(siteId, PERFORNEXT_PLUGIN_ID, "budget"),
    isPluginModuleEnabled(siteId, PERFORNEXT_PLUGIN_ID, "cache"),
    isPluginModuleEnabled(siteId, PERFORNEXT_PLUGIN_ID, "database"),
    isPluginModuleEnabled(siteId, PERFORNEXT_PLUGIN_ID, "media"),
    isPluginModuleEnabled(siteId, PERFORNEXT_PLUGIN_ID, "content"),
    Promise.resolve(cacheSnapshot(siteId)),
    databaseReport(siteId),
    contentReport(siteId, defaultLocale),
    mediaPerformanceReport(siteId),
    budgetPerformanceReport(siteId),
  ]);

  const lastAnalyze = String(settings.lastAnalyzeAt ?? "");
  const lastWarmAt = String(settings.lastWarmAt ?? "");
  const lastWarmMs = settings.lastWarmMs != null ? `${Number(settings.lastWarmMs)} ms` : "—";
  const keepRevisions = Number(settings.keepRevisionsCount ?? 10) || 10;
  const notice = done === "crux" ? String(sp.m ?? "").slice(0, 200) : resolveNotice(done, settings);
  const crux = await loadCruxState(siteId);

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b ${border} pb-3`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Perfornext · Performans ve Hız Merkezi</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            0-KB RSC bütçe denetimi, çok dilli önbellek ön ısıtma, veritabanı şişkinlik bakımı, medya hattı ve Core Web Vitals risk tahmini (içerikten; ölçüm değil) analizi.
          </p>
        </div>
        <Link href="/admin/plugins" className={`rounded-md border ${border} px-3 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5`}>
          Modül Ayarları
        </Link>
      </div>
      {notice ? (
        <p role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px]">
          {notice}
        </p>
      ) : null}

      <CruxSection state={crux} />

      {modBudget ? (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570]">
              0-KB RSC & Ön Yüz Performans Bütçesi
            </h2>
            <Link href="/admin/themes/customize" className="text-[12px] text-[#1D5ED8] hover:underline">
              Tema Özelleştirici →
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ["Sayfa Başı JS Tavanı", `≤ ${budget.publicOwnGzipKb.toFixed(1)} KB gzip`],
              ["İlk Yükleme Tavanı", `≤ ${budget.publicFirstLoadGzipKb} KB gzip`],
              ["Özel CSS Yükü", formatBytes(budget.customizer.customCssBytes)],
              [
                "Üçüncü Parti Betik",
                budget.customizer.hasHeaderScripts || budget.customizer.hasFooterScripts ? "Tanımlı" : "Yok (0 B)",
              ],
              ["0-KB Mimari Durumu", budget.customizer.zeroKbClean ? "Tam Uyumlu" : "Uyarı Var"],
            ].map(([k, v]) => (
              <div key={String(k)} className={`rounded-lg border ${border} bg-white px-3 py-2 dark:bg-[#15171C]`}>
                <dt className="text-[10px] text-[#5F6570]">{k}</dt>
                <dd className="font-mono text-[12px]">{v}</dd>
              </div>
            ))}
          </dl>
          {budget.customizer.warnings.length > 0 ? (
            <ul className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-800 dark:text-amber-200">
              {budget.customizer.warnings.map((n: string) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {modCache ? (
        <section className="space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570]">Önbellek & Ön Isıtma</h2>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {[
              ["Süre (TTL)", `${cache.ttlSeconds} sn`],
              ["Dönem (Epoch)", String(cache.epoch)],
              ["Büyük Yük (>1,8 MB)", String(cache.oversizeEntries)],
              ["Son Ön Isıtma", lastWarmMs],
              ["Isıtma Zamanı", lastWarmAt ? lastWarmAt.slice(0, 16).replace("T", " ") : "—"],
              ["Süreç Başlangıcı", cache.startedAt.slice(0, 16).replace("T", " ")],
            ].map(([k, v]) => (
              <div key={k} className={`rounded-lg border ${border} bg-white px-3 py-2 dark:bg-[#15171C]`}>
                <dt className="text-[10px] text-[#5F6570]">{k}</dt>
                <dd className="font-mono text-[12px]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-end gap-3">
            <form action={saveCacheTtlAction} className="flex items-end gap-2">
              <label className="text-[12px] text-[#5F6570]">
                Süre (30–600 sn)
                <input
                  name="ttl"
                  type="number"
                  min={30}
                  max={600}
                  defaultValue={cache.ttlSeconds}
                  className={`mt-1 block w-28 rounded-md border ${border} bg-white px-2 py-1 text-[12px] dark:bg-[#15171C]`}
                />
              </label>
              <button type="submit" className="rounded-md bg-[#111318] px-3 py-1.5 text-[12px] text-white dark:bg-white dark:text-[#111318]">
                Kaydet
              </button>
            </form>
            <form action={warmCacheAction}>
              <button type="submit" className={`rounded-md border ${border} bg-white px-3 py-1.5 text-[12px] font-medium hover:bg-black/5 dark:bg-[#15171C] dark:hover:bg-white/5`}>
                Önbelleği Ön Isıt ({(site?.supportedLocales ?? [defaultLocale]).join(", ")})
              </button>
            </form>
            <form action={flushCacheAction}>
              <button type="submit" className={`rounded-md border ${border} px-3 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5`}>
                Önbelleği Düşür
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {modDb ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570]">Veritabanı & Şişkinlik Bakımı</h2>
            <div className="flex flex-wrap items-center gap-2">
              <form action={analyzeDatabaseAction}>
                <button type="submit" className={`rounded-md border ${border} px-3 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5`}>
                  İstatistiği & WAL Güncelle
                </button>
              </form>
              <form action={clearLogsAndTrashAction}>
                <button type="submit" className={`rounded-md border ${border} px-3 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5`}>
                  404 Günlüklerini & Süresi Dolmuş Çöpleri Temizle
                </button>
              </form>
            </div>
          </div>
          <p className="text-[12px] text-[#5F6570]">
            Toplam boyut {formatBytes(db.bytes)} · Çöp kutusunda {db.trashedCount} içerik. Satır sayıları ve temizlik işlemleri yalnızca bu kiracıya (`{siteId}`) uygulanır.
            {lastAnalyze ? ` Son ANALYZE: ${lastAnalyze.slice(0, 16).replace("T", " ")}.` : ""}
          </p>
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-[#5F6570]">Ana Tablolar</p>
            <ul className="grid grid-cols-2 gap-2 md:grid-cols-7">
              {db.tables.map((row) => (
                <li key={row.label} className={`rounded-lg border ${border} bg-white px-3 py-2 dark:bg-[#15171C]`}>
                  <p className="text-[10px] text-[#5F6570]">{row.label}</p>
                  <p className="font-mono text-[13px]">{row.rows}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-[#5F6570]">Geçmiş, Günlük ve İndeks Tabloları (Şişkinlik İzleme)</p>
            <ul className="grid grid-cols-2 gap-2 md:grid-cols-7">
              {db.bloat.map((row) => (
                <li key={row.label} className={`rounded-lg border ${border} bg-white px-3 py-2 dark:bg-[#15171C]`}>
                  <p className="text-[10px] text-[#5F6570]">{row.label}</p>
                  <p className="font-mono text-[13px]">{row.rows}</p>
                </li>
              ))}
            </ul>
          </div>
          <form action={pruneRevisionsAction} className="flex flex-wrap items-end gap-2 pt-1">
            <label className="text-[12px] text-[#5F6570]">
              İçerik başına korunacak son revizyon (1–50)
              <input
                name="keep"
                type="number"
                min={1}
                max={50}
                defaultValue={keepRevisions}
                className={`mt-1 block w-28 rounded-md border ${border} bg-white px-2 py-1 text-[12px] dark:bg-[#15171C]`}
              />
            </label>
            <button type="submit" className={`rounded-md border ${border} bg-white px-3 py-1.5 text-[12px] hover:bg-black/5 dark:bg-[#15171C] dark:hover:bg-white/5`}>
              Eski Revizyonları Buda
            </button>
          </form>
        </section>
      ) : null}

      {modMedia ? (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570]">Medya & Görsel Hattı (AVIF / WebP)</h2>
            <Link href="/admin/media" className="text-[12px] text-[#1D5ED8] hover:underline">
              Medya Kütüphanesi →
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {[
              ["Toplam Dosya", String(media.totalAssets)],
              ["Görsel Adedi", String(media.imageAssets)],
              ["Orijinal Depolama", formatBytes(media.totalBytes)],
              ["Ağır Orijinal (>1,5 MB)", String(media.oversizedCount)],
              ["Kullanılmayan Medya", String(media.unusedCount)],
              ["Eksik Alt Metin", String(media.missingAltCount)],
            ].map(([k, v]) => (
              <div key={String(k)} className={`rounded-lg border ${border} bg-white px-3 py-2 dark:bg-[#15171C]`}>
                <dt className="text-[10px] text-[#5F6570]">{k}</dt>
                <dd className="font-mono text-[13px]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {modContent ? (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570]">
              İçerik Ağırlığı & CWV Risk Tahmini ({defaultLocale.toUpperCase()})
              <span className="ml-2 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">Tahmin</span>
            </h2>
            <form action={recompileMarkdownAction}>
              <button type="submit" className={`rounded-md border ${border} px-3 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5`}>
                Markdown Önbelleğini Yeniden Derle
              </button>
            </form>
          </div>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-9">
            {[
              ["Yayın", content.published],
              ["Ort. SEO", content.averageSeo],
              ["Tahmini HTML", `${content.totalEstimatedHtmlKb} KB`],
              ["Boş Meta", content.missingMeta],
              ["Eksik Alt", content.missingAlt],
              ["CLS Riski", content.clsRiskCount],
              ["LCP Riski", content.lcpRiskCount],
              ["Ağır", content.heavy],
              ["Kritik", content.critical],
            ].map(([k, v]) => (
              <div key={String(k)} className={`rounded-lg border ${border} bg-white px-3 py-2 dark:bg-[#15171C]`}>
                <dt className="text-[10px] text-[#5F6570]">{k}</dt>
                <dd className="font-mono text-[13px]">{v}</dd>
              </div>
            ))}
          </dl>
          {content.heaviest.length === 0 ? (
            <p className="text-[12px] text-[#5F6570]">Ağır ya da CLS/LCP risk işareti taşıyan yayın yok.</p>
          ) : (
            <ul className={`divide-y rounded-lg border ${border} bg-white dark:bg-[#15171C]`}>
              {content.heaviest.map((row) => {
                const liveHref = row.slug === "ana-sayfa" ? baseHref || "/" : `${baseHref}/${row.slug}`;
                const editHref = `/admin/contents?id=${encodeURIComponent(row.id)}&type=${encodeURIComponent(row.type)}`;
                return (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[12px]">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={editHref} className="font-medium hover:text-[#1D5ED8] hover:underline">
                          {row.title}
                        </Link>
                        <span className="font-mono text-[11px] text-[#5F6570]">/{row.slug}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${BAND_STYLE[row.band]}`}>
                          {BAND[row.band]}
                        </span>
                        <span className="font-mono text-[11px] text-[#5F6570]">~{row.estimatedHtmlKb} KB HTML</span>
                        <span className="font-mono text-[11px] text-[#5F6570]">{row.blockCount} blok</span>
                      </div>
                      <p className="text-[#5C5F66] dark:text-[#9CA3AF]">
                        {row.notes.join(" · ")} · SEO {row.seoScore}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={editHref} className={`rounded border ${border} px-2.5 py-1 text-[11px] hover:bg-black/5 dark:hover:bg-white/5`}>
                        Stüdyoda Düzenle
                      </Link>
                      <a
                        href={liveHref}
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded border ${border} px-2.5 py-1 text-[11px] text-[#5F6570] hover:text-[#111318] dark:hover:text-white`}
                      >
                        Canlı ↗
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
