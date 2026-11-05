import { createHash } from "node:crypto";
import { getIntelRepository } from "@nexpress/database";

/** Sonuçsuz ziyaretçi aramasını destek havuzuna yazar. Sayacı artırır, örnek sorgu üretmez. */
export async function recordSupportMiss(siteId: string, query: string): Promise<void> {
  const keyword = query.trim().slice(0, 180);
  if (keyword.length < 2) return;
  const id = `sig_${createHash("sha1").update(`${siteId}|support|${keyword.toLocaleLowerCase("tr")}`).digest("hex").slice(0, 16)}`;
  const repo = getIntelRepository(siteId);
  const existing = (await repo.listSignals(500)).find((row) => row.id === id);
  await repo.saveSignals([
    {
      id,
      source: "support",
      keyword,
      clicks: 0,
      impressions: (existing?.impressions ?? 0) + 1,
      ctr100: 0,
      position10: existing?.position10 ?? 0,
      detail: "zero-result",
    },
  ]);
}
