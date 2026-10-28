/**
 * Bilinen yapay zeka ve arama botları: yalnızca imza verisi ve saf eşleştirme.
 * Sayaç ve doğrulama sonuçları burada tutulmaz (veritabanında `bot_daily_stats`).
 */
export type BotCategory = "ai-training" | "ai-search" | "search";

export interface BotSignature {
  id: string;
  name: string;
  vendor: string;
  category: BotCategory;
  userAgentPattern: RegExp;
  /** Ters DNS ile doğrulanabiliyorsa beklenen alan adı sonekleri; yoksa boş (UA dışında kanıt yok). */
  expectedDnsSuffixes: string[];
  /** robots.txt `User-agent` simgeleri (UA düzenli ifadesinden farklı olabilir). */
  robotsTokens: string[];
  /** Sağlayıcının yayımladığı IP aralığı listeleri (JSON); varsa IP doğrulaması bunlarla yapılır. */
  ipRangeUrls?: string[];
}

export const KNOWN_BOTS: BotSignature[] = [
  { id: "gptbot", name: "GPTBot / ChatGPT-User", vendor: "OpenAI", category: "ai-search", userAgentPattern: /GPTBot|ChatGPT-User|OAI-SearchBot/i, expectedDnsSuffixes: [], robotsTokens: ["GPTBot", "OAI-SearchBot", "ChatGPT-User"], ipRangeUrls: ["https://openai.com/gptbot.json", "https://openai.com/searchbot.json", "https://openai.com/chatgpt-user.json"] },
  { id: "claudebot", name: "ClaudeBot / Claude-User", vendor: "Anthropic", category: "ai-search", userAgentPattern: /ClaudeBot|Claude-User|Claude-SearchBot|Claude-Web|anthropic-ai/i, expectedDnsSuffixes: [], robotsTokens: ["ClaudeBot", "Claude-SearchBot", "Claude-User"] },
  { id: "perplexitybot", name: "PerplexityBot", vendor: "Perplexity", category: "ai-search", userAgentPattern: /PerplexityBot|Perplexity-User/i, expectedDnsSuffixes: [], robotsTokens: ["PerplexityBot", "Perplexity-User"], ipRangeUrls: ["https://www.perplexity.ai/perplexitybot.json", "https://www.perplexity.ai/perplexity-user.json"] },
  { id: "googlebot", name: "Googlebot", vendor: "Google", category: "search", userAgentPattern: /Googlebot|GoogleOther|Google-Extended/i, expectedDnsSuffixes: [".googlebot.com", ".google.com"], robotsTokens: ["Googlebot", "Google-Extended"] },
  { id: "bingbot", name: "Bingbot", vendor: "Microsoft", category: "search", userAgentPattern: /bingbot|BingPreview/i, expectedDnsSuffixes: [".search.msn.com"], robotsTokens: ["bingbot"] },
  { id: "applebot", name: "Applebot", vendor: "Apple", category: "search", userAgentPattern: /Applebot/i, expectedDnsSuffixes: [".applebot.apple.com"], robotsTokens: ["Applebot", "Applebot-Extended"] },
  { id: "yandexbot", name: "YandexBot", vendor: "Yandex", category: "search", userAgentPattern: /YandexBot/i, expectedDnsSuffixes: [".yandex.ru", ".yandex.net", ".yandex.com"], robotsTokens: ["YandexBot"] },
  { id: "meta-agent", name: "Meta-ExternalAgent", vendor: "Meta", category: "ai-training", userAgentPattern: /meta-externalagent|FacebookBot/i, expectedDnsSuffixes: [], robotsTokens: ["meta-externalagent"] },
  { id: "amazonbot", name: "Amazonbot", vendor: "Amazon", category: "ai-search", userAgentPattern: /Amazonbot/i, expectedDnsSuffixes: [], robotsTokens: ["Amazonbot"] },
  { id: "ccbot", name: "CCBot (Common Crawl)", vendor: "Common Crawl", category: "ai-training", userAgentPattern: /CCBot/i, expectedDnsSuffixes: [], robotsTokens: ["CCBot"] },
  { id: "bytespider", name: "Bytespider", vendor: "ByteDance", category: "ai-training", userAgentPattern: /Bytespider/i, expectedDnsSuffixes: [], robotsTokens: ["Bytespider"] },
];

/** Ucuz ön süzgeç: istek yolunda her ziyaretçi için tek düzenli ifade. */
const ANY_BOT = new RegExp(KNOWN_BOTS.map((b) => b.userAgentPattern.source).join("|"), "i");

export function detectBot(userAgent?: string | null): BotSignature | null {
  if (!userAgent || !ANY_BOT.test(userAgent)) return null;
  return KNOWN_BOTS.find((bot) => bot.userAgentPattern.test(userAgent)) ?? null;
}

/** Ters DNS adının (sondaki nokta olsun olmasın) beklenen soneklerden birine ait olup olmadığı. */
export function hostMatchesSuffix(hostname: string, suffixes: readonly string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return suffixes.some((s) => host.endsWith(s.toLowerCase()));
}

export type BotRequestKind = "page" | "markdown" | "llms" | "sitemap" | "ai-sitemap" | "robots" | "mcp";

/** İsteğin ne tür kaynağa yöneldiği; botların neyi okuduğunu ayırmak için. */
export function classifyRequestKind(pathname: string, wantsMarkdown = false): BotRequestKind {
  if (pathname === "/api/mcp" || pathname.startsWith("/.well-known/mcp")) return "mcp";
  if (pathname === "/robots.txt") return "robots";
  if (pathname === "/ai-sitemap.json") return "ai-sitemap";
  if (pathname === "/sitemap.xml" || pathname.startsWith("/sitemaps/")) return "sitemap";
  if (pathname === "/llms.txt" || pathname === "/llms-full.txt") return "llms";
  return wantsMarkdown ? "markdown" : "page";
}
