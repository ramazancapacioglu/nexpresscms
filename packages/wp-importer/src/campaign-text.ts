/** Kampanya yazısının başlık ve açıklamasından indirim ve geçerlilik tarihi çıkarır. Ağ ve veritabanı yoktur. */

export interface CampaignText {
  /** Örn: "%40 İndirim" */
  discount?: string;
  /** YYYY-MM-DD */
  startDate?: string;
  endDate?: string;
}

const MONTH: Record<string, number> = { ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6, temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12 };
const pad = (n: number) => String(n).padStart(2, "0");

function validDate(year: number, month: number, day: number): string | null {
  if (year < 2015 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Metindeki tüm tarihler, görünüş sırasıyla: "1 Ekim 2026", "31.08.2025". */
export function findDates(text: string): string[] {
  const found: Array<{ at: number; date: string }> = [];
  for (const m of text.matchAll(/(\d{1,2})\s+(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+(\d{4})/gi)) {
    const date = validDate(Number(m[3]), MONTH[(m[2] ?? "").toLocaleLowerCase("tr")] ?? 0, Number(m[1]));
    if (date) found.push({ at: m.index ?? 0, date });
  }
  for (const m of text.matchAll(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/g)) {
    const date = validDate(Number(m[3]), Number(m[2]), Number(m[1]));
    if (date) found.push({ at: m.index ?? 0, date });
  }
  return found.sort((a, b) => a.at - b.at).map((item) => item.date);
}

/**
 * İndirim: "%40" ya da "Yüzde 50". Tarih: iki tarih varsa başlangıç ve bitiş; tek tarih "bitiş" sözcüğünün yanındaysa bitiş,
 * "öncesi/önce" ile geçiyorsa (geçmiş alımı tarif eder) hiçbiri sayılmaz.
 */
export function parseCampaignText(text: string): CampaignText {
  const out: CampaignText = {};
  const percent = /%\s?(\d{1,2})\b/.exec(text)?.[1] ?? /Y[üu]zde\s+(\d{1,2})\b/i.exec(text)?.[1];
  if (percent) out.discount = `%${percent} İndirim`;
  const dates = findDates(text);
  if (dates.length >= 2) {
    out.startDate = dates[0];
    out.endDate = dates[dates.length - 1];
  } else if (dates.length === 1 && /biti[sş]/i.test(text) && !/(önce|öncesi)/i.test(text)) {
    out.endDate = dates[0];
  }
  return out;
}

export interface CampaignFields {
  name?: string;
  discount?: string;
  gift?: string;
  productName?: string;
  /** Kaynak sitedeki ürün sayfası adresi (mutlak) */
  productUrl?: string;
  startDate?: string;
  endDate?: string;
  terms?: string;
}

const decodeAttr = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

const dateOnly = (value: string | undefined) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : undefined);

/**
 * Kampanya yazısının düzenleme ekranındaki özel alanlar (`camp_*`): ad, indirim yüzdesi, hediye, ürün adı ve adresi,
 * başlangıç/bitiş, şartlar. Boş alan verilmez. İndirim yalnızca rakamdır ("40" → "%40").
 */
export function parseCampaignFields(html: string): CampaignFields {
  const raw: Record<string, string> = {};
  for (const m of html.matchAll(/<input[^>]*name="(camp_[a-z_]+)"[^>]*value="([^"]*)"/g)) raw[m[1] ?? ""] = decodeAttr(m[2] ?? "");
  for (const m of html.matchAll(/<textarea[^>]*name="(camp_[a-z_]+)"[^>]*>([\s\S]*?)<\/textarea>/g)) raw[m[1] ?? ""] = decodeAttr(m[2] ?? "");
  const digits = /^\d{1,3}(?:[.,]\d+)?$/.test((raw.camp_discount ?? "").trim()) ? (raw.camp_discount ?? "").trim().replace(",", ".") : "";
  const url = /^https?:\/\//.test(raw.camp_product_url ?? "") ? raw.camp_product_url : undefined;
  const out: CampaignFields = {
    ...(raw.camp_name ? { name: raw.camp_name } : {}),
    ...(digits ? { discount: `%${digits}` } : {}),
    ...(raw.camp_gift ? { gift: raw.camp_gift } : {}),
    ...(raw.camp_product_name ? { productName: raw.camp_product_name } : {}),
    ...(url ? { productUrl: url } : {}),
    ...(dateOnly(raw.camp_start) ? { startDate: dateOnly(raw.camp_start) } : {}),
    ...(dateOnly(raw.camp_end) ? { endDate: dateOnly(raw.camp_end) } : {}),
    ...(raw.camp_terms ? { terms: raw.camp_terms.slice(0, 1500) } : {}),
  };
  return out;
}
