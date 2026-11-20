"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, Copy, Loader2, ShieldCheck, X, XCircle } from "lucide-react";
import type { WebmasterVerification } from "@nexpress/core";
import type { GscPropertyEntry, WebmasterSource } from "@nexpress/seo-core";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";
import { saveSeoIntegrationsAction, type SaveIntegrationsInput } from "@/app/admin/seo/actions";
import { listGscPropertiesAction, testWebmasterConnectionAction } from "@/app/admin/seo/webmaster-actions";
import { ConnectGuide } from "@/components/admin/seo/connect-guide";
import { SOURCE_NAMES } from "./source-panel";

export interface SecretsSet {
  gscClientSecret: boolean;
  gscRefreshToken: boolean;
  bingApiKey: boolean;
  yandexToken: boolean;
}

const TABS: WebmasterSource[] = ["gsc", "ga4", "bing", "yandex"];
const label = "mb-1 block text-[11px] font-semibold text-nx-soft";

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-nx-fg">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-nx-line" />
      {children}
    </label>
  );
}

/**
 * Bağlantı bilgileri penceresi (yerel <dialog>: odak tuzağı, Esc ile kapanma, arka plan kilidi tarayıcıdan gelir).
 * Gizli alanlar (sır, jeton, API anahtarı) istemciye hiç gönderilmez: "kayıtlı" göstergesi vardır, yalnızca yeni değer yazılırsa değişir.
 */
