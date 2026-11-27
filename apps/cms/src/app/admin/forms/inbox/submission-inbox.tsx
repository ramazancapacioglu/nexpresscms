"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormStatus } from "@nexpress/database";
import {
  Archive,
  Download,
  Eye,
  Mail,
  MailCheck,
  MailOpen,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { deleteSubmissionsAction, setSubmissionStatusAction } from "../actions";
import { STATUS_META, SubmissionDrawer, type InboxSubmissionItem } from "./submission-drawer";

interface FormOption {
  id: string;
  name: string;
}

interface SubmissionInboxProps {
  initialItems: InboxSubmissionItem[];
  forms: FormOption[];
  initialFormId?: string;
  initialStatus?: FormStatus | "all";
  isAdmin: boolean;
}

const PAGE_SIZE = 25;
const border = "border-[#E6E7EA] dark:border-[#23262E]";
const ctrl = `h-8 rounded-md border ${border} bg-white dark:bg-[#15171C] px-2.5 text-[12px] text-[#14151A] dark:text-[#F3F4F6] outline-none focus:border-blue-600`;

function pickContactHint(fields: InboxSubmissionItem["fields"]): string {
  for (const f of fields) {
    const k = `${f.name} ${f.label}`.toLowerCase();
    if (/mail|eposta|e-posta|tel|phone|gsm/.test(k) && f.value.trim()) return f.value.trim();
  }
  return fields[1]?.value?.trim() || "";
}

function pickMessagePreview(fields: InboxSubmissionItem["fields"]): string {
  const vals = fields.map((f) => f.value.trim()).filter(Boolean);
  if (vals.length <= 1) return "";
  return vals.slice(1).join(" · ").slice(0, 110);
}

export function SubmissionInbox({
  initialItems,
  forms,
  initialFormId = "all",
  initialStatus = "all",
  isAdmin,
}: SubmissionInboxProps) {
  const router = useRouter();
  const [items, setItems] = useState<InboxSubmissionItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState<string>(initialFormId || "all");
  const [statusFilter, setStatusFilter] = useState<FormStatus | "all">(initialStatus || "all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7d" | "30d">("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Form seçeneklerine mevcut gönderimlerden gelen (arşivlenmiş/silinmiş tanım dahil) formları da ekle
  const formOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of forms) map.set(f.id, f.name);
    for (const it of items) {
      if (it.formId && !map.has(it.formId)) map.set(it.formId, it.formTitle || it.formId);
    }
    const countsByForm = new Map<string, number>();
    for (const it of items) {
      if (it.formId) countsByForm.set(it.formId, (countsByForm.get(it.formId) ?? 0) + 1);
    }
    return [...map.entries()].map(([id, name]) => ({
      id,
      name,
      count: countsByForm.get(id) ?? 0,
    }));
  }, [forms, items]);

  const statusCounts = useMemo(() => {
    const c = { all: 0, new: 0, read: 0, archived: 0, spam: 0 };
    for (const it of items) {
      if (formFilter !== "all" && it.formId !== formFilter) continue;
      c.all += 1;
      if (it.status in c) c[it.status] += 1;
    }
    return c;
  }, [items, formFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const cutoff =
      dateFilter === "today"
        ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
        : dateFilter === "7d"
          ? now - 7 * 86_400_000
          : dateFilter === "30d"
            ? now - 30 * 86_400_000
            : 0;

    return items.filter((it) => {
      if (formFilter !== "all" && it.formId !== formFilter) return false;
      if (statusFilter !== "all" && it.status !== statusFilter) return false;
      if (cutoff > 0 && new Date(it.createdAt).getTime() < cutoff) return false;
      if (q) {
        const hay = `${it.formTitle} ${it.pagePath} ${it.fields.map((f) => `${f.label} ${f.value}`).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, formFilter, statusFilter, dateFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const visibleIds = pageItems.map((i) => i.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const applyStatus = (ids: string[], nextStatus: FormStatus, silent = false) => {
    if (ids.length === 0) return;
    startTransition(async () => {
      const res = await setSubmissionStatusAction({ ids, status: nextStatus });
      if (res.ok) {
        setItems((prev) => prev.map((it) => (ids.includes(it.id) ? { ...it, status: nextStatus } : it)));
        setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        if (!silent) {
          setNotice({ ok: true, text: `${ids.length} gönderim "${STATUS_META[nextStatus].label}" olarak güncellendi.` });
        }
        router.refresh();
      } else if (!silent) {
        setNotice({ ok: false, text: "Durum güncellenemedi." });
      }
    });
  };

  const applyDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    if (!window.confirm(`${ids.length} gönderim KALICI olarak silinsin mi? Bu işlem geri alınamaz.`)) return;
    startTransition(async () => {
      const res = await deleteSubmissionsAction({ ids });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => !ids.includes(it.id)));
        setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        if (activeId && ids.includes(activeId)) setActiveId(null);
        setNotice({ ok: true, text: `${res.affected} gönderim kalıcı olarak silindi.` });
        router.refresh();
      } else {
        setNotice({ ok: false, text: "Silme işlemi başarısız oldu." });
      }
    });
  };

  const openDrawer = (item: InboxSubmissionItem) => {
    setActiveId(item.id);
    if (item.status === "new") {
      applyStatus([item.id], "read", true);
    }
  };

  const activeIndex = activeId ? filtered.findIndex((x) => x.id === activeId) : -1;
  const activeItem = activeIndex >= 0 ? filtered[activeIndex]! : items.find((x) => x.id === activeId) ?? null;

  const hasFilters = search.trim() !== "" || formFilter !== "all" || statusFilter !== "all" || dateFilter !== "all";
  const exportHref = `/api/admin/forms/export?status=${statusFilter === "all" ? "new" : statusFilter}${
    formFilter !== "all" ? `&form=${encodeURIComponent(formFilter)}` : ""
  }`;

  return (
    <div className="space-y-3.5">
      {/* Tek Satır Birleşik Filtreleme Çubuğu */}
      <div className={`flex flex-wrap items-center gap-2 rounded-xl border ${border} bg-white dark:bg-[#15171C] p-2.5 shadow-2xs`}>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#5F6570] dark:text-[#8C9099]" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Ad, e-posta, telefon, mesaj veya sayfa ara…"
            aria-label="Gönderimlerde ara"
            className={`${ctrl} w-full pl-8`}
          />
        </div>

        <select
          aria-label="Form seçimi"
          value={formFilter}
          onChange={(e) => {
            setFormFilter(e.target.value);
            setPage(1);
            setSelectedIds([]);
          }}
          className={`${ctrl} max-w-[220px]`}
        >
          <option value="all">Tüm Formlar ({items.length})</option>
          {formOptions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.count})
            </option>
          ))}
        </select>

        <select
          aria-label="Durum filtresi"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as FormStatus | "all");
            setPage(1);
            setSelectedIds([]);
          }}
          className={ctrl}
        >
          <option value="all">Tüm Durumlar ({statusCounts.all})</option>
          <option value="new">Yeni ({statusCounts.new})</option>
          <option value="read">Okundu ({statusCounts.read})</option>
          <option value="archived">Arşiv ({statusCounts.archived})</option>
          <option value="spam">Spam ({statusCounts.spam})</option>
        </select>

        <select
          aria-label="Tarih aralığı"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value as "all" | "today" | "7d" | "30d");
            setPage(1);
          }}
          className={ctrl}
        >
          <option value="all">Tüm Tarihler</option>
          <option value="today">Bugün</option>
          <option value="7d">Son 7 Gün</option>
          <option value="30d">Son 30 Gün</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFormFilter("all");
              setStatusFilter("all");
              setDateFilter("all");
              setPage(1);
            }}
            className={`inline-flex h-8 items-center gap-1 rounded-md border ${border} px-2.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground`}
          >
            <RotateCcw className="h-3 w-3" /> Sıfırla
          </button>
        )}

        {isAdmin && (
          <a
            href={exportHref}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border ${border} bg-[#FAFAFB] dark:bg-[#1A1C22] px-2.5 text-[12px] font-medium hover:bg-muted`}
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
        )}
      </div>

      {/* Bildirim */}
      {notice && (
        <div
          role={notice.ok ? "status" : "alert"}
          className={`flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2 text-[12px] font-medium ${
            notice.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-[11px] opacity-70 hover:opacity-100">
            Kapat
          </button>
        </div>
      )}

      {/* Toplu İşlem Çubuğu */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-[12px]">
          <span className="font-semibold text-blue-700 dark:text-blue-300">
            {selectedIds.length} gönderim seçildi
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={pending}
              onClick={() => applyStatus(selectedIds, "read")}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-[11px] font-semibold hover:bg-muted disabled:opacity-50"
            >
              <MailCheck className="h-3.5 w-3.5 text-emerald-600" /> Okundu
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => applyStatus(selectedIds, "new")}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-[11px] font-semibold hover:bg-muted disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5 text-blue-600" /> Yeni
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => applyStatus(selectedIds, "archived")}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-[11px] font-semibold hover:bg-muted disabled:opacity-50"
            >
              <Archive className="h-3.5 w-3.5" /> Arşivle
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => applyStatus(selectedIds, "spam")}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-[11px] font-semibold hover:bg-muted disabled:opacity-50"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Spam
            </button>
            {isAdmin && (
              <button
                type="button"
                disabled={pending}
                onClick={() => applyDelete(selectedIds)}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-rose-600 px-2.5 text-[11px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Seçilenleri Sil
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="ml-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* Gönderim Tablosu */}
      {filtered.length === 0 ? (
        <div className={`rounded-xl border ${border} bg-white dark:bg-[#15171C] px-6 py-14 text-center`}>
          <MailOpen className="mx-auto h-8 w-8 text-muted-foreground/45" />
          <p className="mt-3 text-[13px] font-medium text-foreground">
            {hasFilters ? "Filtrelere uygun gönderim bulunamadı" : "Henüz form gönderimi yok"}
          </p>
          <p className="mx-auto mt-1 max-w-[52ch] text-[12px] text-muted-foreground">
            {hasFilters
              ? "Arama veya filtre seçimlerini sıfırlayarak tüm kayıtları görebilirsiniz."
              : "Sayfalarınızdaki formlardan gelen tüm talepler burada listelenir."}
          </p>
        </div>
      ) : (
        <div className={`overflow-hidden rounded-xl border ${border} bg-white dark:bg-[#15171C] shadow-2xs`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className={`border-b ${border} bg-[#FAFAFB] dark:bg-[#181A20] text-[10px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]`}>
                <tr>
                  <th className="w-9 px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Bu sayfadaki tüm gönderimleri seç"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="w-24 px-3 py-2.5">Durum</th>
                  <th className="px-3 py-2.5">Gönderen &amp; Özet</th>
                  <th className="hidden px-3 py-2.5 md:table-cell">Form</th>
                  <th className="hidden px-3 py-2.5 lg:table-cell">Kaynak Sayfa</th>
                  <th className="w-36 px-3 py-2.5 text-right">Tarih</th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E7EA] dark:divide-[#23262E]">
                {pageItems.map((it) => {
                  const st = STATUS_META[it.status] ?? STATUS_META.new;
                  const checked = selectedIds.includes(it.id);
                  const isNew = it.status === "new";
                  const primary = it.fields[0]?.value?.trim() || "(İsimsiz)";
                  const contact = pickContactHint(it.fields);
                  const preview = pickMessagePreview(it.fields);

                  return (
                    <tr
                      key={it.id}
                      onClick={() => openDrawer(it)}
                      className={`cursor-pointer transition hover:bg-[#F7F9FC] dark:hover:bg-[#1B1E26] ${
                        activeId === it.id ? "bg-blue-500/[0.06]" : isNew ? "bg-blue-500/[0.02]" : ""
                      }`}
                    >
                      <td
                        className="px-3 py-2.5"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <input
                          type="checkbox"
                          aria-label={`${primary} kaydını seç`}
                          checked={checked}
                          onChange={() => toggleOne(it.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${st.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="max-w-[360px] px-3 py-2.5">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className={`truncate text-[#14151A] dark:text-[#F3F4F6] ${isNew ? "font-bold" : "font-medium"}`}>
                            {primary}
                          </span>
                          {contact && contact !== primary ? (
                            <span className="truncate text-[11px] text-[#5F6570] dark:text-[#9CA3AF]">
                              {contact}
                            </span>
                          ) : null}
                        </div>
                        {preview ? (
                          <p className="mt-0.5 truncate text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                            {preview}
                          </p>
                        ) : null}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2.5 md:table-cell">
                        <span className="inline-block max-w-[170px] truncate rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-[#F7F8FA] dark:bg-[#1C1E24] px-2 py-0.5 text-[11px] font-medium text-[#4B505A] dark:text-[#B4B9C5]">
                          {it.formTitle || "Form"}
                        </span>
                      </td>
                      <td className="hidden max-w-[180px] truncate px-3 py-2.5 font-mono text-[11px] text-[#5F6570] dark:text-[#8C9099] lg:table-cell">
                        {it.pagePath}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                        {new Date(it.createdAt).toLocaleString("tr-TR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                          <Eye className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Alt Durum & Sayfalama Çubuğu */}
          <div className={`flex flex-wrap items-center justify-between gap-2 border-t ${border} bg-[#FAFAFB] dark:bg-[#181A20] px-4 py-2 text-[11px] text-[#5F6570] dark:text-[#8C9099]`}>
            <span>
              Toplam <strong className="text-foreground">{filtered.length}</strong> gönderim
              {filtered.length !== items.length ? ` (${items.length} kayıttan filtrelendi)` : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`h-7 rounded border ${border} bg-white dark:bg-[#15171C] px-2 font-medium disabled:opacity-40`}
                >
                  ← Önceki
                </button>
                <span className="px-1">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`h-7 rounded border ${border} bg-white dark:bg-[#15171C] px-2 font-medium disabled:opacity-40`}
                >
                  Sonraki →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detay Çekmecesi */}
      <SubmissionDrawer
        item={activeItem}
        hasPrev={activeIndex > 0}
        hasNext={activeIndex >= 0 && activeIndex < filtered.length - 1}
        pending={pending}
        isAdmin={isAdmin}
        onClose={() => setActiveId(null)}
        onPrev={() => activeIndex > 0 && openDrawer(filtered[activeIndex - 1]!)}
        onNext={() => activeIndex >= 0 && activeIndex < filtered.length - 1 && openDrawer(filtered[activeIndex + 1]!)}
        onSetStatus={(id, st) => applyStatus([id], st)}
        onDelete={(id) => applyDelete([id])}
      />
    </div>
  );
}
