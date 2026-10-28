"use client";

import React, { useState, useTransition } from "react";
import type { NavigationLink, NavigationMenuItem } from "@nexpress/core";
import { MENU_TEMPLATES } from "@nexpress/themes";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { saveChromeAction } from "@/app/admin/actions";
import { AppearanceTabs, SaveBar, TemplateRow, fieldClass } from "./appearance-ui";

function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0) return list;
  const next = list.slice();
  const [row] = next.splice(from, 1);
  if (!row) return list;
  next.splice(to, 0, row);
  return next;
}

export function MenuEditor({ initial }: { initial: NavigationMenuItem[] }) {
  const [items, setItems] = useState<NavigationMenuItem[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [drag, setDrag] = useState<{ id: string; parentId: string | null } | null>(null);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const save = () => {
    start(async () => {
      await saveChromeAction({ menuItems: items });
      setNotice("Menü kaydedildi.");
    });
  };

  const dropOn = (targetId: string, parentId: string | null) => {
    if (!drag || drag.id === targetId || drag.parentId !== parentId) return;
    if (!parentId) {
      const from = items.findIndex((item) => item.id === drag.id);
      const to = items.findIndex((item) => item.id === targetId);
      setItems(reorder(items, from, to));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== parentId) return item;
        const children = item.children ?? [];
        const from = children.findIndex((child) => child.id === drag.id);
        const to = children.findIndex((child) => child.id === targetId);
        return { ...item, children: reorder(children, from, to) };
      })
    );
  };

  return (
    <div className="space-y-4">
      <AppearanceTabs current="menu" />
      <SaveBar title="Menü ağacı" pending={pending} notice={notice} onSave={save} />
      <TemplateRow
        templates={MENU_TEMPLATES}
        onApply={(id) => {
          const found = MENU_TEMPLATES.find((item) => item.id === id);
          if (!found) return;
          const next = structuredClone(found.value);
          setItems(next);
          setSelectedId(next[0]?.id ?? null);
          setNotice("Hazır menü forma alındı. Kaydet ile yayınlanır.");
        }}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-lg border border-[#E6E7EA] bg-white dark:border-[#23262E] dark:bg-[#15171C]">
          <div className="flex items-center justify-between border-b border-[#E6E7EA] px-3 py-2 dark:border-[#23262E]">
            <span className="text-[12px] font-semibold">Bağlantılar</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px]"
              onClick={() => {
                const id = `nav_${Date.now()}`;
                setItems((prev) => [...prev, { id, label: "Yeni bağlantı", href: "/tr", children: [] }]);
                setSelectedId(id);
              }}
            >
              <Plus className="h-3 w-3" />
              Ekle
            </button>
          </div>
          <ul className="divide-y divide-[#E6E7EA] text-[12px] dark:divide-[#23262E]">
            {items.map((item) => (
              <li key={item.id}>
                <MenuRow
                  label={item.label}
                  href={item.href}
                  active={item.id === selectedId}
                  onSelect={() => setSelectedId(item.id)}
                  onDragStart={() => setDrag({ id: item.id, parentId: null })}
                  onDrop={() => dropOn(item.id, null)}
                />
                {(item.children ?? []).length > 0 ? (
                  <ul className="border-t border-[#E6E7EA] bg-[#FBFBFB] dark:border-[#23262E] dark:bg-[#121317]">
                    {item.children?.map((child) => (
                      <li key={child.id} className="pl-6">
                        <MenuRow
                          label={child.label}
                          href={child.href}
                          active={false}
                          onSelect={() => setSelectedId(item.id)}
                          onDragStart={() => setDrag({ id: child.id, parentId: item.id })}
                          onDrop={() => dropOn(child.id, item.id)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
        <aside className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-3 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
          {selected ? (
            <>
              <div className="font-semibold">Seçili bağlantı</div>
              <input
                className={fieldClass}
                value={selected.label}
                onChange={(e) => patchItem(selected.id, { label: e.target.value })}
              />
              <input
                className={fieldClass}
                value={selected.href}
                onChange={(e) => patchItem(selected.id, { href: e.target.value })}
              />
              {(selected.children ?? []).map((child) => (
                <div key={child.id} className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    className={fieldClass}
                    value={child.label}
                    onChange={(e) =>
                      patchItem(selected.id, {
                        children: (selected.children ?? []).map((row) =>
                          row.id === child.id ? { ...row, label: e.target.value } : row
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="text-[#8C9099]"
                    onClick={() =>
                      patchItem(selected.id, {
                        children: (selected.children ?? []).filter((row) => row.id !== child.id),
                      })
                    }
                  >
                    Sil
                  </button>
                  <input
                    className={`${fieldClass} col-span-2`}
                    value={child.href}
                    onChange={(e) =>
                      patchItem(selected.id, {
                        children: (selected.children ?? []).map((row) =>
                          row.id === child.id ? { ...row, href: e.target.value } : row
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-[11px]"
                onClick={() => {
                  const child: NavigationLink = {
                    id: `sub_${Date.now()}`,
                    label: "Alt bağlantı",
                    href: "/tr",
                  };
                  patchItem(selected.id, { children: [...(selected.children ?? []), child] });
                }}
              >
                Alt bağlantı ekle
              </button>
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] text-rose-600"
                onClick={() => {
                  setItems((prev) => prev.filter((item) => item.id !== selected.id));
                  setSelectedId(null);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Bağlantıyı sil
              </button>
              <p className="text-[11px] leading-snug text-[#8C9099]">
                Tutamacı sürükleyerek aynı düzeyde sıralayın. Alt bağlantı yalnızca kendi üstünün içinde yer değiştirir.
              </p>
            </>
          ) : (
            <p className="text-[11px] text-[#8C9099]">Düzenlemek için bir bağlantı seçin.</p>
          )}
        </aside>
      </div>
    </div>
  );

  function patchItem(id: string, patch: Partial<NavigationMenuItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }
}

function MenuRow({
  label,
  href,
  active,
  onSelect,
  onDragStart,
  onDrop,
}: {
  label: string;
  href: string;
  active: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={`flex items-center gap-2 px-3 py-2 ${active ? "bg-[#F4F5F6] dark:bg-[#1C1F26]" : ""}`}
    >
      <button
        type="button"
        draggable
        title="Sırala"
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", label);
          event.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        className="cursor-grab text-[#8C9099]"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 truncate text-left font-medium">
        {label}
      </button>
      <span className="truncate font-mono text-[10px] text-[#8C9099]">{href}</span>
    </div>
  );
}
