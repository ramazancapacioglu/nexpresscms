"use client";

import React from "react";
import { Code2, ShieldAlert } from "lucide-react";
import type { ThemeStoreState } from "./use-theme-store";

/**
 * Özelleştirici 5. sekme: Özel CSS, Header ve Footer kodları.
 * Değerler `sites.settings.customizer` içinde saklanır; "Özelleştirmeleri Yayınla" ile kaydedilir.
 */
export function ThemeStoreTabCode({ s }: { s: ThemeStoreState }) {
  const { activeTab, customizer, setCustomizer } = s;
  if (activeTab !== "code") return null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-300/70 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
        <div className="flex items-center gap-1.5 font-semibold">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span>0-KB RSC ve Çerez Onayı Notu</span>
        </div>
        <p className="mt-1">
          Ek CSS doğrudan sayfa stiline eklenir. Header/Footer betikleri çerez onayı açıksa yalnızca ziyaretçi onayından sonra yüklenir; gereksiz harici betikler hız skorunu düşürebilir.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
          <Code2 className="h-3.5 w-3.5 text-blue-600" />
          <span>Özel CSS (Global)</span>
        </label>
        <textarea
          rows={7}
          value={customizer.customCss ?? ""}
          onChange={(e) =>
            setCustomizer((prev) => ({ ...prev, customCss: e.target.value }))
          }
          placeholder="/* Örn: .nx-hero { letter-spacing: -0.02em; } */"
          className="w-full rounded-lg border border-border bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-foreground">
          Header Kodları (&lt;head&gt;)
        </label>
        <textarea
          rows={4}
          value={customizer.headerScripts ?? ""}
          onChange={(e) =>
            setCustomizer((prev) => ({
              ...prev,
              headerScripts: e.target.value,
            }))
          }
          placeholder="<!-- Doğrulama veya ölçüm etiketleri -->"
          className="w-full rounded-lg border border-border bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-foreground">
          Footer Kodları (&lt;/body&gt; öncesi)
        </label>
        <textarea
          rows={4}
          value={customizer.footerScripts ?? ""}
          onChange={(e) =>
            setCustomizer((prev) => ({
              ...prev,
              footerScripts: e.target.value,
            }))
          }
          placeholder="<!-- Canlı destek veya gecikmeli betikler -->"
          className="w-full rounded-lg border border-border bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
