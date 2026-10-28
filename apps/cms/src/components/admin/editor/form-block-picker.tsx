"use client";

import { useEffect, useState } from "react";

interface Option { id: string; name: string; status: string }

/** Form bloğunu kurucuyla hazırlanmış bir forma bağlar; boş bırakılırsa eski satır içi alanlar kullanılır. */
export function FormBlockPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [forms, setForms] = useState<Option[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/forms/options")
      .then((r) => r.json())
      .then((j: { ok: boolean; forms?: Option[] }) => live && setForms(j.ok ? j.forms ?? [] : []))
      .catch(() => live && setForms([]));
    return () => { live = false; };
  }, []);
  const missing = value && forms && !forms.some((f) => f.id === value);
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-semibold">Form</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-full rounded border border-border bg-background px-2">
        <option value="">Satır içi alanlar (eski)</option>
        {forms?.map((f) => <option key={f.id} value={f.id}>{f.name}{f.status !== "active" ? ` (${f.status === "paused" ? "duraklatıldı" : "arşiv"})` : ""}</option>)}
        {missing && <option value={value}>(silinmiş form)</option>}
      </select>
      <a href={value ? `/admin/forms/${value}` : "/admin/forms/new"} target="_blank" rel="noreferrer" className="block text-[11px] text-blue-600 underline">{value ? "Formu düzenle" : "Yeni form oluştur"}</a>
    </label>
  );
}
