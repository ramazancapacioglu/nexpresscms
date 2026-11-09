/** Yayınlanmış bir içeriğin ağırlığı. Skor uydurulmaz; eşikler not üretir. */

export interface BlockInspection {
  blockCount: number;
  imageCount: number;
  imagesMissingAlt: number;
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
  missingMeta: boolean;
  seoScore: number;
}

export type ContentWeightBand = "light" | "heavy" | "critical";

export interface ContentWeight extends ContentWeightInput {
  band: ContentWeightBand;
  notes: string[];
}

/** Blok ağacındaki görselleri ve düğüm sayısını sayar. */
export function inspectBlocks(value: unknown): BlockInspection {
  let blockCount = 0;
  let imageCount = 0;
  let imagesMissingAlt = 0;
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;
    const record = node as { type?: unknown; props?: Record<string, unknown>; children?: unknown };
    if (typeof record.type === "string") {
      blockCount += 1;
      if (record.type === "image_figure" || record.type === "image") {
        imageCount += 1;
        const alt = String(record.props?.altText ?? record.props?.alt ?? "").trim();
        if (!alt) imagesMissingAlt += 1;
      }
    }
    if (record.children) walk(record.children);
  };
  walk(value);
  return { blockCount, imageCount, imagesMissingAlt };
}

/** Uzun metin ve kalabalık blok kritik, eksik alt veya meta ağır sayılır. */
export function weighContent(input: ContentWeightInput): ContentWeight {
  const notes: string[] = [];
  if (input.markdownChars > 60_000) notes.push("Metin 60 bin karakteri aşıyor");
  else if (input.markdownChars > 25_000) notes.push("Metin uzun");
  if (input.blockCount > 120) notes.push("Blok sayısı 120’yi aşıyor");
  else if (input.blockCount > 60) notes.push("Blok sayısı yüksek");
  if (input.imagesMissingAlt > 0) notes.push(`${input.imagesMissingAlt} görselde alt metin yok`);
  if (input.missingMeta) notes.push("Meta açıklama boş");
  const band: ContentWeightBand =
    input.markdownChars > 60_000 || input.blockCount > 120 ? "critical" : notes.length > 0 ? "heavy" : "light";
  return { ...input, band, notes };
}
