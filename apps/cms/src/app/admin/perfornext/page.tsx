import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { requireAdminPage } from "@/lib/auth/session";
import { cacheSnapshot } from "@/lib/cache";
import { pluginEnabled } from "@/lib/plugin-gate";
import { hydratePerfornextCache } from "@/lib/perfornext/hydrate";
import { contentReport, databaseReport } from "@/lib/perfornext/report";
import { PERFORNEXT_PLUGIN_ID } from "@/plugins/perfornext";
import { getScopedRepository } from "@nexpress/database";
import { analyzeDatabaseAction, flushCacheAction, saveCacheTtlAction } from "./actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const BAND = { critical: "Kritik", heavy: "Ağır", light: "Hafif" } as const;

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function PerfornextPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const me = await requireAdminPage();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? me.siteId;
  if (!(await pluginEnabled(siteId, PERFORNEXT_PLUGIN_ID))) {
    return (
      <div className="space-y-2">
        <h1 className="text-[18px] font-semibold">Perfornext kapalı</h1>
        <p className="text-[13px] text-[#5F6570]">Önbellek ve bakım bu eklentidedir.</p>
        <Link href="/admin/plugins" className="text-[13px] text-[#1D5ED8] hover:underline">Eklentiler</Link>
      </div>
    );
  }
  await hydratePerfornextCache(siteId);
  const done = (await searchParams).done;
  const site = await getScopedRepository(siteId).getSite();
  const plugin = await getScopedRepository(siteId).getSitePlugin(PERFORNEXT_PLUGIN_ID);
  const [cache, db, content] = await Promise.all([
    Promise.resolve(cacheSnapshot(siteId)),
    databaseReport(siteId),
    contentReport(siteId, site?.defaultLocale ?? "tr"),
  ]);
  const lastAnalyze = String(plugin?.settings?.lastAnalyzeAt ?? "");
  const notice = done === "cache" ? "Önbellek düşürüldü." : done === "analyze" ? "Veritabanı istatistiği güncellendi." : done === "ttl" ? "Önbellek süresi kaydedildi." : "";

  return (
    <div className="space-y-5">
      <div className={`border-b ${border} pb-3`}>
        <h1 className="text-[18px] font-semibold tracking-tight">Perfornext</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Önbellek, veritabanı bakımı ve yayın ağırlığı. Ziyaretçi sayfasına ek betik konmaz. Puan uydurulmaz.</p>
      </div>
      {notice ? <p role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px]">{notice}</p> : null}

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570]">Önbellek</h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Süre", `${cache.ttlSeconds} sn`],
            ["Dönem", String(cache.epoch)],
            ["Büyük yük", String(cache.oversizeEntries)],
            ["Süreç", cache.startedAt.slice(0, 16).replace("T", " ")],
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
              <input name="ttl" type="number" min={30} max={600} defaultValue={cache.ttlSeconds} className={`mt-1 block w-28 rounded-md border ${border} bg-white px-2 py-1 text-[12px] dark:bg-[#15171C]`} />
            </label>
            <button type="submit" className="rounded-md bg-[#111318] px-3 py-1.5 text-[12px] text-white dark:bg-white dark:text-[#111318]">Kaydet</button>
          </form>
          <form action={flushCacheAction}>
            <button type="submit" className={`rounded-md border ${border} px-3 py-1.5 text-[12px]`}>Önbelleği düşür</button>
          </form>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570]">Veritabanı</h2>
          <form action={analyzeDatabaseAction}>
            <button type="submit" className={`rounded-md border ${border} px-3 py-1.5 text-[12px]`}>İstatistiği güncelle</button>
          </form>
        </div>
        <p className="text-[12px] text-[#5F6570]">Boyut {formatBytes(db.bytes)}. Satırlar bu siteye aittir. Güncelleme veritabanının tamamında planlayıcı istatistiğini yeniler, tabloyu kilitleyen sıkıştırma yapmaz.{lastAnalyze ? ` Son işlem ${lastAnalyze.slice(0, 16).replace("T", " ")}.` : ""}</p>
        <ul className={`grid grid-cols-2 gap-2 md:grid-cols-4`}>
          {db.tables.map((row) => (
            <li key={row.label} className={`rounded-lg border ${border} bg-white px-3 py-2 dark:bg-[#15171C]`}>
              <p className="text-[10px] text-[#5F6570]">{row.label}</p>
              <p className="font-mono text-[13px]">{row.rows}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570]">İçerik</h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {[
            ["Yayın", content.published],
            ["Ort. SEO", content.averageSeo],
            ["Boş meta", content.missingMeta],
            ["Eksik alt", content.missingAlt],
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
          <p className="text-[12px] text-[#5F6570]">Ağır yayın yok.</p>
        ) : (
          <ul className={`divide-y rounded-lg border ${border} bg-white dark:bg-[#15171C]`}>
            {content.heaviest.map((row) => (
              <li key={row.id} className="px-4 py-2.5 text-[12px]">
                <p className="font-medium">{row.title} <span className="text-[#5F6570]">/{row.slug} · {BAND[row.band]}</span></p>
                <p className="text-[#5C5F66] dark:text-[#9CA3AF]">{row.notes.join(" · ")} · SEO {row.seoScore}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
