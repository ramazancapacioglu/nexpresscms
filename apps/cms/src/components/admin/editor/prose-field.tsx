"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
  Strikethrough,
  Underline,
} from "lucide-react";

export interface ProseValue {
  text: string;
  html: string;
}

export type ProseStructureKind = "paragraph" | "heading" | "div";

interface ProseStructure {
  kind: ProseStructureKind;
  level: number;
  onChange: (kind: ProseStructureKind, level: number) => void;
}

interface ProseFieldProps {
  text: string;
  html?: string;
  placeholder: string;
  variant: "inline" | "paragraph" | "quote";
  syncToken: number;
  structure?: ProseStructure;
  onChange: (value: ProseValue) => void;
  onCommit: () => void;
}

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
  const internal = href.startsWith("/") || href.startsWith("#") || href.startsWith("mailto:");
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
    if (raw.startsWith("/") || raw.startsWith("#") || raw.startsWith("mailto:")) return raw;
    return `/${raw.replace(/^\/+/, "")}`;
  }
  if (!raw || raw === "/") return "https://";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("mailto:")) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

function toDocument(text: string, html?: string): string {
  if (html && html.trim()) return html;
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${safe}</p>`;
}

function FormatButton({
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
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

const STRUCTURES: Array<{ kind: ProseStructureKind; level: number; label: string; title: string }> = [
  { kind: "paragraph", level: 2, label: "P", title: "Paragraf" },
  { kind: "heading", level: 2, label: "H2", title: "Başlık 2" },
  { kind: "heading", level: 3, label: "H3", title: "Başlık 3" },
  { kind: "heading", level: 4, label: "H4", title: "Başlık 4" },
  { kind: "div", level: 2, label: "Div", title: "Div" },
];

function ProseToolbar({
  editor,
  rich,
  structure,
}: {
  editor: Editor;
  rich: boolean;
  structure?: ProseStructure;
}) {
  const [linkDraft, setLinkDraft] = useState<LinkDraft | null>(null);
  const linkRange = useRef<{ from: number; to: number } | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number; below: boolean } | null>(
    null
  );

  useEffect(() => {
    const doc = editor.view.dom.ownerDocument;
    const win = doc.defaultView ?? window;
    const place = () => {
      const selection = win.getSelection();
      const outside = () => {
        if (linkDraft !== null) return;
        setAnchor(null);
      };
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        outside();
        return;
      }
      const range = selection.getRangeAt(0);
      if (!editor.view.dom.contains(range.commonAncestorContainer)) {
        outside();
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        outside();
        return;
      }
      const below = rect.top < 52;
      setAnchor({
        top: below ? rect.bottom + 8 : rect.top - 8,
        left: rect.left + rect.width / 2,
        below,
      });
    };
    doc.addEventListener("selectionchange", place);
    win.addEventListener("resize", place);
    const scroller = editor.view.dom.closest(".overflow-y-auto");
    scroller?.addEventListener("scroll", place, { passive: true });
    return () => {
      doc.removeEventListener("selectionchange", place);
      win.removeEventListener("resize", place);
      scroller?.removeEventListener("scroll", place);
    };
  }, [editor, linkDraft]);
  const marks = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      code: current.isActive("code"),
      link: current.isActive("link"),
      bullet: current.isActive("bulletList"),
      ordered: current.isActive("orderedList"),
    }),
  });

  const withLinkSelection = () => {
    const chain = editor.chain().focus();
    const range = linkRange.current;
    if (range && range.from !== range.to) chain.setTextSelection(range);
    return chain;
  };

  const applyLink = () => {
    if (!linkDraft) return;
    const href = normalizeHref(linkDraft);
    if (href === "https://") {
      withLinkSelection().unsetLink().run();
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
    withLinkSelection()
      .extendMarkRange("link")
      .setLink({
        href,
        target: linkDraft.newTab ? "_blank" : null,
        rel: rel || null,
      })
      .run();
    setLinkDraft(null);
  };

  if (!anchor) return null;

  return createPortal(
    <div
      className="z-[80]"
      style={{
        position: "fixed",
        top: anchor.top,
        left: anchor.left,
        transform: anchor.below ? "translateX(-50%)" : "translate(-50%, -100%)",
      }}
    >
      <div className="flex max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg border border-[#E6E7EA] bg-white shadow-lg dark:border-[#2A2E38] dark:bg-[#16181D]">
        <div className="flex items-center gap-0.5 p-1.5">
          {structure ? (
            <>
              {STRUCTURES.map((item) => {
                const active =
                  structure.kind === item.kind &&
                  (item.kind !== "heading" || structure.level === item.level);
                return (
                  <button
                    key={`${item.kind}-${item.level}`}
                    type="button"
                    title={item.title}
                    aria-label={item.title}
                    aria-pressed={active}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => structure.onChange(item.kind, item.level)}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-[11px] font-bold ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
              <span className="mx-0.5 h-5 w-px bg-[#E6E7EA] dark:bg-[#2A2E38]" />
            </>
          ) : null}
          <FormatButton
            label="Kalın"
            active={marks.bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </FormatButton>
          <FormatButton
            label="İtalik"
            active={marks.italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </FormatButton>
          <FormatButton
            label="Altı çizili"
            active={marks.underline}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline className="h-4 w-4" />
          </FormatButton>
          <FormatButton
            label="Üstü çizili"
            active={marks.strike}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </FormatButton>
          <FormatButton
            label="Kod"
            active={marks.code}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </FormatButton>
          <span className="mx-0.5 h-4 w-px bg-[#E6E7EA] dark:bg-[#2A2E38]" />
          <FormatButton
            label="Bağlantı"
            active={marks.link || linkDraft !== null}
            onClick={() => {
              const { from, to } = editor.state.selection;
              linkRange.current = { from, to };
              setLinkDraft(readLink(editor));
            }}
          >
            <Link2 className="h-4 w-4" />
          </FormatButton>
          {rich ? (
            <>
              <FormatButton
                label="Madde listesi"
                active={marks.bullet}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List className="h-4 w-4" />
              </FormatButton>
              <FormatButton
                label="Numaralı liste"
                active={marks.ordered}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="h-4 w-4" />
              </FormatButton>
            </>
          ) : null}
          <span className="mx-0.5 h-4 w-px bg-[#E6E7EA] dark:bg-[#2A2E38]" />
          <FormatButton
            label="Biçimi temizle"
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
          >
            <RemoveFormatting className="h-4 w-4" />
          </FormatButton>
        </div>
        {linkDraft !== null ? (
          <div className="space-y-1.5 border-t border-[#E6E7EA] px-2 py-2 dark:border-[#2A2E38]">
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
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    setLinkDraft((current) =>
                      current
                        ? {
                            ...current,
                            scope,
                            href: scope === "internal" ? "/" : "https://",
                          }
                        : current
                    )
                  }
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                    linkDraft.scope === scope
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              value={linkDraft.href}
              onChange={(event) =>
                setLinkDraft((current) =>
                  current ? { ...current, href: event.target.value } : current
                )
              }
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => event.currentTarget.focus()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setLinkDraft(null);
                  editor.commands.focus();
                }
              }}
              placeholder={linkDraft.scope === "internal" ? "/tr/sayfa" : "https://"}
              className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-xs font-normal not-italic text-slate-800 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              aria-label="Bağlantı adresi"
            />
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={linkDraft.newTab}
                onMouseDown={(event) => event.preventDefault()}
                onChange={(event) =>
                  setLinkDraft((current) =>
                    current ? { ...current, newTab: event.target.checked } : current
                  )
                }
              />
              Yeni sekmede aç
            </label>
            <div className="flex gap-1">
              {(
                [
                  ["dofollow", "Dofollow"],
                  ["nofollow", "Nofollow"],
                ] as const
              ).map(([follow, label]) => (
                <button
                  key={follow}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    setLinkDraft((current) => (current ? { ...current, follow } : current))
                  }
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                    linkDraft.follow === follow
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={applyLink}
                className="rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white"
              >
                Uygula
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setLinkDraft(null);
                  editor.commands.focus();
                }}
                className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                İptal
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  withLinkSelection().unsetLink().run();
                  setLinkDraft(null);
                }}
                className="rounded px-2 py-1 text-[11px] font-semibold text-rose-600"
              >
                Bağlantıyı kaldır
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    editor.view.dom.ownerDocument.body
  );
}

export function ProseField({
  text,
  html,
  placeholder,
  variant,
  syncToken,
  structure,
  onChange,
  onCommit,
}: ProseFieldProps) {
  const rich = variant === "paragraph";
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          isAllowedUri: (url, ctx) =>
            url.startsWith("/") || url.startsWith("#") || ctx.defaultValidate(url),
        },
        ...(rich
          ? {}
          : { bulletList: false, orderedList: false, listItem: false }),
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: toDocument(text, html),
    editorProps: {
      attributes: {
        class: rich ? "nx-prose min-h-7 text-sm leading-relaxed" : "nx-prose-inline min-h-7",
        role: "textbox",
        "aria-multiline": rich ? "true" : "false",
        "aria-label": rich ? "Zengin metin alanı" : "Metin alanı",
      },
      handleKeyDown: (_view, event) => {
        if (variant === "inline" && event.key === "Enter") {
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange({ text: current.getText(), html: current.getHTML() });
    },
    onBlur: () => onCommit(),
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(toDocument(text, html), { emitUpdate: false });
    // Yalnızca geri al / ileri al bu belirteci artırır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, syncToken]);

  if (!editor) {
    return (
      <p className="text-sm leading-relaxed text-slate-700 dark:text-zinc-200">
        {text || placeholder}
      </p>
    );
  }

  return (
    <div className={variant === "quote" ? "italic" : undefined}>
      <ProseToolbar editor={editor} rich={rich} structure={structure} />
      <EditorContent editor={editor} />
    </div>
  );
}
