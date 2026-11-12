"use client";

import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import { parseImageDirectives, thumbnailUrl, withImageDirectives, type ImageDirectives } from "@nexpress/core";

/**
 * Her görsel alanının altındaki kadraj, kırpma ve yakınlaştırma denetimi.
 * Değerler adresin `#nx:` yönergesine yazılır (`@nexpress/core` `ImageDirectives`); ziyaretçide `ResponsiveImage` uygular,
 * bu yüzden blok türünden bağımsız çalışır ve önizleme sitedeki görünümle aynıdır.
 */
export function ImageAdjust({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const { url, directives } = parseImageDirectives(value);
  const box = useRef<HTMLDivElement>(null);
  if (!url.trim()) return null;

  const fit = directives.fit ?? "cover";
  const x = directives.x ?? 50;
  const y = directives.y ?? 50;
  const zoom = directives.zoom ?? 1;
  const patch = (next: Partial<ImageDirectives>) => onChange(withImageDirectives(url, { ...directives, ...next }));
  const changed = Boolean(directives.fit || directives.x !== undefined || directives.y !== undefined || directives.zoom);

  const pick = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    patch({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div className="mt-1.5 space-y-1.5 rounded-md border border-border bg-muted/20 p-1.5">
      <div
        ref={box}
        role="img"
        aria-label="Görsel kadrajı: kadraj noktasını seçmek için tıklayın veya sürükleyin"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e); }}
        onPointerMove={(e) => { if (e.buttons === 1) pick(e); }}
        className="relative aspect-[16/9] w-full cursor-crosshair touch-none overflow-hidden rounded border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)] bg-[length:12px_12px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl(url, 480)}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full select-none"
          style={{ objectFit: fit, objectPosition: `${x}% ${y}%`, transform: zoom > 1 ? `scale(${zoom})` : undefined, transformOrigin: `${x}% ${y}%` }}
        />
        {fit === "cover" ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ) : null}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="inline-flex shrink-0 overflow-hidden rounded border border-border text-[10.5px] font-semibold" role="group" aria-label="Kırpma biçimi">
          {([["cover", "Kırp"], ["contain", "Sığdır"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={fit === id}
              onClick={() => patch({ fit: id })}
              className={`px-2 py-1 ${fit === id ? "bg-blue-600 text-white" : "bg-background text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="range"
          min={100}
          max={300}
          step={5}
          value={Math.round(zoom * 100)}
          aria-label="Yakınlaştırma"
          onChange={(e) => patch({ zoom: Number(e.target.value) / 100 })}
          className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-lg bg-border accent-blue-600"
        />
        <span className="w-9 shrink-0 text-right font-mono text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          title="Kadrajı sıfırla"
          aria-label="Kadrajı sıfırla"
          disabled={!changed}
          onClick={() => onChange(url)}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-muted-foreground enabled:hover:text-foreground disabled:opacity-40"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
