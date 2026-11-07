"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BlockNode } from "@nexpress/core";
import { RscBlockRenderer, compileDesignTokensToCssVars, getThemeManifest } from "@nexpress/themes";
import { cloneBlockWithFreshIds } from "./studio-model";

const SOURCE_WIDTH = 820;
const THEME = getThemeManifest("corporate-aurora");

/** `:root` değişkenleri kart içine kapsanır: önizleme panelin değil sitenin görünümüyle çizilir. */
export const LIBRARY_PREVIEW_CSS = `${compileDesignTokensToCssVars(THEME.tokens).replaceAll(":root", ".nx-lib-preview")}
.nx-lib-preview{color-scheme:light;background:#fff;color:#0f172a}
.nx-lib-preview .nx-block{width:auto!important;left:auto!important;margin-left:0!important}
.nx-lib-preview *{animation:none!important}`;

/**
 * Kütüphane kartının canlı önizlemesi: bloğun gerçek çıktısı 820 px genişlikte çizilir ve karta sığacak biçimde küçültülür.
 * Kart görünür olunca çizilir (liste uzun olduğundan); tıklamalar karta geçer.
 */
export function LibraryLivePreview({ block, height = 210 }: { block: Omit<BlockNode, "id"> | BlockNode; height?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0.3);
  const blocks = useMemo(() => [cloneBlockWithFreshIds({ id: "preview", ...block } as BlockNode)], [block]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el);
    const ro = new ResizeObserver(([entry]) => { if (entry) setScale(entry.contentRect.width / SOURCE_WIDTH); });
    ro.observe(el);
    return () => { io.disconnect(); ro.disconnect(); };
  }, []);

  return (
    <div ref={host} style={{ height }} className="nx-lib-preview pointer-events-none relative overflow-hidden rounded-xl border border-border bg-white">
      {visible ? (
        <div style={{ width: SOURCE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <RscBlockRenderer blocks={blocks} themeId="corporate-clean" tokens={THEME.tokens} locale="tr" preview />
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/90 to-transparent" />
    </div>
  );
}
