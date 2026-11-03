"use client";

import type { LibraryPreviewKind } from "@nexpress/editor";

export function LibraryWireframe({ kind }: { kind: LibraryPreviewKind }) {
  const bar = "rounded-full bg-slate-300 dark:bg-slate-700";
  const barSoft = "rounded-full bg-slate-200 dark:bg-slate-800";
  const card =
    "rounded-lg border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="relative flex h-32 items-stretch gap-2 overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-slate-100/80 to-blue-50/40 p-3 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
      {kind === "hero-split" || kind === "columns" || kind === "media" ? (
        <>
          <div className="flex flex-1 flex-col justify-center gap-1.5 pr-1">
            <div className="h-2 w-12 rounded-full bg-blue-500/30" />
            <div className={`h-3 w-11/12 ${bar}`} />
            <div className={`h-2.5 w-3/4 ${bar}`} />
            <div className={`h-2 w-5/6 ${barSoft}`} />
            <div className="mt-1.5 flex gap-1.5">
              <div className="h-4 w-14 rounded-md bg-blue-600" />
              <div className="h-4 w-12 rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800" />
            </div>
          </div>
          <div className={`flex w-5/12 flex-col justify-between p-2 ${card}`}>
            <div className="h-2.5 w-8 rounded bg-indigo-500/25" />
            <div className="my-1 flex-1 rounded bg-gradient-to-br from-blue-500/15 to-indigo-500/10" />
            <div className={`h-2 w-2/3 ${barSoft}`} />
          </div>
        </>
      ) : null}

      {kind === "hero-centered" || kind === "cta-strip" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-center text-white">
          <div className="h-2 w-14 rounded-full bg-blue-400/40" />
          <div className="h-3 w-3/4 rounded-full bg-white/90" />
          <div className="h-2 w-1/2 rounded-full bg-white/50" />
          <div className="mt-1 flex gap-1.5">
            <div className="h-4 w-16 rounded-md bg-blue-500" />
            <div className="h-4 w-12 rounded-md bg-white/15" />
          </div>
        </div>
      ) : null}

      {kind === "bento-4" || kind === "gallery" || kind === "stats-4" ? (
        <div className="grid flex-1 grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className={`flex flex-col justify-between p-2 ${card}`}>
              <div className="h-3 w-3 rounded bg-blue-600/20" />
              <div className="space-y-1">
                <div className={`h-2 w-3/4 ${bar}`} />
                <div className={`h-1.5 w-1/2 ${barSoft}`} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {kind === "bento-3" || kind === "pricing-3" ? (
        <div className="grid flex-1 grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className={`flex flex-col justify-between p-2 ${card} ${
                index === 1 ? "ring-2 ring-blue-600/70" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-600/30" />
                {index === 1 && <div className="h-2 w-6 rounded-full bg-blue-600" />}
              </div>
              <div className="space-y-1">
                <div className={`h-2.5 w-4/5 ${bar}`} />
                <div className={`h-1.5 w-full ${barSoft}`} />
                <div className={`h-1.5 w-2/3 ${barSoft}`} />
              </div>
              <div
                className={`h-3 w-full rounded ${
                  index === 1 ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            </div>
          ))}
        </div>
      ) : null}

      {kind === "faq-list" ||
      kind === "howto-timeline" ||
      kind === "prose-section" ||
      kind === "tldr-summary" ? (
        <div className="flex flex-1 flex-col justify-center gap-1.5">
          {Array.from({ length: 3 }, (_, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-2.5 py-1.5 ${card}`}
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600/40" />
                <div className={`h-2 ${idx === 0 ? "w-3/4" : idx === 1 ? "w-2/3" : "w-1/2"} ${bar}`} />
              </div>
              <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : null}

      {kind === "form" ? (
        <div className={`flex flex-1 flex-col justify-center gap-1.5 p-2.5 ${card}`}>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-4 rounded border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
            <div className="h-4 rounded border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <div className="h-6 rounded border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
          <div className="h-4 w-20 rounded bg-blue-600" />
        </div>
      ) : null}

      {kind === "callout-box" || kind === "product-card" || kind === "code-terminal" ? (
        <div
          className={`flex flex-1 flex-col justify-between p-3 ${
            kind === "code-terminal"
              ? "rounded-lg bg-slate-950 text-emerald-400"
              : `${card} border-l-4 border-l-blue-600`
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <div className={`h-2 w-1/3 ${kind === "code-terminal" ? "rounded bg-emerald-400/50" : bar}`} />
          </div>
          <div className="space-y-1.5">
            <div className={`h-2 w-full ${kind === "code-terminal" ? "rounded bg-slate-700" : barSoft}`} />
            <div className={`h-2 w-4/5 ${kind === "code-terminal" ? "rounded bg-slate-800" : barSoft}`} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
