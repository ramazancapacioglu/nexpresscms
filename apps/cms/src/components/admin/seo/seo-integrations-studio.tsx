"use client";

import React, { useState, useTransition } from "react";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";
import {
  saveSeoIntegrationsAction,
  syncGscAction,
  syncBingAction,
  syncYandexAction,
  syncGa4Action,
  type SaveIntegrationsInput,
} from "@/app/admin/seo/actions";
import type {
  GscQueryRow,
  BingQueryRow,
  YandexOrganicLandingRow,
  Ga4AiReferrerRow,
  Ga4LandingRow,
} from "@nexpress/seo-core";

type TabKey = "gsc" | "ga4" | "bing" | "yandex";

export function SeoIntegrationsStudio({
  initialIntegrations,
  siteUrl,
}: {
  initialIntegrations?: SaveIntegrationsInput;
  siteUrl: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("gsc");
  const [config, setConfig] = useState<SaveIntegrationsInput>({
    gsc: {
      clientId: initialIntegrations?.gsc?.clientId ?? "",
      clientSecret: initialIntegrations?.gsc?.clientSecret ?? "",
      refreshToken: initialIntegrations?.gsc?.refreshToken ?? "",
      siteUrl: initialIntegrations?.gsc?.siteUrl || siteUrl,
      enabled: initialIntegrations?.gsc?.enabled ?? false,
    },
    ga4: {
      propertyId: initialIntegrations?.ga4?.propertyId ?? "",
      measurementId: initialIntegrations?.ga4?.measurementId ?? "",
      enabled: initialIntegrations?.ga4?.enabled ?? false,
    },
    bing: {
      apiKey: initialIntegrations?.bing?.apiKey ?? "",
      siteUrl: initialIntegrations?.bing?.siteUrl || siteUrl,
      enabled: initialIntegrations?.bing?.enabled ?? false,
    },
    yandex: {
      token: initialIntegrations?.yandex?.token ?? "",
      counterId: initialIntegrations?.yandex?.counterId ?? "",
      enabled: initialIntegrations?.yandex?.enabled ?? false,
    },
  });

  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // Live synced preview states
  const [gscData, setGscData] = useState<GscQueryRow[] | null>(null);
  const [ga4Data, setGa4Data] = useState<{ referrals: Ga4AiReferrerRow[]; landings: Ga4LandingRow[] } | null>(null);
  const [bingData, setBingData] = useState<BingQueryRow[] | null>(null);
  const [yandexData, setYandexData] = useState<YandexOrganicLandingRow[] | null>(null);

  const showFlash = (tone: "ok" | "err", text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const handleSave = () => {
    startSave(async () => {
      const res = await saveSeoIntegrationsAction(config);
      if (res.ok) {
        showFlash("ok", res.message || "Entegrasyon ayarları kaydedildi.");
      } else {
        showFlash("err", res.error);
      }
    });
  };

  const handleTestGsc = () => {
    startTest(async () => {
      const res = await syncGscAction({
        clientId: config.gsc?.clientId || "",
        clientSecret: config.gsc?.clientSecret || "",
        refreshToken: config.gsc?.refreshToken || "",
        siteUrl: config.gsc?.siteUrl || siteUrl,
      });
      if (!res.ok) {
        showFlash("err", res.error || "GSC bağlantısı kurulamadı.");
        return;
      }
      setGscData(res.data ?? []);
      showFlash("ok", res.message || "GSC verileri başarıyla çekildi.");
    });
  };

  const handleTestGa4 = () => {
    startTest(async () => {
      const res = await syncGa4Action({
        propertyId: config.ga4?.propertyId || "",
        accessToken: "", // demo fallback
      });
      if (!res.ok) {
        showFlash("err", res.error || "GA4 bağlantısı kurulamadı.");
        return;
      }
      setGa4Data(res.data ?? { referrals: [], landings: [] });
      showFlash("ok", res.message || "GA4 verileri başarıyla çekildi.");
    });
  };

  const handleTestBing = () => {
    startTest(async () => {
      const res = await syncBingAction({
        apiKey: config.bing?.apiKey || "",
        siteUrl: config.bing?.siteUrl || siteUrl,
      });
      if (!res.ok) {
        showFlash("err", res.error || "Bing API bağlantısı başarısız.");
        return;
      }
      setBingData(res.data ?? []);
      showFlash("ok", res.message || "Bing Webmaster verileri çekildi.");
    });
  };

  const handleTestYandex = () => {
    startTest(async () => {
      const res = await syncYandexAction({
        token: config.yandex?.token || "",
        counterId: config.yandex?.counterId || "",
      });
      if (!res.ok) {
        showFlash("err", res.error || "Yandex API bağlantısı başarısız.");
        return;
      }
      setYandexData(res.data ?? []);
      showFlash("ok", res.message || "Yandex Metrika verileri çekildi.");
    });
  };

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-nx-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-nx-fg">
              Arama Motoru & Analitik Entegrasyonları (API Hub)
            </h3>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
              Canlı Senkronizasyon
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            Google Search Console, Google Analytics 4, Bing Webmaster Tools ve Yandex Metrika API bağlantıları.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-nx-primary px-4 py-2 text-xs font-semibold text-nx-primary-fg shadow hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "💾 Entegrasyonları Kaydet"}
        </button>
      </div>

      {notice && (
        <div
          className={`rounded-lg px-3.5 py-2.5 text-xs font-medium border ${
            notice.tone === "ok"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* 4'lü Üst Sekme Menüsü */}
      <div className="flex flex-wrap gap-2 border-b border-nx-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("gsc")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "gsc"
              ? "bg-nx-primary text-nx-primary-fg"
              : "bg-nx-subtle text-nx-soft hover:text-nx-fg"
          }`}
        >
          Google Search Console
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ga4")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "ga4"
              ? "bg-nx-primary text-nx-primary-fg"
              : "bg-nx-subtle text-nx-soft hover:text-nx-fg"
          }`}
        >
          Google Analytics 4 (GA4)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bing")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "bing"
              ? "bg-nx-primary text-nx-primary-fg"
              : "bg-nx-subtle text-nx-soft hover:text-nx-fg"
          }`}
        >
          Bing Webmaster Tools
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("yandex")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "yandex"
              ? "bg-nx-primary text-nx-primary-fg"
              : "bg-nx-subtle text-nx-soft hover:text-nx-fg"
          }`}
        >
          Yandex Webmaster & Metrika
        </button>
      </div>

      {/* TAB 1: GOOGLE SEARCH CONSOLE */}
      {activeTab === "gsc" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.gsc?.enabled ?? false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    gsc: { ...config.gsc, enabled: e.target.checked },
                  })
                }
                className="rounded border-nx-line text-nx-primary focus:ring-nx-primary"
              />
              <span className="text-xs font-semibold text-nx-fg">Google Search Console API Entegrasyonunu Etkinleştir</span>
            </label>

            <button
              type="button"
              onClick={handleTestGsc}
              disabled={testing}
              className="rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs font-semibold text-nx-fg hover:bg-nx-line transition disabled:opacity-50"
            >
              {testing ? "Sorgulanıyor..." : "⚡ Bağlantıyı Test Et & Verileri Çek"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-nx-soft mb-1">OAuth Client ID</label>
              <input
                type="text"
                value={config.gsc?.clientId ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, gsc: { ...config.gsc, clientId: e.target.value } })
                }
                placeholder="Örn: 123456789-abc.apps.googleusercontent.com"
                className={`${fieldClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-nx-soft mb-1">OAuth Client Secret</label>
              <input
                type="password"
                value={config.gsc?.clientSecret ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, gsc: { ...config.gsc, clientSecret: e.target.value } })
                }
                placeholder="GOCSPX-..."
                className={`${fieldClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-nx-soft mb-1">OAuth Refresh Token</label>
              <input
                type="password"
                value={config.gsc?.refreshToken ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, gsc: { ...config.gsc, refreshToken: e.target.value } })
                }
                placeholder="1//04..."
                className={`${fieldClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-nx-soft mb-1">Search Console Mülk URL'si (Property)</label>
              <input
                type="text"
                value={config.gsc?.siteUrl ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, gsc: { ...config.gsc, siteUrl: e.target.value } })
                }
                placeholder="https://example.com/ veya sc-domain:example.com"
                className={`${fieldClass} font-mono`}
              />
            </div>
          </div>

          {gscData && (
            <div className="space-y-2 pt-2 border-t border-nx-line">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-nx-fg">Canlı GSC Arama Sorguları</span>
                <span className="text-nx-soft">{gscData.length} sorgu çekildi</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-nx-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-nx-subtle text-[11px] font-semibold text-nx-soft border-b border-nx-line">
                    <tr>
                      <th className="px-3 py-1.5">Sorgu</th>
                      <th className="px-3 py-1.5 text-right">Tıklama</th>
                      <th className="px-3 py-1.5 text-right">Gösterim</th>
                      <th className="px-3 py-1.5 text-right">TO (CTR)</th>
                      <th className="px-3 py-1.5 text-right">Sıralama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nx-line">
                    {gscData.map((row) => (
                      <tr key={row.query} className="hover:bg-nx-subtle/50">
                        <td className="px-3 py-1.5 font-medium text-nx-fg">{row.query}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{row.clicks}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-nx-soft">{row.impressions}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-emerald-600">%{row.ctr}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold">#{row.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GOOGLE ANALYTICS 4 (GA4) */}
      {activeTab === "ga4" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.ga4?.enabled ?? false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    ga4: { ...config.ga4, enabled: e.target.checked },
                  })
                }
                className="rounded border-nx-line text-nx-primary focus:ring-nx-primary"
              />
              <span className="text-xs font-semibold text-nx-fg">Google Analytics 4 Entegrasyonunu Etkinleştir</span>
            </label>

            <button
              type="button"
              onClick={handleTestGa4}
              disabled={testing}
              className="rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs font-semibold text-nx-fg hover:bg-nx-line transition disabled:opacity-50"
            >
              {testing ? "Sorgulanıyor..." : "⚡ AI Yönlendirmelerini & Girişleri Çek"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-nx-soft mb-1">GA4 Sayısal Mülk ID (Property ID)</label>
              <input
                type="text"
                value={config.ga4?.propertyId ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, ga4: { ...config.ga4, propertyId: e.target.value } })
                }
                placeholder="Örn: 348291048 (G- ID değil)"
                className={`${fieldClass} font-mono`}
              />
              <p className="mt-1 text-[10px] text-nx-soft">GA4 Yönetici → Mülk ayarları bölümündeki 9 haneli numara.</p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-nx-soft mb-1">Google Ölçüm Kimliği (Measurement ID)</label>
              <input
                type="text"
                value={config.ga4?.measurementId ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, ga4: { ...config.ga4, measurementId: e.target.value } })
                }
                placeholder="G-XXXXXXXXXX"
                className={`${fieldClass} font-mono`}
              />
              <p className="mt-1 text-[10px] text-nx-soft">Doldurulursa ziyaretçi sayfalarına gtag.js etiketi otomatik bağlanır.</p>
            </div>
          </div>

          {ga4Data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-nx-line">
              {/* AI Referrals */}
              <div className="rounded-lg border border-nx-line bg-nx-subtle p-3 space-y-2 text-xs">
                <span className="font-semibold text-nx-fg">🤖 GA4 AI Arama Yönlendirmeleri (Oturumlar)</span>
                <div className="space-y-1.5">
                  {ga4Data.referrals.map((r) => (
                    <div key={r.source} className="flex items-center justify-between rounded bg-nx-card px-2.5 py-1 border border-nx-line">
                      <span className="font-medium text-nx-fg">{r.label} ({r.source})</span>
                      <span className="font-mono text-emerald-600 font-bold">{r.sessions} oturum</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Organik Landing Sayfaları */}
              <div className="rounded-lg border border-nx-line bg-nx-subtle p-3 space-y-2 text-xs">
                <span className="font-semibold text-nx-fg">🎯 En Çok Ziyaret Alan Giriş Sayfaları</span>
                <div className="space-y-1.5">
                  {ga4Data.landings.slice(0, 5).map((l) => (
                    <div key={l.path} className="flex items-center justify-between rounded bg-nx-card px-2.5 py-1 border border-nx-line">
                      <span className="font-mono text-nx-fg truncate">{l.path}</span>
                      <span className="font-mono text-nx-soft">{l.sessions} oturum</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BING WEBMASTER TOOLS */}
      {activeTab === "bing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.bing?.enabled ?? false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bing: { ...config.bing, enabled: e.target.checked },
                  })
                }
                className="rounded border-nx-line text-nx-primary focus:ring-nx-primary"
              />
              <span className="text-xs font-semibold text-nx-fg">Bing Webmaster Tools API Entegrasyonunu Etkinleştir</span>
            </label>

            <button
              type="button"
              onClick={handleTestBing}
              disabled={testing}
              className="rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs font-semibold text-nx-fg hover:bg-nx-line transition disabled:opacity-50"
            >
              {testing ? "Sorgulanıyor..." : "⚡ Bing Sorgu İstatistiklerini Çek"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-nx-soft mb-1">Bing Webmaster API Anahtarı (API Key)</label>
              <input
                type="password"
                value={config.bing?.apiKey ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, bing: { ...config.bing, apiKey: e.target.value } })
                }
                placeholder="Bing Webmaster Portalından alınan API Key"
                className={`${fieldClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-nx-soft mb-1">Kayıtlı Site URL'si</label>
              <input
                type="text"
                value={config.bing?.siteUrl ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, bing: { ...config.bing, siteUrl: e.target.value } })
                }
                placeholder="https://example.com"
                className={`${fieldClass} font-mono`}
              />
            </div>
          </div>

          {bingData && (
            <div className="space-y-2 pt-2 border-t border-nx-line">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-nx-fg">Canlı Bing Arama Sorguları</span>
                <span className="text-nx-soft">{bingData.length} sorgu çekildi</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-nx-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-nx-subtle text-[11px] font-semibold text-nx-soft border-b border-nx-line">
                    <tr>
                      <th className="px-3 py-1.5">Bing Sorgusu</th>
                      <th className="px-3 py-1.5 text-right">Tıklama</th>
                      <th className="px-3 py-1.5 text-right">Gösterim</th>
                      <th className="px-3 py-1.5 text-right">Sıralama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nx-line">
                    {bingData.map((row) => (
                      <tr key={row.query} className="hover:bg-nx-subtle/50">
                        <td className="px-3 py-1.5 font-medium text-nx-fg">{row.query}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{row.clicks}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-nx-soft">{row.impressions}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold">#{row.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: YANDEX METRIKA & WEBMASTER */}
      {activeTab === "yandex" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.yandex?.enabled ?? false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    yandex: { ...config.yandex, enabled: e.target.checked },
                  })
                }
                className="rounded border-nx-line text-nx-primary focus:ring-nx-primary"
              />
              <span className="text-xs font-semibold text-nx-fg">Yandex Metrika & Webmaster Entegrasyonunu Etkinleştir</span>
            </label>

            <button
              type="button"
              onClick={handleTestYandex}
              disabled={testing}
              className="rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs font-semibold text-nx-fg hover:bg-nx-line transition disabled:opacity-50"
            >
              {testing ? "Sorgulanıyor..." : "⚡ Metrika Organik Girişleri Çek"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-nx-soft mb-1">Yandex OAuth Token</label>
              <input
                type="password"
                value={config.yandex?.token ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, yandex: { ...config.yandex, token: e.target.value } })
                }
                placeholder="y0_AgAAAAA..."
                className={`${fieldClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-nx-soft mb-1">Yandex Metrika Sayaç ID (Counter ID)</label>
              <input
                type="text"
                value={config.yandex?.counterId ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, yandex: { ...config.yandex, counterId: e.target.value } })
                }
                placeholder="Örn: 94821045"
                className={`${fieldClass} font-mono`}
              />
            </div>
          </div>

          {yandexData && (
            <div className="space-y-2 pt-2 border-t border-nx-line">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-nx-fg">Yandex Organik Arama Giriş Sayfaları</span>
                <span className="text-nx-soft">{yandexData.length} sayfa çekildi</span>
              </div>
              <div className="space-y-1.5">
                {yandexData.map((row) => (
                  <div key={row.path} className="flex items-center justify-between rounded bg-nx-subtle px-3 py-1.5 border border-nx-line text-xs">
                    <span className="font-mono text-nx-fg truncate">{row.path}</span>
                    <span className="font-mono font-bold text-emerald-600">{row.visits} organik ziyaret</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

