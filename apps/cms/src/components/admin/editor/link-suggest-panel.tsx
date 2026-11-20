"use client";

import { useState, useTransition } from "react";
import { Link2 } from "lucide-react";
import { applyLinkToBlocks, type LinkSuggestion } from "@nexpress/core";
import { suggestLinksAction } from "@/app/admin/seo/link-suggest-action";
import { useStudioInspector } from "./studio-inspector-context";

/**
 * Editör SEO sekmesi: metinde başka sayfaların başlığı/anahtar kelimesi geçiyorsa iç bağlantı önerir.
 * "Bağlantı ekle" ifadeyi ilk uygun metin bloğunda bağlantıya çevirir (kaydetmek ayrı adımdır); metin dışı alanlarda bulunamazsa elle eklenir.
 */
export function LinkSuggestPanel() {
  const { contentId, compiledMarkdown, blocks, setBlocks, bumpProseSync, locale } = useStudioInspector();
  const [pending, start] = useTransition();
  const [items, setItems] = useState<LinkSuggestion[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const find = () =>
    start(async () => {
      setNote(null);
      const res = await suggestLinksAction({ contentId, markdown: compiledMarkdown, locale });
      if (res.ok) setItems(res.suggestions);
      else {
        setItems(null);
        setNote(res.error);
      }
    });

  const apply = (item: LinkSuggestion) => {
    const result = applyLinkToBlocks(blocks, item.matchedText, item.href);
    if (!result.changed) {
      setNote(`"${item.matchedText}" düzenlenebilir bir metin bloğunda bulunamadı; bağlantıyı elle ekleyin: ${item.href}`);
      return;
    }
    setBlocks(result.blocks);
    bumpProseSync();
    setItems((prev) => (prev ?? []).filter((x) => x !== item));
    setNote(`Bağlantı eklendi: "${item.matchedText}" → ${item.title}. Kaydetmeyi unutmayın.`);
  };

  return (
    <section className="space-y-2 rounded border border-border p-3" aria-label="İç bağlantı önerileri">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold"><Link2 className="h-3.5 w-3.5" aria-hidden="true" /> İç bağlantı önerileri</h3>
        <button type="button" disabled={pending} onClick={find} className="rounded border border-border px-2 py-1 text-[11px] font-medium hover:bg-muted disabled:opacity-60">
          {pending ? "Taranıyor…" : "Önerileri bul"}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">Metinde geçen ifadeleri diğer sayfaların başlıklarıyla eşleştirir; zaten bağlı sayfaları önermez.</p>
      {items && items.length === 0 ? <p className="text-[11px] text-muted-foreground">Yeni bağlantı önerisi yok.</p> : null}
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${item.candidateId}:${item.start}`} className="rounded border border-border bg-background p-2 text-[11px]">
              <p><strong>“{item.matchedText}”</strong> → <span className="font-medium">{item.title}</span></p>
              <p className="mt-0.5 text-muted-foreground">…{item.snippet}…</p>
              <button type="button" onClick={() => apply(item)} className="mt-1 text-[11px] font-medium text-blue-700 underline dark:text-blue-300">Bağlantı ekle</button>
            </li>
          ))}
        </ul>
      ) : null}
      {note ? <p role="status" className="text-[11px] text-muted-foreground">{note}</p> : null}
    </section>
  );
}
