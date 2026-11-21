import { DomUtils, parseDocument } from "htmlparser2";

/**
 * WordPress "AI Prompt" (soru-cevap) sayfası ayrıştırıcısı. Saf mantık: ağ yok.
 * Kaynak: REST `content.rendered` (soru, kısa cevap, ayrıntı: üç düz metin bloğu) ve herkese açık sayfa HTML'i
 * (künye tablosu, ürün bağlantısı, faydalı oyu, cevaplanmış ziyaretçi soruları).
 */
export interface QaPageData {
  question: string;
  shortAnswer: string;
  /** Ayrıntılı cevap: her satır ayrı paragraf */
  detail: string[];
  areaServed: string;
  audience: string;
  about: string;
  serviceType: string;
  /** Aynı kökteyse göreli yol (`/e-fatura`), değilse mutlak adres */
  productUrl: string;
  upvotes: number;
  answered: Array<{ question: string; answer: string; name: string }>;
}

const FACT_KEYS: Record<string, "areaServed" | "audience" | "about" | "serviceType"> = {
  "hizmet bölgesi": "areaServed",
  "hedef kitle": "audience",
  hakkında: "about",
  "hizmet tipi": "serviceType",
};

function textOf(html: string): string {
  const withBreaks = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n");
  const text = DomUtils.textContent(parseDocument(withBreaks));
  return text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

const inline = (html: string): string => textOf(html).replace(/\n+/g, " ").trim();

export function parseQaPage(input: { contentHtml: string; pageHtml: string; origin: string }): QaPageData | null {
  const clean = input.contentHtml.replace(/<style[\s\S]*?<\/style>/gi, "");
  const blocks = [...clean.matchAll(/<div class="wp-block-kadence-dynamichtml[^"]*"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => textOf(m[1] ?? "")).filter(Boolean);
  const question = (blocks[0] ?? "").replace(/\n+/g, " ").trim();
  const shortAnswer = (blocks[1] ?? "").replace(/\n+/g, " ").trim();
  if (!question || !shortAnswer) return null;
  const detail = blocks.slice(2).flatMap((block) => block.split("\n")).map((line) => line.trim()).filter(Boolean);

  const facts: Record<string, string> = {};
  for (const row of input.pageHtml.matchAll(/<tr>\s*<td>([^<]*?):\s*<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)) {
    const key = FACT_KEYS[(row[1] ?? "").trim().toLocaleLowerCase("tr")];
    const value = inline(row[2] ?? "");
    if (key && value && !facts[key]) facts[key] = value;
  }

  let productUrl = "";
  const link = /<a\s+href="([^"]+)"[^>]*class="ai-table-btn"/.exec(input.pageHtml) ?? /<a[^>]*class="ai-table-btn"[^>]*href="([^"]+)"/.exec(input.pageHtml);
  if (link?.[1]) {
    const href = link[1].replace(/&amp;/g, "&");
    try {
      const url = new URL(href, input.origin);
      productUrl = url.origin === new URL(input.origin).origin ? `${url.pathname.replace(/\/+$/, "")}${url.search}` || "/" : url.toString();
    } catch {
      productUrl = "";
    }
  }

  const votes = Number(/id="ai-vote-count"[^>]*>\s*(\d+)/.exec(input.pageHtml)?.[1] ?? 0);
  const answered: QaPageData["answered"] = [];
  for (const chunk of input.pageHtml.split('<div class="ai-qa-item">').slice(1)) {
    const q = /class="ai-qa-q"[^>]*>([\s\S]*?)<\/div>/.exec(chunk)?.[1];
    const a = /class="ai-qa-a"[^>]*>([\s\S]*?)<\/div>/.exec(chunk)?.[1];
    const meta = /class="ai-qa-meta"[^>]*>([\s\S]*?)<\/div>/.exec(chunk)?.[1] ?? "";
    if (q && a) answered.push({ question: inline(q), answer: inline(a), name: inline(meta).replace(/\s*[·|•-].*$/, "") });
  }

  return {
    question,
    shortAnswer,
    detail,
    areaServed: facts.areaServed ?? "",
    audience: facts.audience ?? "",
    about: facts.about ?? "",
    serviceType: facts.serviceType ?? "",
    productUrl,
    upvotes: Number.isFinite(votes) ? votes : 0,
    answered: answered.slice(0, 50),
  };
}
