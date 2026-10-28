"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormDefinitionStatus } from "@nexpress/database";
import { deleteFormAction, duplicateFormAction, setFormStatusAction } from "./actions";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const btn = `h-7 rounded-md border ${border} px-2.5 text-[12px] font-medium inline-flex items-center hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] disabled:opacity-50`;

export function FormRowActions({ id, status, isAdmin }: { id: string; status: FormDefinitionStatus; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? "" : r.error ?? "İşlem başarısız.");
      router.refresh();
    });
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link href={`/admin/forms/${id}`} className={btn}>Düzenle</Link>
      <Link href={`/admin/forms/${id}/analytics`} className={btn}>Analiz</Link>
      <Link href={`/admin/forms/inbox?form=${id}`} className={btn}>Gönderimler</Link>
      <button type="button" className={btn} disabled={pending} onClick={() => run(() => duplicateFormAction({ id }))}>Çoğalt</button>
      <button type="button" className={btn} disabled={pending} onClick={() => run(() => setFormStatusAction({ id, status: status === "active" ? "paused" : "active" }))}>{status === "active" ? "Duraklat" : "Etkinleştir"}</button>
      {isAdmin && <button type="button" disabled={pending} onClick={() => window.confirm("Form tanımı silinsin mi? Gönderimler kalır; bağlı bloklar boş görünür.") && run(() => deleteFormAction({ id }))} className="h-7 rounded-md px-2 text-[12px] text-red-600 hover:bg-red-500/10">Sil</button>}
      {error && <span role="alert" className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
