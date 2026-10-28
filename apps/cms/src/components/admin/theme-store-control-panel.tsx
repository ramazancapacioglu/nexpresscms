import { Layout, Palette, Sparkles, Type } from "lucide-react";
import type { ThemeStoreState } from "./use-theme-store";
import { ThemeStoreTabThemes } from "./theme-store-tab-themes";
import { ThemeStoreTabPalettes } from "./theme-store-tab-palettes";
import { ThemeStoreTabTypography } from "./theme-store-tab-typography";
import { ThemeStoreTabLayout } from "./theme-store-tab-layout";

/** SOL KONTROL PANELİ (5 Sütun) */
export function ThemeStoreControlPanel({ s }: { s: ThemeStoreState }) {
  const { themes, activeTab, setActiveTab } = s;
  return (
    <>
      {/* SOL KONTROL PANELİ (5 Sütun) */}
      <div className="lg:col-span-5 rounded-xl border border-border bg-card shadow-2xs overflow-hidden flex flex-col">
        {/* Sekme Başlıkları */}
        <div className="grid grid-cols-4 border-b border-border bg-muted/40 p-1 text-[11px] font-semibold">
          {(
            [
              { id: "themes", label: "Temalar", icon: Sparkles },
              { id: "colors", label: "Renkler", icon: Palette },
              { id: "typography", label: "Yazı Tipi", icon: Type },
              { id: "layout", label: "Düzen & UI", icon: Layout },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 rounded-md py-2 text-[10px] transition ${
                  activeTab === tab.id
                    ? "bg-background text-blue-600 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sekme İçeriği */}
        <div className="p-4 space-y-4 text-xs max-h-[70vh] overflow-y-auto" tabIndex={0} role="region" aria-label="Tema kontrol paneli">
          <ThemeStoreTabThemes s={s} />

          <ThemeStoreTabPalettes s={s} />

          <ThemeStoreTabTypography s={s} />

          <ThemeStoreTabLayout s={s} />
        </div>
      </div>
    </>
  );
}
