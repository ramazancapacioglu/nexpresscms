"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Send,
  ExternalLink,
  PanelRight,
  Plus,
  ListTree,
  Undo2,
  Redo2,
  Sparkles,
  Globe,
  ChevronDown,
} from "lucide-react";
import { StudioViewBar } from "./editor/studio-view-bar";
import { SearchSnippetBar } from "./editor/search-snippet-bar";
import type { DualModeEditorState } from "./use-dual-mode-editor";

export function DualModeEditorTopbar({ s }: { s: DualModeEditorState }) {
  const [showSerpPopover, setShowSerpPopover] = useState(false);

  const isTemplateMode = s.lockedType === "template";
  const isInserterActive = s.leftDrawerOpen && s.leftTab === "inserter";
  const isTreeActive = s.leftDrawerOpen && s.leftTab === "tree";

  const toggleLeftTab = (tab: "inserter" | "tree") => {
    if (s.leftDrawerOpen && s.leftTab === tab) {
      s.setLeftDrawerOpen(false);
    } else {
      s.setLeftTab(tab);
      s.setLeftDrawerOpen(true);
    }
  };

  const backHref = isTemplateMode
    ? "/admin/appearance/templates"
    : s.lockedType === "post"
      ? "/admin/posts"
      : "/admin/pages";

  return (
    <header className="relative z-30 flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-card px-2.5 py-1.5 select-none">
      {/* Sol: Geri + Mavi Blok Ekle (+) + Yapı Gezgini + Geri/İleri Al + Kompakt URL/SERP */}
      <div className="flex min-w-0 items-center gap-1.5">
        <Link
          href={backHref}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden xl:inline">{isTemplateMode ? "Şablonlar" : "İçerikler"}</span>
        </Link>

        {/* Mavi + Blok Ekle Düğmesi */}
        <button
          type="button"
          onClick={() => toggleLeftTab("inserter")}
          aria-label="Blok ve satır ekleyiciyi aç veya kapat"
          title="Blok Ekle (+)"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all ${
            isInserterActive
              ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
              : "bg-blue-600 text-white shadow-xs hover:bg-blue-700"
          }`}
        >
          <Plus className={`h-4 w-4 transition-transform ${isInserterActive ? "rotate-45" : ""}`} />
          <span className="hidden sm:inline">Blok Ekle</span>
        </button>

        {/* Yapı Gezgini (Liste Görünümü) */}
        <button
          type="button"
          onClick={() => toggleLeftTab("tree")}
          aria-label="Yapı gezginini (blok ağacı) aç veya kapat"
          title="Yapı Gezgini (Blok Ağacı)"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors ${
            isTreeActive
              ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
              : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ListTree className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Yapı</span>
        </button>

        {/* Geri Al / İleri Al */}
        <div className="hidden items-center rounded-md border border-border bg-background p-0.5 sm:flex">
          <button
            type="button"
            disabled={!s.canUndo}
            onClick={s.handleUndo}
            aria-label="Geri al"
            title="Geri Al (Ctrl+Z)"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-35"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!s.canRedo}
            onClick={s.handleRedo}
            aria-label="İleri al"
            title="İleri Al (Ctrl+Y)"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-35"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Kompakt URL & SERP Açılır Penceresi (İçerik Modu) */}
        {!isTemplateMode && (
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setShowSerpPopover((v) => !v)}
              aria-label="Kalıcı bağlantı ve Google arama önizlemesini düzenle"
              className="inline-flex h-8 max-w-[200px] items-center gap-1 rounded-md border border-border bg-muted/40 px-2 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Globe className="h-3 w-3 shrink-0 text-blue-600" />
              <span className="truncate">
                /{s.locale}/{s.slug}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
            </button>

            {showSerpPopover && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSerpPopover(false)}
                />
                <div className="absolute left-0 top-full z-50 mt-1.5 w-[540px] max-w-[92vw] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
                  <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold">
                    <span>Kalıcı Bağlantı (Slug) & Arama Sonucu</span>
                    <button
                      type="button"
                      onClick={() => setShowSerpPopover(false)}
                      className="rounded px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Kapat
                    </button>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-muted-foreground">/{s.locale}/</span>
                      <input
                        type="text"
                        value={s.slug}
                        onChange={(e) => s.setSlug(e.target.value)}
                        aria-label="Kalıcı bağlantı adresi (slug)"
                        className="h-7 flex-1 rounded border border-border bg-background px-2 font-mono text-xs"
                      />
                    </div>
                  </div>
                  <SearchSnippetBar
                    title={s.title}
                    tldr={s.tldr}
                    metaTitle={s.metaTitle}
                    setMetaTitle={s.setMetaTitle}
                    metaDescription={s.metaDescription}
                    setMetaDescription={s.setMetaDescription}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Orta: ✨ Tasarım Kütüphanesi + Görünüm & Cihaz Seçici */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => s.setLibraryOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-indigo-200 bg-gradient-to-r from-indigo-600 to-blue-600 px-3 text-xs font-semibold text-white shadow-xs transition hover:from-indigo-700 hover:to-blue-700 dark:border-indigo-800"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Tasarım Kütüphanesi</span>
        </button>

        <StudioViewBar />
      </div>

      {/* Sağ: Kayıt durumu + Taslak / Yayınla + SEO Puanı + Denetçi */}
      <div className="flex items-center gap-1.5">
        {s.isDirty && (
          <span
            title="Kaydedilmemiş değişiklikler var"
            className="hidden items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300 xl:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Değişiklik var
          </span>
        )}

        {isTemplateMode ? (
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={s.isPending}
            onClick={() => s.handleSave("draft")}
          >
            <Save className="h-3.5 w-3.5" />
            {s.isPending ? "Kaydediliyor..." : "Şablonu Kaydet"}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              disabled={s.isPending}
              onClick={() => s.handleSave("draft")}
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Taslak</span>
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={s.isPending}
              onClick={() => s.handleSave("published")}
            >
              <Send className="h-3.5 w-3.5" />
              {s.isPending ? "Kaydediliyor..." : "Yayınla"}
            </button>
            <Link
              href={`/${s.locale}/${s.slug === "home" ? "" : s.slug}`}
              target="_blank"
              aria-label="Canlı sayfayı yeni sekmede görüntüle"
              title="Canlı Sayfayı Görüntüle"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => {
                s.setRightSidebarOpen(true);
                s.setRightTab("seo");
              }}
              aria-label={`SEO puanı 100 üzerinden ${s.seoAnalysis.score}, SEO denetçisini aç`}
              title="SEO Denetçisini Aç"
              className="hidden sm:inline-flex"
            >
              <span
                className={`inline-flex h-6 cursor-pointer items-center rounded-md px-2 text-[11px] font-semibold ${
                  s.seoAnalysis.score >= 80
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-muted text-foreground"
                }`}
              >
                SEO {s.seoAnalysis.score}
              </span>
            </button>
          </>
        )}

        <button
          type="button"
          className={`inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors ${
            s.rightSidebarOpen
              ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
              : "border-border bg-background text-foreground hover:bg-muted"
          }`}
          onClick={() => s.setRightSidebarOpen((v) => !v)}
          aria-label="Sağ denetçi panelini aç veya kapat"
          title="Sağ Denetçi Paneli"
        >
          <PanelRight className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Denetçi</span>
        </button>
      </div>
    </header>
  );
}
