import type { ChatClient } from "@nexpress/core";
import { brandContextBlock } from "./brand";
import { findForbidden, forbiddenFor, type BrandRules } from "./suggest";

/**
 * Editörde blok düzeyinde AI yazım/düzenleme (saf mantık + sohbet çağrısı). Düzen kuralları:
 * - Model yalnızca ÖNERİ üretir; yazan ve onaylayan editördür (kayıt ayrı bir adımdır).
 * - Çıktı düz metin paragraflardır: HTML/Markdown/bağlantı atılır, uzunluk ve paragraf sayısı sınırlıdır.
 * - Marka yasak kalıpları kontrol edilir (bir kez otomatik düzeltme denenir), kalanlar kullanıcıya bildirilir.
 * - Rakam, yüzde, yıl, "en iyi/ilk/tek" gibi doğrulanması gereken iddialar işaretlenir; kaynakta olmayan rakamlar ayrıca uyarılır.
 */
export type ComposeMode = "write" | "rewrite" | "expand" | "shorten" | "fix";
export const COMPOSE_MODES: ComposeMode[] = ["write", "rewrite", "expand", "shorten", "fix"];

export const COMPOSE_LIMITS = { instruction: 600, text: 4000, context: 3000, paragraphs: 6, paragraphChars: 1200, headingChars: 90 } as const;

export interface ComposeInput {
  mode: ComposeMode;
  /** Kullanıcının isteği (ör. "SEO'ya uygun, samimi bir giriş yaz") */
  instruction: string;
  /** Düzenlenecek metin (write modunda boş olabilir) */
  text: string;
  /** Sayfanın başlığı */
  title: string;
  /** Blok türü: paragraf ya da başlık */
  kind: "paragraph" | "heading";
  /** Çevredeki içerikten kısa bağlam (Markdown) */
  context: string;
  focusKeyword?: string;
  locale?: string;
}

export interface ComposeResult {
  paragraphs: string[];
  /** Yasak kalıplardan kalanlar (otomatik düzeltme sonrası) */
  remainingForbidden: string[];
  /** Doğrulanması gereken iddialar (rakam, yıl, mutlak ifadeler) */
  claims: string[];
  /** Çıktıda olup girdide/bağlamda geçmeyen rakamlar: model uydurmuş olabilir */
  unverifiedNumbers: string[];
  refined: boolean;
  model: string;
}

export function composeSystemPrompt(rules: BrandRules, kind: ComposeInput["kind"]): string {
  const forbidden = forbiddenFor(rules);
  return [
    "Sen deneyimli bir editör ve SEO yazarısın. Yalnızca JSON nesnesi döndür.",
    "Bilgi, rakam, istatistik, ödül, müşteri adı veya alıntı UYDURMA. Kaynakta olmayan somut iddia ekleme; emin değilsen genel ve doğrulanabilir kal.",
    "Düz metin yaz: HTML, Markdown, bağlantı, emoji ve madde işareti kullanma.",
    kind === "heading" ? `Tek bir başlık üret (en çok ${COMPOSE_LIMITS.headingChars} karakter).` : `En çok ${COMPOSE_LIMITS.paragraphs} paragraf; her paragraf en çok ${COMPOSE_LIMITS.paragraphChars} karakter. Cevap-önce yaz: ilk cümle konuya doğrudan girer.`,
    rules.tone ? `Marka tonu: ${rules.tone}.` : "",
    `Asla kullanma: ${forbidden.join("; ")}.`,
    rules.customRules ? `Marka kuralları: ${rules.customRules}` : "",
    brandContextBlock(rules),
  ].filter(Boolean).join("\n");
}

const MODE_TEXT: Record<ComposeMode, string> = {
  write: "Aşağıdaki isteğe göre sıfırdan yaz.",
  rewrite: "Verilen metni anlamını koruyarak isteğe göre yeniden yaz. Yeni olgu ekleme.",
  expand: "Verilen metni anlamını koruyarak genişlet; ek ayrıntı yalnızca bağlamdan ve metnin kendisinden gelsin.",
  shorten: "Verilen metni kısalt; önemli bilgiyi ve tonu koru.",
  fix: "Yalnızca yazım, noktalama ve dil bilgisi hatalarını düzelt; anlamı ve üslubu değiştirme.",
};

