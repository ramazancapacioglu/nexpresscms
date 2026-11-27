"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { applyEntityLinksAction } from "@/app/admin/seo/actions";
import { Check, Network } from "lucide-react";

export interface LinkSuggestionRow {
  fromId: string;
  fromTitle: string;
  toId: string;
  toSlug: string;
  matchedPhrase: string;
}

export function EntityLinkSuggestions({
  suggestions,
  existingPairs,
  locale,
}: {
  suggestions: LinkSuggestionRow[];
  existingPairs: string[];
  locale: string;
}) {
  const [linked, setLinked] = useState<Set<string>>(() => new Set(existingPairs));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (suggestions.length === 0) return null;

  const remaining = suggestions.filter((s) => !linked.has(`${s.fromId}:${s.toId}`));

  const bind = (rows: LinkSuggestionRow[]) => {
    start(async () => {
      const res = await applyEntityLinksAction(
        rows.map((r) => ({
          sourceContentId: r.fromId,
          targetContentId: r.toId,
          relationType: "mentions",
          anchorText: r.matchedPhrase,
        }))
      );
      if (res.ok) {
        setLinked((prev) => {
          const next = new Set(prev);
          for (const r of rows) next.add(`${r.fromId}:${r.toId}`);
          return next;
        });
        setMsg(res.message);
      }
    });
  };

  return (
    <section className="space-y-2.5 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-blue-600" />
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Bilgi Ağı &amp; İç Bağlantı Fırsatları ({suggestions.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">{msg}</span>}
          {remaining.length > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() => bind(remaining)}
              className="h-7 rounded-md bg-blue-600 px-3 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Bağlanıyor…" : `Tümünü Bilgi Ağına Bağla (${remaining.length})`}
            </button>
          )}
        </div>
      </div>

      <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
        {suggestions.map((item) => {
          const key = `${item.fromId}:${item.toId}`;
          const isDone = linked.has(key);
          return (
            <li key={key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[12px]">
              <div>
                <Link href={`/admin/contents?id=${encodeURIComponent(item.fromId)}&locale=${locale}`} className="font-semibold text-foreground hover:underline">
                  {item.fromTitle}
                </Link>
                <span className="text-muted-foreground"> içinde </span>
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[11px] text-blue-700 dark:text-blue-300">
                  “{item.matchedPhrase}”
                </span>
                <span className="text-muted-foreground"> geçiyor → </span>
                <Link href={`/admin/contents?id=${encodeURIComponent(item.toId)}&locale=${locale}`} className="font-semibold text-foreground hover:underline">
                  /{item.toSlug}
                </Link>
              </div>
              <div className="flex items-center gap-1.5">
                {isDone ? (
                  <span className="inline-flex h-7 items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5" /> Bağlı
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => bind([item])}
                    className="h-7 rounded-md border border-blue-500/40 bg-blue-500/10 px-2.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 disabled:opacity-50"
                  >
                    Bilgi Ağına Bağla
                  </button>
                )}
                <Link
                  href={`/admin/contents?id=${encodeURIComponent(item.fromId)}&locale=${locale}`}
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium hover:bg-muted transition"
                >
                  Stüdyoda Aç →
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
