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
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  HealthBarRow,
  KpiStatCard,
  SemiCircleGauge,
  VerticalBarChart,
} from "@/components/admin/ui/saas-charts";
import {
  ArrowUpRight,
  Cpu,
  Database,
  Flame,
  Gauge,
  HardDrive,
  Image as ImageIcon,
  RefreshCw,
  Settings2,
  Trash2,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BAND = { critical: "Kritik", heavy: "Ağır", light: "Hafif" } as const;
const BAND_STYLE = {
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  heavy: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  light: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
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

export default async function PerfornextPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; m?: string }>;
}) {
  const me = await requireAdminPage();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? me.siteId;
  if (!(await pluginEnabled(siteId, PERFORNEXT_PLUGIN_ID))) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-2">
        <h1 className="text-[18px] font-semibold">Perfornext kapalı</h1>
        <p className="text-[13px] text-muted-foreground">
          Önbellek, veritabanı bakımı ve içerik ağırlığı analizi bu eklentidedir.
        </p>
        <Link href="/admin/plugins" className="text-[13px] font-medium text-blue-600 hover:underline">
          Eklentiler →
        </Link>
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
    crux,
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
    loadCruxState(siteId),
  ]);

  const lastAnalyze = String(settings.lastAnalyzeAt ?? "");
  const lastWarmAt = String(settings.lastWarmAt ?? "");
  const lastWarmMs = settings.lastWarmMs != null ? `${Number(settings.lastWarmMs)} ms` : "—";
  const keepRevisions = Number(settings.keepRevisionsCount ?? 10) || 10;
  const notice = done === "crux" ? String(sp.m ?? "").slice(0, 200) : resolveNotice(done, settings);

  // Gerçek verilerden bileşik sağlık göstergesi
  const lightPages = Math.max(0, content.published - content.heavy - content.critical);
  const lightPct = content.published > 0 ? Math.round((lightPages / content.published) * 100) : 100;
  const optMediaPct =
    media.imageAssets > 0
      ? Math.round(((media.imageAssets - media.oversizedCount) / media.imageAssets) * 100)
      : 100;
  const altPct =
    media.imageAssets > 0
      ? Math.round(((media.imageAssets - media.missingAltCount) / media.imageAssets) * 100)
      : 100;
  const zeroKbScore = budget.customizer.zeroKbClean ? 100 : 75;
  const perfScore = Math.round(zeroKbScore * 0.35 + lightPct * 0.35 + optMediaPct * 0.3);

  const dbBarItems = db.tables
    .slice(0, 6)
    .map((row, idx) => ({
      label: row.label,
      value: row.rows,
      highlight: idx === 0,
      tone: (idx % 2 === 0 ? "blue" : "violet") as "blue" | "violet",
    }));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Perfornext · Performans & Hız Merkezi"
        description="0-KB RSC bütçe denetimi, çok dilli önbellek ön ısıtma, veritabanı bakımı, medya hattı ve Core Web Vitals risk tahmini."
        badge={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              budget.customizer.zeroKbClean
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${budget.customizer.zeroKbClean ? "bg-emerald-500" : "bg-amber-500"}`} />
            {budget.customizer.zeroKbClean ? "0-KB RSC Temiz" : "Bütçe Uyarısı"}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/themes/customize"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-medium hover:bg-muted"
            >
              <span>Özelleştirici</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/admin/plugins"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-medium hover:bg-muted"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Modüller</span>
            </Link>
          </div>
        }
      />

      {notice ? (
        <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-[12px] font-medium text-emerald-800 dark:text-emerald-200">
          {notice}
        </p>
      ) : null}

      {/* 4'lü Üst SaaS KPI Şeridi */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStatCard
          label="0-KB RSC JS Tavanı"
          value={`≤ ${budget.publicFirstLoadGzipKb}`}
          suffix="KB gzip"
          badge={budget.customizer.zeroKbClean ? "Tam Uyumlu" : "Uyarı Var"}
          badgeTone={budget.customizer.zeroKbClean ? "emerald" : "amber"}
          hint={`Özel CSS: ${formatBytes(budget.customizer.customCssBytes)}`}
          icon={<Zap className="h-4 w-4" />}
          iconTone="emerald"
          progressPct={zeroKbScore}
        />
        <KpiStatCard
          label="Önbellek & Ön Isıtma"
          value={`${cache.ttlSeconds} sn`}
          suffix={`· ${lastWarmMs}`}
          badge={`Epoch #${cache.epoch}`}
          badgeTone="blue"
          hint={lastWarmAt ? `Son: ${lastWarmAt.slice(5, 16).replace("T", " ")}` : "Henüz ısıtılmadı"}
          icon={<Flame className="h-4 w-4" />}
          iconTone="blue"
        />
        <KpiStatCard
          label="Veritabanı Boyutu"
          value={formatBytes(db.bytes)}
          badge={`${db.trashedCount} çöp`}
          badgeTone={db.trashedCount > 20 ? "amber" : "emerald"}
          hint={lastAnalyze ? `ANALYZE: ${lastAnalyze.slice(5, 16).replace("T", " ")}` : "Bakıma hazır"}
          icon={<Database className="h-4 w-4" />}
          iconTone="violet"
        />
        <KpiStatCard
          label="Medya & CWV Riski"
          value={media.totalAssets}
          suffix="dosya"
          badge={content.critical > 0 ? `${content.critical} kritik sayfa` : `${lightPages}/${content.published} hafif`}
          badgeTone={content.critical > 0 ? "rose" : "emerald"}
          hint={`${media.oversizedCount} ağır görsel · ${media.unusedCount} kullanılmayan`}
          icon={<ImageIcon className="h-4 w-4" />}
          iconTone="amber"
          progressPct={lightPct}
          href="/admin/media"
        />
      </div>

      {/* 2 Sütunlu Görsel Özet: Sağlık Göstergesi + Tablo Dağılımı */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="flex flex-col justify-between gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-2xs xl:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Teknik Hız Sağlığı</h2>
              <p className="text-[11px] text-muted-foreground">
                0-KB mimari, sayfa ağırlığı ve medya optimizasyonu
              </p>
            </div>
            <Gauge className="h-4 w-4 text-emerald-600" />
          </div>

          <SemiCircleGauge
            score={perfScore}
            label="Perfornext Sağlık Puanı"
            subtitle={`${content.published} yayın · ~${content.totalEstimatedHtmlKb} KB toplam HTML`}
          />

          <div className="space-y-3 border-t border-border/60 pt-4">
            <HealthBarRow
              label="Hafif Sayfa Oranı (CWV Düşük Risk)"
              valueText={`${lightPages}/${content.published} (%${lightPct})`}
              pct={lightPct}
              tone="emerald"
            />
            <HealthBarRow
              label="Optimize Görsel Oranı (<1.5 MB)"
              valueText={`%${optMediaPct} (${media.oversizedCount} ağır)`}
              pct={optMediaPct}
              tone={optMediaPct >= 90 ? "blue" : "amber"}
              href="/admin/media"
            />
            <HealthBarRow
              label="Medya Alt Metin Doluluğu"
              valueText={`%${altPct} (${media.missingAltCount} eksik)`}
              pct={altPct}
              tone={altPct >= 85 ? "violet" : "amber"}
              href="/admin/media"
            />
            <HealthBarRow
              label="Üçüncü Parti Betik Hijyeni"
              valueText={budget.customizer.hasHeaderScripts || budget.customizer.hasFooterScripts ? "Özel betik var" : "0 B (Temiz)"}
              pct={budget.customizer.hasHeaderScripts || budget.customizer.hasFooterScripts ? 70 : 100}
              tone={budget.customizer.hasHeaderScripts || budget.customizer.hasFooterScripts ? "amber" : "emerald"}
            />
          </div>
        </section>

        <section className="flex flex-col justify-between gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-2xs xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">
                Veritabanı Tablo Yoğunluğu & Hızlı Bakım
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Kiracı ({siteId}) ana tablo satır sayıları ve tek tıkla optimizasyon araçları
              </p>
            </div>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </div>

          <VerticalBarChart items={dbBarItems} height={152} />

          {/* Hızlı Bakım & Önbellek Aksiyonları */}
          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              {modCache ? (
                <>
                  <form action={warmCacheAction}>
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[12px] font-medium text-background hover:opacity-90 transition"
                    >
                      <Flame className="h-3.5 w-3.5" />
                      <span>Önbelleği Ön Isıt</span>
                    </button>
                  </form>
                  <form action={flushCacheAction}>
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12px] font-medium text-foreground hover:bg-muted transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Önbelleği Düşür</span>
                    </button>
                  </form>
                </>
              ) : null}
              {modDb ? (
                <>
                  <form action={analyzeDatabaseAction}>
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12px] font-medium text-foreground hover:bg-muted transition"
                    >
                      <Cpu className="h-3.5 w-3.5" />
                      <span>ANALYZE & WAL</span>
                    </button>
                  </form>
                  <form action={clearLogsAndTrashAction}>
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12px] font-medium text-foreground hover:bg-muted transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>404 & Çöp Temizle</span>
                    </button>
                  </form>
                </>
              ) : null}
              {modContent ? (
                <form action={recompileMarkdownAction}>
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12px] font-medium text-foreground hover:bg-muted transition"
                  >
                    <span>Markdown Yeniden Derle</span>
                  </button>
                </form>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-4 pt-1">
              {modCache ? (
                <form action={saveCacheTtlAction} className="flex items-end gap-2">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Önbellek TTL (30–600 sn)
                    <input
                      name="ttl"
                      type="number"
                      min={30}
                      max={600}
                      defaultValue={cache.ttlSeconds}
                      className="mt-1 block h-8 w-24 rounded-lg border border-border bg-background px-2 text-[12px] text-foreground"
                    />
                  </label>
                  <button
                    type="submit"
                    className="h-8 rounded-lg border border-border bg-card px-3 text-[12px] font-medium hover:bg-muted"
                  >
                    Kaydet
                  </button>
                </form>
              ) : null}
              {modDb ? (
                <form action={pruneRevisionsAction} className="flex items-end gap-2">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Korunacak Revizyon (1–50)
                    <input
                      name="keep"
                      type="number"
                      min={1}
                      max={50}
                      defaultValue={keepRevisions}
                      className="mt-1 block h-8 w-24 rounded-lg border border-border bg-background px-2 text-[12px] text-foreground"
                    />
                  </label>
                  <button
                    type="submit"
                    className="h-8 rounded-lg border border-border bg-card px-3 text-[12px] font-medium hover:bg-muted"
                  >
                    Revizyonları Buda
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {/* Gerçek Chrome UX Report (CrUX) Bölümü */}
      <CruxSection state={crux} />

      {/* Bütçe Uyarıları (varsa) */}
      {modBudget && budget.customizer.warnings.length > 0 ? (
        <ul className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-800 dark:text-amber-200">
          {budget.customizer.warnings.map((n: string) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
      ) : null}

      {/* Şişkinlik İzleme Şeridi */}
      {modDb ? (
        <section className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-foreground">
              Geçmiş, Günlük & İndeks Tabloları (Şişkinlik İzleme)
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              Toplam: {formatBytes(db.bytes)}
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
            {db.bloat.map((row) => (
              <li key={row.label} className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                <p className="truncate text-[10px] font-medium text-muted-foreground">{row.label}</p>
                <p className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums text-foreground">
                  {row.rows.toLocaleString("tr-TR")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* İçerik Ağırlığı & CWV Risk Tablosu */}
      {modContent ? (
        <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-foreground">
                Ağır & CWV Riskli Sayfalar ({defaultLocale.toUpperCase()})
              </h2>
              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                CLS: {content.clsRiskCount} · LCP: {content.lcpRiskCount}
              </span>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {content.heaviest.length} öncelikli sayfa
            </span>
          </div>

          {content.heaviest.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12px] text-emerald-700 dark:text-emerald-300">
              Ağır ya da CLS/LCP risk işareti taşıyan yayın bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/20 text-[11px] font-medium text-muted-foreground">
                    <th className="px-4 py-2.5">Sayfa & Notlar</th>
                    <th className="px-3 py-2.5">Risk</th>
                    <th className="px-3 py-2.5 text-right">Tahmini HTML</th>
                    <th className="px-3 py-2.5 text-right">Blok</th>
                    <th className="px-3 py-2.5 text-right">SEO</th>
                    <th className="px-4 py-2.5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {content.heaviest.map((row) => {
                    const liveHref = row.slug === "ana-sayfa" ? baseHref || "/" : `${baseHref}/${row.slug}`;
                    const editHref = `/admin/contents?id=${encodeURIComponent(row.id)}&type=${encodeURIComponent(row.type)}`;
                    return (
                      <tr key={row.id} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-2.5 max-w-[360px]">
                          <Link href={editHref} className="block truncate font-semibold text-foreground hover:text-blue-600">
                            {row.title}
                          </Link>
                          <div className="truncate text-[11px] text-muted-foreground">
                            /{row.slug} · {row.notes.join(" · ")}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${BAND_STYLE[row.band]}`}>
                            {BAND[row.band]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground">
                          ~{row.estimatedHtmlKb} KB
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                          {row.blockCount}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold">
                          {row.seoScore}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              href={editHref}
                              className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium hover:border-blue-500 hover:text-blue-600"
                            >
                              Düzenle
                            </Link>
                            <a
                              href={liveHref}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              Canlı ↗
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
