"use client";

import { useEffect } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export interface ProseValue {
  text: string;
  html: string;
}

export type ProseStructureKind = "paragraph" | "heading" | "div";

export interface ProseStructure {
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
  onEditorReady?: (editor: Editor | null) => void;
  onChange: (value: ProseValue) => void;
  onCommit: () => void;
}

function toDocument(text: string, html?: string): string {
  if (html && html.trim()) return html;
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${safe}</p>`;
}

export function ProseField({
  text,
  html,
  placeholder,
  variant,
  syncToken,
  onEditorReady,
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
        class: rich
          ? "nx-prose min-h-7 text-sm leading-relaxed outline-none"
          : "nx-prose-inline min-h-7 outline-none",
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
    onEditorReady?.(editor ?? null);
    return () => {
      onEditorReady?.(null);
    };
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(toDocument(text, html), { emitUpdate: false });
    // Yalnızca geri al / ileri al veya AI uygulaması bu belirteci artırır.
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
      <EditorContent editor={editor} />
    </div>
  );
}
