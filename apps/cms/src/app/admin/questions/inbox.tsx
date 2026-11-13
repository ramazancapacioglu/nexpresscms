"use client";

import { answerQuestionAction, dismissQuestionAction } from "./actions";

export interface InboxRow {
  contentId: string;
  title: string;
  slug: string;
  id: string;
  question: string;
  name: string;
  date: string;
}

/** Bekleyen ziyaretçi soruları. Cevap yayınlanır, silme kaydı düşürür. */
export function QuestionsInbox({ rows }: { rows: InboxRow[] }) {
  if (rows.length === 0) {
    return <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">Bekleyen soru yok.</p>;
  }
  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li key={row.id} className="space-y-3 rounded-lg border border-border p-4">
          <div>
            <p className="text-xs text-muted-foreground">{row.title} · /{row.slug}</p>
            <p className="mt-1 font-medium">{row.question}</p>
            <p className="text-xs text-muted-foreground">{[row.name || "Anonim", row.date].filter(Boolean).join(" · ")}</p>
          </div>
          <form action={answerQuestionAction} className="space-y-2">
            <input type="hidden" name="contentId" value={row.contentId} />
            <input type="hidden" name="id" value={row.id} />
            <textarea name="answer" required minLength={2} rows={3} placeholder="Cevap" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Cevapla ve yayınla</button>
            </div>
          </form>
          <form action={dismissQuestionAction}>
            <input type="hidden" name="contentId" value={row.contentId} />
            <input type="hidden" name="id" value={row.id} />
            <button type="submit" className="text-xs text-rose-700 hover:underline">Sil</button>
          </form>
        </li>
      ))}
    </ul>
  );
}
