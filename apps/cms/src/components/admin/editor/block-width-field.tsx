"use client";

import { useStudioInspector } from "./studio-inspector-context";

/** Her blok: sayfa yerleşimini korur, site kapsayıcısına çeker ya da kenardan kenara açar. */
export function BlockWidthField() {
  const { selectedBlock, updateSelectedBlockStyleRoot } = useStudioInspector();
  if (!selectedBlock) return null;
  const current = selectedBlock.style?.blockWidth ?? (selectedBlock.style?.fullWidth ? "full" : "");
  return (
    <div>
      <label htmlFor="nx-block-width" className="mb-1 block text-[11px] font-semibold">
        Genişlik
      </label>
      <select
        id="nx-block-width"
        aria-label="Blok genişliği"
        value={current}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "full") updateSelectedBlockStyleRoot({ blockWidth: "full", fullWidth: true });
          else if (next === "site") updateSelectedBlockStyleRoot({ blockWidth: "site", fullWidth: undefined });
          else updateSelectedBlockStyleRoot({ blockWidth: undefined, fullWidth: undefined });
        }}
        className="h-8 w-full rounded border border-border bg-background px-2 text-[12px]"
      >
        <option value="">Sayfa ayarı</option>
        <option value="site">Site genişliği</option>
        <option value="full">Tam genişlik</option>
      </select>
    </div>
  );
}
