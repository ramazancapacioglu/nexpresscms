import { autoFixContrast, lintThemeTokens, slugifyTr } from "@nexpress/core";
import { THEME_ID_RE, ThemeJsonSchema, TokensSchema, type ThemeJson, type ThemeTokens } from "./schema";

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

/** Tema yanıtını doğrular: id/ad biçimi, jeton şeması (zod) ve WCAG/geometri denetimi (`lintThemeTokens`). */
export function validateThemeOutput(raw: unknown): ThemeOutput {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const errors: string[] = [];
  const name = typeof o.name === "string" ? o.name.replace(/<[^>]*>/g, "").trim().slice(0, 60) : "";
  let id = typeof o.id === "string" ? o.id : "";
  if (!THEME_ID_RE.test(id)) id = slugifyTr(id || name).slice(0, 39);
  if (!THEME_ID_RE.test(id)) errors.push("tema kimliği üretilemedi");
  if (!name) errors.push("tema adı boş");
  // Kontrast hatalarını modele bırakmadan, tonu koruyarak belirleyici biçimde onar ve raporla
  const repaired = autoFixContrast(o.tokens);
  const lint = lintThemeTokens(repaired.tokens);
  if (repaired.fixes.length > 0) lint.warnings.unshift(`${repaired.fixes.length} renk kontrast için otomatik ayarlandı (${repaired.fixes.slice(0, 4).map((f) => f.key + (f.mode === "koyu" ? " [koyu]" : "")).join(", ")}${repaired.fixes.length > 4 ? "…" : ""})`);
  errors.push(...lint.errors);
  const parsedTokens = TokensSchema.safeParse(repaired.tokens);
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
