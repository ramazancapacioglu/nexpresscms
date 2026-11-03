import type { BlockNode } from "@nexpress/core";

export interface KbTransformResult {
  title: string;
  slug: string;
  tldr: string;
  category: string;
  blocks: BlockNode[];
}

/**
 * Ham bilgi bankası metnini, teknik notu veya müşteri sorusunu 0-KB RSC uyumlu bloklara ve TL;DR özetine dönüştürür.
 */
export function transformRawKbToArticle(rawText: string, suggestedTitle?: string): KbTransformResult {
  const clean = rawText.trim();
  const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] ?? "Teknik Bilgi Bankası Makalesi";
  const title = suggestedTitle?.trim() || (firstLine.length < 80 ? firstLine : firstLine.slice(0, 75) + "...");

  const slug = title
    .toLowerCase()
    .replace(/[ğ]/g, "g")
    .replace(/[ü]/g, "u")
    .replace(/[ş]/g, "s")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const bodyLines = lines.length > 1 ? lines.slice(1) : lines;
  const tldr = bodyLines.slice(0, 2).join(" ").slice(0, 240);

  const blocks: BlockNode[] = [
    {
      id: "kb_head",
      type: "heading",
      props: { level: 1, text: title },
    },
    {
      id: "kb_tldr",
      type: "info_box",
      props: {
        icon: "check-circle",
        title: "Doğrudan Uzman Yanıtı (TL;DR)",
        text: tldr || "Bu rehber, ilgili teknik sürecin adım adım uygulanmasını ve dikkat edilmesi gereken noktaları açıklar.",
        tone: "primary",
      },
    },
    {
      id: "kb_body",
      type: "paragraph",
      props: {
        text: bodyLines.join("\n\n"),
      },
    },
    {
      id: "kb_cta",
      type: "button_element",
      props: {
        label: "Destek Uzmanına Danışın →",
        href: "/tr/akinsoft-destek",
        styleVariant: "primary",
      },
    },
  ];

  return {
    title,
    slug: slug || "bilgi-bankasi-makalesi",
    tldr,
    category: "Teknik Bilgi Bankası",
    blocks,
  };
}
