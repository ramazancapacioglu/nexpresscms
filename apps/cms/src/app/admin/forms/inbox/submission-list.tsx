"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormStatus } from "@nexpress/database";
import { deleteSubmissionsAction, setSubmissionStatusAction } from "../actions";

interface Item {
  id: string;
  pagePath: string;
  formTitle: string;
  fields: Array<{ name: string; label: string; value: string }>;
  createdAt: string;
  notifyStatus: string;
  notifyError: string;
}

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const btn = `h-7 rounded-md border ${border} px-2.5 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] disabled:opacity-50`;

export function SubmissionList({ items, status, isAdmin }: { items: Item[]; status: FormStatus; isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  const move = (id: string, to: FormStatus) => act(() => setSubmissionStatusAction({ ids: [id], status: to }));

  return (
    <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
      {items.map((i) => {
        const summary = i.fields.map((f) => f.value).join(" · ").slice(0, 120);
        const expanded = open === i.id;
        return (
          <li key={i.id} className="px-4 py-3 text-[12px]">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" aria-expanded={expanded} onClick={() => { setOpen(expanded ? null : i.id); if (!expanded && status === "new") move(i.id, "read"); }} className="min-w-0 flex-1 text-left">
                <span className="block truncate font-medium text-[#14151A] dark:text-[#F3F4F6]">{i.fields[0]?.value || "(boş)"}</span>
                <span className="block truncate text-[#5C5F66] dark:text-[#9CA3AF]">{summary}</span>
              </button>
              <span className="text-[11px] text-[#8C9099]">{i.formTitle && `${i.formTitle} · `}<a href={i.pagePath} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{i.pagePath}</a> · {new Date(i.createdAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</span>
            </div>
            {expanded && (
              <div className="mt-3 space-y-2 rounded-md bg-[#F4F5F7] dark:bg-[#1C1E24] p-3">
                {i.notifyStatus && i.notifyStatus !== "skipped" && (
                  <p className={`text-[11px] ${i.notifyStatus === "failed" ? "text-red-600" : "text-[#8C9099]"}`}>
                    E-posta bildirimi: {i.notifyStatus === "sent" ? "gönderildi" : `gönderilemedi${i.notifyError ? ` (${i.notifyError})` : ""}`}
                  </p>
                )}
                {i.fields.map((f) => (
                  <div key={f.name}>
                    <p className="text-[11px] font-medium text-[#8C9099]">{f.label}</p>
                    <p className="whitespace-pre-wrap break-words text-[#14151A] dark:text-[#F3F4F6]">{f.value}</p>
                  </div>
                ))}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {status !== "read" && <button type="button" className={btn} disabled={pending} onClick={() => move(i.id, "read")}>Okundu</button>}
                  {status !== "spam" && <button type="button" className={btn} disabled={pending} onClick={() => move(i.id, "spam")}>Spam</button>}
                  {status === "spam" && <button type="button" className={btn} disabled={pending} onClick={() => move(i.id, "new")}>Spam değil</button>}
                  {status !== "archived" && <button type="button" className={btn} disabled={pending} onClick={() => move(i.id, "archived")}>Arşivle</button>}
                  {isAdmin && (
                    <button type="button" disabled={pending} onClick={() => window.confirm("Bu gönderim KALICI silinsin mi?") && act(() => deleteSubmissionsAction({ ids: [i.id] }))} className="h-7 rounded-md px-2 text-[12px] text-red-600 hover:bg-red-500/10">Sil</button>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
