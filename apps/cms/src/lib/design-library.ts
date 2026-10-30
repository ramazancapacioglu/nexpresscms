import "server-only";
import { buildDesignSystemPrompt, lintDesignOutput, type BlockNode, type DesignMode } from "@nexpress/core";
import { loadDesignSiteContext } from "@nexpress/database";
import { validateThemeOutput } from "@nexpress/themes/package";

/** İstemciye giden (JSON'a uygun) tasarım önizlemesi: temizlenmiş veri + rapor. */
export interface DesignPreview {
  mode: DesignMode;
  name: string;
  description: string;
  category: string;
  blocks: BlockNode[];
  page?: { title: string; slug: string; type: "page"; schemaType: string; tldr: string; metaTitle: string; metaDescription: string };
  theme?: { id: string; name: string; tagline: string; description: string; tokens: Record<string, unknown>; contrast: Array<{ mode: string; pair: string; ratio: number; min: number; pass: boolean }> };
  errors: string[];
  warnings: string[];
  score: number;
  placeholderData: boolean;
  stats?: { blocks: number; words: number; headings: number; ctas: number; h1: number };
  attempts?: number;
  model?: string;
}

/** Ham (model/yapıştırma/istemci) tasarımı sitenin güncel bağlamıyla doğrular; her zaman sunucuda, kaydetmeden önce yeniden çağrılır. */
export async function evaluateDesign(siteId: string, mode: DesignMode, raw: unknown): Promise<DesignPreview> {
  if (mode === "theme") {
    const t = validateThemeOutput(raw);
    return {
      mode,
      name: t.name,
      description: t.description,
      category: "theme",
      blocks: [],
      theme: { id: t.theme.id ?? "", name: t.name, tagline: t.theme.tagline ?? "", description: t.description, tokens: t.tokens as unknown as Record<string, unknown>, contrast: t.contrast },
      errors: t.errors,
      warnings: t.warnings,
      score: t.score,
      placeholderData: false,
    };
  }
  const ctx = await loadDesignSiteContext(siteId);
  const out = lintDesignOutput(mode, raw, { knownPaths: ctx.knownPaths, mediaIds: ctx.media?.map((m) => m.id), formIds: ctx.forms?.map((f) => f.id) });
  return { mode, name: out.name, description: out.description, category: out.category, blocks: out.lint.blocks, page: out.page, errors: out.lint.errors, warnings: out.lint.warnings, score: out.lint.score, placeholderData: out.lint.placeholderData, stats: out.lint.stats };
}

/** Dış sohbet (ChatGPT, Claude…) için kopyalanabilir sistem komutu: anahtar gerektirmez, sitenin gerçek bağlamını içerir. */
export async function exportDesignPrompt(siteId: string, mode: DesignMode): Promise<string> {
  return buildDesignSystemPrompt(mode, mode === "theme" ? undefined : await loadDesignSiteContext(siteId));
}
