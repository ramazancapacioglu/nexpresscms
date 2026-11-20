"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleDashed, KeyRound, LayoutDashboard } from "lucide-react";
import type { WebmasterVerification } from "@nexpress/core";
import type { WebmasterSource } from "@nexpress/seo-core";
import type { SaveIntegrationsInput } from "@/app/admin/seo/actions";
import type { ConnectionStatus } from "@/lib/webmaster/connection";
import { Sparkline } from "./charts";
import { ConnectionDialog, type SecretsSet } from "./connection-dialog";
import { formatValue } from "./format";
import { SOURCE_NAMES, SourcePanel, useReport } from "./source-panel";
import { VizTheme } from "./viz-theme";

type Tab = "overview" | WebmasterSource;
const SOURCES: WebmasterSource[] = ["gsc", "ga4", "bing", "yandex"];
const BLURB: Record<WebmasterSource, string> = {
  gsc: "Google aramasında tıklama, gösterim, sorgu, dizin durumu",
  ga4: "Ziyaretçi, kanal, sayfa ve yapay zekâ kaynaklı trafik",
  bing: "Bing ve Copilot aramasında görünürlük, tarama durumu",
  yandex: "Yandex kaynaklı ziyaret ve giriş sayfaları",
};

function StatusChip({ status, error }: { status: ConnectionStatus; error?: boolean }) {
  if (error) return <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--v-bad)" }}><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Hata</span>;
  return status.configured ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--v-good)" }}><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Bağlı</span>
  ) : (
    <span className="v-ink2 inline-flex items-center gap-1 text-[11px] font-medium"><CircleDashed className="h-3.5 w-3.5" aria-hidden="true" /> Bağlı değil</span>
  );
}

function OverviewCard({ source, status, days, onOpen, onConnect }: { source: WebmasterSource; status: ConnectionStatus; days: number; onOpen: () => void; onConnect: () => void }) {
  const { state } = useReport(source, "overview", days, status.configured);
  const report = state.report;
  const kpis = report?.kpis.slice(0, 2) ?? [];
  const spark = report?.timeline?.series[0];
  return (
    <article className="v-card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="v-ink text-[13px] font-semibold">{SOURCE_NAMES[source]}</h3>
          <p className="v-ink2 text-[11px]">{BLURB[source]}</p>
        </div>
        <StatusChip status={status} error={state.status === "error" && status.configured} />
      </div>
      {!status.configured ? (
        <div className="space-y-2">
          <p className="v-ink2 text-[12px]">Eksik: {status.missing.join(", ")}.</p>
          <button type="button" onClick={onConnect} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium v-ink hover:bg-[var(--v-wash)]" style={{ borderColor: "var(--v-ring)" }}>
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" /> Bağlantıyı tamamla
          </button>
        </div>
      ) : state.status === "error" ? (
        <div className="space-y-1">
          <p className="v-ink text-[12px]">{state.error?.message}</p>
          {state.error?.hint ? <p className="v-ink2 text-[11px]">{state.error.hint}</p> : null}
          <button type="button" onClick={onConnect} className="v-ink text-[12px] font-medium underline underline-offset-2">Bağlantı bilgilerini aç</button>
        </div>
      ) : kpis.length > 0 ? (
        <div className="flex items-end justify-between gap-3">
          <div className="flex gap-5">
            {kpis.map((k) => (
              <div key={k.key}>
                <div className="v-ink2 text-[11px]">{k.label}</div>
                <div className="v-ink text-[22px] font-semibold leading-tight tabular-nums">{formatValue(k.value, k.format)}</div>
              </div>
            ))}
          </div>
          {spark ? <Sparkline values={spark.values} /> : null}
        </div>
      ) : (
        <div className="v-skel h-[52px]" aria-busy="true" />
      )}
      <button type="button" onClick={onOpen} disabled={!status.configured} className="v-ink2 mt-auto self-start text-[12px] font-medium underline underline-offset-2 disabled:no-underline disabled:opacity-50">
        Tüm raporları aç →
      </button>
    </article>
  );
}

