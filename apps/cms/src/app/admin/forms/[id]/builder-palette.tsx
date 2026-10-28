"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { FormFieldType } from "@nexpress/core";
import { FIELD_KINDS, type FieldKind } from "./builder-model";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

function Item({ kind, onAdd }: { kind: FieldKind; onAdd: (t: FormFieldType) => void }) {
  const d = useDraggable({ id: `palette:${kind.type}` });
  const Icon = kind.icon;
  return (
    <button
      ref={d.setNodeRef}
      type="button"
      {...d.attributes}
      {...d.listeners}
      onClick={() => onAdd(kind.type)}
      className={`flex touch-none items-center gap-2 rounded-md border ${border} bg-white px-2.5 py-1.5 text-left text-[12px] hover:border-[#266DF0] dark:bg-[#15171C] ${d.isDragging ? "opacity-40" : ""}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#5F6570] dark:text-[#8C9099]" aria-hidden />
      <span className="truncate">{kind.label}</span>
    </button>
  );
}

/** Alan paleti: sürükleyip kanvasa bırakın ya da tıklayarak sona ekleyin (klavye için). */
export function Palette({ onAdd }: { onAdd: (t: FormFieldType) => void }) {
  const groups = [...new Set(FIELD_KINDS.map((k) => k.group))];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g}>
          <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">{g}</h2>
          <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
            {FIELD_KINDS.filter((k) => k.group === g).map((k) => <Item key={k.type} kind={k} onAdd={onAdd} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
