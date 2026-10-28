import type React from "react";
import type { BlockNode, DesignTokens } from "@nexpress/core";
import type { MediaFocalMap } from "./responsive-image";

export interface BlockRenderContext {
  block: BlockNode;
  themeId: string;
  tokens: DesignTokens;
  isEditorial: boolean;
  isCommerce: boolean;
  /** Sayfanın LCP adayı görsel bloğunun kimliği (eager + yüksek öncelik alır). */
  lcpBlockId?: string;
  mediaFocal?: MediaFocalMap;
  /** Sayfa dili (blok içi sabit metinler için) */
  locale?: string;
  /** İç içe blokları (bölüm, sütun) aynı bağlamla işler. */
  renderChild: (child: BlockNode) => React.ReactElement | null;
}
