import { DEFAULT_FORBIDDEN_PHRASES } from "../content-ops/guardrails";
import { brandContextBlock, type BrandProfile } from "./brand";
import type { ChatClient } from "./openai-chat";

export interface BrandRules extends BrandProfile {
  tone?: string;
  forbiddenPhrases?: string[];
  customRules?: string;
}

export interface SuggestInput {
  title: string;
  markdown: string;
  focusKeyword?: string;
  locale?: string;
}

export interface Suggestions {
  tldr: string;
  metaTitle: string;
  metaDescription: string;
  faq: Array<{ question: string; answer: string }>;
  /** İkinci geçişte temizlenemeyen yasak kalıplar (kullanıcıya uyarı) */
  remainingForbidden: string[];
  refined: boolean;
}

export const LIMITS = { tldr: 300, metaTitle: 60, metaDescription: 160, faqQuestion: 140, faqAnswer: 400, faqCount: 4 };
const CONTENT_CHARS = 6000;

/** Kullanıcının satır/virgülle girdiği listeyi temiz diziye çevirir. */
export function parseList(raw: string | undefined): string[] {
  return (raw ?? "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
}

export function forbiddenFor(rules: BrandRules): string[] {
  return [...new Set([...DEFAULT_FORBIDDEN_PHRASES, ...(rules.forbiddenPhrases ?? []).map((p) => p.toLowerCase())])];
}

export function findForbidden(text: string, phrases: string[]): string[] {
  const lower = text.toLowerCase();
  return phrases.filter((p) => lower.includes(p));
}

export function buildSystemPrompt(rules: BrandRules): string {
  const forbidden = forbiddenFor(rules);
  return [
    "Sen deneyimli bir SEO, GEO (yapay zeka arama) ve LLMs editörüsün. Yalnızca verilen içeriğe dayan; bilgi uydurma, rakam icat etme.",
    "Yanıtı yalnızca JSON nesnesi olarak ver.",
    "Cevap-önce (Answer-First) yaz: ilk cümle soruyu doğrudan yanıtlar.",
    rules.tone ? `Marka tonu: ${rules.tone}.` : "",
    `Asla kullanma: ${forbidden.join("; ")}.`,
    rules.customRules ? `Marka kuralları: ${rules.customRules}` : "",
    brandContextBlock(rules),
  ].filter(Boolean).join("\n");
}

export function buildUserPrompt(i: SuggestInput): string {
  return [
    `Dil: ${i.locale ?? "tr"}`,
    `Başlık: ${i.title}`,
    i.focusKeyword ? `Odak anahtar kelime: ${i.focusKeyword}` : "",
    `İçerik (kısaltılmış):\n${i.markdown.slice(0, CONTENT_CHARS)}`,
    "",
    "Şu JSON şemasıyla yanıtla:",
    `{"tldr": "<=${LIMITS.tldr} karakter cevap-önce özet", "metaTitle": "<=${LIMITS.metaTitle} karakter", "metaDescription": "<=${LIMITS.metaDescription} karakter", "faq": [{"question": "...", "answer": "..."}]} (faq en çok ${LIMITS.faqCount} öğe, içerikte cevabı olan sorular)`,
  ].filter(Boolean).join("\n");
}

const clip = (s: unknown, max: number): string => {
  const t = typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
};

/** Model çıktısını doğrular; sınırları uygular. Bozuk JSON için hata fırlatır. */
export function parseSuggestions(raw: string): Omit<Suggestions, "remainingForbidden" | "refined"> {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    throw new Error("Model geçersiz JSON döndürdü.");
  }
  if (typeof obj !== "object" || obj === null) throw new Error("Model beklenen biçimde yanıt vermedi.");
  const o = obj as Record<string, unknown>;
  const faq = (Array.isArray(o.faq) ? o.faq : [])
    .flatMap((q) => {
      const r = q as Record<string, unknown>;
      const question = clip(r?.question, LIMITS.faqQuestion);
      const answer = clip(r?.answer, LIMITS.faqAnswer);
      return question && answer ? [{ question, answer }] : [];
    })
    .slice(0, LIMITS.faqCount);
  const out = { tldr: clip(o.tldr, LIMITS.tldr), metaTitle: clip(o.metaTitle, LIMITS.metaTitle), metaDescription: clip(o.metaDescription, LIMITS.metaDescription), faq };
  if (!out.tldr && !out.metaTitle && !out.metaDescription && faq.length === 0) throw new Error("Model boş öneri döndürdü.");
  return out;
}

const textOf = (s: Pick<Suggestions, "tldr" | "metaTitle" | "metaDescription" | "faq">) =>
  [s.tldr, s.metaTitle, s.metaDescription, ...s.faq.flatMap((f) => [f.question, f.answer])].join("\n");

/** 2 geçiş: yasak kalıp çıkarsa model bir kez düzeltmeye gönderilir; kalırsa kullanıcıya bildirilir. */
export async function suggestSeoCopy(client: ChatClient, input: SuggestInput, rules: BrandRules = {}): Promise<Suggestions> {
  const system = buildSystemPrompt(rules);
  const phrases = forbiddenFor(rules);
  let current = parseSuggestions(await client.completeJson({ system, user: buildUserPrompt(input) }));
  let found = findForbidden(textOf(current), phrases);
  let refined = false;
  if (found.length > 0) {
    refined = true;
    try {
      const second = parseSuggestions(
        await client.completeJson({
          system,
          user: `${buildUserPrompt(input)}\n\nÖnceki taslakta yasak kalıplar vardı: ${found.join("; ")}.\nÖnceki taslak:\n${JSON.stringify(current)}\nBu kalıpları kullanmadan aynı şemayla yeniden yaz.`,
          temperature: 0.2,
        })
      );
      current = second;
      found = findForbidden(textOf(current), phrases);
    } catch {
      /* ikinci geçiş başarısızsa ilk taslak ve uyarı kalır */
    }
  }
  return { ...current, remainingForbidden: found, refined };
}
