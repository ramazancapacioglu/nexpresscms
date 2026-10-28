/** Yönetim araması (saf mantık): Türkçe duyarlı normalleştirme ve sıralama. */
export type AdminSearchGroup = "content" | "form" | "media" | "taxonomy" | "redirect" | "user";

export interface AdminSearchCandidate {
  group: AdminSearchGroup;
  id: string;
  title: string;
  /** Eşleşmeye katılan ek alanlar (slug, dosya adı, e-posta…) */
  haystack: string[];
  subtitle: string;
  href: string;
}

export interface AdminSearchHit {
  group: AdminSearchGroup;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const MAP: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c", â: "a", î: "i", û: "u" };

/** Küçük harf + Türkçe harfleri ASCII'ye indirir ("Işık" ≈ "isik"); arama iki yönde de bulur. */
export function normalizeSearch(s: string): string {
  return s.replace(/[ıİşŞğĞüÜöÖçÇâîû]/g, (c) => MAP[c] ?? c).toLowerCase().replace(/\s+/g, " ").trim();
}

/** 0 = eşleşme yok; yüksek = daha iyi. Tüm sorgu sözcükleri bir yerde geçmeli (VE). */
function score(title: string, haystack: string[], tokens: string[]): number {
  const t = normalizeSearch(title);
  const extra = haystack.map(normalizeSearch);
  let total = 0;
  for (const tok of tokens) {
    let best = 0;
    if (t === tok) best = 100;
    else if (t.startsWith(tok)) best = 80;
    else if (t.split(/[\s\-_/.:@]+/).some((w) => w.startsWith(tok))) best = 60;
    else if (t.includes(tok)) best = 40;
    else if (extra.some((e) => e.startsWith(tok))) best = 30;
    else if (extra.some((e) => e.includes(tok))) best = 20;
    if (best === 0) return 0;
    total += best;
  }
  return total / tokens.length;
}

export const ADMIN_SEARCH_GROUP_ORDER: AdminSearchGroup[] = ["content", "form", "taxonomy", "media", "redirect", "user"];

/** Adayları süzer ve gruplara göre sıralar (grup başına en çok `perGroup`). Sorgu 2 karakterden kısaysa boş döner. */
export function rankAdminSearch(candidates: AdminSearchCandidate[], query: string, perGroup = 5): AdminSearchHit[] {
  const tokens = normalizeSearch(query).split(" ").filter(Boolean);
  if (tokens.join("").length < 2) return [];
  const scored = candidates
    .map((c) => ({ c, s: score(c.title, c.haystack, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.c.title.localeCompare(b.c.title, "tr"));
  const out: AdminSearchHit[] = [];
  for (const group of ADMIN_SEARCH_GROUP_ORDER) {
    for (const { c } of scored.filter((x) => x.c.group === group).slice(0, perGroup)) out.push({ group: c.group, id: c.id, title: c.title, subtitle: c.subtitle, href: c.href });
  }
  return out;
}
