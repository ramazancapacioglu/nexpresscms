"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CommerceCategoryDto } from "@nexpress/commerce";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/commerce/catalog-actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

export function CategoryBoard({ categories }: { categories: CommerceCategoryDto[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[18px] font-semibold">Kategoriler</h1>
        <p className="text-[12px] text-[#8C9099]">Ürün ağacı. Üst kategori boşsa kök kayıttır.</p>
      </header>
      <form
        className="grid max-w-xl gap-2 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => {
            await saveCategoryAction({ name, slug, parentId: parentId || undefined });
            setName("");
            setSlug("");
            router.refresh();
          });
        }}
      >
        <input className={fieldClass} placeholder="Ad" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={fieldClass} placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <select className={fieldClass} value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">Kök</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <button disabled={pending} className="rounded-md bg-[#111318] px-3 py-2 text-[12px] text-white dark:bg-white dark:text-[#111318]">
          Ekle
        </button>
      </form>
      <ul className="space-y-1 text-[12px]">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between rounded border border-[#E6E7EA] px-3 py-2 dark:border-[#23262E]">
            <span>
              {category.name} <span className="text-[#8C9099]">/{category.slug}</span>
            </span>
            <button
              type="button"
              className="text-red-600"
              onClick={() => start(async () => { await deleteCategoryAction(category.id); router.refresh(); })}
            >
              Sil
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