export function composeUserPrompt(i: ComposeInput): string {
  return [
    `Dil: ${i.locale ?? "tr"}`,
    `Sayfa başlığı: ${i.title.slice(0, 160)}`,
    i.focusKeyword ? `Odak anahtar kelime (doğal geçsin, doldurma): ${i.focusKeyword}` : "",
    `Görev: ${MODE_TEXT[i.mode]}`,
    i.instruction ? `İstek: ${i.instruction.slice(0, COMPOSE_LIMITS.instruction)}` : "",
    i.text ? `Metin:\n${i.text.slice(0, COMPOSE_LIMITS.text)}` : "",
    i.context ? `Sayfanın çevresindeki içerik (yalnızca bağlam, kopyalama):\n${i.context.slice(0, COMPOSE_LIMITS.context)}` : "",
    "",
    i.kind === "heading" ? 'JSON: {"paragraphs": ["<başlık>"]}' : 'JSON: {"paragraphs": ["<paragraf 1>", "<paragraf 2>"]}',
  ].filter(Boolean).join("\n");
}

/** HTML etiketlerini, Markdown işaretlerini ve bağlantıları atar; boşlukları düzenler. */
export function cleanText(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  const t = s
    .replace(/<[^>]*>/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[`*_#>]+/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40))}…`;
}

/** Model çıktısını doğrular. Bozuk/boş çıktıda hata fırlatır. */
export function parseCompose(raw: string, kind: ComposeInput["kind"]): string[] {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    throw new Error("Model geçersiz JSON döndürdü.");
  }
  const list = (obj as { paragraphs?: unknown } | null)?.paragraphs;
  const arr = Array.isArray(list) ? list : typeof list === "string" ? [list] : [];
  const max = kind === "heading" ? COMPOSE_LIMITS.headingChars : COMPOSE_LIMITS.paragraphChars;
  const out = arr.map((p) => cleanText(p, max)).filter((p) => p.length > 0).slice(0, kind === "heading" ? 1 : COMPOSE_LIMITS.paragraphs);
  if (out.length === 0) throw new Error("Model boş metin döndürdü.");
  return out;
}

const CLAIM_PATTERNS: Array<[RegExp, string]> = [
  [/\b\d{1,3}(?:[.,]\d+)?\s*%|%\s*\d+/g, "yüzde"],
  [/\b(19|20)\d{2}\b/g, "yıl"],
  [/\b\d[\d.,]*\s*(?:milyon|milyar|bin|kat|kişi|müşteri|kullanıcı|firma|şirket)\b/gi, "büyüklük"],
  [/\b(?:en iyi|bir numaralı|tek|ilk|lider|garantili|%100|sıfır risk|kesinlikle)\b/gi, "mutlak ifade"],
];

/** Doğrulanması gereken iddia parçaları (tekrarsız, en çok 8). */
export function findClaims(text: string): string[] {
  const out = new Set<string>();
  for (const [re] of CLAIM_PATTERNS) for (const m of text.matchAll(re)) out.add(m[0].trim());
  return [...out].slice(0, 8);
}

const NUM_RE = /\d[\d.,]*/g;
/** Çıktıdaki rakamlardan, girdide (metin, istek, başlık, bağlam) geçmeyenler: uydurma olasılığı. */
export function findUnverifiedNumbers(output: string, source: string): string[] {
  const known = new Set((source.match(NUM_RE) ?? []).map((n) => n.replace(/[.,]+$/, "")));
  const out = new Set<string>();
  for (const m of output.matchAll(NUM_RE)) {
    const n = m[0].replace(/[.,]+$/, "");
    if (n.length >= 1 && !known.has(n)) out.add(n);
  }
  return [...out].slice(0, 8);
}

export async function composeText(client: ChatClient, input: ComposeInput, rules: BrandRules = {}): Promise<ComposeResult> {
  const system = composeSystemPrompt(rules, input.kind);
  const phrases = forbiddenFor(rules);
  const user = composeUserPrompt(input);
  let paragraphs = parseCompose(await client.completeJson({ system, user, temperature: input.mode === "fix" ? 0.1 : 0.5, maxTokens: 1400 }), input.kind);
  let found = findForbidden(paragraphs.join("\n"), phrases);
  let refined = false;
  if (found.length > 0) {
    refined = true;
    try {
      paragraphs = parseCompose(await client.completeJson({ system, user: `${user}\n\nÖnceki taslakta yasak kalıplar vardı: ${found.join("; ")}.\nÖnceki taslak:\n${JSON.stringify({ paragraphs })}\nBu kalıpları kullanmadan, aynı anlamla yeniden yaz.`, temperature: 0.2, maxTokens: 1400 }), input.kind);
      found = findForbidden(paragraphs.join("\n"), phrases);
    } catch {
      /* ikinci geçiş başarısızsa ilk taslak ve uyarı kalır */
    }
  }
  const out = paragraphs.join("\n");
  const source = [input.text, input.instruction, input.title, input.context].join("\n");
  return { paragraphs, remainingForbidden: found, claims: findClaims(out), unverifiedNumbers: findUnverifiedNumbers(out, source), refined, model: client.model };
}
