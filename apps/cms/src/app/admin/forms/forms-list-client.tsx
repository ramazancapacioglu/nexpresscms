"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";
import type { FormDefinitionStatus } from "@nexpress/database";
import { FormRowActions } from "./form-row-actions";
import { deleteFormAction, setFormStatusAction } from "./actions";

export interface FormListItem {
  id: string;
  name: string;
  status: FormDefinitionStatus;
  fieldCount: number;
  notifyOn: boolean;
  total: number;
  newCount: number;
  last30: number;
}

const STATUS_STYLE: Record<string, [string, string]> = {
  active: ["Aktif", "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"],
  paused: ["Duraklatıldı", "bg-amber-500/15 text-amber-800 dark:text-amber-300"],
  archived: ["Arşiv", "bg-muted text-muted-foreground"],
};

export function FormsListClient({
  forms,
  isAdmin,
}: {
  forms: FormListItem[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | FormDefinitionStatus>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "total" | "new" | "name">("default");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const list = forms.filter((f) => {
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (q && !`${f.name} ${f.id}`.toLocaleLowerCase("tr-TR").includes(q)) return false;
      return true;
    });
    if (sortBy === "total") return [...list].sort((a, b) => b.total - a.total);
    if (sortBy === "new") return [...list].sort((a, b) => b.newCount - a.newCount);
    if (sortBy === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name, "tr"));
    return list;
  }, [forms, statusFilter, query, sortBy]);

  const allSelected =
    filtered.length > 0 && filtered.every((f) => selectedIds.includes(f.id));

  const toggleAll = () => setSelectedIds(allSelected ? [] : filtered.map((f) => f.id));
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const bulkStatus = (status: FormDefinitionStatus) => {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      for (const id of selectedIds) {
        await setFormStatusAction({ id, status });
      }
      setSelectedIds([]);
      router.refresh();
    });
  };

  const bulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Seçilen ${selectedIds.length} form tanımı silinsin mi? Gönderimler korunur.`)) return;
    startTransition(async () => {
      for (const id of selectedIds) {
        await deleteFormAction({ id });
      }
      setSelectedIds([]);
      router.refresh();
    });
  };

  if (forms.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-[13px] font-medium text-foreground">Henüz form yok</p>
        <p className="mx-auto mt-1 max-w-[52ch] text-[12px] text-muted-foreground">
          İletişim, teklif, destek, anket gibi hazır şablonlardan başlayabilir veya boş formdan kurabilirsiniz.
        </p>
        <Link
          href="/admin/forms/new"
          className="mt-4 inline-flex h-8 items-center rounded-lg bg-blue-600 px-4 text-[12px] font-semibold text-white"
        >
          İlk formu oluştur
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filtre, Arama & Sıralama */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-card p-3 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex flex-wrap items-center gap-0.5 rounded-lg bg-muted/50 p-1 text-xs">
          {(
            [
              { id: "all", label: "Tümü", count: forms.length },
              { id: "active", label: "Aktif", count: forms.filter((f) => f.status === "active").length },
              { id: "paused", label: "Duraklatıldı", count: forms.filter((f) => f.status === "paused").length },
              { id: "archived", label: "Arşiv", count: forms.filter((f) => f.status === "archived").length },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatusFilter(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                statusFilter === t.id
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{t.label}</span>
              <span className="rounded bg-muted px-1.5 py-px font-mono text-[10px]">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Form adı veya kimlik ara..."
              className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            aria-label="Form sıralama"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "default" | "total" | "new" | "name")}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-blue-500 focus:outline-none"
          >
            <option value="default">Sırala: Varsayılan</option>
            <option value="total">Toplam Gönderim (Çoktan Aza)</option>
            <option value="new">Yeni Gönderim</option>
            <option value="name">Form Adı (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Toplu İşlem Çubuğu */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs">
          <span className="font-semibold text-blue-700 dark:text-blue-300">
            {selectedIds.length} form seçildi
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => bulkStatus("active")}
              className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Etkinleştir
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => bulkStatus("paused")}
              className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              Duraklat
            </button>
            {isAdmin && (
              <button
                type="button"
                disabled={isPending}
                onClick={bulkDelete}
                className="rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Seçilenleri Sil
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
        <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 px-4 py-2 text-[11px] font-medium text-muted-foreground">
          <input
            type="checkbox"
            aria-label="Tüm formları seç"
            checked={allSelected}
            onChange={toggleAll}
            className="rounded border-border"
          />
          <span>
            {filtered.length} / {forms.length} form listeleniyor
          </span>
        </div>
        <ul className="divide-y divide-border/60">
          {filtered.length === 0 ? (
            <li className="px-4 py-10 text-center text-xs text-muted-foreground">
              Filtreye uyan form bulunamadı.
            </li>
          ) : (
            filtered.map((f) => {
              const [label, cls] = STATUS_STYLE[f.status] ?? STATUS_STYLE.active!;
              const checked = selectedIds.includes(f.id);
              return (
                <li
                  key={f.id}
                  className={`flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-[12px] transition ${
                    checked ? "bg-blue-500/5" : "hover:bg-muted/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    aria-label={`${f.name} seç`}
                    checked={checked}
                    onChange={() => toggleOne(f.id)}
                    className="rounded border-border"
                  />
                  <div className="min-w-0 flex-1 basis-52">
                    <Link
                      href={`/admin/forms/${f.id}`}
                      className="block truncate text-[13px] font-semibold text-foreground hover:text-blue-600"
                    >
                      {f.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {f.fieldCount} alan · {f.notifyOn ? "bildirim açık" : "bildirim kapalı"} ·{" "}
                      <span className="font-mono">{f.id}</span>
                    </p>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
                    {label}
                  </span>
                  <dl className="flex gap-5 text-muted-foreground">
                    <div>
                      <dt className="text-[10px]">Toplam</dt>
                      <dd className="font-mono font-semibold text-foreground">{f.total}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px]">Yeni</dt>
                      <dd className="font-mono font-semibold text-foreground">{f.newCount}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px]">Son 30g</dt>
                      <dd className="font-mono font-semibold text-foreground">{f.last30}</dd>
                    </div>
                  </dl>
                  <FormRowActions id={f.id} status={f.status} isAdmin={isAdmin} />
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
