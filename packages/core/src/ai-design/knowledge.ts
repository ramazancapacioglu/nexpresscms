import { AI_BLOCK_CATALOG, AI_BLOCK_STYLE_KEYS, type FieldSpec } from "./catalog";
import { CONTRAST_PAIRS, SAFE_FONT_FAMILIES } from "./theme-lint";

/** AI'ın "CMS bilgisi": komut metni kataloğtan ve kural listesinden üretilir; elle yazılmış ikinci bir sözleşme yoktur. */
export type DesignMode = "section" | "page" | "theme";

export interface DesignSiteContext {
  siteName?: string;
  tagline?: string;
  locale?: string;
  sector?: string;
  audience?: string;
  tone?: string;
  positioning?: string;
  siteDna?: string;
  knownPaths?: string[];
  media?: Array<{ id: string; alt: string }>;
  forms?: Array<{ id: string; name: string }>;
}

/** Kullanıcıya da gösterilen kural özeti (panelde "AI bu sınırlara uyar"). */
export const AI_DESIGN_RULES: Record<DesignMode, string[]> = {
  section: [
    "Yalnızca katalogdaki bloklar; bilinmeyen alanlar atılır, uzun metinler kısaltılır.",
    "Metinler düz metindir (HTML, betik, satır içi stil, iframe yok); ön yüzde 0 KB istemci JS kuralı.",
    "Görsel yalnızca medya kitaplığından (/media/…) ve alt metinle; bağlantılar güvenli şemalarla sınırlıdır.",
    "Sayı, fiyat ve yorum uydurmaz; yer tutucu içeren bloklar \"gerçek verilerle güncelleyin\" uyarısı alır.",
  ],
  page: [
    "İlk blok hero (tek h1); başlıklar h2–h4 ve düzey atlamaz.",
    "Hero'dan hemen sonra 40–260 karakterlik Answer-First tldr_box.",
    "En çok 14 bölüm, en çok 6 çağrı düğmesi; uzun sayfada SSS (FAQPage şeması).",
    "İç bağlantılar sitede var olan yollara gider; olmayan yol uyarı olur.",
    "Aşağıdakiler de geçerlidir: bölüm kuralları.",
  ],
  theme: [
    "Tüm renkler #rrggbb; metin/zemin çiftlerinde WCAG AA kontrastı (≥4.5:1; büyük öğeler ≥3:1).",
    "Koyu kip renkleri tanımlanır ve ayrıca kontrast denetimine girer.",
    "Yazı tipleri sistem yazı tipleridir (dosya yüklenmez); yedek olarak genel aile bulunur.",
    "Geometri: yarıçap ≤ 32 px, kapsayıcı 960–1440 px, bölüm aralığı 24–160 px.",
  ],
};

function fieldText(spec: FieldSpec): string {
  switch (spec.kind) {
    case "text": return `metin ≤${spec.max}${spec.required ? ", zorunlu" : ""}`;
    case "url": return `bağlantı${spec.required ? " (zorunlu)" : ""}`;
    case "image": return `medya görseli (/media/med_…)${spec.required ? ", zorunlu" : ""}`;
    case "enum": return spec.values.join(" | ");
    case "number": return `tam sayı ${spec.min}–${spec.max}`;
    case "boolean": return "true | false";
    case "strings": return `metin dizisi ≤${spec.maxItems} öğe, her biri ≤${spec.maxLen}`;
    case "matrix": return `satırlar: dizi dizisi ≤${spec.maxRows}×${spec.maxCols}, hücre ≤${spec.maxLen}`;
    case "list": return `liste ${spec.minItems ?? 0}–${spec.maxItems} öğe { ${Object.entries(spec.item).map(([k, s]) => `${k}: ${fieldText(s)}`).join("; ")} }`;
  }
}

export function describeBlockCatalog(): string {
  return Object.entries(AI_BLOCK_CATALOG)
    .map(([type, b]) => {
      const props = Object.entries(b.props).map(([k, s]) => `    - ${k}: ${fieldText(s)}`).join("\n");
      const meta = [b.variants ? `variant: ${b.variants.join(" | ")}` : "", b.maxPerPage ? `sayfada en çok ${b.maxPerPage}` : ""].filter(Boolean).join("; ");
      return `* ${type} — ${b.label}. ${b.usage}${meta ? ` (${meta})` : ""}\n${props}`;
    })
    .join("\n");
}

