"use client";

import { SCHEMA_CARD_KINDS, type SchemaCardKind } from "@nexpress/core";
import { RichSchemaPanel } from "./rich-schema-panel";
import { useStudioInspector } from "./studio-inspector-context";

const NAME: Record<SchemaCardKind, string> = { software: "Yazılım / uygulama kartı", offer: "Kampanya kartı", qa: "Soru-cevap kartı", tech: "Teknik künye" };

/**
 * Şema kartı alanları: SEO › Şema sekmesindeki alanlarla AYNI veri. Burada girilen bilgi hem kartta hem JSON-LD şemasında görünür;
 * bir yerde değiştirmek yeterlidir (tek kaynak: `schemaAttributes.richSchema`).
 */
export function SchemaCardFields() {
  const { selectedBlock, updateSelectedBlockProps, richSchema, setRichSchema } = useStudioInspector();
  if (!selectedBlock) return null;
  const kind = (SCHEMA_CARD_KINDS as string[]).includes(String(selectedBlock.props?.schema)) ? (selectedBlock.props!.schema as SchemaCardKind) : "software";
  return (
    <div className="space-y-3">
      <p className="rounded bg-blue-500/10 p-2 text-[11px] leading-snug">Bu kart sayfanın şema bilgilerini gösterir. Alanlar SEO › Şema sekmesiyle ortaktır: burada girdiğiniz bilgi şemaya da yazılır.</p>
      <div>
        <label htmlFor="sc-kind" className="mb-1 block text-[11px] font-semibold">Kart türü</label>
        <select id="sc-kind" value={kind} onChange={(e) => updateSelectedBlockProps({ schema: e.target.value })} className="h-8 w-full rounded border border-border bg-background px-2 text-[12px]">{SCHEMA_CARD_KINDS.map((k) => <option key={k} value={k}>{NAME[k]}</option>)}</select>
      </div>
      <RichSchemaPanel value={richSchema} onChange={setRichSchema} only={kind} />
    </div>
  );
}
