"use client";

import React, { useState, useTransition } from "react";
import { saveReadingSettingsAction } from "@/app/admin/pages/reading-actions";

const field = "mt-1 h-8 w-full rounded border border-[#E6E7EA] bg-white px-2 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]";

/** Sayfalar listesinde öne çıkan sayfa ve yazı sayfası. */
export function ReadingCard({
  pages,
  frontPageSlug,
  postsPageSlug,
}: {
  pages: Array<{ slug: string; title: string }>;
  frontPageSlug: string;
  postsPageSlug: string;
}) {
  const [front, setFront] = useState(frontPageSlug);
  const [posts, setPosts] = useState(postsPageSlug);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    start(async () => {
      setNotice(null);
      setError(null);
      const result = await saveReadingSettingsAction({ frontPageSlug: front, postsPageSlug: posts });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice("Kaydedildi.");
    });
  };

  return (
    <section className="rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
      <h2 className="text-[13px] font-semibold">Öne çıkan sayfa ve blog</h2>
      <p className="mt-1 text-[12px] text-[#5F6570] dark:text-[#8C9099]">
        Öne çıkan sayfa ziyaretçi ana sayfası olur. Seçilmezse tema varsayılanı durur. Blog sayfası kendi gövdesi yerine yayınlanmış yazıları listeler.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-[11px] text-[#5F6570] dark:text-[#8C9099]">
          Öne çıkan sayfa
          <select className={field} value={front} onChange={(e) => setFront(e.target.value)}>
            <option value="">Tema varsayılanı</option>
            {pages.map((page) => (
              <option key={page.slug} value={page.slug}>
                {page.title} — /{page.slug}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] text-[#5F6570] dark:text-[#8C9099]">
          Blog sayfası
          <select className={field} value={posts} onChange={(e) => setPosts(e.target.value)}>
            <option value="">Yok</option>
            {pages.map((page) => (
              <option key={page.slug} value={page.slug}>
                {page.title} — /{page.slug}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex h-8 items-center rounded-md bg-[#14151A] px-3 text-[12px] font-medium text-white disabled:opacity-60 dark:bg-[#F3F4F6] dark:text-[#14151A]"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {notice ? <span className="text-[12px] text-emerald-700 dark:text-emerald-400">{notice}</span> : null}
        {error ? <span className="text-[12px] text-red-600">{error}</span> : null}
      </div>
    </section>
  );
}
