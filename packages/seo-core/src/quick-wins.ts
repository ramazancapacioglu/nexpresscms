export type QuickWinKind = "page2" | "low_ctr" | "missing_topic";

export interface SeoSignalInput {
  keyword: string;
  source?: string | null;
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
}

export interface SeoQuickWin {
  kind: QuickWinKind;
  keyword: string;
  source: string;
  impressions: number;
  clicks: number;
  ctrPct: number;
  position: number | null;
  recommendation: string;
}

const norm = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Search Console / Bing sinyallerinden aksiyona dönüştürülebilir hızlı kazanımları çıkarır:
 * - page2: 7-20. sıralarda olup küçük iyileştirmeyle ilk 5'e girebilecek sorgular
 * - low_ctr: ilk 6'da olup tıklama oranı %3'ün altında kalan başlık/meta fırsatları
 * - missing_topic: yüksek gösterim alıp mevcut içerik başlıklarında geçmeyen konu fırsatları
 */
export function extractSeoQuickWins(
  signals: SeoSignalInput[],
  existingTitles: string[],
  limit = 24
): SeoQuickWin[] {
  const titlePool = existingTitles.map(norm).filter(Boolean);
  const byKey = new Map<string, SeoQuickWin>();

  for (const raw of signals) {
    const keyword = (raw.keyword ?? "").trim();
    if (!keyword || keyword.startsWith("/") || keyword.length < 3) continue;
    const impressions = Number(raw.impressions ?? 0);
    const clicks = Number(raw.clicks ?? 0);
    const pos = typeof raw.position === "number" && raw.position > 0 ? Number(raw.position.toFixed(1)) : null;
    const rawCtr = typeof raw.ctr === "number" ? raw.ctr : impressions > 0 ? clicks / impressions : 0;
    const ctrPct = Number((rawCtr > 1 ? rawCtr : rawCtr * 100).toFixed(1));
    const source = raw.source || "gsc";

    let kind: QuickWinKind | null = null;
    let recommendation = "";

    if (pos !== null && pos >= 7 && pos <= 20 && impressions >= 10) {
      kind = "page2";
      recommendation = `Sıra ${pos}: Hedef sayfada başlık, TL;DR ve 2–3 iç bağlantı ekleyerek ilk 5'e taşıyın.`;
    } else if (pos !== null && pos > 0 && pos <= 6 && impressions >= 20 && ctrPct < 3) {
      kind = "low_ctr";
      recommendation = `İlk sayfada (sıra ${pos}) ancak TO %${ctrPct}. Meta başlık ve açıklamayı daha net ve değer odaklı yenileyin.`;
    } else if (impressions >= 15) {
      const nk = norm(keyword);
      const tokens = nk.split(" ").filter((w) => w.length > 2);
      const covered = tokens.length > 0 && titlePool.some((t) => tokens.every((w) => t.includes(w)));
      if (!covered) {
        kind = "missing_topic";
        recommendation = "Mevcut sayfa başlıklarında doğrudan karşılığı yok; yeni rehber veya SSS içeriği üretin.";
      }
    }

    if (!kind) continue;
    const dedupeKey = `${kind}:${norm(keyword)}`;
    const prev = byKey.get(dedupeKey);
    if (!prev || impressions > prev.impressions) {
      byKey.set(dedupeKey, { kind, keyword, source, impressions, clicks, ctrPct, position: pos, recommendation });
    }
  }

  return [...byKey.values()]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}
