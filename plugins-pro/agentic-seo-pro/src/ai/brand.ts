/** Marka profili ve Site DNA (saf mantık): stil örnekleri, DNA istemi ve çıktı doğrulama. */
export interface BrandSample {
  title: string;
  type: string;
  markdown: string;
  seoScore: number;
  isHome?: boolean;
}

export interface BrandProfile {
  sector?: string;
  audience?: string;
  positioning?: string;
  siteDna?: string | null;
  styleExamples?: string[];
}

export const MAX_STYLE_EXAMPLES = 3;
const EXAMPLE_CHARS = 380;
export const DNA_MAX_CHARS = 2400;

const plain = (md: string) =>
  md
    .replace(/^#{1,6}\s+.*$/gm, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Kısa, yüksek SEO skorlu, düz paragraf içeren içeriklerden markanın sesini taşıyan kesitler seçer. */
export function pickStyleExamples(samples: BrandSample[], max = MAX_STYLE_EXAMPLES): string[] {
  return samples
    .filter((s) => !s.isHome)
    .map((s) => ({ s, text: plain(s.markdown) }))
    .filter(({ text }) => text.length >= 200)
    .sort((a, b) => b.s.seoScore - a.s.seoScore || b.text.length - a.text.length)
    .slice(0, max)
    .map(({ text }) => (text.length > EXAMPLE_CHARS ? `${text.slice(0, EXAMPLE_CHARS).replace(/\s+\S*$/, "")}…` : text));
}

/** Prompt'a eklenecek marka bağlamı (boş alanlar atlanır). */
export function brandContextBlock(p: BrandProfile): string {
  const lines: string[] = [];
  if (p.sector) lines.push(`Sektör: ${p.sector}`);
  if (p.audience) lines.push(`Hedef kitle: ${p.audience}`);
  if (p.positioning) lines.push(`GEO/LLM konumlandırma: ${p.positioning}`);
  if (p.siteDna) lines.push(`Site kimliği (Site DNA):\n${p.siteDna.slice(0, DNA_MAX_CHARS)}`);
  if (p.styleExamples?.length) lines.push(`Marka stil örnekleri (üslubu taklit et, içeriği kopyalama):\n${p.styleExamples.map((e, i) => `${i + 1}) ${e}`).join("\n")}`);
  return lines.join("\n");
}

export function buildDnaSystemPrompt(): string {
  return [
    "Sen bir marka stratejisti ve GEO (yapay zeka arama) uzmanısın.",
    "Verilen site içeriklerinden sitenin KİMLİĞİNİ çıkar: kim, ne sunuyor, kime, hangi dille, hangi ürün/hizmet adlarıyla.",
    "Yalnızca verilen içeriğe dayan; bilgi, rakam, müşteri adı uydurma. Emin olmadığın şeyi yazma.",
    "4–6 kısa paragraf düz Türkçe yaz (başlık, madde işareti, süslü ifade yok). Yanıtı yalnızca JSON olarak ver: {\"dna\": \"...\"}",
  ].join("\n");
}

export function buildDnaUserPrompt(input: { siteName: string; tagline?: string | null; samples: Array<{ title: string; type: string; excerpt: string }> }): string {
  const parts = input.samples.map((s, i) => `[${i + 1}] (${s.type}) ${s.title}\n${s.excerpt}`);
  return [`Site adı: ${input.siteName}`, input.tagline ? `Slogan: ${input.tagline}` : "", "", "İçerik özetleri:", ...parts].filter((x) => x !== "").join("\n");
}

/** Site DNA örneklemesi: ana sayfa + en önemli içerikler, kısaltılmış. */
export function dnaSamples(samples: Array<BrandSample & { importanceScore: number }>, max = 8) {
  return [...samples]
    .sort((a, b) => Number(Boolean(b.isHome)) - Number(Boolean(a.isHome)) || b.importanceScore - a.importanceScore)
    .slice(0, max)
    .map((s) => ({ title: s.title, type: s.type, excerpt: plain(s.markdown).slice(0, 500) }))
    .filter((s) => s.excerpt.length > 0);
}

export function parseDna(raw: string): string {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    throw new Error("Model geçersiz JSON döndürdü.");
  }
  const dna = typeof (obj as { dna?: unknown })?.dna === "string" ? (obj as { dna: string }).dna.replace(/\n{3,}/g, "\n\n").trim() : "";
  if (dna.length < 80) throw new Error("Model yeterli bir kimlik özeti üretemedi.");
  return dna.slice(0, DNA_MAX_CHARS);
}
