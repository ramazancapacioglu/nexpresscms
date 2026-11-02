/**
 * Editör güvenlik ağı (saf mantık): kaydedilmemiş değişiklik imzası ve yerel taslak kurtarma kararı.
 * Tarayıcı depolamasına dokunmaz; çağıran tarafı `localStorage` ile birleştirir.
 */
import { fnv1a64 } from "./chunker";
import { resolvePublishing } from "./site-settings";

/** Düzenlenebilir alanların kaydedilebilir görüntüsü; imza ve yerel taslak bunu kullanır. */
export interface EditorDraftFields {
  title: string;
  slug: string;
  tldr: string;
  blocks: unknown[];
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noIndex: boolean;
  schemaType: string;
  importanceScore: number;
  featuredImageUrl: string;
  featuredImageAlt: string;
  featuredImageCaption: string;
  focusKeyword: string;
  visibility: string;
  scheduledAt: string;
  categories: string[];
  tags: string[];
  allowComments: boolean;
  allowReviews: boolean;
  showShareButtons: boolean;
  /** Pro eklentinin zengin şema alanları (yoksa boş) */
  richSchema?: Record<string, unknown>;
  /** Seçilen görünüm şablonu ("" varsayılan, "none" yerleşik) */
  templateId?: string;
}

/** Kararlı imza: alan sırası sabittir, böylece aynı içerik her zaman aynı imzayı verir. */
export function draftSignature(fields: EditorDraftFields): string {
  return fnv1a64(
    JSON.stringify([
      fields.title, fields.slug, fields.tldr, fields.blocks, fields.metaTitle, fields.metaDescription, fields.canonicalUrl,
      fields.noIndex, fields.schemaType, fields.importanceScore, fields.featuredImageUrl, fields.featuredImageAlt,
      fields.featuredImageCaption, fields.focusKeyword, fields.visibility, fields.scheduledAt, fields.categories,
      fields.tags, fields.allowComments, fields.allowReviews, fields.showShareButtons,
      fields.richSchema && Object.keys(fields.richSchema).length > 0 ? fields.richSchema : null,
      fields.templateId || null,
    ])
  );
}

export interface StoredDraft {
  v: 1;
  /** Kaydedilirken kullanılan imza (içerik değişti mi karşılaştırması için) */
  signature: string;
  /** Yerel taslağın yazıldığı an (ms) */
  at: number;
  /** Bu taslağın dayandığı kaydın son güncellenme anı (ms); eski taslağı ayıklamak için */
  baseUpdatedAt: number;
  fields: EditorDraftFields;
}

/** Yerel taslak anahtarı; varsayılan (tr) dışındaki diller kendi anahtarını alır, böylece çeviri taslakları karışmaz. */
export const draftStorageKey = (siteId: string, contentId: string | undefined, type: string, locale = "tr") =>
  `nx:draft:${siteId}:${contentId ?? `new-${type}`}${locale === "tr" ? "" : `:${locale}`}`;

/** Depodan okunan ham metni doğrular; bozuk/yabancı sürüm `null` döner. */
export function parseStoredDraft(raw: string | null): StoredDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<StoredDraft>;
    if (d.v !== 1 || typeof d.signature !== "string" || typeof d.at !== "number" || typeof d.baseUpdatedAt !== "number") return null;
    if (!d.fields || typeof d.fields !== "object" || !Array.isArray(d.fields.blocks)) return null;
    return d as StoredDraft;
  } catch {
    return null;
  }
}

/**
 * Yerel taslak geri yükleme önerilmeli mi?
 * Evet, eğer taslak şu anki kayıttan FARKLIYSA ve kayıt, taslak yazıldıktan sonra başka yerde
 * (başka sekme/kişi) güncellenmediyse. Aksi halde taslak eskidir ve sessizce silinir.
 */
export function recoveryDecision(
  stored: StoredDraft | null,
  currentSignature: string,
  docUpdatedAtMs: number
): "offer" | "discard" | "none" {
  if (!stored) return "none";
  if (stored.signature === currentSignature) return "discard"; // zaten kayıtla aynı
  if (docUpdatedAtMs > stored.baseUpdatedAt) return "discard"; // kayıt, taslaktan sonra değişmiş
  return "offer";
}

/** Revizyon görüntüsünün editörün ihtiyaç duyduğu kısmı (veritabanı paketine bağımlı olmamak için yapısal tip). */
export interface SnapshotLike {
  title: string;
  slug: string;
  tldr: string | null;
  blocks: unknown[];
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  featuredImage: string | null;
  schemaType: string;
  importanceScore: number;
  schemaAttributes: Record<string, unknown>;
}

/** Revizyon görüntüsünü editör alanlarına çevirir (yayın öznitelikleri `_publishing` altından çözülür). */
export function snapshotToDraftFields(s: SnapshotLike): EditorDraftFields {
  const pub = resolvePublishing(s.schemaAttributes);
  return {
    title: s.title,
    slug: s.slug,
    tldr: s.tldr ?? "",
    blocks: s.blocks,
    metaTitle: s.metaTitle ?? "",
    metaDescription: s.metaDescription ?? "",
    canonicalUrl: s.canonicalUrl ?? "",
    noIndex: s.noIndex,
    schemaType: s.schemaType,
    importanceScore: s.importanceScore,
    featuredImageUrl: s.featuredImage ?? pub.featuredImageUrl ?? "",
    featuredImageAlt: pub.featuredImageAlt ?? "",
    featuredImageCaption: pub.featuredImageCaption ?? "",
    focusKeyword: pub.focusKeyword ?? "",
    visibility: pub.visibility,
    scheduledAt: pub.scheduledAt ?? "",
    categories: pub.categories,
    tags: pub.tags,
    allowComments: pub.allowComments,
    allowReviews: pub.allowReviews,
    showShareButtons: pub.showShareButtons,
  };
}
