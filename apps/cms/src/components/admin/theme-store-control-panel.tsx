import { Columns, Layout, LayoutTemplate, Palette, PanelTop, Sparkles, Type } from "lucide-react";
import type { ThemeStoreState } from "./use-theme-store";
import { ThemeStoreTabThemes } from "./theme-store-tab-themes";
import { ThemeStoreTabPalettes } from "./theme-store-tab-palettes";
import { ThemeStoreTabTypography } from "./theme-store-tab-typography";
import { ThemeStoreTabLayout } from "./theme-store-tab-layout";

/** SOL KONTROL PANELİ (5 Sütun — 6 Özelleştirici Sekmesi) */
export function ThemeStoreControlPanel({ s }: { s: ThemeStoreState }) {
  const { activeTab, setActiveTab } = s;
  return (
    <div className="lg:col-span-5 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
      {/* Sekme Başlıkları (WordPress Customizer Tarzı 6 Modül) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-border bg-muted/40 p-1 text-[11px] font-semibold">
        {(
          [
            { id: "themes", label: "Temalar", icon: Sparkles },
            { id: "colors", label: "Renkler", icon: Palette },
            { id: "typography", label: "Yazı Tipi", icon: Type },
            { id: "layout", label: "Sidebar & En", icon: Columns },
            { id: "chrome", label: "Header/Footer", icon: PanelTop },
            { id: "templates", label: "Şablonlar", icon: LayoutTemplate },
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
                  ? "bg-background text-blue-600 shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sekme İçeriği */}
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
      </div>
    </div>
  );
}
