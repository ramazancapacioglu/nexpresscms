import { buildDesignSystemPrompt, extractJson, lintDesignOutput, type ChatClient, type DesignContext, type DesignMode, type DesignOutput, type DesignSiteContext } from "@nexpress/core";
import { validateThemeOutput, type ThemeOutput } from "@nexpress/themes/package";

export const MAX_PROMPT_CHARS = 2000;

export type GeneratedDesign = (DesignOutput & { attempts: number; model: string }) | (ThemeOutput & { attempts: number; model: string });

function evaluate(mode: DesignMode, text: string, ctx: DesignContext): { result: DesignOutput | ThemeOutput | null; errors: string[] } {
  const json = extractJson(text);
  if (!json.ok) return { result: null, errors: [json.error] };
  if (mode === "theme") {
    const r = validateThemeOutput(json.value);
    return { result: r, errors: r.errors };
  }
  const r = lintDesignOutput(mode, json.value, ctx);
  return { result: r, errors: r.lint.errors };
}

/**
 * Üretim hattı: komut (CMS bilgisi) → model → doğrulama → hata varsa hataları modele geri verip TEK onarım turu.
 * En az hatalı sonuç döner; hiç JSON alınamazsa hata fırlatır. Çıktıyı yazmaz.
 */
export async function generateDesign(
  client: ChatClient,
  input: { mode: DesignMode; prompt: string; site?: DesignSiteContext; extraRules?: string }
): Promise<GeneratedDesign> {
  const prompt = input.prompt.trim().slice(0, MAX_PROMPT_CHARS);
  const ctx: DesignContext = { knownPaths: input.site?.knownPaths, mediaIds: input.site?.media?.map((m) => m.id), formIds: input.site?.forms?.map((f) => f.id) };
  const system = buildDesignSystemPrompt(input.mode, input.site) + (input.extraRules?.trim() ? `\n\nSite sahibinin ek kuralları:\n${input.extraRules.trim().slice(0, 1000)}` : "");
  const maxTokens = input.mode === "page" ? 6000 : 3500;

  const first = await client.completeJson({ system, user: prompt, temperature: 0.5, maxTokens });
  let best = evaluate(input.mode, first, ctx);
  let attempts = 1;
  if (best.errors.length > 0) {
    const repairUser = `${prompt}\n\nÖnceki çıktın şu hatalarla reddedildi, düzelt ve yalnızca düzeltilmiş JSON'u ver:\n${best.errors.slice(0, 12).map((e) => `- ${e}`).join("\n")}\n\nÖnceki çıktı:\n${first.slice(0, 6000)}`;
    try {
      const second = evaluate(input.mode, await client.completeJson({ system, user: repairUser, temperature: 0.2, maxTokens }), ctx);
      attempts = 2;
      if (second.result && (!best.result || second.errors.length < best.errors.length)) best = second;
    } catch {
      /* onarım turu başarısızsa ilk sonuç döner */
    }
  }
  if (!best.result) throw new Error(best.errors[0] ?? "Model geçerli bir tasarım döndürmedi.");
  return { ...best.result, attempts, model: client.model } as GeneratedDesign;
}
