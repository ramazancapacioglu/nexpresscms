/**
 * Medya hattının saf kısmı: kaynak başvurusu, türev adresleri, srcset üretimi.
 * Görsel işleme (sharp) ve depolama `apps/cms/src/lib/media` içindedir.
 *
 * Kaynak başvurusu: `/media/{id}?w=1600&h=900[&a=1]`
 *   w,h = özgün boyut (CLS için), a=1 = saydamlık var (yedek biçim png olur).
 * Türev adresi:   `/media/{id}/{genişlik}.{biçim}` (avif | webp | jpg | png)
 * Adresler biçimi açıkça taşır; Accept başlığına bağlı değildir, CDN'de güvenle önbelleğe alınır.
 */
export const MEDIA_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1600, 1920, 2560] as const;
export type MediaFormat = "avif" | "webp" | "jpg" | "png";
export const MEDIA_FORMATS: readonly MediaFormat[] = ["avif", "webp", "jpg", "png"];
export const MEDIA_MIME: Record<MediaFormat, string> = {
  avif: "image/avif",
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
};
/** Yüklemede kabul edilen kaynak türleri (SVG ve animasyonlu GIF bilerek dışarıda). */
export const UPLOAD_MIME_ALLOWLIST = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

export interface MediaRef {
  id: string;
  width: number;
  height: number;
  hasAlpha: boolean;
}

export function buildMediaRef(ref: MediaRef): string {
  return `/media/${ref.id}?w=${ref.width}&h=${ref.height}${ref.hasAlpha ? "&a=1" : ""}`;
}

/**
 * Görsel sunum yönergesi: her görsel alanı için kırpma biçimi, kadraj noktası ve yakınlaştırma.
 * Adresin sonuna `#nx:fit=contain;x=30;y=70;z=1.4` olarak eklenir. Parça sunucuya gitmez, medya başvurusunu
 * ve dış adresleri bozmaz; yönerge olmayan eski içerik değişmeden çalışır. Çizim `ResponsiveImage`'dadır.
 */
export interface ImageDirectives {
  fit?: "cover" | "contain";
  /** Kadraj noktası (%), yalnızca `cover` kırpmasında etkilidir. 50/50 varsayılandır. */
  x?: number;
  y?: number;
  /** Yakınlaştırma çarpanı, 1–3. */
  zoom?: number;
}

const DIRECTIVE_RE = /#nx:([^#\s]*)$/;
const clampNum = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Adresi ve yönergeyi ayırır. Bozuk değerler atılır. */
export function parseImageDirectives(url: string | null | undefined): { url: string; directives: ImageDirectives } {
  const raw = url ?? "";
  const m = DIRECTIVE_RE.exec(raw);
  if (!m) return { url: raw, directives: {} };
  const directives: ImageDirectives = {};
  for (const part of m[1]!.split(";")) {
    const [key, value] = part.split("=");
    const n = Number(value);
    if (key === "fit" && (value === "cover" || value === "contain")) directives.fit = value;
    else if ((key === "x" || key === "y") && Number.isFinite(n)) directives[key] = Math.round(clampNum(n, 0, 100));
    else if (key === "z" && Number.isFinite(n)) directives.zoom = Math.round(clampNum(n, 1, 3) * 100) / 100;
  }
  return { url: raw.slice(0, m.index), directives };
}

/** Yönergeyi adrese yazar; varsayılan değerler (cover, 50/50, 1×) yazılmaz, hepsi varsayılansa parça kalkar. */
export function withImageDirectives(url: string, next: ImageDirectives): string {
  const base = parseImageDirectives(url).url;
  const parts: string[] = [];
  if (next.fit === "contain") parts.push("fit=contain");
  const x = next.x === undefined ? 50 : Math.round(clampNum(next.x, 0, 100));
  const y = next.y === undefined ? 50 : Math.round(clampNum(next.y, 0, 100));
  if (x !== 50) parts.push(`x=${x}`);
  if (y !== 50) parts.push(`y=${y}`);
  const zoom = next.zoom === undefined ? 1 : Math.round(clampNum(next.zoom, 1, 3) * 100) / 100;
  if (zoom !== 1) parts.push(`z=${zoom}`);
  return parts.length ? `${base}#nx:${parts.join(";")}` : base;
}

/** Yalnızca adres (ör. Markdown, site haritası, paylaşım görseli). */
export function stripImageDirectives(url: string | null | undefined): string {
  return parseImageDirectives(url).url;
}

/** Yerel medya başvurusunu çözer; dış adres veya boyutsuz başvuru için `null`. */
export function parseMediaRef(rawUrl: string | null | undefined): MediaRef | null {
  if (!rawUrl) return null;
  const url = stripImageDirectives(rawUrl);
  const m = /^\/media\/([A-Za-z0-9_-]{6,64})\?(.+)$/.exec(url);
  if (!m) return null;
  const q = new URLSearchParams(m[2]);
  const width = Number(q.get("w"));
  const height = Number(q.get("h"));
  if (!ID_RE.test(m[1]!) || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) return null;
  return { id: m[1]!, width, height, hasAlpha: q.get("a") === "1" };
}

export function isValidMediaId(id: string): boolean {
  return ID_RE.test(id);
}

export function variantPath(id: string, width: number, format: MediaFormat): string {
  return `/media/${id}/${width}.${format}`;
}

/** `1280.webp` -> `{ width: 1280, format: "webp" }`; sınırlı kümenin dışı `null` (DoS ve yol gezinmesine karşı). */
export function parseVariantFile(file: string): { width: number; format: MediaFormat } | null {
  const m = /^([1-9]\d{2,3})\.(avif|webp|jpg|png)$/.exec(file);
  if (!m) return null;
  const width = Number(m[1]);
  return (MEDIA_WIDTHS as readonly number[]).includes(width) ? { width, format: m[2] as MediaFormat } : null;
}

/** Özgün genişliği aşmayan basamaklar; özgün küçükse ilk basamak (sunucu gerçek boyuta indirir). */
export function widthsFor(originalWidth: number): number[] {
  const fit = MEDIA_WIDTHS.filter((w) => w <= originalWidth);
  return fit.length > 0 ? [...fit] : [MEDIA_WIDTHS[0]];
}

const srcSet = (id: string, widths: number[], format: MediaFormat) =>
  widths.map((w) => `${variantPath(id, w, format)} ${w}w`).join(", ");

export interface PictureSpec {
  sources: Array<{ type: string; srcSet: string }>;
  img: { src: string; srcSet: string; width: number; height: number };
}

/** `<picture>` için avif + webp kaynakları ve jpg/png yedek `<img>`. */
export function buildPictureSpec(ref: MediaRef): PictureSpec {
  const widths = widthsFor(ref.width);
  const fallback: MediaFormat = ref.hasAlpha ? "png" : "jpg";
  const mid = widths[Math.min(widths.length - 1, 3)]!;
  return {
    sources: (["avif", "webp"] as const).map((f) => ({ type: MEDIA_MIME[f], srcSet: srcSet(ref.id, widths, f) })),
    img: { src: variantPath(ref.id, mid, fallback), srcSet: srcSet(ref.id, widths, fallback), width: ref.width, height: ref.height },
  };
}

/** Küçük resim (yönetim listesi) için tek adres. */
export function thumbnailUrl(url: string, width: 320 | 480 = 320): string {
  const ref = parseMediaRef(url);
  return ref ? variantPath(ref.id, width, "webp") : stripImageDirectives(url);
}
