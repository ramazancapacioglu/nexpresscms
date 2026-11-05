"use client";

import {
  DEFAULT_HEADER_ZONES,
  deriveMobileZones,
  mobileZonesToWidgets,
  resolveHeaderZones,
  type HeaderConfig,
} from "@nexpress/core";
import { HeaderMiniBars } from "./header-mini-bars";
import { HeaderZoneBoard } from "./header-zone-board";

/**
 * Seçilen hazır header'ın mobil dizisini forma almadan önce düzenler.
 * Masaüstü dizisi şablonda kalır; mobil tahta kayda yazılacak dizileri üretir.
 */
export function HeaderLibraryDraft({
  name,
  value,
  onChange,
  onApply,
  onBack,
}: {
  name: string;
  value: HeaderConfig;
  onChange: (next: HeaderConfig) => void;
  onApply: () => void;
  onBack: () => void;
}) {
  const setBar = (key: "topBar" | "mainBar" | "bottomBar", patch: Partial<HeaderConfig["mainBar"]>) =>
    onChange({ ...value, [key]: { ...value[key], ...patch } });

  const mainDesktop = resolveHeaderZones(value.mainBar, DEFAULT_HEADER_ZONES.main);
  const topDesktop = resolveHeaderZones(value.topBar, DEFAULT_HEADER_ZONES.top);
  const bottomDesktop = resolveHeaderZones(value.bottomBar, DEFAULT_HEADER_ZONES.bottom);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[#E6E7EA] px-4 py-2 dark:border-[#23262E]">
        <button type="button" onClick={onBack} className="text-xs font-medium text-[#5F6570] hover:underline">
          Tasarım listesi
        </button>
        <div className="truncate text-sm font-semibold">{name}</div>
        <button type="button" onClick={onApply} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
          Forma al
        </button>
      </div>
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[280px_1fr]">
        <HeaderMiniBars header={value} />
        <div className="space-y-4">
          <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
            Mobil dizi bu tasarımın parçasıdır. Değiştirince forma yazılır; Kaydet ile yayınlanır.
          </p>
          {value.topBar.enabled ? (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold">Mobil üst şerit</h3>
              <HeaderZoneBoard
                barKey="top"
                heading="Duyuru ve iletişim. Boşaltırsan üst şerit küçük ekranda kaybolur."
                fallback={deriveMobileZones(topDesktop)}
                bar={{
                  leftWidgets: value.topBar.mobileLeftWidgets,
                  centerWidgets: value.topBar.mobileCenterWidgets,
                  rightWidgets: value.topBar.mobileRightWidgets,
                }}
                onChange={(patch) =>
                  setBar("topBar", mobileZonesToWidgets({ left: patch.leftWidgets, center: patch.centerWidgets, right: patch.rightWidgets }))
                }
              />
            </section>
          ) : null}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold">Mobil ana şerit</h3>
            <HeaderZoneBoard
              barKey="main"
              heading="Logo solda kalsın. Menü sağda düğme olur."
              fallback={deriveMobileZones(mainDesktop)}
              bar={{
                leftWidgets: value.mainBar.mobileLeftWidgets,
                centerWidgets: value.mainBar.mobileCenterWidgets,
                rightWidgets: value.mainBar.mobileRightWidgets,
              }}
              onChange={(patch) =>
                setBar("mainBar", mobileZonesToWidgets({ left: patch.leftWidgets, center: patch.centerWidgets, right: patch.rightWidgets }))
              }
            />
          </section>
          {value.bottomBar.enabled ? (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold">Mobil alt şerit</h3>
              <HeaderZoneBoard
                barKey="bottom"
                heading="Bağlantı sırası. Kaldırırsan alt şerit küçük ekranda basılmaz."
                fallback={deriveMobileZones(bottomDesktop)}
                bar={{
                  leftWidgets: value.bottomBar.mobileLeftWidgets,
                  centerWidgets: value.bottomBar.mobileCenterWidgets,
                  rightWidgets: value.bottomBar.mobileRightWidgets,
                }}
                onChange={(patch) =>
                  setBar(
                    "bottomBar",
                    mobileZonesToWidgets({ left: patch.leftWidgets, center: patch.centerWidgets, right: patch.rightWidgets })
                  )
                }
              />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
