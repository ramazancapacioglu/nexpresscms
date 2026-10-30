import { buildDesignSystemPrompt, extractJson, lintDesignOutput, lintThemeTokens, slugifyTr, type ChatClient, type DesignContext, type DesignMode, type DesignOutput, type DesignSiteContext } from "@nexpress/core";
import { THEME_ID_RE, ThemeJsonSchema, TokensSchema, type ThemeJson, type ThemeTokens } from "@nexpress/themes/package";

export const MAX_PROMPT_CHARS = 2000;

export interface ThemeOutput {
  mode: "theme";
  name: string;
  description: string;
  theme: ThemeJson;
  tokens: ThemeTokens;
  errors: string[];
  warnings: string[];
  contrast: ReturnType<typeof lintThemeTokens>["contrast"];
  score: number;
  ok: boolean;
}

export type GeneratedDesign = (DesignOutput & { attempts: number; model: string }) | (ThemeOutput & { attempts: number; model: string });

/** Tema yanıtını doğrular: id/ad biçimi, jeton şeması (zod) ve WCAG/geometri denetimi (`lintThemeTokens`). */
export function validateThemeOutput(raw: unknown): ThemeOutput {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const errors: string[] = [];
  const name = typeof o.name === "string" ? o.name.replace(/<[^>]*>/g, "").trim().slice(0, 60) : "";
  let id = typeof o.id === "string" ? o.id : "";
  if (!THEME_ID_RE.test(id)) id = slugifyTr(id || name).slice(0, 39);
  if (!THEME_ID_RE.test(id)) errors.push("tema kimliği üretilemedi");
  if (!name) errors.push("tema adı boş");
  const lint = lintThemeTokens(o.tokens);
  errors.push(...lint.errors);
  const parsedTokens = TokensSchema.safeParse(o.tokens);
  if (!parsedTokens.success) errors.push(...parsedTokens.error.issues.slice(0, 6).map((i) => `tokens.${i.path.join(".")}: ${i.message}`));
  const theme = ThemeJsonSchema.safeParse({
    id,
    name: name || "AI teması",
    version: "1.0.0",
    author: "AI Tasarım",
    tagline: typeof o.tagline === "string" ? o.tagline.slice(0, 120) : "",
    description: typeof o.description === "string" ? o.description.replace(/<[^>]*>/g, "").slice(0, 300) : "",
    recommendedProfile: "corporate",
    features: ["AI tarafından üretildi"],
  });
  if (!theme.success) errors.push(...theme.error.issues.slice(0, 4).map((i) => `theme.${i.path.join(".")}: ${i.message}`));
  const uniqueErrors = [...new Set(errors)];
  return {
    mode: "theme",
    name,
    description: theme.success ? theme.data.description : "",
    theme: (theme.success ? theme.data : ({} as ThemeJson)),
    tokens: (parsedTokens.success ? parsedTokens.data : ({} as ThemeTokens)),
    errors: uniqueErrors,
    warnings: lint.warnings,
    contrast: lint.contrast,
    score: Math.max(0, 100 - uniqueErrors.length * 25 - lint.warnings.length * 5),
    ok: uniqueErrors.length === 0,
  };
}

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
