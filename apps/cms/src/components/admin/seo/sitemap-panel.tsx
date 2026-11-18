"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContentType, SeoEngineSettings } from "@nexpress/core";
import { saveSeoEngineSettingsAction } from "@/app/admin/actions";

const TYPES: Array<{ id: ContentType; label: string }> = [
  { id: "page", label: "Sayfa" },
  { id: "post", label: "Yazı" },
  { id: "kb_tech", label: "Bilgi" },
  { id: "ai_prompt", label: "Soru" },
  { id: "product", label: "Ürün" },
  { id: "campaign", label: "Kampanya" },
];

/** Site haritasına girecek içerik türleri ve arşivler. Kayıt yalnızca bu üç alanı yazar. */
export function SitemapPanel({ seo }: { seo: SeoEngineSettings }) {
  const router = useRouter();
  const [types, setTypes] = useState<ContentType[]>(seo.sitemapTypes);
  const [categories, setCategories] = useState(seo.sitemapIncludeCategories !== false);
  const [tags, setTags] = useState(seo.sitemapIncludeTags !== false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggleType = (id: ContentType) => {
    setTypes((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const save = () => {
    start(async () => {
      await saveSeoEngineSettingsAction({
        seo: { sitemapTypes: types, sitemapIncludeCategories: categories, sitemapIncludeTags: tags },
      });
      setNotice("Site haritası ayarı kaydedildi. /sitemap.xml yenilendi.");
      router.refresh();
    });
  };

  const tagsBlocked = seo.noIndexTagArchives === true;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {notice ? <p className="text-[12px] text-emerald-800 dark:text-emerald-400">{notice}</p> : <span />}
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-md bg-[#14151A] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50 dark:bg-[#F3F4F6] dark:text-[#14151A]"
        >
          {pending ? "Kaydediliyor" : "Kaydet"}
        </button>
      </div>
      <section className="rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
        <h2 className="text-[13px] font-semibold">İçerik türleri</h2>
        <p className="mt-1 text-[12px] text-[#5F6570] dark:text-[#8C9099]">Seçili türlerin yayındaki kayıtları site haritasına yazılır.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPES.map((type) => {
            const on = types.includes(type.id);
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => toggleType(type.id)}
                className={`rounded-md px-2.5 py-1 text-[12px] ${on ? "bg-blue-600 text-white" : "border border-[#E6E7EA] dark:border-[#23262E]"}`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </section>
      <section className="rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
        <h2 className="text-[13px] font-semibold">Arşivler</h2>
        <label className="mt-3 flex items-center justify-between gap-3 text-[13px]">
          <span>Kategorileri site haritasına ekle</span>
          <input type="checkbox" checked={categories} onChange={(e) => setCategories(e.target.checked)} />
        </label>
        <label className="mt-3 flex items-center justify-between gap-3 text-[13px]">
          <span>Etiketleri site haritasına ekle</span>
          <input type="checkbox" checked={tags} onChange={(e) => setTags(e.target.checked)} disabled={tagsBlocked} />
        </label>
        {tagsBlocked ? (
          <p className="mt-2 text-[12px] text-amber-800 dark:text-amber-300">
            Etiket arşivleri noindex. Bu yüzden site haritasına yazılmaz. Kaldırmak için Ayarlar sayfasındaki etiket noindex kutusunu kapatın.
          </p>
        ) : (
          <p className="mt-2 text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            Kapalı etiketler haritadan çıkar. Sayfaların kendisi durur; yalnızca /etiket adresleri listelenmez.
          </p>
        )}
      </section>
    </div>
  );
}
