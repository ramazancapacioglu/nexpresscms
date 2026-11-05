"use client";

import React, { useState } from "react";
import {
  DEFAULT_HEADER_ZONES,
  resolveHeaderZones,
  zonesToWidgets,
  type HeaderBarKey,
  type HeaderBarWidgets,
  type HeaderWidgetId,
  type HeaderZones,
} from "@nexpress/core";

const ZONES = ["left", "center", "right"] as const;
const ZONE_LABEL: Record<(typeof ZONES)[number], string> = { left: "Sol", center: "Orta", right: "Sağ" };

const PALETTE: Record<HeaderBarKey, { id: HeaderWidgetId; label: string }[]> = {
  top: [
    { id: "announcement", label: "Duyuru" },
    { id: "contact", label: "İletişim" },
  ],
  main: [
    { id: "logo", label: "Logo" },
    { id: "menu", label: "Menü" },
    { id: "search", label: "Arama" },
    { id: "cta", label: "Çağrı" },
  ],
  bottom: [{ id: "links", label: "Bağlantılar" }],
};

function labelOf(bar: HeaderBarKey, id: HeaderWidgetId): string {
  return PALETTE[bar].find((item) => item.id === id)?.label ?? id;
}

function place(zones: HeaderZones, id: HeaderWidgetId, side: (typeof ZONES)[number]): HeaderZones {
  const next: HeaderZones = {
    left: zones.left.filter((item) => item !== id),
    center: zones.center.filter((item) => item !== id),
    right: zones.right.filter((item) => item !== id),
  };
  next[side] = [...next[side], id];
  return next;
}

function move(zones: HeaderZones, id: HeaderWidgetId, dir: -1 | 1): HeaderZones {
  const side = ZONES.find((key) => zones[key].includes(id));
  if (!side) return zones;
  const list = [...zones[side]];
  const index = list.indexOf(id);
  const target = index + dir;
  if (target < 0 || target >= list.length) return zones;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item!);
  return { ...zones, [side]: list };
}

/**
 * Bir header şeridinin sol / orta / sağ öğe dizisi.
 * Sürükleyerek veya düğmeyle bölge değiştirilir; kayıt kanonik kimliklerle yazılır.
 */
export function HeaderZoneBoard({
  barKey,
  bar,
  onChange,
  fallback,
  heading,
}: {
  barKey: HeaderBarKey;
  bar: HeaderBarWidgets;
  onChange: (patch: ReturnType<typeof zonesToWidgets>) => void;
  /** Yazılı dizi yoksa gösterilecek düzen. */
  fallback?: HeaderZones;
  heading?: string;
}) {
  const zones = resolveHeaderZones(bar, fallback ?? DEFAULT_HEADER_ZONES[barKey]);
  const [dragId, setDragId] = useState<HeaderWidgetId | null>(null);
  const placed = new Set([...zones.left, ...zones.center, ...zones.right]);
  const emit = (next: HeaderZones) => onChange(zonesToWidgets(next));

  return (
    <div className="space-y-2">
      {heading ? <div className="text-[11px] font-semibold text-[#5F6570] dark:text-[#8C9099]">{heading}</div> : null}
      <div className="flex flex-wrap gap-1.5">
        {PALETTE[barKey].map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={placed.has(item.id)}
            onClick={() => emit(place(zones, item.id, "left"))}
            className="rounded-md border border-[#E6E7EA] px-2 py-1 text-[11px] disabled:opacity-40 dark:border-[#2E333D]"
          >
            + {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {ZONES.map((side) => (
          <div
            key={side}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragId) emit(place(zones, dragId, side));
              setDragId(null);
            }}
            className="min-h-16 rounded-md border border-dashed border-[#D5D8DE] bg-[#F8FAFC] p-2 dark:border-[#2E333D] dark:bg-[#111318]"
          >
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#5F6570]">{ZONE_LABEL[side]}</div>
            <div className="flex flex-col gap-1">
              {zones[side].map((id) => (
                <div
                  key={id}
                  draggable
                  onDragStart={() => setDragId(id)}
                  className="flex items-center justify-between gap-1 rounded bg-white px-2 py-1 text-[11px] shadow-2xs dark:bg-[#1A1D24]"
                >
                  <span className="cursor-grab font-medium">{labelOf(barKey, id)}</span>
                  <span className="flex items-center gap-1 text-[#5F6570]">
                    <button type="button" aria-label="Yukarı" onClick={() => emit(move(zones, id, -1))}>↑</button>
                    <button type="button" aria-label="Aşağı" onClick={() => emit(move(zones, id, 1))}>↓</button>
                    <button
                      type="button"
                      aria-label="Kaldır"
                      onClick={() =>
                        emit({
                          left: zones.left.filter((item) => item !== id),
                          center: zones.center.filter((item) => item !== id),
                          right: zones.right.filter((item) => item !== id),
                        })
                      }
                    >
                      ×
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
