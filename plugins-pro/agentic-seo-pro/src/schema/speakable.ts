import type { SchemaGraphNode } from "@nexpress/core";

const SPEAKABLE_TYPES = new Set(["Article", "BlogPosting", "NewsArticle", "TechArticle", "WebPage", "FAQPage", "QAPage"]);

/** Makale/sayfa düğümlerine `SpeakableSpecification` ekler (zaten varsa dokunmaz). */
export function addSpeakable(nodes: SchemaGraphNode[]): SchemaGraphNode[] {
  return nodes.map((n) => {
    const types = Array.isArray(n["@type"]) ? n["@type"] : [n["@type"]];
    if (n.speakable || !types.some((t) => typeof t === "string" && SPEAKABLE_TYPES.has(t))) return n;
    return { ...n, speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "article p:first-of-type"] } };
  });
}
