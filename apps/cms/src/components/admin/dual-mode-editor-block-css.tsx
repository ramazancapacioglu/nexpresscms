
import type { DualModeEditorState } from "./use-dual-mode-editor";

/** Canlı Blok CSS Kuralları */
export function DualModeEditorBlockCss({ s }: { s: DualModeEditorState }) {
  const { compiledBlockCss } = s;
  return (
    <>
      {/* Canlı Blok CSS Kuralları */}
      {compiledBlockCss ? (
        <style dangerouslySetInnerHTML={{ __html: compiledBlockCss }} />
      ) : null}
    </>
  );
}
