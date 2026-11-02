"use client";

import type { RichSchemaFields } from "./rich-schema-panel";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import { createContext, useContext } from "react";
import type {
  BlockLocation,
  BlockNode,
  BlockStyle,
  BlockStyleValues,
  ContentStatus,
  DeviceKey,
  SchemaGraphNode,
} from "@nexpress/core";
import type { TaxonomyDto, TranslationOverviewRow } from "@nexpress/database";
import type { SnapshotLike } from "@nexpress/core";
import type { SeoAnalysis } from "@nexpress/seo-core";

type RightTab = "publish" | "seo" | "block" | "engage";
type EditorMode = "visual" | "preview" | "code" | "markdown";
type InspectorSubTab = "general" | "style" | "advanced";
type Visibility = "public" | "private" | "password" | "members_only";
type FlatCategory = { id: string; slug: string; name: string; depth: number; color?: string | null };

export interface StudioInspectorApi {
  editorMode: EditorMode;
  setEditorMode: Dispatch<SetStateAction<EditorMode>>;
  viewport: DeviceKey;
  setViewport: Dispatch<SetStateAction<DeviceKey>>;
  openLibrary: () => void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen: Dispatch<SetStateAction<boolean>>;
  rightTab: RightTab;
  setRightTab: Dispatch<SetStateAction<RightTab>>;
  blockInspectorSubTab: InspectorSubTab;
  setBlockInspectorSubTab: Dispatch<SetStateAction<InspectorSubTab>>;
  styleDevice: DeviceKey;
  setStyleDevice: Dispatch<SetStateAction<DeviceKey>>;
  selectedBlock: BlockNode | null;
  selectedLocation: BlockLocation | null;
  setSelectedBlockId: Dispatch<SetStateAction<string | null>>;
  setBlocks: (
    updater: BlockNode[] | ((prev: BlockNode[]) => BlockNode[]),
    recordHistory?: boolean
  ) => void;
  updateSelectedBlockProps: (patch: Record<string, unknown>) => void;
  updateSelectedBlockStyle: (patch: Partial<BlockStyle>) => void;
  getActiveStyleValue: <K extends keyof BlockStyleValues>(
    key: K
  ) => BlockStyleValues[K] | undefined;
  handleChangeColumnLayout: (columnsBlockId: string, layoutId: string) => void;
  setMediaPickerTarget: Dispatch<SetStateAction<"featured" | "block_image" | "block_media" | null>>;
  seoAnalysis: SeoAnalysis;
  autoSchemaNodes: SchemaGraphNode[];
  inspectorSlot?: ReactNode;
  status: ContentStatus;
  setStatus: Dispatch<SetStateAction<ContentStatus>>;
  visibility: Visibility;
  setVisibility: Dispatch<SetStateAction<Visibility>>;
  accessPassword: string;
  setAccessPassword: Dispatch<SetStateAction<string>>;
  flatCategoryTree: FlatCategory[];
  selectedCategories: string[];
  setSelectedCategories: Dispatch<SetStateAction<string[]>>;
  quickCatName: string;
  setQuickCatName: Dispatch<SetStateAction<string>>;
  quickCatParentId: string;
  setQuickCatParentId: Dispatch<SetStateAction<string>>;
  handleQuickAddCategory: () => void;
  tags: TaxonomyDto[];
  selectedTags: string[];
  setSelectedTags: Dispatch<SetStateAction<string[]>>;
  quickTagName: string;
  setQuickTagName: Dispatch<SetStateAction<string>>;
  handleQuickAddTag: () => void;
  focusKeyword: string;
  setFocusKeyword: Dispatch<SetStateAction<string>>;
  slug: string;
  title: string;
  tldr: string;
  setTldr: Dispatch<SetStateAction<string>>;
  metaTitle: string;
  setMetaTitle: Dispatch<SetStateAction<string>>;
  metaDescription: string;
  setMetaDescription: Dispatch<SetStateAction<string>>;
  noIndex: boolean;
  setNoIndex: Dispatch<SetStateAction<boolean>>;
  canonicalUrl: string;
  richSchema: RichSchemaFields;
  setRichSchema: Dispatch<SetStateAction<RichSchemaFields>>;
  setCanonicalUrl: Dispatch<SetStateAction<string>>;
  schemaType: string;
  setSchemaType: Dispatch<SetStateAction<string>>;
  importanceScore: number;
  setImportanceScore: Dispatch<SetStateAction<number>>;
  featuredImageUrl: string;
  setFeaturedImageUrl: Dispatch<SetStateAction<string>>;
  featuredImageAlt: string;
  setFeaturedImageAlt: Dispatch<SetStateAction<string>>;
  allowComments: boolean;
  setAllowComments: Dispatch<SetStateAction<boolean>>;
  allowReviews: boolean;
  setAllowReviews: Dispatch<SetStateAction<boolean>>;
  showShareButtons: boolean;
  setShowShareButtons: Dispatch<SetStateAction<boolean>>;
  scheduledAt: string;
  setScheduledAt: Dispatch<SetStateAction<string>>;
  contentId: string | undefined;
  /** Düzenlenen dil ve sitenin dil kurulumu */
  locale: string;
  defaultLocale: string;
  siteLocales: string[];
  translations: TranslationOverviewRow[];
  /** Editörün derlediği Markdown (AI önerisi ve analiz girdisi) */
  compiledMarkdown: string;
  isDirty: boolean;
  /** Bir revizyon görüntüsünü editör alanlarına yükler (kaydetmez). */
  applyRevision: (snapshot: SnapshotLike) => void;
}

const StudioInspectorContext = createContext<StudioInspectorApi | null>(null);

export function StudioInspectorProvider({
  value,
  children,
}: {
  value: StudioInspectorApi;
  children: ReactNode;
}) {
  return (
    <StudioInspectorContext.Provider value={value}>{children}</StudioInspectorContext.Provider>
  );
}

export function useStudioInspector(): StudioInspectorApi {
  const value = useContext(StudioInspectorContext);
  if (!value) {
    throw new Error("Denetçi, stüdyo bağlamının dışında render edildi.");
  }
  return value;
}
