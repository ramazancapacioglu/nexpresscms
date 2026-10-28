import { BlockInspector } from "@/components/admin/editor/block-inspector";
import type { DualModeEditorState } from "./use-dual-mode-editor";

/** 3. SAĞ DENETÇİ */
export function DualModeEditorRightPanel({ s }: { s: DualModeEditorState }) {
  return (
    <>
        {/* 3. SAĞ DENETÇİ */}
        <BlockInspector />
    </>
  );
}
