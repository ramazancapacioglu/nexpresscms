"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export interface PagePickerOption {
  contentId: string;
  title: string;
  slug: string;
  type: string;
  seoScore: number;
}

/** Tekil sayfa raporu için aranabilir içerik seçici. */
export function PageReportPicker({
  options,
  selectedId,
}: {
  options: PagePickerOption[];
  selectedId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const types = useMemo(() => [...new Set(options.map((o) => o.type))].sort(), [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return options.filter((o) => {
      if (typeFilter !== "all" && o.type !== typeFilter) return false;
      if (q && !`${o.title} ${o.slug} ${o.type}`.toLocaleLowerCase("tr-TR").includes(q)) return false;
      return true;
    });
  }, [options, query, typeFilter]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/80 bg-card p-3 shadow-2xs">
      <div className="relative min-w-[200px] flex-1 sm:max-w-[260px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sayfa veya URL filtrele..."
          className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
        />
      </div>

      <select
        aria-label="İçerik türü"
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground focus:border-blue-500 focus:outline-none"
      >
        <option value="all">Tüm Türler ({options.length})</option>
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        aria-label="Raporlanacak sayfa"
        value={selectedId}
        onChange={(e) => router.push(`/admin/seo/page-report?id=${encodeURIComponent(e.target.value)}`)}
        className="h-8 min-w-[260px] flex-1 rounded-lg border border-border bg-background px-2.5 text-[12px] font-medium text-foreground focus:border-blue-500 focus:outline-none"
      >
        {filtered.map((o) => (
          <option key={o.contentId} value={o.contentId}>
            [{o.seoScore}] {o.title} (/{o.slug})
          </option>
        ))}
      </select>
    </div>
  );
}
