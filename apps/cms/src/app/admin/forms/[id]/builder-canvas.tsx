"use client";

import React from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { ratingMax, type FormField } from "@nexpress/core";
import { kindOf } from "./builder-model";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const mock = `h-8 w-full rounded-md border ${border} bg-[#F9FAFB] dark:bg-[#1C1E24] px-2 text-[12px] leading-8 text-[#5F6570] dark:text-[#8C9099]`;

/** Alanın kanvastaki (etkileşimsiz) görünümü; genişlik ve düzen ziyaretçi formuyla aynıdır. */
export function FieldPreview({ f }: { f: FormField }) {
  switch (f.type) {
    case "heading": return <p className="text-[15px] font-bold text-[#14151A] dark:text-[#F3F4F6]">{f.label}</p>;
    case "paragraph": return <p className="text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">{f.label}</p>;
    case "textarea": return <div className={`${mock} h-16`}>{f.placeholder}</div>;
    case "select": return <div className={mock}>{f.placeholder || "Seçin"} ▾</div>;
    case "radio": case "checkboxes": return <ul className="space-y-1 text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">{f.options.slice(0, 4).map((o) => <li key={o}>{f.type === "radio" ? "◯" : "☐"} {o}</li>)}{f.options.length > 4 && <li>… +{f.options.length - 4}</li>}</ul>;
    case "checkbox": return <p className="text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">☐ {f.label}{f.required ? " *" : ""}</p>;
    case "rating": return <p className="text-[16px] tracking-widest text-amber-500">{"★".repeat(ratingMax(f))}</p>;
    case "scale": return <p className="flex gap-0.5 text-[10px]">{Array.from({ length: 11 }, (_, i) => <span key={i} className={`rounded border ${border} px-1.5 py-0.5`}>{i}</span>)}</p>;
    default: return <div className={mock}>{f.placeholder}</div>;
  }
}

function SortableField({ f, selected, onSelect, onRemove, onDuplicate }: { f: FormField; selected: boolean; onSelect: () => void; onRemove: () => void; onDuplicate: () => void }) {
  const s = useSortable({ id: f.id });
  const Icon = kindOf(f.type).icon;
  const content = f.type === "heading" || f.type === "paragraph" || f.type === "checkbox";
  return (
    <li
      ref={s.setNodeRef}
      style={{ transform: CSS.Transform.toString(s.transform), transition: s.transition, opacity: s.isDragging ? 0.4 : 1 }}
      className={f.width === "half" ? "col-span-1" : "sm:col-span-2"}
    >
      <div className={`group flex gap-2 rounded-lg border bg-white p-3 dark:bg-[#15171C] ${selected ? "border-[#266DF0] ring-2 ring-[#266DF0]/20" : border}`}>
        <button type="button" aria-label="Sürükle" {...s.attributes} {...s.listeners} className="mt-0.5 h-6 w-5 shrink-0 cursor-grab touch-none text-[#5F6570] dark:text-[#8C9099] hover:text-[#5C5F66]"><GripVertical className="h-4 w-4" /></button>
        <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={`${f.label} alanını düzenle`} className="min-w-0 flex-1 space-y-1.5 text-left">
          {!content && (
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#14151A] dark:text-[#F3F4F6]">
              <Icon className="h-3.5 w-3.5 text-[#5F6570] dark:text-[#8C9099]" aria-hidden />
              <span className="truncate">{f.label}</span>{f.required && <span className="text-red-600">*</span>}
            </span>
          )}
          <FieldPreview f={f} />
          {f.help && !content && <span className="block text-[11px] text-[#5F6570] dark:text-[#8C9099]">{f.help}</span>}
        </button>
        <div className={`flex shrink-0 flex-col gap-1 ${selected ? "" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}>
          <button type="button" aria-label="Çoğalt" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="rounded p-1 text-[#5F6570] dark:text-[#8C9099] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]"><Copy className="h-3.5 w-3.5" /></button>
          <button type="button" aria-label="Sil" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="rounded p-1 text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </li>
  );
}

export function Canvas({ fields, selectedId, onSelect, onRemove, onDuplicate, submitLabel, dragging }: { fields: FormField[]; selectedId: string | null; onSelect: (id: string) => void; onRemove: (id: string) => void; onDuplicate: (id: string) => void; submitLabel: string; dragging: boolean }) {
  const end = useDroppable({ id: "canvas-end" });
  return (
    <div className={`rounded-lg border ${border} bg-[#F9FAFB] p-4 dark:bg-[#101216]`}>
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <SortableField key={f.id} f={f} selected={f.id === selectedId} onSelect={() => onSelect(f.id)} onRemove={() => onRemove(f.id)} onDuplicate={() => onDuplicate(f.id)} />
          ))}
        </ul>
      </SortableContext>
      <div ref={end.setNodeRef} className={`mt-3 rounded-lg border-2 border-dashed py-6 text-center text-[12px] ${end.isOver || dragging ? "border-[#266DF0] text-[#1D5ED8] dark:text-[#7AA7FF]" : `${border} text-[#5F6570] dark:text-[#8C9099]`}`}>
        {fields.length === 0 ? "Soldaki alanları buraya sürükleyin ya da tıklayarak ekleyin" : "Alan eklemek için buraya bırakın"}
      </div>
      <p className="mt-3"><span className="inline-block rounded-md bg-[#266DF0] px-4 py-1.5 text-[12px] font-semibold text-white">{submitLabel || "Gönder"}</span></p>
    </div>
  );
}
