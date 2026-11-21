import Link from "next/link";
import { Code2, Columns, Palette, PanelTop, Type } from "lucide-react";
import type { ThemeStoreState } from "./use-theme-store";
import { ThemeStoreTabThemes } from "./theme-store-tab-themes";
import { ThemeStoreTabPalettes } from "./theme-store-tab-palettes";
import { ThemeStoreTabTypography } from "./theme-store-tab-typography";
import { ThemeStoreTabLayout } from "./theme-store-tab-layout";
import { ThemeStoreTabCode } from "./theme-store-tab-code";

/** Sol kontrol paneli (5 Özelleştirici Sekmesi: Renkler, Yazı Tipi, Sidebar & En, Logo & ölçü, Özel Kod) */
export function ThemeStoreControlPanel({ s }: { s: ThemeStoreState }) {
  const { activeTab, setActiveTab } = s;
  return (
    <div className="lg:col-span-5 flex flex-col overflow-hidden rounded-lg border border-[#E6E7EA] bg-white dark:border-[#23262E] dark:bg-[#15171C]">
      <div className="grid grid-cols-3 sm:grid-cols-5 border-b border-[#E6E7EA] bg-[#F4F5F7] p-1 text-[11px] font-medium dark:border-[#23262E] dark:bg-[#1C1E24]">
        {(
          [
            { id: "colors", label: "Renkler", icon: Palette },
            { id: "typography", label: "Yazı Tipi", icon: Type },
            { id: "layout", label: "Sidebar & En", icon: Columns },
            { id: "chrome", label: "Logo & Ölçü", icon: PanelTop },
            { id: "code", label: "Özel Kod", icon: Code2 },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] transition ${
                activeTab === tab.id
                  ? "bg-white text-[#266DF0] shadow-2xs font-semibold dark:bg-[#2A2D35] dark:text-[#60A5FA]"
                  : "text-[#5C5F66] hover:text-[#14151A] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="max-h-[74vh] space-y-4 overflow-y-auto p-4 text-xs"
        tabIndex={0}
        role="region"
        aria-label="Tema kontrol paneli"
      >
        <ThemeStoreTabThemes s={s} />
        <ThemeStoreTabPalettes s={s} />
        <ThemeStoreTabTypography s={s} />
        <ThemeStoreTabLayout s={s} />
        <ThemeStoreTabCode s={s} />
      </div>
      <p className="border-t border-[#E6E7EA] px-3 py-2 text-[11px] text-[#5F6570] dark:border-[#23262E] dark:text-[#8C9099]">
        Tema değişimi{" "}
        <Link href="/admin/themes" className="font-medium text-[#266DF0] hover:underline">
          Temalar
        </Link>
        , üst/alt şerit{" "}
        <Link href="/admin/appearance/header" className="font-medium text-[#266DF0] hover:underline">
          Site İskeleti
        </Link>
        , sayfa düzeni{" "}
        <Link href="/admin/appearance/templates" className="font-medium text-[#266DF0] hover:underline">
          Şablonlar
        </Link>{" "}
        sekmesindedir.
      </p>
    </div>
  );
}
