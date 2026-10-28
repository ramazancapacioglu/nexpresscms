import type React from "react";
import type { BlockNode, DesignTokens } from "@nexpress/core";
import type { MediaFocalMap } from "./responsive-image";

export interface FormRenderContext {
  path: string;
  token: string;
  status?: "sent" | "error" | null;
  /** Sonucun ait olduğu form bloğu kimliği */
  blockId?: string | null;
}

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
  /** Form bağlamı: sayfa yolu, imzalı zaman belirteci ve son gönderim sonucu (form_block için) */
  form?: FormRenderContext;
  /** İç içe blokları (bölüm, sütun) aynı bağlamla işler. */
  renderChild: (child: BlockNode) => React.ReactElement | null;
}
