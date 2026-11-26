import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  // `robots` yazılmaz: Next 404 yanıtına kendi `noindex` etiketini ekler, ikincisi yinelenen etiket olur
  title: "Sayfa Bulunamadı (404)",
};

/** 0-KB RSC kurumsal Türkçe 404 sayfası. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-slate-900">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-700">Hata 404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Aradığınız sayfa bulunamadı
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Sayfa taşınmış, kaldırılmış veya bağlantı hatalı yazılmış olabilir. Aşağıdan site içinde arama yapabilir ya da ana sayfaya dönebilirsiniz.
        </p>

        <form action="/ara" method="get" role="search" className="mt-6 flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Site içinde ara…"
            aria-label="Site içinde ara"
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Ara
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-800 hover:bg-slate-50"
          >
            ← Ana Sayfaya Dön
          </a>
          <a
            href="/iletisim"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent px-4 font-medium text-blue-700 hover:underline"
          >
            İletişim &amp; Destek
          </a>
        </div>
      </div>
    </main>
  );
}
