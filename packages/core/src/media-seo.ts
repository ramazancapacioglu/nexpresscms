/**
 * Medya SEO'su (saf): tür tanıma, SEO dostu dosya adı, kaynak başına puan ve uyarılar.
 * Görsel işleme ve depolama `apps/cms/src/lib/media` içindedir; burada Node/DOM bağımlılığı yoktur.
 */
export type MediaKind = "image" | "document" | "video" | "audio";

/** Görsel olmayan yüklemelerde kabul edilen türler (içerik başlığına bakılarak doğrulanır, uzantıya değil). */
export const FILE_KINDS: Record<string, { kind: Exclude<MediaKind, "image">; ext: string; inline: boolean }> = {
  "application/pdf": { kind: "document", ext: "pdf", inline: true },
  "video/mp4": { kind: "video", ext: "mp4", inline: true },
  "video/webm": { kind: "video", ext: "webm", inline: true },
  "audio/mpeg": { kind: "audio", ext: "mp3", inline: true },
  "audio/ogg": { kind: "audio", ext: "ogg", inline: true },
  "audio/wav": { kind: "audio", ext: "wav", inline: true },
};

/** Dosyanın ilk baytlarına bakarak izin verilen görsel olmayan türü bulur; tanınmazsa null. */
export function sniffFileMime(b: Uint8Array): string | null {
  const ascii = (a: number, n: number) => String.fromCharCode(...b.subarray(a, a + n));
  if (b.length < 12) return null;
  if (ascii(0, 5) === "%PDF-") return "application/pdf";
  if (ascii(4, 4) === "ftyp") return /^(avif|avis|heic|heix|hevc|mif1|msf1)$/.test(ascii(8, 4)) ? null : "video/mp4"; // AVIF/HEIF görseldir
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "video/webm";
  if (ascii(0, 3) === "ID3" || (b[0] === 0xff && (b[1]! & 0xe0) === 0xe0)) return "audio/mpeg";
  if (ascii(0, 4) === "OggS") return "audio/ogg";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE") return "audio/wav";
  return null;
}

export const kindOfMime = (mime: string): MediaKind => (mime.startsWith("image/") ? "image" : (FILE_KINDS[mime]?.kind ?? "document"));

/** Başlık/dosya adından arama motoru dostu ad: küçük harf, Türkçe karakter sadeleşmiş, tire ile (en çok 60). */
export function seoFileSlug(input: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", i̇: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  const base = input.replace(/\.[A-Za-z0-9]{2,5}$/, "").toLocaleLowerCase("tr").replace(/[çğıöşüâîû]/g, (c) => map[c] ?? c);
  const slug = base.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "");
  return slug || "dosya";
}

/** Kameranın/telefonun verdiği anlamsız adlar (IMG_1234, DSC0001, WhatsApp Image…, Screenshot…, 20240101_…). */
export function isGenericFilename(name: string): boolean {
  const n = name.replace(/\.[A-Za-z0-9]{2,5}$/, "").trim();
  return /^(img|dsc|dscn|dscf|pxl|mvimg|image|resim|foto|photo|screenshot|screen shot|whatsapp image|wp|untitled|adsiz|gorsel)[ _-]?\d*/i.test(n) && n.replace(/\D/g, "").length >= 2 || /^\d{6,}([_-]\d+)*$/.test(n) || n.length < 3;
}

/** Dosya adından insan okunur varsayılan başlık: "kirmizi-ayakkabi_01.jpg" -> "Kirmizi ayakkabi 01". */
export function titleFromFilename(name: string): string {
  const t = name.replace(/\.[A-Za-z0-9]{2,5}$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return t ? t.charAt(0).toLocaleUpperCase("tr") + t.slice(1) : "";
}

export interface MediaSeoInput {
  kind: MediaKind;
  filename: string;
  altText: string;
  titleText?: string | null;
  caption?: string | null;
  description?: string | null;
  width?: number;
  height?: number;
  sizeBytes: number;
  mimeType: string;
}

export interface MediaSeoReport {
  score: number;
  issues: Array<{ code: string; message: string; severity: "error" | "warn" | "info" }>;
}

const KB = 1024;

/** 0–100 puan ve düzeltilecekler. Ölçütler yalnızca gerçek veriye bakar (uydurma puan yok). */
export function scoreMediaSeo(m: MediaSeoInput): MediaSeoReport {
  const issues: MediaSeoReport["issues"] = [];
  let score = 100;
  const lose = (n: number, code: string, message: string, severity: "error" | "warn" | "info" = "warn") => {
    score -= n;
    issues.push({ code, message, severity });
  };
  const alt = m.altText.trim();
  if (m.kind === "image") {
    if (!alt) lose(35, "alt-missing", "Alt metin yok: erişilebilirlik ve görsel arama için gerekli.", "error");
    else {
      if (alt.length < 8) lose(10, "alt-short", "Alt metin çok kısa (en az 8 karakter, görseli betimleyin).");
      if (alt.length > 125) lose(8, "alt-long", "Alt metin 125 karakteri aşıyor; kısaltın.");
      if (/^(görsel|resim|foto|fotoğraf|image|img|photo|picture)\b/i.test(alt)) lose(6, "alt-prefix", "Alt metin \"görsel/resim\" ile başlamamalı; ekran okuyucu zaten bildirir.", "info");
      if (alt.toLowerCase() === (m.titleText ?? "").trim().toLowerCase() && alt) lose(0, "alt-same-title", "Alt metin ve başlık aynı; başlığı farklılaştırmak isteğe bağlıdır.", "info");
    }
    if (isGenericFilename(m.filename)) lose(12, "filename-generic", "Dosya adı anlamsız (örn. IMG_1234); açıklayıcı bir ad kullanın.");
    if (!(m.titleText ?? "").trim()) lose(5, "title-missing", "Başlık yok.", "info");
    const w = m.width ?? 0;
    if (w > 0 && w < 600) lose(8, "too-small", "Görsel dar (<600 px): sosyal paylaşım ve arama sonuçlarında küçük görünür.");
    if (m.sizeBytes > 1500 * KB) lose(10, "heavy", "Özgün dosya 1,5 MB'tan büyük; sunum türevleri küçültür ama yükleme öncesi sıkıştırmak iyidir.", "info");
  } else {
    if (!(m.titleText ?? "").trim()) lose(25, "title-missing", "Başlık yok: bağlantı metni ve arama sonuçları için gerekli.", "error");
    if (!(m.description ?? "").trim()) lose(20, "description-missing", "Açıklama yok: dosyanın içeriğini 1–2 cümleyle anlatın.");
    if (isGenericFilename(m.filename)) lose(10, "filename-generic", "Dosya adı anlamsız; açıklayıcı bir ad kullanın.");
    if (m.kind === "video" && !(m.caption ?? "").trim()) lose(10, "transcript-missing", "Video için kısa bir özet/alt yazı ekleyin (erişilebilirlik).", "info");
    if (m.kind === "audio" && !(m.description ?? "").trim()) lose(0, "transcript-hint", "Ses için metin dökümü eklemek erişilebilirliği ve aramayı iyileştirir.", "info");
  }
  return { score: Math.max(0, Math.min(100, score)), issues };
}
