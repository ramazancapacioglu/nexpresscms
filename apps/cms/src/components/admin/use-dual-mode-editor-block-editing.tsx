import { BLOCK_TYPE_LABELS, COLUMN_LAYOUT_PRESETS, cloneBlockWithFreshIds } from "@/components/admin/editor/studio-model";
import { insertBlockAt, moveBlockTo, placeNewBlock, updateBlockById, type BlockNode, type BlockStyle, type BlockStyleValues } from "@nexpress/core";
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
                paddingTop: "20px",
                paddingRight: "20px",
                paddingBottom: "20px",
                paddingLeft: "20px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                borderWidth: "1px",
                borderColor: "#e2e8f0",
              },
              children: [
                {
                  id: `blk_col_h_${Date.now()}_${i}`,
                  type: "heading",
                  props: { level: 3, text: `${i + 1}. Sütun Başlığı` },
                },
                {
                  id: `blk_col_p_${Date.now()}_${i}`,
                  type: "paragraph",
                  props: { text: "Sütun içi içerik metni." },
                },
              ],
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

  // Blok Ekleme (Kök listeye veya Seçili Sütun / Section içine!)
  const handleInsertBlock = (
    template: Omit<BlockNode, "id"> | BlockNode,
    targetParentId?: string | null
  ) => {
    const fresh = cloneBlockWithFreshIds(template);
    const parentIdToUse =
      targetParentId !== undefined
        ? targetParentId
        : selectedBlock?.type === "column" || selectedBlock?.type === "section"
          ? selectedBlock.id
          : null;

    setBlocks((prev) => insertBlockAt(prev, fresh, parentIdToUse));
    setSelectedBlockId(fresh.id);
    setRightTab("block");
    setActiveColumnInsertId(null);
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

  return { ...p, handleDropBlock, updateSelectedBlockProps, convertTextBlock, updateBlockPropsById, updateSelectedBlockStyle, getActiveStyleValue, handleChangeColumnLayout, handleInsertBlock };
}
