"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { assignStringsToTexts, collectEditableStrings, normalizeText, patchAtPath, type BlockNode } from "@nexpress/core";

/** `plaintext-only` her tarayıcıda yok (eski Firefox); desteklenmiyorsa düz `true` kullanılır. */
let plainMode: "plaintext-only" | "true" | null = null;
function editableMode(el: HTMLElement): "plaintext-only" | "true" {
  if (plainMode) return plainMode;
  el.contentEditable = "plaintext-only";
  plainMode = el.contentEditable === "plaintext-only" ? "plaintext-only" : "true";
  return plainMode;
}

/**
 * Satır içi metin düzenleme sarmalayıcısı: bloğun render çıktısındaki yaprak metin öğelerini blok özellikleriyle eşleştirir
 * (`assignStringsToTexts`), eşleşenleri `contenteditable` yapar ve düzenlemeyi `blur`/Enter'da `props`'a geri yazar.
 * Render kodu değişmez; eşleşmeyen metin sağ panelden düzenlenir. Her kayıttan sonra alt ağaç yeniden kurulur (`key`),
 * böylece tarayıcının değiştirdiği metin düğümleri React ile çakışmaz.
 */
export function InlineEditable({ block, onChange, onCommit, children }: { block: BlockNode; onChange: (key: string, value: unknown) => void; onCommit: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rev, setRev] = useState(0);
  const sig = JSON.stringify(block.props ?? {});

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const leaves = Array.from(root.querySelectorAll<HTMLElement>("*")).filter(
      (el) => el.children.length === 0 && !/^(STYLE|SCRIPT|SVG|PATH|INPUT|TEXTAREA|SELECT|OPTION|BUTTON|SUMMARY)$/i.test(el.tagName) && normalizeText(el.textContent ?? "").length >= 2
    );
    const map = assignStringsToTexts(collectEditableStrings(block.props), leaves.map((el) => normalizeText(el.textContent ?? "")));
    const undo: Array<() => void> = [];
    map.forEach((path, idx) => {
      const el = leaves[idx]!;
      const original = el.textContent ?? "";
      el.setAttribute("contenteditable", editableMode(el));
      el.setAttribute("data-nx-inline", path.join("."));
      el.setAttribute("spellcheck", "false");
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Enter") { e.preventDefault(); el.blur(); }
        else if (e.key === "Escape") { el.textContent = original; el.blur(); }
        e.stopPropagation();
      };
      const onBlur = () => {
        const next = normalizeText(el.textContent ?? "");
        if (next === normalizeText(original) || next.length === 0) { el.textContent = original; return; }
        const patch = patchAtPath(block.props ?? {}, path, next);
        if (!patch) return;
        onChange(patch.key, patch.value);
        onCommit();
        setRev((r) => r + 1);
      };
      el.addEventListener("keydown", onKey);
      el.addEventListener("blur", onBlur);
      undo.push(() => {
        el.removeEventListener("keydown", onKey);
        el.removeEventListener("blur", onBlur);
        el.removeAttribute("contenteditable");
        el.removeAttribute("data-nx-inline");
      });
    });
    return () => undo.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rev, sig]);

  const stop = (e: { target: EventTarget; preventDefault: () => void }) => {
    // Önizlemedeki bağlantı/düğme/form editörden ayrılmaya ya da gönderime yol açmasın
    if ((e.target as HTMLElement).closest?.("a,button,summary,label,form")) e.preventDefault();
  };
  return (
    <div key={rev} ref={ref} onClickCapture={stop} onSubmitCapture={(e) => e.preventDefault()}>
      {children}
    </div>
  );
}
