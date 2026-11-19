/**
 * İlgili içerik sıralaması (saf): ortak etiket, ortak kategori ve başlık sözcük örtüşmesi. Ziyaretçi sayfalarında iç bağlantı
 * kümesi kurar (ürün ↔ yazı ↔ rehber). Betik yok; sıralama sunucuda yapılır. Eşit puanlarda sıra, içerik çifti kimliğinden
 * türetilen sabit bir sayıyla bozulur: her hedef farklı içeriklerden bağlantı alır, hep aynı üç yazı öne çıkmaz.
 */
export interface RelatedCandidate {
  id: string;
  title: string;
  categories?: readonly string[];
  tags?: readonly string[];
}

const STOP = new Set(["nedir", "nasil", "icin", "ile", "veya", "olan", "gibi", "daha", "kadar", "hakkinda", "programi", "program", "akinsoft"]);

const fold = (value: string): string =>
  value
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

/** Başlıktaki anlamlı sözcükler: en az 4 harf, bağlaç/yaygın sözcük değil. Çekim eklerine karşı ilk 5 harf kökü kullanılır. */
export function titleTerms(title: string): Set<string> {
  const out = new Set<string>();
  for (const word of fold(title).split(/[^a-z0-9]+/)) {
    if (word.length >= 4 && !STOP.has(word)) out.add(word.slice(0, 5));
  }
  return out;
}

const hash = (value: string): number => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return (h >>> 0) % 1000;
};

/** `minScore` altındaki adaylar elenir: ilgisiz bağlantı gösterilmez. */
export function rankRelated<T extends RelatedCandidate>(current: RelatedCandidate, candidates: readonly T[], limit: number, minScore = 1): T[] {
  const myTerms = titleTerms(current.title);
  const myTags = new Set(current.tags ?? []);
  const myCats = new Set(current.categories ?? []);
  return candidates
    .filter((c) => c.id !== current.id)
    .map((c) => {
      const sharedTags = (c.tags ?? []).filter((t) => myTags.has(t)).length;
      const sharedCats = (c.categories ?? []).filter((t) => myCats.has(t)).length;
      const sharedTerms = [...titleTerms(c.title)].filter((t) => myTerms.has(t)).length;
      return { c, score: Math.min(sharedTags, 3) * 3 + Math.min(sharedCats, 2) * 2 + Math.min(sharedTerms, 3) * 2, tie: hash(`${current.id}|${c.id}`) };
    })
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .slice(0, limit)
    .map((x) => x.c);
}
