import { parseMediaRef } from "./media";

/** Yayınlanmış bir içeriğin ağırlığı ve Core Web Vitals (LCP / CLS / DOM) risk analizi. Skor uydurulmaz; somut eşikler not üretir. */

export interface BlockInspection {
  blockCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  /** Boyut bilgisi (`?w=&h=` veya `width`/`height`) olmayan görsel sayısı (CLS kayma riski) */
  imagesMissingDimensions: number;
  /** Üçüncü taraf iframe / gömülü medya (`video_embed`, `map_embed`) sayısı */
  embedCount: number;
  /** Blok ağacının maksimum iç içe geçme derinliği (DOM derinliği) */
  maxDepth: number;
  /** İlk ekranda (ilk üst düzey blokta) ağır iframe/harita/video var mı (LCP gecikme riski) */
  firstFoldHeavy: boolean;
}

export interface ContentWeightInput {
  id: string;
  title: string;
  slug: string;
  type: string;
  markdownChars: number;
  blockCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  imagesMissingDimensions?: number;
  embedCount?: number;
  maxDepth?: number;
  firstFoldHeavy?: boolean;
  missingMeta: boolean;
  seoScore: number;
}

export type ContentWeightBand = "light" | "heavy" | "critical";

export interface ContentWeight extends ContentWeightInput {
  band: ContentWeightBand;
  notes: string[];
  /** Tahmini RSC HTML çıktı ağırlığı (KB) */
  estimatedHtmlKb: number;
}

function hasIntrinsicDimensions(url: string, props?: Record<string, unknown>): boolean {
  if (!url) return true;
  if (parseMediaRef(url)) return true;
  const w = Number(props?.width ?? 0);
  const h = Number(props?.height ?? 0);
  return Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0;
}

/** Blok ağacındaki görselleri, CLS boyut eksiklerini, gömülü iframe'leri ve ağaç derinliğini sayar. */
export function inspectBlocks(value: unknown): BlockInspection {
  let blockCount = 0;
  let imageCount = 0;
  let imagesMissingAlt = 0;
  let imagesMissingDimensions = 0;
  let embedCount = 0;
  let maxDepth = 0;
  let firstFoldHeavy = false;

  const topList = Array.isArray(value) ? value : [];

  const walk = (node: unknown, depth: number, isFirstRootBranch: boolean) => {
    if (Array.isArray(node)) {
      node.forEach((child, idx) => walk(child, depth, isFirstRootBranch && idx === 0));
      return;
    }
    if (!node || typeof node !== "object") return;
    const record = node as { type?: unknown; props?: Record<string, unknown>; children?: unknown };
    if (typeof record.type === "string") {
      blockCount += 1;
      if (depth > maxDepth) maxDepth = depth;

      const t = record.type;
      if (t === "image_figure" || t === "image" || t === "image_overlay") {
        imageCount += 1;
        const alt = String(record.props?.altText ?? record.props?.alt ?? "").trim();
        if (!alt) imagesMissingAlt += 1;
        const url = String(record.props?.url ?? record.props?.imageUrl ?? record.props?.src ?? "").trim();
        if (url && !hasIntrinsicDimensions(url, record.props)) {
          imagesMissingDimensions += 1;
        }
      } else if (t === "video_embed" || t === "map_embed") {
        embedCount += 1;
        if (isFirstRootBranch) firstFoldHeavy = true;
      } else if (t === "slider" && isFirstRootBranch) {
        const slides = Array.isArray(record.props?.slides) ? record.props.slides : [];
        if (slides.length > 3) firstFoldHeavy = true;
      }
    }
    if (record.children) walk(record.children, depth + 1, isFirstRootBranch);
  };

  topList.forEach((rootNode, idx) => walk(rootNode, 1, idx === 0));
  return {
    blockCount,
    imageCount,
    imagesMissingAlt,
    imagesMissingDimensions,
    embedCount,
    maxDepth,
    firstFoldHeavy,
  };
}

/** Uzun metin ve kalabalık blok kritik; CLS/LCP/eksik alt veya meta ağır sayılır. */
export function weighContent(input: ContentWeightInput): ContentWeight {
  const notes: string[] = [];
  const missingDims = input.imagesMissingDimensions ?? 0;
  const embeds = input.embedCount ?? 0;
  const depth = input.maxDepth ?? 1;

  if (input.markdownChars > 60_000) notes.push("Metin 60 bin karakteri aşıyor");
  else if (input.markdownChars > 25_000) notes.push("Metin uzun (>25B krk)");
  if (input.blockCount > 120) notes.push("Blok sayısı 120’yi aşıyor");
  else if (input.blockCount > 60) notes.push("Blok sayısı yüksek (>60)");
  if (input.imagesMissingAlt > 0) notes.push(`${input.imagesMissingAlt} görselde alt metin yok`);
  if (missingDims > 0) notes.push(`${missingDims} görselde boyut yok (CLS riski)`);
  if (input.firstFoldHeavy) notes.push("İlk ekranda ağır gömülü blok (LCP riski)");
  if (embeds > 2) notes.push(`${embeds} gömülü video/harita (üçüncü taraf yükü)`);
  if (depth > 6) notes.push(`DOM derinliği yüksek (${depth} katman)`);
  if (input.missingMeta) notes.push("Meta açıklama boş");

  const estimatedHtmlKb = Math.max(
    1,
    Math.round((input.markdownChars * 1.35 + input.blockCount * 180) / 1024)
  );

  const band: ContentWeightBand =
    input.markdownChars > 60_000 || input.blockCount > 120
      ? "critical"
      : notes.length > 0
        ? "heavy"
        : "light";
  return { ...input, band, notes, estimatedHtmlKb };
}

export interface CustomizerPerformanceAudit {
  customCssBytes: number;
  hasHeaderScripts: boolean;
  hasFooterScripts: boolean;
  zeroKbClean: boolean;
  warnings: string[];
}

/**
 * Tema özelleştiricideki özel CSS ve özel betik alanlarını 0-KB RSC kuralına göre denetler.
 */
export function auditCustomizerPerformance(input: {
  customCss?: string | null;
  headerScripts?: string | null;
  footerScripts?: string | null;
}): CustomizerPerformanceAudit {
  const css = (input.customCss ?? "").trim();
  const header = (input.headerScripts ?? "").trim();
  const footer = (input.footerScripts ?? "").trim();
  const customCssBytes = new TextEncoder().encode(css).length;
  const hasHeaderScripts = header.length > 0;
  const hasFooterScripts = footer.length > 0;
  const warnings: string[] = [];

  if (hasHeaderScripts) {
    warnings.push("Özelleştiricide üst (header) betiği tanımlı: ziyaretçi sayfalarına ek JS/ağ isteği ekler.");
  }
  if (hasFooterScripts) {
    warnings.push("Özelleştiricide alt (footer) betiği tanımlı: ziyaretçi sayfalarına ek JS/ağ isteği ekler.");
  }
  if (customCssBytes > 32_768) {
    warnings.push(`Özel CSS boyutu yüksek (${(customCssBytes / 1024).toFixed(1)} KB > 32 KB): ilk boyama (FCP) süresini uzatabilir.`);
  }

  return {
    customCssBytes,
    hasHeaderScripts,
    hasFooterScripts,
    zeroKbClean: !hasHeaderScripts && !hasFooterScripts && customCssBytes <= 32_768,
    warnings,
  };
}
