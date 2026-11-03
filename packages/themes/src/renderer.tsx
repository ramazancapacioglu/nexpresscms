import React from "react";
import {
  compileBlockStylesToCss,
  normalizeDynamicQuery,
  toCssVarTokens,
  safeBlockDomId,
  type BlockNode,
  type DesignTokens,
  type DynamicDataMap,
  type PageSchemaData,
  type SchemaCardKind,
} from "@nexpress/core";
import type { BlockRenderContext, FormRenderContext } from "./block-context";
import type { MediaFocalMap } from "./responsive-image";
import { renderStudioCatalogBlock } from "./catalog-blocks";
import { renderContentBlock } from "./blocks-content";
import { renderLayoutBlock } from "./blocks-layout";
import { renderMarketingBlock } from "./blocks-marketing";
import { INK_GRID_ID } from "./ink-grid";
import { DynamicListView } from "./dynamic-list";
import { renderTemplateBlock } from "./blocks-template";
import { SchemaCardView } from "./schema-card";
import type { TemplateRenderContext } from "./block-template-context";

export interface RscBlockRendererProps {
  blocks: BlockNode[];
  themeId: string;
  tokens: DesignTokens;
  /** false: bu liste sayfanın LCP görselini içermez (ör. üstte öne çıkan görsel var). */
  lcp?: boolean;
  /** Medya odak noktaları; kırpılan görsellerde `object-position` olur. */
  mediaFocal?: MediaFocalMap;
  /** Sayfa dili: blok içi sabit metinler ve boş alan yedekleri bu dilde çizilir (varsayılan `tr`). */
  locale?: string;
  /** `form_block` için sayfa yolu + imzalı belirteç + son sonuç (yoksa form eski GET davranışında kalır) */
  form?: FormRenderContext;
  /** `dynamic_list` blokları için sunucuda çözülmüş öğeler (blok kimliği → öğeler) */
  dynamic?: DynamicDataMap;
  /** Şablon yuvaları (tpl_*) için sayfa verisi */
  tpl?: TemplateRenderContext;
  /** `schema_card` blokları için sayfanın şema verisi (SEO sekmesindeki Gelişmiş şema) */
  pageSchema?: PageSchemaData;
  /** Stüdyo önizlemesi: veri eksik olan şema kartı yönlendirme gösterir (ziyaretçide gizlenir) */
  preview?: boolean;
}

/**
 * LCP adayı: ilk iki üst düzey bloğun içindeki ilk görsel bloğu. Daha aşağıdaki görsel
 * ekran dışında olabileceğinden öncelik verilmez (gereksiz bant genişliği olur).
 */
export function findLcpImageId(blocks: BlockNode[]): string | undefined {
  const walk = (node: BlockNode): string | undefined => {
    if (node.type === "image_figure") return node.id;
    for (const child of node.children ?? []) {
      const hit = walk(child);
      if (hit) return hit;
    }
    return undefined;
  };
  for (const top of blocks.slice(0, 2)) {
    const hit = walk(top);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Kural 5: Ön yüzde %100 React Server Component (0-KB İstemci JS) olarak çalışan,
 * iç içe Satır/Sütun (Section/Columns/Column) ve duyarlı BlockStyle CSS kurallarını
 * sıfır istemci yüküyle işleyen yüksek hızlı RSC Blok Motoru.
 */
export function RscBlockRenderer({
  blocks,
  themeId,
  tokens: rawTokens,
  lcp = true,
  mediaFocal,
  locale,
  form,
  dynamic,
  tpl,
  pageSchema,
  preview,
}: RscBlockRendererProps): React.ReactElement {
  // Renkler CSS değişkeninden okunur: palet/karanlık mod değişince blok kodu aynı kalır
  const tokens = toCssVarTokens(rawTokens);
  const isEditorial = themeId === "editorial-pulse";
  const isCommerce = themeId === "commerce-velocity";
  const isInk = themeId === INK_GRID_ID;
  const compiledCss = compileBlockStylesToCss(blocks);
  const lcpBlockId = lcp ? findLcpImageId(blocks) : undefined;

  return (
    <div className={isInk ? "nx-ink" : "space-y-8"}>
      {compiledCss ? (
        <style dangerouslySetInnerHTML={{ __html: compiledCss }} />
      ) : null}
      {blocks.map((block) => (
        <RscSingleBlock
          key={block.id}
          block={block}
          themeId={themeId}
          tokens={tokens}
          isEditorial={isEditorial}
          isCommerce={isCommerce}
          lcpBlockId={lcpBlockId}
          mediaFocal={mediaFocal}
          locale={locale}
          form={form}
          dynamic={dynamic}
          tpl={tpl}
          pageSchema={pageSchema}
          preview={preview}
        />
      ))}
    </div>
  );
}

type BlockRenderInput = Omit<BlockRenderContext, "renderChild">;

function renderBlockInner(input: BlockRenderInput): React.ReactElement | null {
  if (input.block.type === "schema_card") return <SchemaCardView kind={(input.block.props?.schema as SchemaCardKind) ?? "software"} data={input.pageSchema} tokens={input.tokens} locale={input.locale} preview={input.preview} />;
  if (input.block.type.startsWith("tpl_")) return renderTemplateBlock({ ...input, renderChild: () => null }) ?? null;
  if (input.block.type === "dynamic_list") {
    return <DynamicListView query={normalizeDynamicQuery(input.block.props)} items={input.dynamic?.[input.block.id]?.items ?? []} meta={input.dynamic?.[input.block.id]?.meta} tokens={input.tokens} locale={input.locale} />;
  }
  const ctx: BlockRenderContext = {
    ...input,
    renderChild: (child) => <RscSingleBlock {...input} block={child} />,
  };
  const rendered =
    renderMarketingBlock(ctx) ?? renderContentBlock(ctx) ?? renderLayoutBlock(ctx);
  return rendered === undefined
    ? renderStudioCatalogBlock(input.block, input.tokens, input.mediaFocal, input.locale, input.form)
    : rendered;
}

export function RscSingleBlock({
  block,
  themeId,
  tokens,
  isEditorial,
  isCommerce,
  lcpBlockId,
  mediaFocal,
  locale,
  form,
  dynamic,
  tpl,
  pageSchema,
  preview,
}: {
  block: BlockNode;
  themeId: string;
  tokens: DesignTokens;
  isEditorial: boolean;
  isCommerce: boolean;
  lcpBlockId?: string;
  mediaFocal?: MediaFocalMap;
  locale?: string;
  form?: FormRenderContext;
  dynamic?: DynamicDataMap;
  tpl?: TemplateRenderContext;
  pageSchema?: PageSchemaData;
  preview?: boolean;
}): React.ReactElement | null {
  const inner = renderBlockInner({
    block,
    themeId,
    tokens,
    isEditorial,
    isCommerce,
    lcpBlockId,
    mediaFocal,
    locale,
    form,
    dynamic,
    tpl,
    pageSchema,
    preview,
  });
  if (!inner) return null;

  const domId = safeBlockDomId(block.id);
  const anchorId = block.style?.anchorId?.trim() || undefined;
  const customClass = block.style?.cssClass?.trim() || "";

  return (
    <div
      id={anchorId}
      data-nx-b={domId}
      className={customClass ? `nx-block ${customClass}` : "nx-block"}
    >
      {inner}
    </div>
  );
}
