import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPublicSite } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı (404)",
};

/** 0-KB RSC kurumsal Türkçe 404 sayfası — site adı, marka rengi ve üst/alt gezinme ile. */
export default async function NotFound() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  const siteName = site?.name?.trim() || "Ana Sayfa";
  const primary = site?.designTokens?.colors.primary ?? "#1d4ed8";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="text-base font-extrabold tracking-tight text-slate-950 hover:opacity-80">
            {siteName}
          </a>
          <nav aria-label="Hızlı bağlantılar" className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <a href="/" className="hover:text-slate-950">Ana Sayfa</a>
            <a href="/blog" className="hover:text-slate-950">Blog</a>
            <a href="/kampanyalar" className="hover:text-slate-950">Kampanyalar</a>
            <a href="/iletisim" className="hover:text-slate-950">İletişim</a>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <p style={{ color: primary }} className="font-mono text-xs font-semibold uppercase tracking-widest">
            Hata 404
          </p>
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
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
            <button
              type="submit"
              style={{ backgroundColor: primary }}
              className="h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-white hover:opacity-90"
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
              style={{ color: primary }}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent px-4 font-medium hover:underline"
            >
              İletişim &amp; Destek
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {siteName}
      </footer>
    </div>
  );
}
