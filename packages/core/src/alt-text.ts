/**
 * Görsel alt metni üretimi (saf mantık): model istemi ve yanıt temizliği. Ağ çağrısı çağıranda (`ChatClient.completeJsonWithImage`).
 * Alt metin: görseli görmeyen okuyucuya (ve arama motoruna) görselin içeriğini ve işlevini anlatan kısa, düz cümledir.
 */
export const ALT_MAX = 125;

export interface AltTextHints {
  siteName?: string;
  /** Kitaplıktaki ad ya da başlık (varsa) */
  title?: string;
  filename?: string;
  /** İçerik dili (örn. `tr`) */
  locale?: string;
}

const LANG: Record<string, string> = { tr: "Türkçe", en: "English", de: "Deutsch", fr: "Français", es: "Español" };

export function altTextRequest(hints: AltTextHints): { system: string; user: string } {
  const language = LANG[(hints.locale ?? "tr").slice(0, 2)] ?? "Türkçe";
  const cleanName = (hints.filename ?? "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").trim();
  return {
    system: [
      `Sen bir web erişilebilirliği ve görsel SEO uzmanısın. Verilen görsel için ${language} alt metin yaz.`,
      `Kurallar: en çok ${ALT_MAX} karakter; görselde gerçekten görülen konuyu ve (varsa) görselde yazan metni anlat; "görsel", "fotoğraf", "resim" ile başlama; anahtar kelime doldurma yok; görselde olmayan şey uydurma;`,
      "marka ya da ürün adını yalnızca ipucunda geçiyorsa veya görselde okunuyorsa yaz; kişileri adlarıyla tanımlama; tek, düz cümle.",
      'Yanıtı yalnızca JSON olarak ver: {"alt": "..."}',
    ].join(" "),
    user: [
      hints.siteName ? `Site: ${hints.siteName}.` : "",
      hints.title ? `Kitaplık başlığı: ${hints.title}.` : "",
      cleanName ? `Dosya adı ipucu: ${cleanName}.` : "",
      "Bu görsel için alt metni yaz.",
    ].filter(Boolean).join(" "),
  };
}

const PREFIX = /^(?:g[öo]rsel|foto[ğg]raf|resim|image|picture|photo)\s*[:\-–—]?\s+/i;

/** Model yanıtından alt metni çıkarır: HTML ve tırnaklar temizlenir, "Görsel:" öneki atılır, sınır kelime sonunda uygulanır. Boşsa null. */
export function parseAltText(raw: string): string | null {
  let alt = "";
  try {
    const parsed = JSON.parse(raw) as { alt?: unknown };
    alt = typeof parsed.alt === "string" ? parsed.alt : "";
  } catch {
    alt = "";
  }
  alt = alt.replace(/<[^>]*>/g, " ").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();
  alt = alt.replace(PREFIX, "").trim();
  if (alt.length > ALT_MAX) {
    const cut = alt.slice(0, ALT_MAX);
    const space = cut.lastIndexOf(" ");
    alt = (space > 60 ? cut.slice(0, space) : cut).replace(/[,;:\s-]+$/, "");
  }
  alt = alt.replace(/[.]+$/, "").trim();
  return alt.length >= 3 ? alt : null;
}
