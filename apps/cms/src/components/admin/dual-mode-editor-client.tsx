"use client";

import React from "react";
import { StudioInspectorProvider } from "@/components/admin/editor/studio-inspector-context";
import { useDualModeEditor, type DualModeEditorClientProps } from "./use-dual-mode-editor";
import { DualModeEditorBlockCss } from "./dual-mode-editor-block-css";
import { DualModeEditorToast } from "./dual-mode-editor-toast";
import { DualModeEditorTopbar } from "./dual-mode-editor-topbar";
import { DualModeEditorWorkspace } from "./dual-mode-editor-workspace";
import { DualModeEditorModals } from "./dual-mode-editor-modals";

export type { DualModeEditorClientProps } from "./use-dual-mode-editor";

export function DualModeEditorClient(props: DualModeEditorClientProps) {
  const s = useDualModeEditor(props);
  return (
    <StudioInspectorProvider value={s.inspectorApi}>
      <div className="relative z-0 -m-3 flex h-[calc(100vh-2.5rem)] flex-col overflow-hidden bg-[#F6F7F9] dark:bg-[#0B0C0E]">
        <DualModeEditorBlockCss s={s} />
        <DualModeEditorToast s={s} />
        <DualModeEditorTopbar s={s} canPublish={props.canPublish !== false} />
        {s.recovery && (
          <div role="alert" className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-200">
            <span>
              Bu içerik için kaydedilmemiş yerel bir taslak bulundu ({new Date(s.recovery.at).toLocaleString("tr-TR")}).
            </span>
            <span className="flex gap-2">
              <button type="button" onClick={s.restoreRecovery} className="rounded border border-amber-500/40 px-2 py-0.5 font-medium hover:bg-amber-500/20">Geri yükle</button>
              <button type="button" onClick={s.dismissRecovery} className="rounded border border-border px-2 py-0.5 hover:bg-muted">Yok say</button>
            </span>
          </div>
        )}
        <DualModeEditorWorkspace s={s} />
        <DualModeEditorModals s={s} />
      </div>
    </StudioInspectorProvider>
  );
}