export function WebmasterDashboard({
  initial,
  initialVerification,
  secrets,
  statuses,
  siteUrl,
  siteHost,
  redirectUri,
  googleNotice,
  openDialog,
}: {
  initial: SaveIntegrationsInput;
  initialVerification: WebmasterVerification;
  secrets: SecretsSet;
  statuses: Record<WebmasterSource, ConnectionStatus>;
  siteUrl: string;
  siteHost: string;
  redirectUri: string;
  googleNotice: string | null;
  openDialog: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [days, setDays] = useState(28);
  // Bağlantı kaydedilince raporlar sıfırdan yüklensin (eski hata/önbellek kalmasın)
  const [version, setVersion] = useState(0);
  const [dialog, setDialog] = useState<{ open: boolean; tab: WebmasterSource }>({ open: openDialog, tab: "gsc" });
  const connected = SOURCES.filter((s) => statuses[s].configured).length;
  const connect = (tab: WebmasterSource) => setDialog({ open: true, tab });

  return (
    <div className="nx-viz space-y-4">
      <VizTheme />
      <header className="v-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h1 className="v-ink text-lg font-semibold">Webmaster Merkezi</h1>
          <p className="v-ink2 text-[12px]">Google, Bing ve Yandex'in sitenizle ilgili gerçek verileri: {connected}/4 kaynak bağlı. Anahtarlar sunucuda saklanır, tarayıcıya gönderilmez.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Tarih aralığı" className="inline-flex overflow-hidden rounded-md border" style={{ borderColor: "var(--v-ring)" }}>
            {[7, 28, 90].map((d) => (
              <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-[12px] font-medium ${days === d ? "bg-nx-primary text-nx-primary-fg" : "v-ink2 hover:bg-[var(--v-wash)]"}`}>
                Son {d} gün
              </button>
            ))}
          </div>
          <button type="button" onClick={() => connect(tab === "overview" ? "gsc" : tab)} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-semibold v-ink hover:bg-[var(--v-wash)]" style={{ borderColor: "var(--v-ring)" }}>
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" /> Bağlantı bilgileri
          </button>
        </div>
      </header>

      {googleNotice && !dialog.open ? (
        <p role="status" className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-900 dark:text-sky-200">{googleNotice}</p>
      ) : null}

      <nav aria-label="Webmaster bölümleri" className="flex flex-wrap gap-2">
        {(["overview", ...SOURCES] as Tab[]).map((id) => (
          <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition ${tab === id ? "bg-nx-primary text-nx-primary-fg shadow-sm" : "bg-nx-subtle text-nx-soft hover:text-nx-fg"}`}>
            {id === "overview" ? <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" /> : <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${statuses[id].configured ? "bg-emerald-500" : "bg-nx-soft/40"}`} />}
            {id === "overview" ? "Genel bakış" : SOURCE_NAMES[id]}
            {id !== "overview" ? <span className="sr-only">{statuses[id].configured ? "(bağlı)" : "(bağlı değil)"}</span> : null}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {SOURCES.map((s) => (
            <OverviewCard key={`${s}-${version}`} source={s} status={statuses[s]} days={days} onOpen={() => setTab(s)} onConnect={() => connect(s)} />
          ))}
        </div>
      ) : (
        <SourcePanel key={`${tab}-${version}`} source={tab} days={days} origin={siteUrl} onOpenConnection={connect} />
      )}

      <ConnectionDialog
        open={dialog.open}
        initialTab={dialog.tab}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSaved={() => { setVersion((v) => v + 1); router.refresh(); }}
        initial={initial}
        initialVerification={initialVerification}
        secrets={secrets}
        siteUrl={siteUrl}
        siteHost={siteHost}
        redirectUri={redirectUri}
        googleNotice={googleNotice}
      />
    </div>
  );
}
