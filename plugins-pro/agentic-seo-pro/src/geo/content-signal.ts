import { KNOWN_BOTS } from "@nexpress/core";

/**
 * robots.txt `Content-Signal` satırı (contentsignals.org): search / ai-input / ai-train.
 * Eğitim botlarının tümü engelliyse `ai-train=no`; arama botları engelliyse `ai-input=no`.
 */
export function contentSignalLine(botPolicy: Record<string, "allow" | "block">): string {
  const blockedAll = (category: string) => {
    const bots = KNOWN_BOTS.filter((b) => b.category === category);
    return bots.length > 0 && bots.every((b) => botPolicy[b.id] === "block");
  };
  const yn = (blocked: boolean) => (blocked ? "no" : "yes");
  return `Content-Signal: search=yes, ai-input=${yn(blockedAll("ai-search"))}, ai-train=${yn(blockedAll("ai-training"))}`;
}
