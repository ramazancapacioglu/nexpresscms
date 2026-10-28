import React from "react";
import {
  compileBlockStylesToCss,
  safeBlockDomId,
  type BlockNode,
  type DesignTokens,
} from "@nexpress/core";
import type { BlockRenderContext } from "./block-context";
import type { MediaFocalMap } from "./responsive-image";
import { renderStudioCatalogBlock } from "./catalog-blocks";
import { renderContentBlock } from "./blocks-content";
import { renderLayoutBlock } from "./blocks-layout";
import { renderMarketingBlock } from "./blocks-marketing";
import { INK_GRID_ID } from "./ink-grid";

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
  tokens,
  lcp = true,
  mediaFocal,
  locale,
}: RscBlockRendererProps): React.ReactElement {
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
        />
      ))}
    </div>
  );
}

type BlockRenderInput = Omit<BlockRenderContext, "renderChild">;

function renderBlockInner(input: BlockRenderInput): React.ReactElement | null {
  const ctx: BlockRenderContext = {
    ...input,
    renderChild: (child) => <RscSingleBlock {...input} block={child} />,
  };
  const rendered =
    renderMarketingBlock(ctx) ?? renderContentBlock(ctx) ?? renderLayoutBlock(ctx);
  return rendered === undefined
    ? renderStudioCatalogBlock(input.block, input.tokens, input.mediaFocal, input.locale)
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
}: {
  block: BlockNode;
  themeId: string;
  tokens: DesignTokens;
  isEditorial: boolean;
  isCommerce: boolean;
  lcpBlockId?: string;
  mediaFocal?: MediaFocalMap;
  locale?: string;
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
