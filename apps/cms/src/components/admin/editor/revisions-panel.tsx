"use client";

import { useEffect, useState } from "react";
import type { RevisionSummary } from "@nexpress/database";
import { getRevisionAction, listRevisionsAction } from "@/app/admin/revisions/actions";
import { useStudioInspector } from "./studio-inspector-context";

const STATUS_LABEL: Record<string, string> = { draft: "Taslak", published: "Yayında", scheduled: "Zamanlı", archived: "Arşiv" };

/** Yayın sekmesi: içeriğin kayıt geçmişi. Sürümü yüklemek yalnızca editörü doldurur; kaydetmek ayrı bir adımdır. */
export function RevisionsPanel() {
  const { contentId, locale, applyRevision } = useStudioInspector();
  const [items, setItems] = useState<RevisionSummary[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!contentId) return;
    let alive = true;
    listRevisionsAction({ contentId, locale })
      .then((r) => alive && (r.ok ? setItems(r.revisions) : setError(r.error)))
      .catch(() => alive && setError("Geçmiş yüklenemedi."));
    return () => {
      alive = false;
    };
  }, [contentId, locale]);

  const load = async (id: string) => {
    setBusyId(id);
    try {
      const r = await getRevisionAction({ id });
      if (r.ok) applyRevision(r.revision.snapshot);
      else setError(r.error);
    } catch {
      setError("Sürüm yüklenemedi.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Sürüm Geçmişi</div>
      {!contentId && <p className="text-[11px] text-muted-foreground">İlk kayıttan sonra sürümler burada listelenir.</p>}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {contentId && items && items.length === 0 && <p className="text-[11px] text-muted-foreground">Henüz kayıtlı sürüm yok.</p>}
      <ul className="space-y-1.5">
        {(items ?? []).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="min-w-0">
              <span className="block font-medium">{new Date(r.createdAt).toLocaleString("tr-TR")}</span>
              <span className="block truncate text-muted-foreground">
                {r.authorEmail || "—"} · {STATUS_LABEL[r.status] ?? r.status} · {r.blockCount} blok · {r.wordCount} kelime
              </span>
            </span>
            <button
              type="button"
              disabled={busyId === r.id}
              onClick={() => load(r.id)}
              className="shrink-0 rounded border border-border px-2 py-0.5 hover:bg-muted disabled:opacity-50"
            >
              Bu sürümü yükle
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
