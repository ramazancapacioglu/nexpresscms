"use client";

import React from "react";
import { EditorDnd } from "./editor/dnd";
import { DualModeEditorLeftPanel } from "./dual-mode-editor-left-panel";
import { DualModeEditorCanvas } from "./dual-mode-editor-canvas";
import { DualModeEditorRightPanel } from "./dual-mode-editor-right-panel";
import { EditorStatusBar } from "./editor/editor-status-bar";
import type { DualModeEditorState } from "./use-dual-mode-editor";

export function DualModeEditorWorkspace({ s }: { s: DualModeEditorState }) {
  return (
    <EditorDnd onDrop={s.handleDropBlock}>
      <div className="flex flex-1 overflow-hidden">
        <DualModeEditorLeftPanel s={s} />
        <DualModeEditorCanvas s={s} />
        <DualModeEditorRightPanel s={s} />
      </div>
      <EditorStatusBar s={s} />
    </EditorDnd>
  );
}
