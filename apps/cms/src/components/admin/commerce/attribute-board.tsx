"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CommerceAttributeDto } from "@nexpress/commerce";
import { saveAttributeAction } from "@/app/admin/commerce/catalog-actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

export function AttributeBoard({ attributes }: { attributes: CommerceAttributeDto[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [labels, setLabels] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[18px] font-semibold">Nitelikler</h1>
        <p className="text-[12px] text-[#8C9099]">Varyasyon sihirbazı bu değerlerin kombinasyonunu üretir. Değerleri virgülle yazın.</p>
      </header>
      <form
        className="grid max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => {
            await saveAttributeAction({ name, slug, labels });
            setName("");
            setSlug("");
            setLabels("");
            router.refresh();
          });
        }}
      >
        <input className={fieldClass} placeholder="Nitelik adı" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={fieldClass} placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <input className={fieldClass} placeholder="Kırmızı, Mavi, Yeşil" value={labels} onChange={(e) => setLabels(e.target.value)} required />
        <button disabled={pending} className="w-fit rounded-md bg-[#111318] px-3 py-2 text-[12px] text-white dark:bg-white dark:text-[#111318]">
          Kaydet
        </button>
      </form>
      <ul className="space-y-2 text-[12px]">
        {attributes.map((attr) => (
          <li key={attr.id} className="rounded border border-[#E6E7EA] px-3 py-2 dark:border-[#23262E]">
            <strong>{attr.name}</strong>
            <span className="text-[#8C9099]"> — {attr.values.map((value) => value.label).join(", ") || "değer yok"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
