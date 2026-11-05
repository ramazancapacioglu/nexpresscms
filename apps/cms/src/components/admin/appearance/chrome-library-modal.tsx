"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FooterConfig, HeaderConfig } from "@nexpress/core";
import {
  CHROME_AI_DESIGN_PROMPT,
  FOOTER_LIBRARY,
  FOOTER_LIBRARY_GROUPS,
  HEADER_LIBRARY,
  HEADER_LIBRARY_GROUPS,
  type ChromeLibraryKind,
} from "@nexpress/themes";
import { Sparkles, X } from "lucide-react";
import { ChromeWireframe } from "./chrome-wireframe";
import { HeaderLibraryDraft } from "./header-library-draft";
import { HeaderMiniBars } from "./header-mini-bars";

type Tab = "designs" | "json";

export function ChromeLibraryModal({
  open,
  kind,
  onClose,
  onApplyHeader,
  onApplyFooter,
}: {
  open: boolean;
  kind: ChromeLibraryKind;
  onClose: () => void;
  onApplyHeader?: (value: HeaderConfig) => void;
  onApplyFooter?: (value: FooterConfig) => void;
}) {
  const [tab, setTab] = useState<Tab>("designs");
  const [groupId, setGroupId] = useState("all");
  const [query, setQuery] = useState("");
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; value: HeaderConfig } | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setTab("designs");
      setGroupId("all");
      setQuery("");
      setError(null);
      setDraft(null);
    }
    wasOpen.current = open;
  }, [open]);

  const groups = kind === "header" ? HEADER_LIBRARY_GROUPS : FOOTER_LIBRARY_GROUPS;
  const items = useMemo(() => {
    const source = kind === "header" ? HEADER_LIBRARY : FOOTER_LIBRARY;
    const needle = query.trim().toLocaleLowerCase("tr");
    return source.filter((item) => {
      const inGroup = groupId === "all" || item.category === groupId;
      const haystack = `${item.name} ${item.description}`.toLocaleLowerCase("tr");
      return inGroup && (!needle || haystack.includes(needle));
    });
  }, [groupId, kind, query]);

  if (!open) return null;

  const applyParsed = () => {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (kind === "header") {
        const header = (parsed.kind === "footer" ? null : parsed.header ?? parsed) as HeaderConfig;
        if (!header?.mainBar || !header.topBar) throw new Error("Header JSON geçersiz.");
        onApplyHeader?.(structuredClone(header));
      } else {
        const footer = (parsed.kind === "header" ? null : parsed.footer ?? parsed) as FooterConfig;
        if (!footer || !Array.isArray(footer.columns)) throw new Error("Footer JSON geçersiz.");
        onApplyFooter?.(structuredClone(footer));
      }
      setError(null);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "JSON okunamadı.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="flex h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#E6E7EA] bg-white dark:border-[#23262E] dark:bg-[#15171C]">
        <div className="flex items-center justify-between gap-3 border-b border-[#E6E7EA] px-4 py-3 dark:border-[#23262E]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold">{kind === "header" ? "Header kütüphanesi" : "Footer kütüphanesi"}</h2>
              <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                {tab === "designs"
                  ? kind === "header"
                    ? `${items.length} tasarım. Mobil dizi düzenlenir, sonra forma alınır.`
                    : `${items.length} tasarım. Seçince forma alınır.`
                  : "JSON forma alınır."}{" "}
                Kaydet ile yayınlanır.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setTab("designs")} className={tabClass(tab === "designs")}>
              Tasarımlar
            </button>
            <button type="button" onClick={() => setTab("json")} className={tabClass(tab === "json")}>
              JSON aktar
            </button>
            <button type="button" onClick={onClose} className="rounded-md p-1.5 text-[#5F6570] dark:text-[#8C9099]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {tab === "designs" && draft && kind === "header" ? (
          <HeaderLibraryDraft
            name={draft.name}
            value={draft.value}
            onChange={(value) => setDraft({ name: draft.name, value })}
            onBack={() => setDraft(null)}
            onApply={() => {
              onApplyHeader?.(structuredClone(draft.value));
              onClose();
            }}
          />
        ) : tab === "designs" ? (
          <div className="flex min-h-0 flex-1">
            <aside className="flex w-40 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-[#E6E7EA] p-2 dark:border-[#23262E]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ara"
                className="mb-2 rounded-md border border-[#E6E7EA] px-2 py-1.5 text-xs dark:border-[#23262E] dark:bg-[#121317]"
              />
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setGroupId(group.id)}
                  className={`rounded-md px-2 py-1.5 text-left text-xs ${
                    groupId === group.id ? "bg-blue-600 font-semibold text-white" : "hover:bg-[#F4F5F6]"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </aside>
            <div className="flex-1 overflow-y-auto p-4" tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (kind === "header") {
                        setDraft({ name: item.name, value: structuredClone(item.value as HeaderConfig) });
                        return;
                      }
                      onApplyFooter?.(structuredClone(item.value as FooterConfig));
                      onClose();
                    }}
                    className="rounded-xl border border-[#E6E7EA] p-3 text-left hover:border-blue-500 dark:border-[#23262E]"
                  >
                    {kind === "header" ? <HeaderMiniBars header={item.value as HeaderConfig} /> : <ChromeWireframe kind={item.preview} />}
                    <div className="mt-2 text-[12px] font-semibold">{item.name}</div>
                    <p className="mt-1 text-[11px] leading-snug text-[#5F6570] dark:text-[#8C9099]">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] text-[#5C5F66]">
                Modelden gelen JSON’u yapıştırın. Sözleşme `docs/08-AI-CHROME-SPEC.md` içindedir.
              </p>
              <button
                type="button"
                className="rounded-md border border-[#E6E7EA] px-2 py-1 text-[11px] dark:border-[#23262E]"
                onClick={() => navigator.clipboard.writeText(CHROME_AI_DESIGN_PROMPT)}
              >
                AI promptunu kopyala
              </button>
            </div>
            <textarea
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              className="min-h-0 flex-1 rounded-md border border-[#E6E7EA] p-3 font-mono text-[11px] dark:border-[#23262E] dark:bg-[#121317]"
              placeholder='{ "kind": "header", "header": { ... } }'
            />
            {error ? <p className="text-[11px] text-rose-600">{error}</p> : null}
            <button type="button" onClick={applyParsed} className="self-end rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
              Forma uygula
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function tabClass(active: boolean) {
  return `rounded-md px-2.5 py-1 text-xs font-semibold ${active ? "bg-blue-600 text-white" : "bg-[#F4F5F6] text-[#5C5F66]"}`;
}
