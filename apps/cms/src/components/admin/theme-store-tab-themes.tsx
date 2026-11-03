import React, { useState } from "react";
import { Check, ChevronDown, ChevronUp, EyeOff, Palette } from "lucide-react";
import type { ThemeStoreState } from "./use-theme-store";

/** SEKME 1: TEMA SEÇİMİ (Gizle / Göster Destekli) */
export function ThemeStoreTabThemes({ s }: { s: ThemeStoreState }) {
  const { themes, selectedThemeId, activeTab, setActiveTab, handleSelectTheme } = s;
  const [listCollapsed, setListCollapsed] = useState(false);

  if (activeTab !== "themes") return null;

  const activeTheme = themes.find((t) => t.id === selectedThemeId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
        <div>
          <div className="text-[11px] font-bold text-foreground">
            Seçili Tema: {activeTheme?.name ?? selectedThemeId}
          </div>
          <div className="text-[10px] text-muted-foreground">
            0-KB RSC Başlangıç Temaları (İçerik verisini değiştirmez)
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setListCollapsed((v) => !v)}
            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] font-semibold hover:bg-muted"
          >
            <EyeOff className="h-3 w-3" />
            {listCollapsed ? "Temaları Göster" : "Listeyi Gizle"}
            {listCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("colors")}
            className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
          >
            <Palette className="h-3 w-3" /> Özelleştir
          </button>
        </div>
      </div>

      {!listCollapsed &&
        themes.map((thm) => {
          const isSelected = selectedThemeId === thm.id;
          return (
            <div
              key={thm.id}
              onClick={() => handleSelectTheme(thm)}
              className={`cursor-pointer rounded-xl border p-3.5 transition space-y-2 ${
                isSelected
                  ? "border-blue-600 bg-blue-500/5 ring-1 ring-blue-600"
                  : "border-border hover:border-blue-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">
                    {thm.name}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    v{thm.version}
                  </span>
                </div>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    <Check className="h-3 w-3" /> Seçili
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {thm.description}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {Object.values(thm.tokens.colors)
                  .slice(0, 6)
                  .map((c, idx) => (
                    <span
                      key={idx}
                      style={{ backgroundColor: c }}
                      className="h-4 w-4 rounded-full border border-border"
                    />
                  ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
