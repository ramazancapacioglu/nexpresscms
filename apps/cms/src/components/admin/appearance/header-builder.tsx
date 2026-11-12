"use client";

import React, { useState } from "react";
import {
  HEADER_WIDGETS,
  HEADER_WIDGET_META,
  deriveMobileZones,
  mobileZonesToWidgets,
  resolveHeaderZones,
  zonesToWidgets,
  type HeaderConfig,
  type HeaderWidgetId,
  type HeaderZones,
} from "@nexpress/core";
import { ChevronLeft, ChevronRight, Monitor, Plus, RotateCcw, Smartphone, X } from "lucide-react";
import { BAR_LABEL, HeaderElementSettings, type BuilderSelection, type HeaderBarName } from "./header-element-settings";

type Device = "desktop" | "mobile";
type Side = "left" | "center" | "right";
const SIDES: Side[] = ["left", "center", "right"];
const SIDE_LABEL: Record<Side, string> = { left: "Sol", center: "Orta", right: "Sağ" };
const BARS: HeaderBarName[] = ["top", "main", "bottom"];
const EMPTY: HeaderZones = { left: [], center: [], right: [] };
const BAR_KEY = { top: "topBar", main: "mainBar", bottom: "bottomBar" } as const;
const MIME = "application/x-nx-header-el";

/** Şeridin sol/orta/sağ dizisi. Kurucuda boş şerit geçerlidir: varsayılana düşülmez. */
function readZones(header: HeaderConfig, bar: HeaderBarName, device: Device): HeaderZones {
  const cfg = header[BAR_KEY[bar]];
  const desktop = resolveHeaderZones(cfg, EMPTY);
  if (device === "desktop") return desktop;
  const explicit = cfg.mobileLeftWidgets !== undefined || cfg.mobileCenterWidgets !== undefined || cfg.mobileRightWidgets !== undefined;
  if (!explicit) return deriveMobileZones(desktop);
  return resolveHeaderZones({ leftWidgets: cfg.mobileLeftWidgets, centerWidgets: cfg.mobileCenterWidgets, rightWidgets: cfg.mobileRightWidgets }, EMPTY);
}

function writeZones(header: HeaderConfig, bar: HeaderBarName, device: Device, zones: HeaderZones): HeaderConfig {
  const patch = device === "desktop" ? zonesToWidgets(zones) : mobileZonesToWidgets(zones);
  return { ...header, [BAR_KEY[bar]]: { ...header[BAR_KEY[bar]], ...patch } } as HeaderConfig;
}

const without = (zones: HeaderZones, id: HeaderWidgetId): HeaderZones => ({
  left: zones.left.filter((x) => x !== id),
  center: zones.center.filter((x) => x !== id),
  right: zones.right.filter((x) => x !== id),
});

function insert(zones: HeaderZones, id: HeaderWidgetId, side: Side, index?: number): HeaderZones {
  const next = without(zones, id);
  const list = [...next[side]];
  list.splice(index ?? list.length, 0, id);
  return { ...next, [side]: list };
}

/**
 * Header yerleşim kurucusu: üç şerit × sol/orta/sağ bölge. Öğeler sürüklenerek şeritler arasında taşınır,
 * "+" ile eklenir, okla sıralanır. Masaüstü ve mobil düzen ayrı ayrı kurulur; mobile dokunulmazsa masaüstünden türetilir.
 */
