import "server-only";
import { promises as dns } from "node:dns";
import { hostMatchesSuffix, ipInRanges, parsePublishedRanges, type BotSignature, type ParsedCidr } from "@nexpress/core";
import type { BotTrust } from "@nexpress/database";

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 5000;
const cache = new Map<string, { trust: BotTrust; expires: number }>();

const RANGE_TTL_MS = 24 * 60 * 60 * 1000;
const RANGE_FAIL_TTL_MS = 10 * 60 * 1000;
const MAX_RANGE_BYTES = 1_000_000;
const rangeCache = new Map<string, { ranges: ParsedCidr[]; expires: number }>();

/**
 * Sağlayıcının yayımladığı IP listesi (yalnızca `KNOWN_BOTS` içindeki sabit https adresleri; kullanıcı girdisi değil).
 * 24 saat önbelleklenir; ağ/boyut/biçim hatasında boş döner ve 10 dk sonra yeniden denenir.
 */
async function loadRanges(url: string): Promise<ParsedCidr[]> {
  const hit = rangeCache.get(url);
  if (hit && hit.expires > Date.now()) return hit.ranges;
  let ranges: ParsedCidr[] = [];
  let ttl = RANGE_FAIL_TTL_MS;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } });
    const text = res.ok ? await res.text() : "";
    if (text.length > 0 && text.length <= MAX_RANGE_BYTES) {
      ranges = parsePublishedRanges(JSON.parse(text));
      if (ranges.length > 0) ttl = RANGE_TTL_MS;
    }
  } catch {
    // erişilemedi: doğrulanamadı
  }
  rangeCache.set(url, { ranges, expires: Date.now() + ttl });
  return ranges;
}

/**
 * İleri-doğrulamalı ters DNS (FCrDNS): IP -> ad -> aynı IP. Yalnızca sağlayıcı bunu
 * destekliyorsa (`expectedDnsSuffixes` veya yayımlanmış `ipRangeUrls` dolu) "verified" olabilir; aksi halde UA iddiası
 * "claimed" kalır. Sonuç IP başına 24 saat önbelleğe alınır; DNS hatası "claimed" demektir.
 */
export async function verifyBotIp(bot: BotSignature, ip: string | null): Promise<BotTrust> {
  if (!ip || (bot.expectedDnsSuffixes.length === 0 && !bot.ipRangeUrls?.length)) return "claimed";
  const key = `${bot.id}|${ip}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.trust;

  let trust: BotTrust = "claimed";
  if (bot.ipRangeUrls?.length) {
    for (const url of bot.ipRangeUrls) {
      if (ipInRanges(ip, await loadRanges(url))) {
        trust = "verified";
        break;
      }
    }
  }
  if (trust !== "verified" && bot.expectedDnsSuffixes.length > 0) {
    try {
      for (const name of await dns.reverse(ip)) {
        if (!hostMatchesSuffix(name, bot.expectedDnsSuffixes)) continue;
        const forward = [...(await dns.resolve4(name).catch(() => [] as string[])), ...(await dns.resolve6(name).catch(() => [] as string[]))];
        if (forward.includes(ip)) {
          trust = "verified";
          break;
        }
      }
    } catch {
      // DNS yanıt vermedi: doğrulanamadı
    }
  }
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(key, { trust, expires: Date.now() + TTL_MS });
  return trust;
}
