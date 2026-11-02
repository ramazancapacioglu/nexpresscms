import type { DualModeEditorState } from "./use-dual-mode-editor";
import { DualModeEditorLeftPanel } from "./dual-mode-editor-left-panel";
import { DualModeEditorCanvas } from "./dual-mode-editor-canvas";
import { EditorDnd } from "@/components/admin/editor/dnd";
import { DualModeEditorRightPanel } from "./dual-mode-editor-right-panel";

/** ANA ÇALIŞMA ALANI */
export function DualModeEditorWorkspace({ s }: { s: DualModeEditorState }) {
  return (
    <>
      {/* ANA ÇALIŞMA ALANI */}
      <EditorDnd onDrop={s.handleDropBlock}>
      <div className="flex flex-1 overflow-hidden">
        <DualModeEditorLeftPanel s={s} />

        <DualModeEditorCanvas s={s} />

        <DualModeEditorRightPanel s={s} />
      </div>
      </EditorDnd>
    </>
  );
}
