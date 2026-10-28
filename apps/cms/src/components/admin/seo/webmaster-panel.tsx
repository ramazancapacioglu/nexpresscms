"use client";

import type { SeoEngineSettings } from "@nexpress/core";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

const ENGINES: Array<{ key: "google" | "bing" | "yandex"; label: string; hint: string }> = [
  { key: "google", label: "Google Search Console", hint: "google-site-verification içeriği" },
  { key: "bing", label: "Bing Webmaster Tools", hint: "msvalidate.01 içeriği" },
  { key: "yandex", label: "Yandex Webmaster", hint: "yandex-verification içeriği" },
];

/** Arama konsolu sahiplik doğrulaması: yalnızca kodun kendisi girilir, etiket sunucuda üretilir. */
export function WebmasterPanel({
  value,
  onChange,
}: {
  value: NonNullable<SeoEngineSettings["verification"]>;
  onChange: (next: NonNullable<SeoEngineSettings["verification"]>) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9099]">Arama konsolu doğrulaması</div>
      {ENGINES.map((e) => (
        <label key={e.key} className="block text-[11px] text-[#8C9099]">
          {e.label} <span className="opacity-70">· {e.hint}</span>
          <input
            className={`${fieldClass} mt-1 font-mono`}
            value={value[e.key] ?? ""}
            onChange={(ev) => onChange({ ...value, [e.key]: ev.target.value })}
            placeholder="Yalnızca kod, etiketin tamamı değil"
            spellCheck={false}
          />
        </label>
      ))}
    </div>
  );
}
