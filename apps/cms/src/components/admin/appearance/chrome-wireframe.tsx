import type { ChromePreview } from "@nexpress/themes";

export function ChromeWireframe({ kind }: { kind: ChromePreview }) {
  const line = "h-1.5 rounded bg-slate-300";
  return (
    <div className="flex h-24 flex-col justify-between overflow-hidden rounded-md bg-slate-100 p-2">
      {kind.startsWith("bar") ? (
        <div className="space-y-1">
          {kind === "bar-announce" ? <div className="h-2 rounded bg-slate-900/80" /> : null}
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-slate-800" />
            <div className={`flex-1 ${kind === "bar-center" ? "mx-4" : ""} ${line}`} />
            <div className="h-3 w-8 rounded bg-blue-600/80" />
          </div>
          {kind === "bar-catalog" ? (
            <div className="flex gap-1 pt-1">
              <div className="h-1.5 w-8 rounded bg-slate-300" />
              <div className="h-1.5 w-8 rounded bg-slate-300" />
              <div className="h-1.5 w-8 rounded bg-slate-300" />
            </div>
          ) : null}
        </div>
      ) : (
        <div className={`grid flex-1 gap-1 ${kind === "foot-slim" ? "grid-cols-1" : "grid-cols-3"}`}>
          {kind === "foot-slim" ? (
            <div className="mt-auto h-1.5 w-1/2 rounded bg-slate-300" />
          ) : (
            Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-1 rounded bg-white p-1">
                <div className="h-1.5 w-2/3 rounded bg-slate-400" />
                <div className={line} />
                <div className={line} />
              </div>
            ))
          )}
        </div>
      )}
      {kind === "foot-news" ? <div className="mt-1 h-3 rounded border border-slate-300 bg-white" /> : null}
    </div>
  );
}