const SEO_RULES = `SEO/GEO KURALLARI (ihlal doğrulamada reddedilir veya puan düşürür):
- Sayfada TEK h1 vardır ve onu hero.title verir; başka blok h1 üretmez, heading düzeyleri 2–4'tür ve atlanmaz.
- Hero'dan hemen sonra 40–260 karakterlik Answer-First tldr_box: ilk cümle soruyu doğrudan yanıtlar, marka adı ve ana konu geçer.
- Her bölüm tek fikir; paragraflar 2–4 cümle; ilk cümle konuyu söyler (yapay zeka alıntılaması için).
- Sorular gerçek kullanıcı sorularıdır ve yanıt ilk cümlede cevabı verir; SSS 3–8 öğe (FAQPage şeması otomatik).
- Anahtar kelime doğal geçer (hero başlığı, tldr, bir h2); doldurma yok.
- Çağrı düğmeleri net eylem fiili içerir ("Teklif iste"), bir sayfada en çok 6; birincil eylem tektir.
- İç bağlantılar yalnızca "Var olan sayfalar" listesindeki yollara gider; yol uydurma.
- Görsel yalnızca "Medya kitaplığı" listesindeki kimliklerle ve anlamlı alt metinle; listede yoksa görsel kullanma.
- Sayı, fiyat, yorum, puan, müşteri adı UYDURMA. Kullanıcı vermediyse stats_strip/pricing_table kullanma ya da açıkça makul ve genel ifade kullan.
- Metin düz metindir: HTML, markdown, emoji dizileri, betik yok. Dil: sitenin dili.
- Yapay zeka klişelerinden kaçın ("dijital dünyada", "sınırları zorlayan", "devrim niteliğinde").
- YERLEŞİM VE TAŞMA ÖNLEME KURALLARI:
  * Kart ızgaralarında (bento_features) öğe sayısına göre dengeli sütun seç (3, 6, 9 öğe için columns: 3; 4, 8 öğe için columns: 4; 2, 4 öğe için columns: 2).
  * Madde veya modül bağlantı listelerinde 6+ öğe varsa icon_list içinde columns: 2 veya columns: 3 kullanarak dikey uzamayı ve boşluğu önle.
  * Başlık ile paragraf metnini asla tek alanda birleştirme; her kartın başlığı ≤70, açıklaması ≤240 karakter olsun.
  * Koyu arka plan renklerinde (#0b4b8a, #09589a, #0c644e, #060a0d) metin rengini daima #ffffff olarak ayarla.`;

const THEME_SPEC = `TEMA JETONLARI (tokens):
{ "colors": { "primary","primaryForeground","secondary","secondaryForeground","accent","accentForeground","background","foreground","muted","mutedForeground","border" (hepsi #rrggbb) },
  "darkColors": { aynı anahtarlar; yalnızca değişenler yeterli },
  "typography": { "headingFont","bodyFont","monoFont" (CSS yığını, yalnızca sistem yazı tipleri), "baseSizePx": 15–20, "scaleRatio": 1.1–1.5 },
  "geometry": { "borderRadius": "8px", "containerMaxWidth": "1200px", "sectionSpacingY": "64px", "cardShadow": "none|sm|md|lg|glow" } }
Kontrast çiftleri (en az oran): ${CONTRAST_PAIRS.map(([a, b, m]) => `${a}/${b} ≥ ${m}`).join(", ")}.
Güvenli yazı tipleri: ${SAFE_FONT_FAMILIES.join(", ")}. Web yazı tipi dosyası yüklenmez; yedek olarak serif | sans-serif | monospace | system-ui yazın.`;

