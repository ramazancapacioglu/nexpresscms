/**
 * `@nexpress-pro/content-ops` — Site DNA, Few-Shot Stil Koruması ve AI Klişe Denetleyicisi
 */
export const DEFAULT_FORBIDDEN_PHRASES: string[] = [
  "bu makalede",
  "sonuç olarak",
  "özetlemek gerekirse",
  "günümüzde",
  "unutulmamalıdır ki",
  "şüphesiz ki",
  "dijital çağda",
  "hızla gelişen teknoloji",
];

export interface GuardrailAuditResult {
  passed: boolean;
  calculatedSeoScore: number;
  detectedForbiddenPhrases: string[];
  hasAnswerFirstTldr: boolean;
  wordCount: number;
  recommendations: string[];
}

export function auditContentGuardrails(
  markdownText: string,
  tldr?: string | null
): GuardrailAuditResult {
  const lower = markdownText.toLowerCase();
  const detected = DEFAULT_FORBIDDEN_PHRASES.filter((phrase) =>
    lower.includes(phrase)
  );

  const hasAnswerFirstTldr = Boolean(tldr && tldr.trim().length >= 40);
  const words = markdownText
    .replace(/[#>*_`~-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const wordCount = words.length;

  let score = 96;
  const recommendations: string[] = [];

  if (!hasAnswerFirstTldr) {
    score -= 12;
    recommendations.push(
      "Eksik veya kısa TL;DR: SGE ve AI botları için en az 40 karakterlik Answer-First özet ekleyin."
    );
  }

  if (detected.length > 0) {
    score -= detected.length * 8;
    recommendations.push(
      `Yapay AI klişesi tespit edildi (${detected.join(", ")}). Site DNA kurumsal diline uygun olarak temizleyin.`
    );
  }

  if (wordCount < 45) {
    score -= 6;
    recommendations.push(
      "İçerik derinliği düşük: Teknik KB veya ürün karşılaştırma bloğu ekleyerek zenginleştirin."
    );
  }

  return {
    passed: detected.length === 0 && hasAnswerFirstTldr,
    calculatedSeoScore: Math.max(40, Math.min(100, score)),
    detectedForbiddenPhrases: detected,
    hasAnswerFirstTldr,
    wordCount,
    recommendations,
  };
}