export function ConnectionDialog({
  open,
  initialTab,
  onClose,
  onSaved,
  initial,
  initialVerification,
  secrets,
  siteUrl,
  siteHost,
  redirectUri,
  googleNotice,
}: {
  open: boolean;
  initialTab: WebmasterSource;
  onClose: () => void;
  onSaved: () => void;
  initial: SaveIntegrationsInput;
  initialVerification: WebmasterVerification;
  secrets: SecretsSet;
  siteUrl: string;
  siteHost: string;
  redirectUri: string;
  googleNotice: string | null;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const [tab, setTab] = useState<WebmasterSource>(initialTab);
  const [config, setConfig] = useState<SaveIntegrationsInput>(initial);
  const [verification, setVerification] = useState<WebmasterVerification>(initialVerification);
  const [secretSet, setSecretSet] = useState<SecretsSet>(secrets);
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [test, setTest] = useState<{ ok: boolean; steps: Array<{ label: string; ok: boolean; detail: string }>; hint?: string } | null>(null);
  const [properties, setProperties] = useState<GscPropertyEntry[] | null>(null);
  const [propError, setPropError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setTab(initialTab);
      setTest(null);
      setNotice(googleNotice ? { tone: googleNotice.startsWith("Google hesabı bağlandı") ? "ok" : "err", text: googleNotice } : null);
      dialog.showModal();
    } else if (!open && dialog.open) dialog.close();
  }, [open, initialTab, googleNotice]);

  const patchGsc = (p: NonNullable<SaveIntegrationsInput["gsc"]>) => setConfig((c) => ({ ...c, gsc: { ...c.gsc, ...p } }));
  const patchGa4 = (p: NonNullable<SaveIntegrationsInput["ga4"]>) => setConfig((c) => ({ ...c, ga4: { ...c.ga4, ...p } }));
  const patchBing = (p: NonNullable<SaveIntegrationsInput["bing"]>) => setConfig((c) => ({ ...c, bing: { ...c.bing, ...p } }));
  const patchYandex = (p: NonNullable<SaveIntegrationsInput["yandex"]>) => setConfig((c) => ({ ...c, yandex: { ...c.yandex, ...p } }));

  const save = (thenTest: boolean) =>
    startSave(async () => {
      setNotice(null);
      const res = await saveSeoIntegrationsAction({
        ...config,
        verification,
        keep: {
          gscClientSecret: secretSet.gscClientSecret && !config.gsc?.clientSecret,
          gscRefreshToken: secretSet.gscRefreshToken && !config.gsc?.refreshToken,
          bingApiKey: secretSet.bingApiKey && !config.bing?.apiKey,
          yandexToken: secretSet.yandexToken && !config.yandex?.token,
        },
      });
      if (!res.ok) {
        setNotice({ tone: "err", text: res.error });
        return;
      }
      setSecretSet((s) => ({
        gscClientSecret: s.gscClientSecret || Boolean(config.gsc?.clientSecret),
        gscRefreshToken: s.gscRefreshToken || Boolean(config.gsc?.refreshToken),
        bingApiKey: s.bingApiKey || Boolean(config.bing?.apiKey),
        yandexToken: s.yandexToken || Boolean(config.yandex?.token),
      }));
      // Yazılan gizli değerler istemcide tutulmaz
      setConfig((c) => ({ ...c, gsc: { ...c.gsc, clientSecret: "", refreshToken: "" }, bing: { ...c.bing, apiKey: "" }, yandex: { ...c.yandex, token: "" } }));
      setNotice({ tone: "ok", text: res.message ?? "Kaydedildi." });
      onSaved();
      if (thenTest) {
        setTest(null);
        startTest(async () => setTest(await testWebmasterConnectionAction({ source: tab })));
      }
    });

  const fetchProperties = () => {
    setPropError(null);
    startTest(async () => {
      const res = await listGscPropertiesAction();
      if (res.ok) setProperties(res.properties);
      else setPropError(`${res.error}${res.hint ? ` ${res.hint}` : ""}`);
    });
  };

  const googleConnected = secretSet.gscRefreshToken;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="wm-dialog-title"
      className="m-auto w-[min(56rem,calc(100vw-1.5rem))] max-w-none rounded-xl border border-nx-line bg-nx-card p-0 text-nx-fg shadow-2xl backdrop:bg-black/50"
    >
      <div className="flex max-h-[calc(100vh-3rem)] flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-nx-line px-5 py-3">
          <div>
            <h2 id="wm-dialog-title" className="text-sm font-semibold">Bağlantı bilgileri</h2>
            <p className="text-[11px] text-nx-soft">Arama motoru ve analitik hesaplarının anahtarları, site doğrulama ve bağlantı testi.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-md p-1.5 text-nx-soft hover:bg-nx-subtle hover:text-nx-fg">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div role="tablist" aria-label="Hizmetler" className="flex flex-wrap gap-1.5 border-b border-nx-line px-5 py-2">
          {TABS.map((id) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setTest(null); }} className={`rounded-full px-3 py-1 text-xs font-semibold ${tab === id ? "bg-nx-primary text-nx-primary-fg" : "bg-nx-subtle text-nx-soft hover:text-nx-fg"}`}>
              {SOURCE_NAMES[id]}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4" role="tabpanel">
          {notice ? (
            <div role="status" className={`rounded-lg border px-3 py-2 text-xs font-medium ${notice.tone === "ok" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "border-red-500/25 bg-red-500/10 text-red-800 dark:text-red-300"}`}>{notice.text}</div>
          ) : null}


          {tab === "gsc" || tab === "ga4" ? (
            <section className="rounded-lg border border-nx-line p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className={`h-4 w-4 ${googleConnected ? "text-emerald-600" : "text-nx-soft"}`} aria-hidden="true" />
                  Google hesabı: {googleConnected ? "bağlı (yenileme jetonu kayıtlı)" : "henüz bağlanmadı"}
                </p>
                <button type="button" onClick={() => void navigator.clipboard?.writeText(redirectUri)} className="inline-flex items-center gap-1 rounded-md border border-nx-line px-2 py-1 text-[11px] font-medium text-nx-soft hover:text-nx-fg">
                  <Copy className="h-3 w-3" aria-hidden="true" /> Yönlendirme adresini kopyala
                </button>
              </div>
              <p className="mt-1 text-[11px] text-nx-soft">Bu adres Google Cloud → Kimlik bilgileri → OAuth istemcisi → "Yetkili yönlendirme URI'leri" listesinde birebir bulunmalıdır. Aynı Google hesabı hem Search Console hem Analytics için kullanılır.</p>
            </section>
          ) : null}

          {tab === "gsc" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={label}>OAuth istemci kimliği</label>
                <input className={`${fieldClass} font-mono`} value={config.gsc?.clientId ?? ""} onChange={(e) => patchGsc({ clientId: e.target.value })} placeholder="123456789-abc.apps.googleusercontent.com" />
              </div>
              <div>
                <label className={label}>OAuth istemci sırrı {secretSet.gscClientSecret ? <span className="font-normal text-emerald-700 dark:text-emerald-400">· kayıtlı</span> : null}</label>
                <input type="password" autoComplete="new-password" className={`${fieldClass} font-mono`} value={config.gsc?.clientSecret ?? ""} onChange={(e) => patchGsc({ clientSecret: e.target.value })} placeholder={secretSet.gscClientSecret ? "Değiştirmek için yeni sırrı yazın" : "GOCSPX-…"} />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Search Console mülkü</label>
                <div className="flex flex-wrap gap-2">
                  <input className={`${fieldClass} min-w-64 flex-1 font-mono`} value={config.gsc?.siteUrl ?? ""} onChange={(e) => patchGsc({ siteUrl: e.target.value })} placeholder={`sc-domain:${siteHost || "alanadi.com"}  veya  ${siteUrl}/`} />
                  <button type="button" onClick={fetchProperties} disabled={testing || !googleConnected} title={googleConnected ? "" : "Önce Google hesabını bağlayın"} className="rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
                    Mülkleri getir
                  </button>
                </div>
                {propError ? <p className="mt-1 text-[11px] text-red-700 dark:text-red-300">{propError}</p> : null}
                {properties ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Hesaptaki mülkler">
                    {properties.length === 0 ? <li className="text-[11px] text-nx-soft">Bu hesapta Search Console mülkü yok.</li> : null}
                    {properties.map((p) => (
                      <li key={p.siteUrl}>
                        <button type="button" onClick={() => patchGsc({ siteUrl: p.siteUrl })} aria-pressed={config.gsc?.siteUrl === p.siteUrl} className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${config.gsc?.siteUrl === p.siteUrl ? "border-nx-primary bg-nx-primary/10" : "border-nx-line"}`}>
                          {p.siteUrl} <span className="text-nx-soft">· {p.permissionLevel === "siteOwner" ? "sahip" : p.permissionLevel === "siteFullUser" ? "tam kullanıcı" : p.permissionLevel === "siteRestrictedUser" ? "kısıtlı" : p.permissionLevel}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <Check checked={config.gsc?.enabled ?? false} onChange={(enabled) => patchGsc({ enabled })}>Arama sorgularını kelime havuzuna otomatik aktar (zamanlanmış eşitleme)</Check>
              </div>
              <details className="md:col-span-2 text-xs">
                <summary className="cursor-pointer text-[11px] font-semibold text-nx-soft">Yenileme jetonunu elle gir (gelişmiş)</summary>
                <input type="password" autoComplete="new-password" className={`${fieldClass} mt-2 font-mono`} value={config.gsc?.refreshToken ?? ""} onChange={(e) => patchGsc({ refreshToken: e.target.value })} placeholder={secretSet.gscRefreshToken ? "Kayıtlı. Değiştirmek için yeni jetonu yazın" : "1//04…"} />
              </details>
            </div>
          ) : null}

          {tab === "ga4" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={label}>Ölçüm kimliği (G-…) — sayfaya gtag etiketi basar</label>
                <input className={`${fieldClass} font-mono`} value={config.ga4?.measurementId ?? ""} onChange={(e) => patchGa4({ measurementId: e.target.value })} placeholder="G-XXXXXXXXXX" />
              </div>
              <div>
                <label className={label}>Sayısal mülk kimliği — raporlar için (G- değildir)</label>
                <input className={`${fieldClass} font-mono`} value={config.ga4?.propertyId ?? ""} onChange={(e) => patchGa4({ propertyId: e.target.value })} placeholder="402846992" />
              </div>
              <div className="md:col-span-2">
                <Check checked={config.ga4?.enabled ?? false} onChange={(enabled) => patchGa4({ enabled })}>Ölçüm etiketini ziyaretçi sayfalarına ekle</Check>
                <p className="mt-1 text-[11px] text-nx-soft">Raporlar için Google hesabı bağlantısı (Search Console sekmesi) ve Cloud'da "Google Analytics Data API" etkin olmalıdır.</p>
              </div>
            </div>
          ) : null}

          {tab === "bing" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={label}>API anahtarı {secretSet.bingApiKey ? <span className="font-normal text-emerald-700 dark:text-emerald-400">· kayıtlı</span> : null}</label>
                <input type="password" autoComplete="new-password" className={`${fieldClass} font-mono`} value={config.bing?.apiKey ?? ""} onChange={(e) => patchBing({ apiKey: e.target.value })} placeholder={secretSet.bingApiKey ? "Değiştirmek için yeni anahtarı yazın" : "Bing Webmaster → Ayarlar → API erişimi"} />
              </div>
              <div>
                <label className={label}>Bing'de kayıtlı site adresi</label>
                <input className={`${fieldClass} font-mono`} value={config.bing?.siteUrl ?? ""} onChange={(e) => patchBing({ siteUrl: e.target.value })} placeholder={`${siteUrl}/`} />
              </div>
              <div className="md:col-span-2">
                <Check checked={config.bing?.enabled ?? false} onChange={(enabled) => patchBing({ enabled })}>Bing sorgularını kelime havuzuna otomatik aktar</Check>
              </div>
            </div>
          ) : null}

          {tab === "yandex" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={label}>Metrika OAuth jetonu {secretSet.yandexToken ? <span className="font-normal text-emerald-700 dark:text-emerald-400">· kayıtlı</span> : null}</label>
                <input type="password" autoComplete="new-password" className={`${fieldClass} font-mono`} value={config.yandex?.token ?? ""} onChange={(e) => patchYandex({ token: e.target.value })} placeholder={secretSet.yandexToken ? "Değiştirmek için yeni jetonu yazın" : "y0_Ag… (metrika:read yetkili)"} />
              </div>
              <div>
                <label className={label}>Metrika sayaç numarası</label>
                <input className={`${fieldClass} font-mono`} value={config.yandex?.counterId ?? ""} onChange={(e) => patchYandex({ counterId: e.target.value })} placeholder="98684133" />
              </div>
              <div className="md:col-span-2">
                <Check checked={config.yandex?.enabled ?? false} onChange={(enabled) => patchYandex({ enabled })}>Metrika sayacını ziyaretçi sayfalarına ekle ve giriş sayfalarını aktar</Check>
              </div>
            </div>
          ) : null}

          <details open className="rounded-lg border border-nx-line p-3">
            <summary className="cursor-pointer text-xs font-semibold">Kurulum rehberi, site doğrulama ve Google bağlantısı</summary>
            <div className="mt-3">
              <ConnectGuide
                service={tab}
                domain={siteHost}
                verification={verification}
                onVerification={setVerification}
                gaPlacement={config.ga4?.placement === "body" ? "body" : "head"}
                metrikaPlacement={config.yandex?.placement === "body" ? "body" : "head"}
                onGaPlacement={(placement) => patchGa4({ placement })}
                onMetrikaPlacement={(placement) => patchYandex({ placement })}
                redirectUri={redirectUri}
          />
            </div>
          </details>

          {test ? (
            <section aria-live="polite" className={`rounded-lg border p-3 ${test.ok ? "border-emerald-500/25 bg-emerald-500/5" : "border-red-500/25 bg-red-500/5"}`}>
              <p className="mb-2 text-xs font-semibold">{test.ok ? "Bağlantı çalışıyor" : "Bağlantı kurulamadı"}</p>
              <ul className="space-y-1.5">
                {test.steps.map((s) => (
                  <li key={s.label} className="flex items-start gap-2 text-xs">
                    {s.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" aria-hidden="true" />}
                    <span><strong>{s.label}:</strong> {s.detail}</span>
                  </li>
                ))}
              </ul>
              {test.hint ? <p className="mt-2 text-xs font-medium">{test.hint}</p> : null}
            </section>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-nx-line px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-semibold text-nx-soft hover:text-nx-fg">Kapat</button>
          <button type="button" onClick={() => save(false)} disabled={saving || testing} className="rounded-lg border border-nx-line px-3 py-2 text-xs font-semibold hover:bg-nx-subtle disabled:opacity-60">
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <button type="button" onClick={() => save(true)} disabled={saving || testing} className="inline-flex items-center gap-1.5 rounded-lg bg-nx-primary px-3 py-2 text-xs font-semibold text-nx-primary-fg disabled:opacity-60">
            {testing || saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
            Kaydet ve bağlantıyı test et
          </button>
        </footer>
      </div>
    </dialog>
  );
}