const SHAPES: Record<DesignMode, string> = {
  section: `ÇIKTI (yalnızca JSON). Blok alanları HER ZAMAN "props" nesnesinin içindedir, bloğun köküne yazılmaz. Örnek blok: { "type": "hero", "props": { "title": "…", "subtitle": "…", "primaryCtaLabel": "…", "primaryCtaHref": "/tr/iletisim" } }.
{ "name": "kısa ad", "description": "tek cümle", "category": "text|hero|page_title|accordion|location|subscribe|testimonials|stats|list|people|product|cards|contact|posts|pricing|cta|timeline|data_table|comparison|menu|tabs|image_text|gallery|video_text|logos", "blocks": [ { "type": "...", "variant": "(isteğe bağlı)", "gridSpan": {"desktop":12,"tablet":12,"mobile":12}, "props": { ... }, "style": { ${AI_BLOCK_STYLE_KEYS.join(", ")} (isteğe bağlı; renkler #rrggbb, kontrast ≥4.5:1) } } ] }  — 1 ile 3 blok.`,
  page: `ÇIKTI (yalnızca JSON): { "title": "sayfa başlığı", "slug": "kucuk-harf-tireli", "type": "page", "schemaType": "WebPage|AboutPage|FAQPage|Product", "tldr": "40–260 karakter özet", "metaTitle": "≤60 karakter", "metaDescription": "70–160 karakter", "blocks": [ ...blok düğümleri (bölüm biçimiyle aynı) ] }`,
  theme: `ÇIKTI (yalnızca JSON): { "id": "kucuk-harf-tire", "name": "Tema adı", "tagline": "≤120 karakter", "description": "≤300 karakter", "tokens": { ... } }  (üst/alt bilgi şablonlarına dokunulmaz; yalnızca tasarım jetonları üretilir)`,
};

/** Modele verilecek sistem komutu. `ctx` boş olabilir; dolu alanlar "Site bağlamı" olarak eklenir. */
export function buildDesignSystemPrompt(mode: DesignMode, ctx: DesignSiteContext = {}): string {
  const brand = [
    ctx.siteName && `Site: ${ctx.siteName}${ctx.tagline ? ` — ${ctx.tagline}` : ""}`,
    `Dil: ${ctx.locale ?? "tr"}`,
    ctx.sector && `Sektör: ${ctx.sector}`,
    ctx.audience && `Hedef kitle: ${ctx.audience}`,
    ctx.tone && `Ton: ${ctx.tone}`,
    ctx.positioning && `Konumlandırma: ${ctx.positioning}`,
    ctx.siteDna && `Site DNA (üslup özeti):\n${ctx.siteDna.slice(0, 1200)}`,
  ].filter(Boolean).join("\n");
  const lists = [
    ctx.knownPaths?.length ? `Var olan sayfalar (iç bağlantı yalnızca bunlardan): ${ctx.knownPaths.slice(0, 60).join(", ")}` : "Var olan sayfa listesi verilmedi: iç bağlantıyı yalnızca # çapa veya /{dil}/iletisim gibi genel yollarla sınırla.",
    ctx.media?.length ? `Medya kitaplığı (görsel için yalnızca bu kimlikler): ${ctx.media.slice(0, 30).map((m) => `/media/${m.id} ("${m.alt.slice(0, 50)}")`).join("; ")}` : "Medya kitaplığı boş: görsel kullanma.",
    ctx.forms?.length ? `Var olan formlar (form_block için formId): ${ctx.forms.map((f) => `${f.id} ("${f.name}")`).join(", ")}` : "Var olan form yok: form_block kullanma.",
  ].join("\n");
  return [
    `Sen NexPress CMS için tasarım yapan bir uzmansın (Next.js 15, RSC, ziyaretçi sayfalarında 0 KB istemci JS). Kullanıcının tarifine göre ${mode === "theme" ? "bir TEMA" : mode === "page" ? "tam bir SAYFA" : "yeniden kullanılabilir BÖLÜM(LER)"} üret.`,
    "Yanıtın yalnızca geçerli JSON olmalı: açıklama, markdown çiti, yorum yok.",
    "SİTE BAĞLAMI:\n" + brand,
    lists,
    mode === "theme" ? THEME_SPEC : `BLOK KATALOĞU (yalnızca bunlar; başka tür kullanma):\n${describeBlockCatalog()}\n\n${SEO_RULES}`,
    SHAPES[mode],
    "Sınırların dışına çıkarsan çıktın otomatik temizlenir veya reddedilir; sınırlar içinde kal.",
  ].join("\n\n");
}
