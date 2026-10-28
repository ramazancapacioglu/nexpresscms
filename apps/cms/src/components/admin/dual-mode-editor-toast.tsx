import { CheckCircle2 } from "lucide-react";
import type { DualModeEditorState } from "./use-dual-mode-editor";

/** Bildirim Toast */
export function DualModeEditorToast({ s }: { s: DualModeEditorState }) {
  const { toastMsg } = s;
  return (
    <>
      {/* Bildirim Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}
