import { StudioViewBar } from "@/components/admin/editor/studio-view-bar";
import { PreviewLinkButton } from "./preview-link-button";
import { PanelRightClose, PanelRightOpen, Save } from "lucide-react";
import type { DualModeEditorState } from "./use-dual-mode-editor";

/** ÜST STÜDYO ÇUBUĞU (BAĞLAM KİLİTLİ — KARIŞIK TÜR FİLTRESİ YOK!) */
export function DualModeEditorTopbar({ s }: { s: DualModeEditorState }) {
  const { isPending, title, rightSidebarOpen, setRightSidebarOpen, setRightTab, seoAnalysis, handleSave, isDirty, recovery, restoreRecovery, dismissRecovery, contentId, locale, lockedType } = s;
  return (
    <>
      {/* ÜST STÜDYO ÇUBUĞU (BAĞLAM KİLİTLİ — KARIŞIK TÜR FİLTRESİ YOK!) */}
      <header className="flex h-10 shrink-0 items-center justify-start gap-2 overflow-x-auto border-b lg:justify-end border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#111317] px-3">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          {isDirty && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
              Kaydedilmedi
            </span>
          )}
          <StudioViewBar />
          <PreviewLinkButton contentId={contentId} locale={locale} dirty={isDirty} />
          <button
            type="button"
            onClick={() => {
              setRightSidebarOpen(true);
              setRightTab("seo");
            }}
            className={`hidden md:inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold transition ${
              seoAnalysis.score >= 85
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : seoAnalysis.score >= 70
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
            }`}
          >
            <span>SEO: {seoAnalysis.score}/100</span>
            <span className="rounded bg-background/80 px-1 text-[10px]">
              {seoAnalysis.grade}
            </span>
          </button>

          {lockedType !== "template" && <button
            type="button"
            disabled={isPending}
            onClick={() => handleSave("draft")}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-50"
          >
            Taslak Kaydet
          </button>}

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSave(lockedType === "template" ? "draft" : "published")}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isPending ? "Kaydediliyor..." : lockedType === "template" ? "Şablonu kaydet" : "Yayınla"}</span>
          </button>

          <button
            type="button"
            onClick={() => setRightSidebarOpen((v) => !v)}
            title="Sağ Denetçi Panelini Aç/Kapat"
            className={`rounded-md border p-1.5 transition ${
              rightSidebarOpen
                ? "border-blue-500/40 bg-blue-500/10 text-blue-600"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            {rightSidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>
    </>
  );
}