export function HeaderBuilder({ header, onChange }: { header: HeaderConfig; onChange: (next: HeaderConfig) => void }) {
  const [device, setDevice] = useState<Device>("desktop");
  const [selected, setSelected] = useState<BuilderSelection | null>({ kind: "row", bar: "main" });
  const [dropKey, setDropKey] = useState<string | null>(null);

  const apply = (from: { bar: HeaderBarName; id: HeaderWidgetId } | null, to: { bar: HeaderBarName; side: Side; index?: number }, id: HeaderWidgetId) => {
    let next = header;
    if (from && from.bar !== to.bar) next = writeZones(next, from.bar, device, without(readZones(next, from.bar, device), id));
    next = writeZones(next, to.bar, device, insert(readZones(next, to.bar, device), id, to.side, to.index));
    onChange(next);
    setSelected({ kind: "element", bar: to.bar, id });
  };

  const onDrop = (event: React.DragEvent, bar: HeaderBarName, side: Side, index?: number) => {
    event.preventDefault();
    event.stopPropagation();
    setDropKey(null);
    try {
      const data = JSON.parse(event.dataTransfer.getData(MIME)) as { bar: HeaderBarName | null; id: HeaderWidgetId };
      if (!HEADER_WIDGETS.includes(data.id)) return;
      apply(data.bar ? { bar: data.bar, id: data.id } : null, { bar, side, index }, data.id);
    } catch {
      /* başka bir kaynaktan gelen sürükleme */
    }
  };

  const remove = (bar: HeaderBarName, id: HeaderWidgetId) => {
    onChange(writeZones(header, bar, device, without(readZones(header, bar, device), id)));
    setSelected({ kind: "row", bar });
  };

  const nudge = (bar: HeaderBarName, id: HeaderWidgetId, dir: -1 | 1) => {
    const zones = readZones(header, bar, device);
    const flat = SIDES.flatMap((side) => zones[side].map((x) => ({ side, id: x })));
    const at = flat.findIndex((x) => x.id === id);
    const to = flat[at + dir];
    if (at < 0 || !to) return;
    const base = without(zones, id);
    const j = base[to.side].indexOf(to.id);
    const list = [...base[to.side]];
    list.splice(dir === 1 ? j + 1 : j, 0, id);
    onChange(writeZones(header, bar, device, { ...base, [to.side]: list }));
  };

  const mobileCustom = BARS.some((bar) => {
    const cfg = header[BAR_KEY[bar]];
    return cfg.mobileLeftWidgets !== undefined || cfg.mobileCenterWidgets !== undefined || cfg.mobileRightWidgets !== undefined;
  });
  const resetMobile = () => {
    const strip = (cfg: HeaderConfig["topBar"]) => {
      const { mobileLeftWidgets: _l, mobileCenterWidgets: _c, mobileRightWidgets: _r, ...rest } = cfg;
      return rest;
    };
    onChange({ ...header, topBar: strip(header.topBar) as HeaderConfig["topBar"], mainBar: strip(header.mainBar) as HeaderConfig["mainBar"], bottomBar: strip(header.bottomBar) as HeaderConfig["bottomBar"] });
  };

  return (
    <section aria-label="Header yerleşim kurucusu" className="overflow-hidden rounded-xl border border-[#D5D8DE] bg-white dark:border-[#2E333D] dark:bg-[#15171C]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] bg-[#F8FAFC] px-4 py-2 dark:border-[#23262E] dark:bg-[#111318]">
        <div className="inline-flex overflow-hidden rounded-md border border-[#D5D8DE] text-[12px] font-semibold dark:border-[#2E333D]" role="group" aria-label="Cihaz">
          {([["desktop", "Masaüstü", Monitor], ["mobile", "Mobil", Smartphone]] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" aria-pressed={device === id} onClick={() => setDevice(id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${device === id ? "bg-blue-600 text-white" : "bg-transparent text-[#5F6570]"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
          {device === "mobile" ? (mobileCustom ? "Mobil düzen özel: değişiklikler yalnızca küçük ekranı etkiler." : "Mobil düzen masaüstünden türetilir; değiştirirseniz ayrılır.") : "Öğeleri sürükleyin, bölgedeki + ile ekleyin."}
        </p>
        {device === "mobile" && mobileCustom ? (
          <button type="button" onClick={resetMobile} className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline">
            <RotateCcw className="h-3 w-3" /> Masaüstünden yeniden türet
          </button>
        ) : null}
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3 p-4">
          {BARS.map((bar) => {
            const cfg = header[BAR_KEY[bar]];
            const zones = readZones(header, bar, device);
            const rowSelected = selected?.kind === "row" && selected.bar === bar;
            return (
              <div key={bar} className={`rounded-lg border ${rowSelected ? "border-blue-500 ring-1 ring-blue-500/30" : "border-[#E6E7EA] dark:border-[#2E333D]"} ${cfg.enabled ? "" : "opacity-60"}`}>
                <div className="flex items-center justify-between gap-2 border-b border-[#E6E7EA] px-3 py-1.5 dark:border-[#2E333D]">
                  <button type="button" onClick={() => setSelected({ kind: "row", bar })} className="text-[11px] font-bold uppercase tracking-wide text-[#454B55] hover:text-blue-600 dark:text-[#B4BAC5]">
                    {BAR_LABEL[bar]} {bar === "main" ? "· zorunlu" : ""}
                  </button>
                  <label className="inline-flex items-center gap-1.5 text-[11px]">
                    <input type="checkbox" checked={cfg.enabled} disabled={bar === "main"} onChange={(e) => onChange({ ...header, [BAR_KEY[bar]]: { ...cfg, enabled: e.target.checked } } as HeaderConfig)} />
                    Göster
                  </label>
                </div>
                <div className="grid gap-2 p-2 sm:grid-cols-3">
                  {SIDES.map((side) => {
                    const key = `${bar}:${side}`;
                    const placed = new Set([...zones.left, ...zones.center, ...zones.right]);
                    return (
                      <div
                        key={side}
                        onDragOver={(e) => { e.preventDefault(); setDropKey(key); }}
                        onDragLeave={() => setDropKey((k) => (k === key ? null : k))}
                        onDrop={(e) => onDrop(e, bar, side)}
                        className={`min-h-[64px] rounded-md border border-dashed p-1.5 ${dropKey === key ? "border-blue-500 bg-blue-500/5" : "border-[#D5D8DE] bg-[#F8FAFC] dark:border-[#2E333D] dark:bg-[#111318]"}`}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#5F6570]">{SIDE_LABEL[side]}</span>
                          <details className="relative">
                            <summary className="inline-flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded text-blue-600 hover:bg-blue-500/10" aria-label={`${BAR_LABEL[bar]} ${SIDE_LABEL[side]} bölgesine öğe ekle`}>
                              <Plus className="h-3.5 w-3.5" />
                            </summary>
                            <div className="absolute right-0 z-20 mt-1 max-h-60 w-48 overflow-y-auto rounded-md border border-[#D5D8DE] bg-white p-1 shadow-lg dark:border-[#2E333D] dark:bg-[#1A1D24]">
                              {HEADER_WIDGETS.filter((id) => !placed.has(id)).map((id) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={(e) => { apply(null, { bar, side }, id); (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open"); }}
                                  className="block w-full rounded px-2 py-1 text-left text-[12px] hover:bg-blue-500/10"
                                >
                                  {HEADER_WIDGET_META[id].label}
                                </button>
                              ))}
                              {placed.size >= HEADER_WIDGETS.length ? <div className="px-2 py-1 text-[11px] text-[#5F6570]">Tüm öğeler yerleştirildi.</div> : null}
                            </div>
                          </details>
                        </div>
                        <div className="flex flex-col gap-1">
                          {zones[side].map((id, index) => {
                            const active = selected?.kind === "element" && selected.bar === bar && selected.id === id;
                            return (
                              <div
                                key={id}
                                draggable
                                onDragStart={(e) => { e.dataTransfer.setData(MIME, JSON.stringify({ bar, id })); e.dataTransfer.effectAllowed = "move"; }}
                                onDrop={(e) => onDrop(e, bar, side, index)}
                                onClick={() => setSelected({ kind: "element", bar, id })}
                                className={`group flex cursor-grab items-center justify-between gap-1 rounded border bg-white px-2 py-1 text-[12px] shadow-2xs dark:bg-[#1A1D24] ${active ? "border-blue-500 ring-1 ring-blue-500/30" : "border-[#E6E7EA] dark:border-[#2E333D]"}`}
                              >
                                <span className="min-w-0 truncate font-medium">{HEADER_WIDGET_META[id].label}</span>
                                <span className="flex shrink-0 items-center text-[#5F6570] opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                                  <button type="button" aria-label="Geri taşı" onClick={(e) => { e.stopPropagation(); nudge(bar, id, -1); }}><ChevronLeft className="h-3.5 w-3.5" /></button>
                                  <button type="button" aria-label="İleri taşı" onClick={(e) => { e.stopPropagation(); nudge(bar, id, 1); }}><ChevronRight className="h-3.5 w-3.5" /></button>
                                  <button type="button" aria-label={`${HEADER_WIDGET_META[id].label} öğesini kaldır`} onClick={(e) => { e.stopPropagation(); remove(bar, id); }}><X className="h-3.5 w-3.5" /></button>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-[#5F6570] dark:text-[#8C9099]">Öğeler · sürükleyip bir bölgeye bırakın</div>
            <div className="flex flex-wrap gap-1.5">
              {HEADER_WIDGETS.map((id) => (
                <span
                  key={id}
                  draggable
                  title={HEADER_WIDGET_META[id].hint}
                  onDragStart={(e) => { e.dataTransfer.setData(MIME, JSON.stringify({ bar: null, id })); e.dataTransfer.effectAllowed = "copy"; }}
                  className="cursor-grab rounded-full border border-[#D5D8DE] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-medium hover:border-blue-500 dark:border-[#2E333D] dark:bg-[#111318]"
                >
                  {HEADER_WIDGET_META[id].label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside aria-label="Seçili öğe ayarları" className="border-t border-[#E6E7EA] bg-[#FBFBFD] p-4 lg:border-t-0 lg:border-l dark:border-[#23262E] dark:bg-[#12141A]">
          <HeaderElementSettings header={header} selection={selected} onChange={onChange} />
        </aside>
      </div>
    </section>
  );
}

