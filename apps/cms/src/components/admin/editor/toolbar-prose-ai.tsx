"use client";

import React, { useRef, useState, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import type { BlockNode } from "@nexpress/core";
import {
  Bold,
  Code,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
  Sparkles,
  Strikethrough,
  Underline,
} from "lucide-react";
import { AiComposePanel } from "./ai-compose-panel";

interface LinkDraft {
  href: string;
  scope: "internal" | "external";
  newTab: boolean;
  follow: "nofollow" | "dofollow";
}

function readLink(editor: Editor): LinkDraft {
  const attrs = editor.getAttributes("link");
  const href = String(attrs.href ?? "");
  const rel = String(attrs.rel ?? "");
  const internal =
    href.startsWith("/") || href.startsWith("#") || href.startsWith("mailto:");
  return {
    href: href || "/",
    scope: href && !internal ? "external" : "internal",
    newTab: attrs.target === "_blank",
    follow: rel.includes("nofollow") ? "nofollow" : "dofollow",
  };
}

function normalizeHref(draft: LinkDraft): string {
  const raw = draft.href.trim();
  if (draft.scope === "internal") {
    if (!raw || raw === "https://") return "/";
    if (
      raw.startsWith("/") ||
      raw.startsWith("#") ||
      raw.startsWith("mailto:")
    ) {
      return raw;
    }
    return `/${raw.replace(/^\/+/, "")}`;
  }
  if (!raw || raw === "/") return "https://";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("mailto:")) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

function MarkBtn({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-6 w-6 items-center justify-center rounded transition ${
        active
          ? "bg-blue-600 text-white shadow-2xs"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function ActiveEditorMarksBar({
  editor,
  rich,
  linkOpen,
  onToggleLink,
}: {
  editor: Editor;
  rich: boolean;
  linkOpen: boolean;
  onToggleLink: () => void;
}) {
  const marks = useEditorState({
    editor,
    selector: ({ editor: cur }) => ({
      bold: cur.isActive("bold"),
      italic: cur.isActive("italic"),
      underline: cur.isActive("underline"),
      strike: cur.isActive("strike"),
      code: cur.isActive("code"),
      link: cur.isActive("link"),
      bullet: cur.isActive("bulletList"),
      ordered: cur.isActive("orderedList"),
    }),
  });

  return (
    <>
      <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
      <MarkBtn
        label="Kalın (Ctrl+B)"
        active={marks.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-3 w-3" />
      </MarkBtn>
      <MarkBtn
        label="İtalik (Ctrl+I)"
        active={marks.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-3 w-3" />
      </MarkBtn>
      <MarkBtn
        label="Altı çizili (Ctrl+U)"
        active={marks.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-3 w-3" />
      </MarkBtn>
      <MarkBtn
        label="Üstü çizili"
        active={marks.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-3 w-3" />
      </MarkBtn>
      <MarkBtn
        label="Satır içi kod"
        active={marks.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-3 w-3" />
      </MarkBtn>
      <MarkBtn
        label="Bağlantı ekle / düzenle"
        active={marks.link || linkOpen}
        onClick={onToggleLink}
      >
        <Link2 className="h-3 w-3" />
      </MarkBtn>
      {rich && (
        <>
          <MarkBtn
            label="Madde işaretli liste"
            active={marks.bullet}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3 w-3" />
          </MarkBtn>
          <MarkBtn
            label="Numaralı liste"
            active={marks.ordered}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3 w-3" />
          </MarkBtn>
        </>
      )}
      <MarkBtn
        label="Biçimlendirmeyi temizle"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        <RemoveFormatting className="h-3 w-3" />
      </MarkBtn>
    </>
  );
}

export function ToolbarProseAndAi({
  block,
  editor,
  onUpdateProp,
  onConvertText,
}: {
  block: BlockNode;
  editor?: Editor | null;
  onUpdateProp: (id: string, key: string, value: unknown) => void;
  onConvertText?: (kind: "paragraph" | "heading" | "div", level?: number) => void;
}) {
  const [linkDraft, setLinkDraft] = useState<LinkDraft | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const linkRange = useRef<{ from: number; to: number } | null>(null);

  const isConvertibleText =
    block.type === "heading" ||
    block.type === "paragraph" ||
    block.type === "heading_element" ||
    block.type === "paragraph_element" ||
    block.type === "text_div";

  const isAiSupported =
    isConvertibleText || block.type === "quote" || block.type === "tldr_box";

  const isRichParagraph =
    block.type === "paragraph" ||
    block.type === "paragraph_element" ||
    block.type === "text_div" ||
    block.type === "tldr_box";

  const currentTag =
    block.type === "heading" || block.type === "heading_element"
      ? (`h${Number(block.props.level ?? 2)}` as "h1" | "h2" | "h3" | "h4")
      : block.type === "text_div"
        ? "div"
        : "p";

  const handleTagSelect = (tag: "p" | "h1" | "h2" | "h3" | "h4" | "div") => {
    if (tag === "p") {
      onConvertText?.("paragraph");
    } else if (tag === "div") {
      onConvertText?.("div");
    } else {
      const lvl = Number(tag.slice(1));
      if (block.type === "heading" || block.type === "heading_element") {
        onUpdateProp(block.id, "level", lvl);
      } else {
        onConvertText?.("heading", lvl);
      }
    }
  };

  const toggleLinkPopover = () => {
    if (!editor) return;
    if (linkDraft !== null) {
      setLinkDraft(null);
      return;
    }
    setAiOpen(false);
    const { from, to } = editor.state.selection;
    linkRange.current = { from, to };
    setLinkDraft(readLink(editor));
  };

  const withLinkSelection = () => {
    if (!editor) return null;
    const chain = editor.chain().focus();
    const range = linkRange.current;
    if (range && range.from !== range.to) chain.setTextSelection(range);
    return chain;
  };

  const applyLink = () => {
    if (!linkDraft || !editor) return;
    const href = normalizeHref(linkDraft);
    const chain = withLinkSelection();
    if (!chain) return;
    if (href === "https://") {
      chain.unsetLink().run();
      setLinkDraft(null);
      return;
    }
    const rel = [
      linkDraft.follow === "nofollow" ? "nofollow" : null,
      linkDraft.newTab ? "noopener" : null,
      linkDraft.newTab ? "noreferrer" : null,
    ]
      .filter(Boolean)
      .join(" ");
    chain
      .extendMarkRange("link")
      .setLink({
        href,
        target: linkDraft.newTab ? "_blank" : null,
        rel: rel || null,
      })
      .run();
    setLinkDraft(null);
  };

  return (
    <>
      {/* 1. Tekil Etiket / Yapı Dönüştürücü (P | H1 | H2 | H3 | H4 | Div) */}
      {isConvertibleText && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          <div className="flex items-center gap-0.5 rounded bg-slate-800/90 p-0.5">
            {(
              [
                ["p", "P", "Paragraf"],
                ["h1", "H1", "Başlık 1"],
                ["h2", "H2", "Başlık 2"],
                ["h3", "H3", "Başlık 3"],
                ["h4", "H4", "Başlık 4"],
                ["div", "Div", "Div Kapsayıcı"],
              ] as const
            ).map(([tag, label, title]) => {
              const active = currentTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  title={title}
                  aria-label={title}
                  aria-pressed={active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleTagSelect(tag)}
                  className={`h-5 min-w-5 rounded px-1.5 text-[10px] font-bold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 2. Birleşik TipTap Zengin Metin Biçimlendirme Düğmeleri */}
      {editor && (
        <ActiveEditorMarksBar
          editor={editor}
          rich={isRichParagraph}
          linkOpen={linkDraft !== null}
          onToggleLink={toggleLinkPopover}
        />
      )}

      {/* 3. ✨ AI ile Yaz / Düzenle Düğmesi */}
      {isAiSupported && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setLinkDraft(null);
              setAiOpen((v) => !v);
            }}
            aria-label="AI ile yaz veya düzenle"
            aria-expanded={aiOpen}
            title="AI ile Yaz / Düzenle (Yaz, Yeniden yaz, Genişlet, Kısalt, Düzelt)"
            className={`inline-flex h-6 items-center gap-1 rounded px-2 text-[10px] font-semibold transition ${
              aiOpen
                ? "bg-violet-600 text-white ring-2 ring-violet-400/50"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>AI Yaz / Düzenle</span>
          </button>
        </>
      )}

      {/* Bağlantı (Link) Açılır Penceresi — Araç Çubuğunun Altında */}
      {linkDraft !== null && editor && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-slate-700 bg-slate-900/98 p-3 text-xs text-white shadow-2xl space-y-2"
        >
          <div className="flex gap-1">
            {(
              [
                ["internal", "İç bağlantı"],
                ["external", "Dış bağlantı"],
              ] as const
            ).map(([scope, label]) => (
              <button
                key={scope}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  setLinkDraft((cur) =>
                    cur
                      ? {
                          ...cur,
                          scope,
                          href: scope === "internal" ? "/" : "https://",
                        }
                      : cur
                  )
                }
                className={`flex-1 rounded-md py-1 text-[11px] font-semibold ${
                  linkDraft.scope === scope
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={linkDraft.href}
            onChange={(e) =>
              setLinkDraft((cur) =>
                cur ? { ...cur, href: e.target.value } : cur
              )
            }
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.currentTarget.focus()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setLinkDraft(null);
                editor.commands.focus();
              }
            }}
            placeholder={
              linkDraft.scope === "internal" ? "/hakkimizda" : "https://"
            }
            aria-label="Bağlantı adresi"
            className="h-8 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-white outline-none focus:border-blue-500"
          />
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={linkDraft.newTab}
                onChange={(e) =>
                  setLinkDraft((cur) =>
                    cur ? { ...cur, newTab: e.target.checked } : cur
                  )
                }
              />
              Yeni sekme
            </label>
            <div className="flex gap-1">
              {(["dofollow", "nofollow"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    setLinkDraft((cur) => (cur ? { ...cur, follow: f } : cur))
                  }
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    linkDraft.follow === f
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={applyLink}
              className="rounded-md bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-500"
            >
              Uygula
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setLinkDraft(null);
                editor.commands.focus();
              }}
              className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
            >
              İptal
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                withLinkSelection()?.unsetLink().run();
                setLinkDraft(null);
              }}
              className="ml-auto rounded-md px-2 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-950/50"
            >
              Kaldır
            </button>
          </div>
        </div>
      )}

      {/* ✨ AI ile Yaz / Düzenle Açılır Penceresi — Araç Çubuğunun Altında */}
      {aiOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-1.5 z-50 w-[360px] max-w-[92vw]"
        >
          <AiComposePanel onClose={() => setAiOpen(false)} />
        </div>
      )}
    </>
  );
}

