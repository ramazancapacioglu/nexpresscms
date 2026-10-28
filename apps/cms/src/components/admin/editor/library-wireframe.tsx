"use client";

import type { LibraryPreviewKind } from "@nexpress/editor";

export function LibraryWireframe({ kind }: { kind: LibraryPreviewKind }) {
  const bar = "rounded bg-slate-200";
  const card = "rounded bg-white shadow-2xs";
  return (
    <div className="flex h-28 items-stretch gap-1.5 overflow-hidden rounded-md bg-slate-100 p-2">
      {kind === "hero-split" || kind === "columns" || kind === "media" ? (
        <>
          <div className="flex flex-1 flex-col justify-center gap-1.5">
            <div className={`h-2 w-10 ${bar}`} />
            <div className={`h-3 w-full ${bar}`} />
            <div className={`h-2 w-4/5 ${bar}`} />
            <div className="mt-1 h-4 w-14 rounded bg-blue-600/80" />
          </div>
          <div className={`w-2/5 ${card}`} />
        </>
      ) : null}
      {kind === "hero-centered" || kind === "cta-strip" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
          <div className={`h-3 w-3/4 ${bar}`} />
          <div className={`h-2 w-1/2 ${bar}`} />
          <div className="h-4 w-16 rounded bg-blue-600/80" />
        </div>
      ) : null}
      {kind === "bento-4" || kind === "gallery" || kind === "stats-4" ? (
        <div className="grid flex-1 grid-cols-2 gap-1.5">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className={card} />
          ))}
        </div>
      ) : null}
      {kind === "bento-3" || kind === "pricing-3" ? (
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className={`${card} ${index === 1 ? "ring-1 ring-blue-500" : ""}`} />
          ))}
        </div>
      ) : null}
      {kind === "faq-list" || kind === "howto-timeline" || kind === "prose-section" || kind === "tldr-summary" ? (
        <div className="flex flex-1 flex-col justify-center gap-1.5">
          <div className={`h-2.5 w-2/3 ${bar}`} />
          <div className={`h-2 w-full ${bar}`} />
          <div className={`h-2 w-5/6 ${bar}`} />
          <div className={`h-2 w-4/6 ${bar}`} />
        </div>
      ) : null}
      {kind === "form" ? (
        <div className="flex flex-1 flex-col justify-center gap-1.5">
          <div className="h-5 rounded border border-slate-200 bg-white" />
          <div className="h-5 rounded border border-slate-200 bg-white" />
          <div className="h-4 w-16 rounded bg-slate-900" />
        </div>
      ) : null}
      {kind === "callout-box" || kind === "product-card" || kind === "code-terminal" ? (
        <div className={`flex-1 ${card} p-2`}>
          <div className={`h-2 w-1/3 ${bar}`} />
          <div className={`mt-2 h-2 w-full ${bar}`} />
          <div className={`mt-1 h-2 w-4/5 ${bar}`} />
        </div>
      ) : null}
    </div>
  );
}
