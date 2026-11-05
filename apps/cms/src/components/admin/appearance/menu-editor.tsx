"use client";

import React, { useMemo, useState, useTransition } from "react";
import { addMenuNode, countMenuNodes, findMenuNode, indentMenuNode, indentMenuNodes, MENU_MAX_ITEMS, moveMenuNode, outdentMenuNode, outdentMenuNodes, removeMenuNode, removeMenuNodes, updateMenuNode, megaChildLayout, type NavigationMenuItem, type SiteMenuRecord } from "@nexpress/core";
import { MENU_TEMPLATES } from "@nexpress/themes";
import { saveChromeAction } from "@/app/admin/actions";
import { SvgIconPreview } from "@/components/admin/editor/icon-picker-modal";
import { AppearanceTabs, SaveBar, TemplateRow } from "./appearance-ui";
import { MenuAddPanel, type AddRequest } from "./menu/menu-add-panel";
import { MenuItemSettings } from "./menu/menu-item-settings";
import { buildClientLookup, type MenuSourceLists } from "./menu/menu-sources";
import { MenuTree } from "./menu/menu-tree";

const panel = "rounded-lg border border-[#D5D8DE] bg-white dark:border-[#2E333D] dark:bg-[#15171C]";

/**
 * Menü ağacı (WordPress benzeri): soldan sayfa/yazı/kategori/etiket/ürün ekle, ağaçta sırala ve girintile (en çok 3 düzey),
 * seçili öğenin ayarları ve kök öğede mega menü yapılandırması + üstte canlı menü/mega menü önizlemesi.
 */
