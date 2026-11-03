import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DEFAULT_STUDIO_TOKENS } from "@/components/admin/editor/studio-model";
import { useRouter } from "next/navigation";
import { slugFromTitle, type BlockNode, type ContentStatus, type ContentType, type DesignTokens } from "@nexpress/core";
import type { ContentDto, MediaAssetDto, TaxonomyDto, TranslationOverviewRow } from "@nexpress/database";

export interface DualModeEditorClientProps {
  initialContents: ContentDto[];
  initialTaxonomies: TaxonomyDto[];
  initialMediaAssets: MediaAssetDto[];
  initialSelectedId?: string;
  initialContextType?: ContentType;
  startNew?: boolean;
  siteTokens?: DesignTokens;
  inspectorSlot?: React.ReactNode;
  siteId?: string;
  /** Düzenlenen dil (içerik listesi bu dilde gelir) */
  locale?: string;
  defaultLocale?: string;
  siteLocales?: string[];
  /** Açık içeriğin dil şeridi verisi (çoklu dilde) */
  translations?: TranslationOverviewRow[];
}

/** useDualModeEditor — aşama 1: Document */
export function useDualModeEditorDocument({
  initialContents,
  initialTaxonomies,
  initialMediaAssets,
  initialSelectedId,
  initialContextType = "page",
  startNew = false,
  siteTokens = DEFAULT_STUDIO_TOKENS,
  inspectorSlot,
  siteId = "default",
  locale = "tr",
  defaultLocale = "tr",
  siteLocales = ["tr"],
  translations = [],
}: DualModeEditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Başlangıç içeriğini belirle:
  // Eğer ?new=1 geldiyse doğrudan o tipte (page veya post) yeni taslak başlat!
  // Eğer ?id=... geldiyse o içeriği aç!
  const initialDoc = useMemo(() => {
    if (startNew) return null;
    if (initialSelectedId) {
      const match = initialContents.find((c) => c.contentId === initialSelectedId);
      if (match) return match;
    }
    const byType = initialContents.find((c) => c.type === initialContextType);
    return byType ?? initialContents[0] ?? null;
  }, [initialContents, initialSelectedId, initialContextType, startNew]);

  const lockedType: ContentType = initialDoc
    ? (initialDoc.type as ContentType)
    : initialContextType;

  // Belge durumları
  const [contentId, setContentId] = useState<string | undefined>(
    initialDoc?.contentId
  );
  const [title, setTitle] = useState<string>(initialDoc?.title ?? "");
  const [slug, setSlug] = useState<string>(initialDoc?.slug ?? "");
  const [tldr, setTldr] = useState<string>(initialDoc?.tldr ?? "");
  const [status, setStatus] = useState<ContentStatus>(
    (initialDoc?.status as ContentStatus) ?? "draft"
  );
  const [schemaType, setSchemaType] = useState<string>(
    initialDoc?.schemaType ?? (lockedType === "post" ? "BlogPosting" : "WebPage")
  );
  const [importanceScore, setImportanceScore] = useState<number>(
    initialDoc?.importanceScore ?? 5
  );

  const blankBlocks: BlockNode[] = useMemo(
    () => [{ id: "blk_new_paragraph", type: "paragraph", props: { text: "" } }],
    []
  );
  const initialBlocks = initialDoc?.blocks?.length ? initialDoc.blocks : blankBlocks;
  const [blocks, setBlocksState] = useState<BlockNode[]>(initialBlocks);
  const [history, setHistory] = useState<BlockNode[][]>([initialBlocks]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [proseSyncToken, setProseSyncToken] = useState(0);
  const slugSeeded = useRef(Boolean(initialDoc?.slug));
  useEffect(() => {
    if (slugSeeded.current) return;
    slugSeeded.current = true;
    const suffix = Date.now().toString().slice(-4);
    setSlug(lockedType === "post" ? `yeni-blog-yazisi-${suffix}` : `yeni-sayfa-${suffix}`);
  }, [lockedType]);

  // Yeni içerikte adres, kullanıcı elle değiştirene kadar başlığı izler (ilk kayıttan sonra sabitlenir)
  const slugTouched = useRef(false);
  useEffect(() => {
    if (initialDoc || contentId || slugTouched.current || lockedType === "template") return;
    const next = slugFromTitle(title);
    if (next) setSlug(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);
  const setSlugManual = (v: string | ((prev: string) => string)) => {
    slugTouched.current = true;
    setSlug(v);
  };

  const blocksRef = useRef(initialBlocks);
  const historyRef = useRef<BlockNode[][]>([initialBlocks]);
  const historyIdxRef = useRef(0);
  const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rememberHistory = (next: BlockNode[]) => {
    if (historyRef.current[historyIdxRef.current] === next) return;
    const stacked = [
      ...historyRef.current.slice(0, historyIdxRef.current + 1).slice(-30),
      next,
    ];
    historyRef.current = stacked;
    historyIdxRef.current = stacked.length - 1;
    setHistory(stacked);
    setHistoryIdx(stacked.length - 1);
  };

  const setBlocks = (
    updater: BlockNode[] | ((prev: BlockNode[]) => BlockNode[]),
    recordHistory = true
  ) => {
    const next = typeof updater === "function" ? updater(blocksRef.current) : updater;
    blocksRef.current = next;
    setBlocksState(next);
    if (recordHistory) {
      if (historyTimer.current) {
        clearTimeout(historyTimer.current);
        historyTimer.current = null;
      }
      rememberHistory(next);
      return;
    }
    if (historyTimer.current) clearTimeout(historyTimer.current);
    historyTimer.current = setTimeout(() => {
      historyTimer.current = null;
      rememberHistory(blocksRef.current);
    }, 500);
  };

  const flushHistory = () => {
    if (historyTimer.current) {
      clearTimeout(historyTimer.current);
      historyTimer.current = null;
    }
    rememberHistory(blocksRef.current);
  };

  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < history.length - 1;

  const restoreHistory = (nextIdx: number) => {
    const snapshot = historyRef.current[nextIdx];
    if (!snapshot) return;
    historyIdxRef.current = nextIdx;
    blocksRef.current = snapshot;
    setHistoryIdx(nextIdx);
    setBlocksState(snapshot);
    setProseSyncToken((value) => value + 1);
  };

  const handleUndo = () => {
    flushHistory();
    if (historyIdxRef.current <= 0) return;
    restoreHistory(historyIdxRef.current - 1);
  };

  const handleRedo = () => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    restoreHistory(historyIdxRef.current + 1);
  };

  return { isPending, startTransition, contentId, setContentId, title, setTitle, slug, setSlug: setSlugManual, tldr, setTldr, status, setStatus, schemaType, setSchemaType, importanceScore, setImportanceScore, blocks, setBlocksState, history, setHistory, historyIdx, setHistoryIdx, proseSyncToken, setProseSyncToken, router, initialDoc, lockedType, blankBlocks, initialBlocks, slugSeeded, blocksRef, historyRef, historyIdxRef, historyTimer, rememberHistory, setBlocks, flushHistory, canUndo, canRedo, restoreHistory, handleUndo, handleRedo, initialContents, initialTaxonomies, initialMediaAssets, initialSelectedId, initialContextType, startNew, siteTokens, inspectorSlot, siteId, locale, defaultLocale, siteLocales, translations };
}
