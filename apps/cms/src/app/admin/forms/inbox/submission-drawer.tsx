"use client";

import React, { useEffect, useState } from "react";
import type { FormStatus } from "@nexpress/database";
import {
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Mail,
  MailCheck,
  Phone,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

export interface InboxSubmissionItem {
  id: string;
  formId: string;
  formTitle: string;
  pagePath: string;
  status: FormStatus;
  fields: Array<{ name: string; label: string; value: string }>;
  createdAt: string;
  notifyStatus: string;
  notifyError: string;
}

export const STATUS_META: Record<
  FormStatus,
  { label: string; badge: string; dot: string }
> = {
  new: {
    label: "Yeni",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
    dot: "bg-blue-600",
  },
  read: {
    label: "Okundu",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    dot: "bg-emerald-500",
  },
  archived: {
    label: "Arşiv",
    badge: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25",
    dot: "bg-zinc-400",
  },
  spam: {
    label: "Spam",
    badge: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25",
    dot: "bg-amber-500",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s().-]{7,18}$/;

function isWideField(f: { name: string; label: string; value: string }): boolean {
  const key = `${f.name} ${f.label}`.toLowerCase();
  if (/mesaj|message|not|note|açıklama|aciklama|detay|adres|address|konu|talep/.test(key)) {
    return f.value.length > 36 || f.value.includes("\n");
  }
  return f.value.length > 56 || f.value.includes("\n");
}

interface SubmissionDrawerProps {
  item: InboxSubmissionItem | null;
  hasPrev: boolean;
  hasNext: boolean;
  pending: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSetStatus: (id: string, status: FormStatus) => void;
  onDelete: (id: string) => void;
}

/**
 * Form gönderim detayı çekmecesi:
 * Yatayda yan yana sığabilen kısa alanlar 2 sütunlu kompakt tablo/ızgarada,
 * uzun metin/mesaj alanları tam genişlikte gösterilir.
 */
export function SubmissionDrawer({
  item,
  hasPrev,
  hasNext,
  pending,
  isAdmin,
  onClose,
  onPrev,
  onNext,
  onSetStatus,
  onDelete,
}: SubmissionDrawerProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, hasPrev, hasNext, onClose, onPrev, onNext]);

  if (!item) return null;

  const meta = STATUS_META[item.status] ?? STATUS_META.new;
  const senderTitle = item.fields[0]?.value?.trim() || "(İsimsiz gönderim)";
  const dateText = new Date(item.createdAt).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const copyValue = (key: string, val: string) => {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 1400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Form gönderim detayı"
    >
      {/* Arka plan karartma */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Sağ çekmece */}
      <aside className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] shadow-2xl">
        {/* Üst Başlık */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E6E7EA] dark:border-[#23262E] px-5 py-3.5">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              {item.formTitle ? (
                <span className="rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-[#F7F8FA] dark:bg-[#1C1E24] px-2 py-0.5 text-[11px] font-medium text-[#5F6570] dark:text-[#A1A6B3]">
                  {item.formTitle}
                </span>
              ) : null}
              <span className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{dateText}</span>
            </div>
            <h2 className="truncate text-[15px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">
              {senderTitle}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onPrev}
              title="Önceki gönderim (←)"
              aria-label="Önceki gönderim"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#E6E7EA] dark:border-[#23262E] text-muted-foreground hover:bg-muted disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={onNext}
              title="Sonraki gönderim (→)"
              aria-label="Sonraki gönderim"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#E6E7EA] dark:border-[#23262E] text-muted-foreground hover:bg-muted disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Kapat (Esc)"
              aria-label="Kapat"
              className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#E6E7EA] dark:border-[#23262E] text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Kompakt Meta Şeridi */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FAFAFB] dark:bg-[#121317] px-5 py-2 text-[11px] text-[#5F6570] dark:text-[#8C9099]">
          <span className="inline-flex items-center gap-1">
            Kaynak:
            <a
              href={item.pagePath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-foreground hover:underline"
            >
              {item.pagePath}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </span>
          {item.notifyStatus && item.notifyStatus !== "skipped" ? (
            <span
              className={
                item.notifyStatus === "failed"
                  ? "font-medium text-red-600 dark:text-red-400"
                  : "text-emerald-700 dark:text-emerald-400"
              }
            >
              E-posta bildirimi:{" "}
              {item.notifyStatus === "sent"
                ? "Gönderildi"
                : `Hata${item.notifyError ? ` (${item.notifyError})` : ""}`}
            </span>
          ) : null}
        </div>

        {/* Form Alanları — 2 Sütunlu Kompakt Tablo Düzeni */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="overflow-hidden rounded-xl border border-[#E6E7EA] dark:border-[#23262E]">
            <div className="grid grid-cols-1 divide-y divide-[#E6E7EA] dark:divide-[#23262E] sm:grid-cols-2 sm:divide-y-0">
              {item.fields.map((f, idx) => {
                const wide = isWideField(f);
                const val = f.value?.trim() || "—";
                const isEmail = EMAIL_RE.test(val);
                const isPhone = !isEmail && PHONE_RE.test(val);
                const copyId = `${item.id}-${idx}`;

                return (
                  <div
                    key={`${f.name}-${idx}`}
                    className={`group flex flex-col justify-between gap-1 border-b border-[#E6E7EA] dark:border-[#23262E] p-3 text-[12px] ${
                      wide
                        ? "sm:col-span-2 bg-[#FAFAFB]/70 dark:bg-[#181A20]/60"
                        : "sm:odd:border-r sm:odd:border-[#E6E7EA] dark:sm:odd:border-[#23262E]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">
                        {f.label || f.name}
                      </span>
                      {val !== "—" && (
                        <button
                          type="button"
                          onClick={() => copyValue(copyId, val)}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-muted"
                          title="Kopyala"
                        >
                          {copiedKey === copyId ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" /> Kopyalandı
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Kopyala
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {isEmail ? (
                      <a
                        href={`mailto:${val}`}
                        className="inline-flex items-center gap-1.5 break-all font-medium text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0 opacity-75" />
                        <span>{val}</span>
                      </a>
                    ) : isPhone ? (
                      <a
                        href={`tel:${val.replace(/[^\d+]/g, "")}`}
                        className="inline-flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0 opacity-75" />
                        <span>{val}</span>
                      </a>
                    ) : (
                      <p className="whitespace-pre-wrap break-words font-medium leading-relaxed text-[#14151A] dark:text-[#F3F4F6]">
                        {val}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alt İşlem Çubuğu */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E6E7EA] dark:border-[#23262E] bg-[#FAFAFB] dark:bg-[#121317] px-5 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.status !== "read" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => onSetStatus(item.id, "read")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2.5 text-[12px] font-medium hover:bg-muted disabled:opacity-50"
              >
                <MailCheck className="h-3.5 w-3.5 text-emerald-600" /> Okundu
              </button>
            )}
            {item.status !== "new" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => onSetStatus(item.id, "new")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2.5 text-[12px] font-medium hover:bg-muted disabled:opacity-50"
              >
                <Mail className="h-3.5 w-3.5 text-blue-600" /> Yeni Yap
              </button>
            )}
            {item.status !== "archived" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => onSetStatus(item.id, "archived")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2.5 text-[12px] font-medium hover:bg-muted disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" /> Arşivle
              </button>
            )}
            {item.status !== "spam" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => onSetStatus(item.id, "spam")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2.5 text-[12px] font-medium hover:bg-muted disabled:opacity-50"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Spam
              </button>
            )}
          </div>

          {isAdmin && (
            <button
              type="button"
              disabled={pending}
              onClick={() => onDelete(item.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-rose-600 px-3 text-[12px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Kalıcı Sil
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