export function MenuEditor({ menus: initialMenus, lists, locale, locales, defaultLocale, hasOwn }: { menus: SiteMenuRecord[]; lists: MenuSourceLists; locale: string; locales: string[]; defaultLocale: string; hasOwn: boolean }) {
  const [menus, setMenus] = useState<SiteMenuRecord[]>(initialMenus);
  const [activeMenuId, setActiveMenuId] = useState(initialMenus.find((m) => m.header)?.id ?? initialMenus[0]?.id ?? "");
  const activeMenu = menus.find((m) => m.id === activeMenuId) ?? menus[0];
  const items = activeMenu?.items ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [previewOpenId, setPreviewOpenId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const lookup = useMemo(() => buildClientLookup(lists, locale), [lists, locale]);
  const selected = selectedId ? findMenuNode(items, selectedId) : null;
  const total = countMenuNodes(items);

  const edit = (next: NavigationMenuItem[]) => {
    if (!activeMenu) return;
    setMenus((cur) => cur.map((m) => (m.id === activeMenu.id ? { ...m, items: next } : m)));
    setDirty(true);
    setNotice(null);
  };

  const openMenu = (id: string) => {
    setActiveMenuId(id);
    const next = menus.find((m) => m.id === id);
    setSelectedId(next?.items[0]?.id ?? null);
    setCheckedIds([]);
    setPreviewOpenId(null);
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

  const handleReorder = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const dHit = findMenuNode(items, draggedId);
    const tHit = findMenuNode(items, targetId);
    if (!dHit || !tHit) return;
    if (findMenuNode([dHit.node], targetId)) return;

    const without = removeMenuNode(items, draggedId);
    const newTHit = findMenuNode(without, targetId);
    if (!newTHit) {
      edit(without);
      return;
    }

    const parentId = newTHit.parent?.id ?? null;
    let next: NavigationMenuItem[];
    if (parentId === null) {
      const idx = without.findIndex((n) => n.id === targetId);
      const copy = [...without];
      copy.splice(idx, 0, dHit.node as NavigationMenuItem);
      next = copy;
    } else {
      next = addMenuNode(without, dHit.node, parentId);
    }
    edit(next);
  };

  const toggleChecked = (id: string) => {
    setCheckedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const save = () =>
    start(async () => {
      await saveChromeAction({ menus, locale });
      setDirty(false);
      setNotice("Menüler kaydedildi. Header'daki kayıt yayında.");
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
      <SaveBar title={dirty ? `${activeMenu?.name ?? "Menü"} • kaydedilmemiş değişiklik` : (activeMenu?.name ?? "Menüler")} pending={pending} notice={notice} onSave={save} />

      <section aria-label="Kayıtlı menüler" className={`${panel} flex flex-wrap items-center gap-2 p-2`}>
        {menus.map((m) => (
          <button key={m.id} type="button" onClick={() => openMenu(m.id)} aria-current={m.id === activeMenu?.id ? "true" : undefined} className={`rounded px-2 py-1 text-[12px] ${m.id === activeMenu?.id ? "bg-[#14151A] text-white dark:bg-[#F3F4F6] dark:text-[#14151A]" : "border border-[#D5D8DE] dark:border-[#2E333D]"}`}>
            {m.name}{m.header ? " · header" : ""}
          </button>
        ))}
        <button
          type="button"
          className="rounded border border-dashed border-[#D5D8DE] px-2 py-1 text-[12px] dark:border-[#2E333D]"
          onClick={() => {
            if (menus.length >= 12) return;
            const id = `menu_${Date.now().toString(36)}`;
            setMenus((cur) => [...cur, { id, name: "Yeni menü", header: false, items: [] }]);
            setActiveMenuId(id);
            setSelectedId(null);
            setCheckedIds([]);
            setDirty(true);
          }}
        >
          + Menü
        </button>
        {activeMenu ? (
          <>
            <label className="ml-1 text-[12px]">
              Ad
              <input
                value={activeMenu.name}
                maxLength={60}
                onChange={(e) => {
                  const name = e.target.value;
                  setMenus((cur) => cur.map((m) => (m.id === activeMenu.id ? { ...m, name } : m)));
                  setDirty(true);
                }}
                className="ml-1 w-36 rounded border border-[#D5D8DE] bg-white px-2 py-0.5 text-[12px] dark:border-[#2E333D] dark:bg-[#121317]"
              />
            </label>
            <label className="flex items-center gap-1 text-[12px]">
              <input
                type="radio"
                name="header-menu"
                checked={activeMenu.header}
                onChange={() => {
                  setMenus((cur) => cur.map((m) => ({ ...m, header: m.id === activeMenu.id })));
                  setDirty(true);
                }}
              />
              Header'da kullan
            </label>
            <button
              type="button"
              disabled={menus.length < 2}
              className="text-[12px] text-red-700 disabled:opacity-40"
              onClick={() => {
                const next = menus.filter((m) => m.id !== activeMenu.id);
                if (!next.some((m) => m.header) && next[0]) next[0] = { ...next[0], header: true };
                setMenus(next);
                setActiveMenuId(next[0]?.id ?? "");
                setSelectedId(next[0]?.items[0]?.id ?? null);
                setCheckedIds([]);
                setDirty(true);
              }}
            >
              Bu menüyü sil
            </button>
          </>
        ) : null}
      </section>

      {/* Canlı Menü & Mega Menü Önizleme Şeridi */}
      <section aria-label="Canlı menü önizlemesi" className={`${panel} p-3`}>
        <div className="mb-2 flex items-center justify-between text-[11px] text-[#5F6570] dark:text-[#8C9099]">
          <span className="font-semibold uppercase tracking-wider">Canlı Menü & Mega Menü Önizlemesi</span>
          <span>Öğeye tıklayarak açılır/mega menüyü test edin</span>
        </div>
        <div className="relative flex flex-wrap items-center gap-5 rounded-lg border border-[#E6E7EA] bg-[#FBFBFD] px-4 py-3 dark:border-[#23262E] dark:bg-[#111318]">
          {items.map((root) => {
            const hasSub = Boolean(root.megaMenu?.enabled || root.children?.length);
            const isOpen = previewOpenId === root.id;
            return (
              <div key={root.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(root.id);
                    setPreviewOpenId(isOpen ? null : root.id);
                  }}
                  className={`inline-flex items-center gap-1 text-[12px] font-medium transition ${
                    selectedId === root.id ? "text-blue-600" : "hover:text-blue-600"
                  }`}
                >
                  {root.icon && <SvgIconPreview name={root.icon} size={12} />}
                  <span>{root.label}</span>
                  {root.badge && (
                    <span className="rounded bg-blue-500/15 px-1.5 py-px text-[9px] font-bold uppercase text-blue-600">
                      {root.badge}
                    </span>
                  )}
                  {hasSub && <span className="text-[9px] opacity-60">▼</span>}
                </button>

                {isOpen && root.megaMenu?.enabled && (
                  <div className="mt-2 w-[min(640px,85vw)] rounded-xl border border-[#D5D8DE] bg-white p-4 shadow-xl dark:border-[#2E333D] dark:bg-[#15171C]">
                    {megaChildLayout(root) === "cards" || megaChildLayout(root) === "cards-and-list" ? (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {root.megaMenu.items.map((card) => (
                          <div key={card.id} className="flex items-start gap-2 rounded-lg border border-[#E6E7EA] p-2 dark:border-[#23262E]">
                            {card.icon && (
                              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500/10 text-blue-600">
                                <SvgIconPreview name={card.icon} size={12} />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="truncate text-[12px] font-medium">{card.label}</span>
                              {card.description && <p className="mt-0.5 text-[11px] opacity-75">{card.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {megaChildLayout(root) === "columns" ? (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {(root.children ?? []).map((col) => (
                          <div key={col.id} className="space-y-1">
                            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase">
                              {col.icon && <SvgIconPreview name={col.icon} size={12} />}
                              <span>{col.label}</span>
                            </div>
                            <ul className="space-y-0.5 text-[12px] opacity-80">
                              {(col.children ?? []).map((sub) => (
                                <li key={sub.id}>{sub.label}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {megaChildLayout(root) === "list" || megaChildLayout(root) === "cards-and-list" ? (
                      <ul className={`space-y-0.5 text-[12px] ${megaChildLayout(root) === "cards-and-list" ? "mt-3 border-t border-[#E6E7EA] pt-2 dark:border-[#23262E]" : ""}`}>
                        {(root.children ?? []).map((sub) => (
                          <li key={sub.id} className="flex items-center gap-1">
                            {sub.icon && <SvgIconPreview name={sub.icon} size={12} />}
                            <span>{sub.label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {root.megaMenu.promoBanner?.title && (
                      <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2 text-xs">
                        <div>
                          <div className="font-bold">{root.megaMenu.promoBanner.title}</div>
                          <div className="text-[11px] opacity-80">{root.megaMenu.promoBanner.subtitle}</div>
                        </div>
                        <span className="rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                          {root.megaMenu.promoBanner.ctaText || "İncele"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5D8DE] px-3 py-1.5 dark:border-[#2E333D]">
            <span className="text-[12px] font-semibold">Menü yapısı</span>
            <span className="text-[11px] text-[#6A7180]">{total} öğe</span>
          </div>
          {checkedIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E6E8EC] px-3 py-1.5 text-[12px] dark:border-[#2A2E36]">
              <span>{checkedIds.length} seçili</span>
              <button type="button" className="underline" onClick={() => edit(indentMenuNodes(items, checkedIds))}>İçeri al</button>
              <button type="button" className="underline" onClick={() => edit(outdentMenuNodes(items, checkedIds))}>Dışarı al</button>
              <button type="button" className="text-red-700 underline" onClick={() => { edit(removeMenuNodes(items, checkedIds)); setCheckedIds([]); if (selectedId && checkedIds.includes(selectedId)) setSelectedId(null); }}>Sil</button>
              <button type="button" className="underline" onClick={() => setCheckedIds([])}>Seçimi kaldır</button>
            </div>
          ) : null}
          <MenuTree
            items={items}
            selectedId={selectedId}
            checkedIds={checkedIds}
            lookup={lookup}
            onSelect={setSelectedId}
            onToggle={toggleChecked}
            onReorder={handleReorder}
            onMove={(id, dir) => edit(moveMenuNode(items, id, dir))}
            onIndent={(id) => edit(indentMenuNode(items, id))}
            onOutdent={(id) => edit(outdentMenuNode(items, id))}
            onRemove={(id) => {
              edit(removeMenuNode(items, id));
              setCheckedIds((cur) => cur.filter((x) => x !== id));
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
