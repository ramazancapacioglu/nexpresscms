"use client";

import React, { useEffect, useMemo, useState } from "react";
import { runOps } from "./ops-client";

interface ClusterRow {
  id: string;
  label: string;
  members: string[];
  impressions: number;
  status: string;
  href: string;
}

/** Kayıtlı kelimelerden konu kümesi — arama, durum filtresi ve sıralama destekli. */
export function QuestionPoolCard() {
  const [rows, setRows] = useState<ClusterRow[] | null>(null);
  const [signals, setSignals] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "draft">("all");
  const [sort, setSort] = useState<"impressions" | "members">("impressions");

  const load = async () => {
    const res = await runOps("intel.clusters", {});
    if (!res.ok) {
      setError(res.error ?? "Havuz okunamadı.");
      setRows([]);
      return;
    }
    const data = res.data as { clusters?: ClusterRow[]; signals?: number } | undefined;
    setRows(data?.clusters ?? []);
    setSignals(data?.signals ?? 0);
    setError(null);
  };

  useEffect(() => {
    void load();
  }, []);

  const draft = async (row: ClusterRow) => {
    setBusy(row.id);
    const res = await runOps("intel.draft", { label: row.label, members: row.members });
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Taslak açılamadı.");
      return;
    }
    await load();
  };

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const list = rows.filter((r) => {
      if (filter === "open" && r.href) return false;
      if (filter === "draft" && !r.href) return false;
      if (q && !`${r.label} ${r.members.join(" ")}`.toLocaleLowerCase("tr-TR").includes(q)) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      sort === "members" ? b.members.length - a.members.length : b.impressions - a.impressions
    );
  }, [rows, query, filter, sort]);

  const maxImp = Math.max(1, ...filtered.map((r) => r.impressions));
  const draftCount = (rows ?? []).filter((r) => Boolean(r.href)).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-3">
        <div>
          <h4 className="text-[13px] font-semibold text-foreground">
            Sorgu Kümeleri & Konu Havuzu
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Kayıtlı GSC / Bing / Serper sorguları anlamsal örtüşmeye göre kümelenir; tek tıkla içerik taslağı açılır.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="rounded-md border border-border bg-background px-2 py-0.5 text-foreground">
            {signals.toLocaleString("tr-TR")} sorgu
          </span>
          <span className="rounded-md bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-700 dark:text-blue-300">
            {(rows ?? []).length} küme · {draftCount} taslak
          </span>
        </div>
      </div>

      {/* Filtre & Arama Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/50 p-0.5 text-[11px]">
          {(
            [
              { id: "all", label: `Tümü (${(rows ?? []).length})` },
              { id: "open", label: `Açık (${(rows ?? []).length - draftCount})` },
              { id: "draft", label: `Taslak (${draftCount})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                filter === t.id ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Küme veya kelime ara..."
            className="h-7 w-44 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
          />
          <select
            aria-label="Küme sıralaması"
            value={sort}
            onChange={(e) => setSort(e.target.value as "impressions" | "members")}
            className="h-7 rounded-lg border border-border bg-background px-2 text-[11px] text-foreground focus:border-blue-500 focus:outline-none"
          >
            <option value="impressions">Gösterim (Yüksek)</option>
            <option value="members">Sorgu Sayısı (Çok)</option>
          </select>
        </div>
      </div>

      {error && <p className="px-4 py-2 text-xs text-amber-700 dark:text-amber-300">{error}</p>}

      {rows === null ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">Küme havuzu yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
          {rows.length === 0
            ? "Henüz kayıt yok. Canlı Search Console, Bing, Yandex veya Serper sorgusu geldikçe burada kümelenir."
            : "Seçili filtreyle eşleşen küme bulunamadı."}
        </p>
      ) : (
        <div className="divide-y divide-border/60 text-[12px]">
          {filtered.slice(0, 20).map((row) => {
            const pct = Math.max(8, Math.round((row.impressions / maxImp) * 100));
            return (
              <div key={row.id} className="space-y-1.5 px-4 py-3 hover:bg-muted/20 transition">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-foreground">{row.label}</span>
                      <span className="rounded bg-muted px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                        {row.members.length} sorgu
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
                      {row.impressions.toLocaleString("tr-TR")}{" "}
                      <span className="font-normal text-muted-foreground">gösterim</span>
                    </span>
                    {row.href ? (
                      <a
                        href={row.href}
                        className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
                      >
                        Taslağı Aç →
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled={busy === row.id}
                        onClick={() => void draft(row)}
                        className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-blue-500 hover:text-blue-600 disabled:opacity-50"
                      >
                        {busy === row.id ? "Açılıyor..." : "+ Taslak Aç"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-blue-500/70" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex flex-wrap gap-1 pt-0.5">
                  {row.members.slice(0, 6).map((m) => (
                    <span
                      key={m}
                      className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {m}
                    </span>
                  ))}
                  {row.members.length > 6 ? (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{row.members.length - 6} daha
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
