import type { TemplateRenderContext } from "./block-template-context";
import type { DisplayField, PageSchemaData } from "@nexpress/core";
import type { DynamicDataMap } from "@nexpress/core";
import type React from "react";
import type { BlockNode, DesignTokens } from "@nexpress/core";
import type { MediaFocalMap } from "./responsive-image";

export interface FormRenderContext {
  /** `form_block`ların `props.formId` ile bağlandığı kurucu formları (kimlik → tanım) */
  forms?: Record<string, import("./rsc-form").PublicFormDef>;
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
  /** Dinamik liste blokları için sunucuda çözülmüş öğeler (blok kimliği → öğeler) */
  dynamic?: DynamicDataMap;
  /** Şablon yuvaları (tpl_*) için sayfa verisi */
  tpl?: TemplateRenderContext;
  /** Şema kartları (schema_card) için sayfanın şema verisi */
  pageSchema?: PageSchemaData;
  /** `custom_fields` bloğu için sayfanın özel alan değerleri (yalnızca özel içerik türlerinde). */
  customFields?: DisplayField[];
  /** Senkronize modeller (synced_pattern için modelId → BlockNode[] haritası) */
  patterns?: Record<string, BlockNode[]>;
  preview?: boolean;
  /** İç içe blokları (bölüm, sütun) aynı bağlamla işler. */
  renderChild: (child: BlockNode) => React.ReactElement | null;
}
