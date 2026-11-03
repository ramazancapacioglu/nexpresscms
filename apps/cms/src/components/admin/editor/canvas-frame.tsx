"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { DeviceKey, DesignTokens } from "@nexpress/core";
import { compileDesignTokensToCssVars } from "@nexpress/themes";

const WIDTH: Record<DeviceKey, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

/**
 * Tuval çerçevesi (iframe): sayfa, yönetim panelinin değil sitenin kendi CSS'iyle ve **gerçek medya sorgularıyla** çizilir.
 * İçerik React portalıyla çerçevenin belgesine basılır (durum/olaylar aynı ağaçta kalır). Üst belgedeki stil sayfaları ve
 * `<html>` sınıfı (karanlık yönetim teması) çerçeveye kopyalanır ve izlenir; sitenin `--nx-*` değişkenleri eklenir.
 * Çerçeve içindeki Ctrl+S ve sürükleme bitişi üst pencereye iletilir.
 */
export function CanvasFrame({ device, tokens, blockCss, children }: { device: DeviceKey; tokens: DesignTokens; blockCss: string; children: ReactNode }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);

  // Çerçeve belgesi hazır olunca (srcDoc yüklenince) portal hedefini ayarla
  useLayoutEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const ready = () => {
      const d = frame.contentDocument;
      if (d?.body && d.getElementById("nx-canvas-root")) setDoc(d);
    };
    frame.addEventListener("load", ready);
    ready();
    return () => frame.removeEventListener("load", ready);
  }, []);

  // Üst belgenin stil sayfalarını çerçeveye kopyala ve değişimleri izle (geliştirme sıcak yenilemesi dahil)
  useEffect(() => {
    if (!doc) return;
    const win = doc.defaultView!;
    const copied = new Map<Element, Element>();
    const sync = () => {
      document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => {
        if (el.hasAttribute("data-nx-frame-skip") || copied.has(el)) return;
        const clone = el.cloneNode(true) as Element;
        doc.head.appendChild(clone);
        copied.set(el, clone);
      });
      copied.forEach((clone, el) => {
        if (!document.head.contains(el)) { clone.remove(); copied.delete(el); }
        else if (el.tagName === "STYLE" && clone.textContent !== el.textContent) clone.textContent = el.textContent;
      });
      doc.documentElement.className = document.documentElement.className;
      doc.documentElement.lang = document.documentElement.lang;
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.head, { childList: true, subtree: true, characterData: true });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") e.preventDefault();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, bubbles: true, cancelable: true }));
    };
    const forward = (type: string) => () => window.dispatchEvent(new Event(type));
    const dragend = forward("dragend");
    const drop = forward("drop");
    win.addEventListener("keydown", onKey);
    win.addEventListener("dragend", dragend);
    win.addEventListener("drop", drop);
    return () => {
      mo.disconnect();
      win.removeEventListener("keydown", onKey);
      win.removeEventListener("dragend", dragend);
      win.removeEventListener("drop", drop);
    };
  }, [doc]);

  return (
    <>
      <iframe
        ref={ref}
        title="Sayfa tuvali"
        srcDoc='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="nx-canvas-root"></div></body></html>'
        style={{ width: WIDTH[device], maxWidth: "100%" }}
        className="mx-auto block h-full rounded-xl border border-border bg-white shadow-sm transition-[width] duration-200"
      />
      {doc
        ? createPortal(
            <div style={{ backgroundColor: tokens.colors.background, color: tokens.colors.foreground, fontFamily: tokens.typography.bodyFont, minHeight: "100vh" }}>
              <style>{`html,body{margin:0;background:${tokens.colors.background}}${compileDesignTokensToCssVars(tokens)}[data-nx-inline]{cursor:text;border-radius:4px;transition:outline-color .15s ease,background-color .15s ease}[data-nx-inline]:hover{outline:1px dashed rgba(37,99,235,.45);outline-offset:2px}[data-nx-inline]:focus{outline:2px solid rgba(37,99,235,.85);outline-offset:2px;background-color:rgba(37,99,235,.03)}`}</style>
              {blockCss ? <style>{blockCss}</style> : null}
              {children}
            </div>,
            doc.getElementById("nx-canvas-root")!
          )
        : null}
    </>
  );
}
