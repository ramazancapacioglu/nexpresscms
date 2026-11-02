"use client";

import React, { useMemo, useState, useTransition } from "react";
import { addMenuNode, countMenuNodes, findMenuNode, indentMenuNode, MENU_MAX_ITEMS, moveMenuNode, outdentMenuNode, removeMenuNode, updateMenuNode, type NavigationMenuItem } from "@nexpress/core";
import { MENU_TEMPLATES } from "@nexpress/themes";
import { saveChromeAction } from "@/app/admin/actions";
import { AppearanceTabs, SaveBar, TemplateRow } from "./appearance-ui";
import { MenuAddPanel, type AddRequest } from "./menu/menu-add-panel";
import { MenuItemSettings } from "./menu/menu-item-settings";
import { buildClientLookup, type MenuSourceLists } from "./menu/menu-sources";
import { MenuTree } from "./menu/menu-tree";

const panel = "rounded-lg border border-[#D5D8DE] bg-white dark:border-[#2E333D] dark:bg-[#15171C]";

/**
 * Menü ağacı (WordPress benzeri): soldan sayfa/yazı/kategori/etiket/ürün ekle, ağaçta sırala ve girintile (en çok 3 düzey),
 * seçili öğenin ayarları ve kök öğede mega menü yapılandırması. Bağlantılar kimlikle bağlıdır: slug değişince kendiliğinden güncellenir.
 */
export function MenuEditor({ initial, lists, locale, locales, defaultLocale, hasOwn }: { initial: NavigationMenuItem[]; lists: MenuSourceLists; locale: string; locales: string[]; defaultLocale: string; hasOwn: boolean }) {
  const [items, setItems] = useState<NavigationMenuItem[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const lookup = useMemo(() => buildClientLookup(lists, locale), [lists, locale]);
  const selected = selectedId ? findMenuNode(items, selectedId) : null;
  const total = countMenuNodes(items);

  const edit = (next: NavigationMenuItem[]) => {
    setItems(next);
    setDirty(true);
    setNotice(null);
  };

  const add = (reqs: AddRequest[]) => {
    let next = items;
    let lastId: string | null = null;
    for (const r of reqs) {
      if (countMenuNodes(next) >= MENU_MAX_ITEMS) break;
      const id = `nav_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      next = addMenuNode(next, { id, label: r.label, href: r.href, source: r.source }, null);
      lastId = id;
    }
    edit(next);
    if (lastId) setSelectedId(lastId);
  };

  const save = () =>
    start(async () => {
      await saveChromeAction({ menuItems: items, locale });
      setDirty(false);
      setNotice("Menü kaydedildi ve yayında.");
    });

  return (
    <div className="space-y-4">
      <AppearanceTabs current="menu" />
      {locales.length > 1 && (
        <nav aria-label="Menü dili" className="flex flex-wrap items-center gap-1 text-[13px]">
          <span className="mr-1 font-medium">Dil:</span>
          {locales.map((l) => (
            <a key={l} href={`/admin/appearance/menus?locale=${l}`} aria-current={l === locale ? "page" : undefined} className={`rounded px-2.5 py-1 font-semibold uppercase ${l === locale ? "bg-[#14151A] text-white dark:bg-[#F3F4F6] dark:text-[#14151A]" : "border border-[#D5D8DE] dark:border-[#2E333D]"}`}>{l}</a>
          ))}
          {locale !== defaultLocale && !hasOwn && <span className="ml-2 text-[12px] text-amber-800 dark:text-amber-300">Bu dilin ayrı menüsü yok; varsayılan dilin menüsü gösteriliyor. Kaydedince bu dile özel olur.</span>}
        </nav>
      )}
      <SaveBar title={dirty ? "Menü ağacı • kaydedilmemiş değişiklik var" : "Menü ağacı"} pending={pending} notice={notice} onSave={save} />
      <details className={`${panel} px-3 py-2 text-[13px]`}>
        <summary className="cursor-pointer font-medium">Hazır menü şablonları</summary>
        <div className="mt-2">
          <TemplateRow
            templates={MENU_TEMPLATES}
            onApply={(id) => {
              const found = MENU_TEMPLATES.find((item) => item.id === id);
              if (!found) return;
              const next = structuredClone(found.value);
              edit(next);
              setSelectedId(next[0]?.id ?? null);
              setNotice("Şablon uygulandı. Kaydet ile yayınlanır.");
            }}
          />
        </div>
      </details>
      <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <MenuAddPanel lists={lists} onAdd={add} locale={locale} />
        <section aria-label="Menü yapısı" className={panel}>
          <div className="flex items-center justify-between border-b border-[#D5D8DE] px-3 py-2 dark:border-[#2E333D]">
            <span className="text-[13px] font-semibold">Menü yapısı</span>
            <span className="text-[12px] text-[#454B55] dark:text-[#B4BAC5]">{total} öğe • en çok 3 düzey</span>
          </div>
          <MenuTree
            items={items}
            selectedId={selectedId}
            lookup={lookup}
            onSelect={setSelectedId}
            onMove={(id, dir) => edit(moveMenuNode(items, id, dir))}
            onIndent={(id) => edit(indentMenuNode(items, id))}
            onOutdent={(id) => edit(outdentMenuNode(items, id))}
            onRemove={(id) => {
              edit(removeMenuNode(items, id));
              if (selectedId === id) setSelectedId(null);
            }}
          />
        </section>
        <aside aria-label="Seçili öğe" className={`${panel} p-3 lg:col-span-2 xl:col-span-1`}>
          {selected ? (
            <MenuItemSettings
              item={selected.node as NavigationMenuItem}
              isRoot={selected.depth === 1}
              hasChildren={Boolean(selected.node.children?.length)}
              lookup={lookup}
              onChange={(patch) => edit(updateMenuNode(items, selected.node.id, patch))}
            />
          ) : (
            <p className="text-[13px] text-[#454B55] dark:text-[#B4BAC5]">Ayarlarını düzenlemek için ağaçtan bir öğe seçin.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
