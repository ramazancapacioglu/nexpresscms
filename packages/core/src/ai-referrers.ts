/** Yapay zeka sohbet/arama ürünlerinden gelen insan ziyaretlerini tanır (saf mantık; JS beacon gerekmez). */
export interface AiReferrerSource {
  id: string;
  name: string;
  hosts: string[];
  /** `utm_source` değerleri (ChatGPT bağlantılara `utm_source=chatgpt.com` ekler) */
  utm: string[];
}

export const AI_REFERRERS: AiReferrerSource[] = [
  { id: "chatgpt", name: "ChatGPT", hosts: ["chatgpt.com", "chat.openai.com"], utm: ["chatgpt.com"] },
  { id: "perplexity", name: "Perplexity", hosts: ["perplexity.ai"], utm: ["perplexity", "perplexity.ai"] },
  { id: "gemini", name: "Gemini", hosts: ["gemini.google.com", "bard.google.com"], utm: ["gemini"] },
  { id: "copilot", name: "Microsoft Copilot", hosts: ["copilot.microsoft.com"], utm: ["copilot.com", "copilot"] },
  { id: "claude", name: "Claude", hosts: ["claude.ai"], utm: ["claude.ai", "claude"] },
  { id: "you", name: "You.com", hosts: ["you.com"], utm: [] },
  { id: "phind", name: "Phind", hosts: ["phind.com"], utm: [] },
  { id: "meta-ai", name: "Meta AI", hosts: ["meta.ai"], utm: [] },
  { id: "deepseek", name: "DeepSeek", hosts: ["chat.deepseek.com"], utm: [] },
];

const hostOf = (referer: string | null | undefined): string => {
  try {
    return referer ? new URL(referer).hostname.toLowerCase() : "";
  } catch {
    return "";
  }
};

/** Önce `utm_source`, sonra Referer ana makinesi (alt alan adları dahil). Tanınmazsa `null`. */
export function detectAiReferrer(referer: string | null | undefined, utmSource?: string | null): AiReferrerSource | null {
  const utm = (utmSource ?? "").trim().toLowerCase();
  if (utm) {
    const byUtm = AI_REFERRERS.find((s) => s.utm.includes(utm));
    if (byUtm) return byUtm;
  }
  const host = hostOf(referer);
  if (!host) return null;
  return AI_REFERRERS.find((s) => s.hosts.some((h) => host === h || host.endsWith(`.${h}`))) ?? null;
}

/** Yalnızca yol (sorgu ve çapa atılır), en çok 200 karakter. */
export function normalizeReferralPath(path: string): string {
  const p = path.split(/[?#]/)[0] || "/";
  return (p.startsWith("/") ? p : `/${p}`).slice(0, 200);
}
