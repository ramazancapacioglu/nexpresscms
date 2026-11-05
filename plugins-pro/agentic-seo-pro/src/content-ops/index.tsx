import React from "react";
import { cmsHooks, isPluginModuleEnabled, slotRegistry } from "@nexpress/core";
import { ModuleGate, PLUGIN_ID } from "../module-gate";
import { auditContentGuardrails } from "./guardrails";
import { CopilotCard } from "./copilot-card";
import { GapCard } from "./gap-card";
import { QuestionPoolCard } from "./question-pool-card";
import { registerContentOpsActions } from "./register-ops";

/** İçerik Operasyonları modülleri: guardrail, editör Co-Pilot, soru madenciliği kartı. */
export function registerContentOps(): void {
  registerContentOpsActions();

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

  // İçerik açığı: SEO raporları / içerik
  slotRegistry.register({
    id: "content-ops-gap-card",
    pluginId: PLUGIN_ID,
    slot: "seo.reports.content",
    priority: 15,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="gap-analysis">
        <GapCard siteId={siteId} />
      </ModuleGate>
    ),
  });

  // Soru havuzu: SEO raporları / sorgular
  slotRegistry.register({
    id: "content-ops-question-mining-card",
    pluginId: PLUGIN_ID,
    slot: "seo.reports.queries",
    priority: 20,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="question-mining">
        <QuestionPoolCard />
      </ModuleGate>
    ),
  });
}


