import { BLOCK_TYPE_LABELS, COLUMN_LAYOUT_PRESETS, cloneBlockWithFreshIds } from "@/components/admin/editor/studio-model";
import { canInsertInto, findBlock, insertBlockAt, locateBlock, moveBlockTo, placeNewBlock, removeBlockById, updateBlockById, type BlockNode, type BlockStyle, type BlockStyleValues } from "@nexpress/core";
import { Columns } from "lucide-react";
import type { DragPayload } from "@/components/admin/editor/dnd";
import type { useDualModeEditorUiState } from "./use-dual-mode-editor-ui-state";

/** useDualModeEditor — aşama 4: BlockEditing */
export function useDualModeEditorBlockEditing(p: ReturnType<typeof useDualModeEditorUiState>) {
  const { setBlocks, setRightTab, styleDevice, selectedBlockId, setSelectedBlockId, setActiveColumnInsertId, showToast, selectedBlock } = p;
  // Seçili bloğun props veya style alanını güncelleme yardımcıları
  const updateSelectedBlockProps = (patch: Record<string, unknown>) => {
    if (!selectedBlockId) return;
    setBlocks((prev) =>
      updateBlockById(prev, selectedBlockId, (b) => ({
        ...b,
        props: { ...b.props, ...patch },
      }))
    );
  };

  const convertTextBlock = (
    id: string,
    kind: "paragraph" | "heading" | "div",
    level = 2
  ) => {
    setBlocks((prev) =>
      updateBlockById(prev, id, (block) => {
        const text = String(block.props.text ?? block.props.quote ?? block.props.summary ?? "");
        const html = typeof block.props.html === "string" ? block.props.html : "";
        const element = String(block.type).endsWith("_element");
        if (kind === "heading") {
          return {
            ...block,
            type: element ? "heading_element" : "heading",
            props: { text, html, level },
          };
        }
        if (kind === "div") {
          return { ...block, type: "text_div", props: { text, html } };
        }
        return {
          ...block,
          type: element ? "paragraph_element" : "paragraph",
          props: { text, html },
        };
      })
    );
  };

  const updateBlockPropsById = (
    id: string,
    patch: Record<string, unknown>,
    recordHistory = true
  ) => {
    setBlocks(
      (prev) =>
        updateBlockById(prev, id, (block) => ({
          ...block,
          props: { ...block.props, ...patch },
        })),
      recordHistory
    );
  };

  const updateSelectedBlockStyle = (patch: Partial<BlockStyle>) => {
    if (!selectedBlockId) return;
    setBlocks((prev) =>
      updateBlockById(prev, selectedBlockId, (b) => {
        const currentStyle: BlockStyle = b.style ?? {};
        if (styleDevice === "desktop") {
          return {
            ...b,
            style: { ...currentStyle, ...patch },
          };
        }
        const devCurrent = currentStyle[styleDevice] ?? {};
        return {
          ...b,
          style: {
            ...currentStyle,
            [styleDevice]: { ...devCurrent, ...(patch as BlockStyleValues) },
          },
        };
      })
    );
  };

  /** Kayan araç çubuğu: belirli bir bloğun masaüstü stiline değer yazar (undefined = alanı kaldır). */
  const updateBlockStyleById = (id: string, patch: Partial<BlockStyleValues>) => {
    setBlocks((prev) => updateBlockById(prev, id, (b) => ({ ...b, style: { ...(b.style ?? {}), ...patch } })));
  };
  const setBlockStyleById = (id: string, style: BlockStyle) => {
    setBlocks((prev) => updateBlockById(prev, id, (b) => ({ ...b, style })));
  };

  /** Cihazdan bağımsız alanlar (hover, animasyon, geçiş süresi) her zaman kök stile yazılır. */
  const updateSelectedBlockStyleRoot = (patch: Partial<BlockStyle>) => {
    if (!selectedBlockId) return;
    setBlocks((prev) =>
      updateBlockById(prev, selectedBlockId, (b) => {
        const style: BlockStyle = { ...(b.style ?? {}), ...patch };
        for (const key of Object.keys(patch) as (keyof BlockStyle)[]) {
          if (patch[key] === undefined) delete style[key];
        }
        return { ...b, style };
      })
    );
  };

  // Aktif cihaza göre seçili bloğun stil değerini oku
  const getActiveStyleValue = <K extends keyof BlockStyleValues>(
    key: K
  ): BlockStyleValues[K] | undefined => {
    if (!selectedBlock?.style) return undefined;
    if (styleDevice === "desktop") {
      return selectedBlock.style[key];
    }
    return (
      selectedBlock.style[styleDevice]?.[key] ?? selectedBlock.style[key]
    );
  };

  // Sütun düzeni (Columns Layout) değiştirildiğinde sütun sayısını ve genişliklerini otomatik senkronize et
  const handleChangeColumnLayout = (columnsBlockId: string, layoutId: string) => {
    const preset =
      COLUMN_LAYOUT_PRESETS.find((p) => p.id === layoutId) ??
      COLUMN_LAYOUT_PRESETS[1]!;

    setBlocks((prev) =>
      updateBlockById(prev, columnsBlockId, (b) => {
        const existingCols = Array.isArray(b.children) ? b.children : [];
        const targetCount = preset.cols.length;
        const nextCols: BlockNode[] = [];

        for (let i = 0; i < targetCount; i++) {
          const widthPct = preset.cols[i] ?? 50;
          if (existingCols[i]) {
            nextCols.push({
              ...existingCols[i]!,
              props: { ...existingCols[i]!.props, widthPct },
            });
          } else {
            nextCols.push({
              id: `blk_col_${Date.now()}_${i}`,
              type: "column",
              props: { widthPct },
              style: {
                paddingTop: "16px",
                paddingRight: "16px",
                paddingBottom: "16px",
                paddingLeft: "16px",
              },
              children: [],
            });
          }
        }

        return {
          ...b,
          props: { ...b.props, layout: layoutId },
          children: nextCols,
        };
      })
    );
  };

  // Blok Ekleme (Kök listeye, Seçili Sütun / Section / Sekme içine veya seçili bloğun hemen altına!)
  const handleInsertBlock = (
    template: Omit<BlockNode, "id"> | BlockNode,
    targetParentId?: string | null
  ) => {
    const fresh = cloneBlockWithFreshIds(template);
    let parentIdToUse: string | null = null;
    let insertIdx = 999999;

    if (targetParentId !== undefined) {
      parentIdToUse = targetParentId;
    } else if (selectedBlock?.type === "column" || selectedBlock?.type === "section") {
      parentIdToUse = selectedBlock.id;
    } else if (selectedBlock?.type === "tabs" && selectedBlock.children?.[0]) {
      parentIdToUse = selectedBlock.children[0].id;
    } else if (selectedBlock) {
      const loc = locateBlock(p.blocks, selectedBlock.id);
      if (loc) {
        parentIdToUse = loc.parentId;
        insertIdx = loc.index + 1;
      }
    }

    setBlocks((prev) => insertBlockAt(prev, fresh, parentIdToUse, insertIdx));
    setSelectedBlockId(fresh.id);
    setRightTab("block");
    setActiveColumnInsertId(null);
    showToast(`${BLOCK_TYPE_LABELS[fresh.type] ?? fresh.type} eklendi.`);
  };

  /** Eğik çizgi komutu: bloğu (genelde boş paragraf) seçilen şablonla aynı yerde değiştirir. */
  const replaceBlockById = (id: string, template: BlockNode) => {
    const current = p.blocks;
    const loc = locateBlock(current, id);
    if (!loc) return;
    const parentType = loc.parentId ? findBlock(current, loc.parentId)?.type ?? null : null;
    const fresh = cloneBlockWithFreshIds(template);
    if (!canInsertInto(parentType, fresh.type)) return showToast("Bu blok buraya konulamaz.");
    setBlocks(() => insertBlockAt(removeBlockById(current, id), fresh, loc.parentId, loc.index));
    setSelectedBlockId(fresh.id);
    setRightTab("block");
    showToast(`${BLOCK_TYPE_LABELS[fresh.type] ?? fresh.type} eklendi.`);
  };

  /** Sürükle-bırak: `parentId === null` kök; `index` hedef kapsayıcının çocuk sırası. */
  const handleDropBlock = (payload: DragPayload, parentId: string | null, index: number) => {
    const current = p.blocks;
    if (payload.kind === "move") {
      const next = moveBlockTo(current, payload.id, parentId, index);
      if (next === current) return showToast("Bu blok oraya taşınamaz.");
      setBlocks(() => next);
      setSelectedBlockId(payload.id);
      return;
    }
    const fresh = cloneBlockWithFreshIds(payload.block);
    const next = placeNewBlock(current, fresh, parentId, index);
    if (!next) return showToast("Bu blok oraya eklenemez.");
    setBlocks(() => next);
    setSelectedBlockId(fresh.id);
    setRightTab("block");
    showToast(`${BLOCK_TYPE_LABELS[fresh.type] ?? fresh.type} eklendi.`);
  };

  /** Senkronize Model (Pattern) bağlantısını koparır ve bağımsız bloklara dönüştürür. */
  const handleDetachPattern = (patternBlockId: string) => {
    setBlocks((prev) => {
      const block = findBlock(prev, patternBlockId);
      if (!block || block.type !== "synced_pattern") return prev;
      const children = Array.isArray(block.children) && block.children.length > 0 ? block.children : [];
      if (children.length === 0) {
        showToast("Model içeriği boş.");
        return prev;
      }
      const loc = locateBlock(prev, patternBlockId);
      if (!loc) return prev;
      const freshChildren = children.map((c) => cloneBlockWithFreshIds(c));
      let updated = removeBlockById(prev, patternBlockId);
      for (let i = 0; i < freshChildren.length; i++) {
        updated = insertBlockAt(updated, freshChildren[i]!, loc.parentId, loc.index + i);
      }
      return updated;
    });
    showToast("Model bağlantısı koparıldı (Bağımsız standart bloklara dönüştürüldü).");
  };

  /** Oluşturulan modeli sayfadaki bloğun yerine senkronize model olarak bağlar. */
  const handlePatternCreated = (
    patternBlockId: string,
    pattern: { id: string; name: string; blocks: BlockNode[] }
  ) => {
    setBlocks((prev) =>
      updateBlockById(prev, patternBlockId, () => ({
        id: `blk_pattern_${Date.now()}`,
        type: "synced_pattern",
        props: { patternId: pattern.id, title: pattern.name },
        children: pattern.blocks,
      }))
    );
    showToast(`"${pattern.name}" senkronize modeli oluşturuldu ve sayfaya bağlandı.`);
  };

  return { ...p, replaceBlockById, handleDropBlock, updateSelectedBlockProps, convertTextBlock, updateBlockPropsById, updateSelectedBlockStyle, updateSelectedBlockStyleRoot, updateBlockStyleById, setBlockStyleById, getActiveStyleValue, handleChangeColumnLayout, handleInsertBlock, handleDetachPattern, handlePatternCreated };
}
