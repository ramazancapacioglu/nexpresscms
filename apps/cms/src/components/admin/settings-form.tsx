"use client";

import React, { useState, useTransition } from "react";
import { saveSettingsAction, type SettingsResult } from "@/app/admin/settings/actions";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = `h-8 w-full rounded border ${border} bg-transparent px-2 text-[12px] outline-none focus:ring-1 focus:ring-[#266DF0]`;
const card = `rounded-lg border ${border} bg-white dark:bg-[#15171C] p-4 space-y-3`;

export interface SystemInfo {
  siteId: string;
  domain: string;
  defaultLocale: string;
  supportedLocales: string[];
  cmsMode: string;
  dbDialect: string;
  nodeEnv: string;
  embeddingModel: string;
  mediaDir: string;
}

export function SettingsForm({
  initial,
  info,
  timezones,
}: {
  initial: { name: string; tagline: string; contactEmail: string; timezone: string };
  info: SystemInfo;
  timezones: string[];
}) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SettingsResult | null>(null);

  const rows: Array<[string, string]> = [
    ["Site kimliği (siteId)", info.siteId],
    ["Alan adı", info.domain],
    ["Varsayılan dil", info.defaultLocale],
    ["Etkin diller", info.supportedLocales.join(", ")],
    ["Çalışma modu", info.cmsMode],
    ["Veritabanı motoru", info.dbDialect],
    ["Ortam", info.nodeEnv],
    ["Arama dizini modeli", info.embeddingModel],
    ["Medya dizini", info.mediaDir],
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-[16px] font-bold tracking-tight">Ayarlar</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Genel site kimliği. Kurum kimliği ve <code>sameAs</code> için <a className="underline" href="/admin/seo">SEO</a>, ticaret için <a className="underline" href="/admin/commerce">E-Ticaret</a>, görünüm için <a className="underline" href="/admin/themes">Tema</a> sayfaları kullanılır.
        </p>
      </div>

      <form
        className={card}
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => setResult(await saveSettingsAction(v)));
        }}
      >
        <label className="block space-y-1 text-[12px] font-medium">Site adı
          <input required maxLength={80} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={field} />
        </label>
        <label className="block space-y-1 text-[12px] font-medium">Slogan
          <input maxLength={160} value={v.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} className={field} />
        </label>
        <label className="block space-y-1 text-[12px] font-medium">İletişim e-postası
          <input type="email" value={v.contactEmail} onChange={(e) => setV({ ...v, contactEmail: e.target.value })} className={field} placeholder="ornek@firma.com" />
        </label>
        <label className="block space-y-1 text-[12px] font-medium">Saat dilimi
          <select value={v.timezone} onChange={(e) => setV({ ...v, timezone: e.target.value })} className={field}>
            {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="h-8 rounded bg-[#266DF0] px-3 text-[12px] font-medium text-white disabled:opacity-60">{pending ? "Kaydediliyor…" : "Kaydet"}</button>
          {result && (result.ok ? <span role="status" className="text-[11px] text-emerald-800">Kaydedildi.</span> : <span role="alert" className="text-[11px] text-red-600">{result.error}</span>)}
        </div>
      </form>

      <div className={card}>
        <div className="text-[12px] font-semibold">Sistem bilgisi (salt okunur)</div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map(([k, val]) => (
            <div key={k}>
              <dt className="text-[10px] uppercase text-[#5F6570] dark:text-[#8C9099]">{k}</dt>
              <dd className="break-all font-mono text-[11px]">{val || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
