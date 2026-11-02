import React from "react";
import { cmsHooks, isPluginModuleEnabled, slotRegistry } from "@nexpress/core";
import { ModuleGate, PLUGIN_ID } from "../module-gate";
import {
  auditContentGuardrails,
  DEFAULT_FORBIDDEN_PHRASES,
} from "./guardrails";
import { CopilotCard } from "./copilot-card";
import { GapCard } from "./gap-card";
import { SAMPLE_MINED_QUESTIONS } from "./question-mining";

/** İçerik Operasyonları modülleri: guardrail, editör Co-Pilot, soru madenciliği kartı. */
export function registerContentOps(): void {

  // 1. HOOK: content:beforeSave -> Kayıt anında otomatik Guardrail & AI Klişe Denetimi
  cmsHooks.registerFilter(
    "content:beforeSave",
    PLUGIN_ID,
    async (payload) => {
      if (!(await isPluginModuleEnabled(payload.siteId, PLUGIN_ID, "guardrails"))) return payload;
      const audit = auditContentGuardrails(payload.markdownCache, payload.tldr);
      return {
        ...payload,
        seoScore: audit.calculatedSeoScore,
      };
    },
    20
  );

  // 2. SLOT: editor.sidebar.tabs -> gerçek kanibalizasyon / iç bağlantı (dizin vektörleri)
  slotRegistry.register({
    id: "content-ops-editor-copilot",
    pluginId: PLUGIN_ID,
    slot: "editor.sidebar.tabs",
    priority: 10,
    render: ({ siteId, context }) => (
      <ModuleGate siteId={siteId} module="copilot">
        <CopilotCard siteId={siteId} contentId={(context as { contentId?: string } | undefined)?.contentId} />
      </ModuleGate>
    ),
  });

  // 2b. SLOT: dashboard.overview.cards -> içerik açığı analizi (gerçek içerik verisi)
  slotRegistry.register({
    id: "content-ops-gap-card",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 15,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="gap-analysis">
        <GapCard siteId={siteId} />
      </ModuleGate>
    ),
  });

  // 3. SLOT: dashboard.overview.cards -> Attio CRM Data Grid Stilinde Soru Madenciliği
  slotRegistry.register({
    id: "content-ops-question-mining-card",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 20,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="question-mining">
      <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] overflow-hidden mt-4">
        <div className="px-4 py-2.5 border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#266DF0]" />
            <span className="text-[12px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">
              8 Kaynaklı Hibrit Soru Madenciliği (Question-Intel)
            </span>
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-800 dark:text-amber-400">
              Demo verisi
            </span>
            <span className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#1C1E24] px-1.5 py-0.5 font-mono text-[10px] text-[#5C5F66] dark:text-[#9CA3AF]">
              Cosine &gt; 0.92
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#8C9099]">
            GSC Pos 4–20 • Serper PAA • WebMCP
          </span>
        </div>

        <div className="divide-y divide-[#E6E7EA] dark:divide-[#23262E] text-[12px]">
          {SAMPLE_MINED_QUESTIONS.map((q) => (
            <div
              key={q.id}
              className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F4F5F7]/60 dark:hover:bg-[#1C1E24]/60 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-1.5 py-0.5 font-mono text-[10px] text-[#5C5F66] dark:text-[#9CA3AF] shrink-0">
                  {q.sourceChannel}
                </span>
                <span className="font-medium text-[#14151A] dark:text-[#F3F4F6] truncate">
                  {q.canonicalQuestion}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-[11px]">
                <span className="font-mono text-[#5C5F66] dark:text-[#9CA3AF] tabular-nums">
                  {q.impressions30d.toLocaleString("tr-TR")} imp
                </span>
                <span className="font-mono text-[#266DF0] dark:text-[#3B82F6]">
                  → {q.recommendedTargetType}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-[#14151A] dark:text-[#F3F4F6]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      q.status === "published" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {q.status === "published" ? "Yayında" : "2-Pass Hazır"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </ModuleGate>
    ),
  });
}


