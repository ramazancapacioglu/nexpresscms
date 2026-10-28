"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FilePlus2 } from "lucide-react";
import { createFormAction } from "../actions";

interface Tpl { id: string; name: string; description: string; category: string; fields: string[] }
const border = "border-[#E6E7EA] dark:border-[#23262E]";
const CATS: Record<string, string> = { iletisim: "İletişim", satis: "Satış", destek: "Destek", anket: "Anket", etkinlik: "Etkinlik", ik: "İnsan kaynakları" };

export function TemplateGallery({ templates }: { templates: Tpl[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const create = (templateId?: string) => {
    setBusy(templateId ?? "blank");
    setError("");
    start(async () => {
      const r = await createFormAction({ templateId });
      if (r.ok) router.push(`/admin/forms/${r.id}`);
      else { setError(r.error); setBusy(null); }
    });
  };
  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-[12px] text-red-600">{error}</p>}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <li>
          <button type="button" disabled={pending} onClick={() => create()} className={`flex h-full w-full flex-col items-start gap-1 rounded-lg border-2 border-dashed ${border} p-4 text-left hover:border-[#266DF0] disabled:opacity-60`}>
            <FilePlus2 className="h-5 w-5 text-[#266DF0]" aria-hidden />
            <span className="text-[13px] font-medium">{busy === "blank" ? "Oluşturuluyor…" : "Boş form"}</span>
            <span className="text-[12px] text-[#8C9099]">Ad, e-posta ve mesaj alanlarıyla başlayın.</span>
          </button>
        </li>
        {templates.map((t) => (
          <li key={t.id}>
            <button type="button" disabled={pending} onClick={() => create(t.id)} className={`flex h-full w-full flex-col items-start gap-1 rounded-lg border ${border} bg-white p-4 text-left hover:border-[#266DF0] disabled:opacity-60 dark:bg-[#15171C]`}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C9099]">{CATS[t.category] ?? t.category}</span>
              <span className="text-[13px] font-medium">{busy === t.id ? "Oluşturuluyor…" : t.name}</span>
              <span className="text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">{t.description}</span>
              <span className="mt-1 line-clamp-2 text-[11px] text-[#8C9099]">{t.fields.join(" · ")}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
