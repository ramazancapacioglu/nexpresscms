import { useDualModeEditorDocument } from "./use-dual-mode-editor-document";
import { useDualModeEditorPublishing } from "./use-dual-mode-editor-publishing";
import { useDualModeEditorUiState } from "./use-dual-mode-editor-ui-state";
import { useDualModeEditorBlockEditing } from "./use-dual-mode-editor-block-editing";
import { useDualModeEditorDirty } from "./use-dual-mode-editor-dirty";
import { useDualModeEditorSave } from "./use-dual-mode-editor-save";
import { useDualModeEditorSafety } from "./use-dual-mode-editor-safety";
import type { DualModeEditorClientProps } from "./use-dual-mode-editor-document";

export type { DualModeEditorClientProps } from "./use-dual-mode-editor-document";

/** Düzenleyici durumu ve davranışları; aşamalar sırayla genişleyen bir zincirdir. */
export function useDualModeEditor(props: DualModeEditorClientProps) {
  const a = useDualModeEditorDocument(props);
  const b = useDualModeEditorPublishing(a);
  const c = useDualModeEditorUiState(b);
  const d = useDualModeEditorBlockEditing(c);
  const e = useDualModeEditorDirty(d);
  const f = useDualModeEditorSave(e);
  return useDualModeEditorSafety(f);
}

export type DualModeEditorState = ReturnType<typeof useDualModeEditor>;
