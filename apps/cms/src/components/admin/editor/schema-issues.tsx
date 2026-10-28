"use client";

import { useMemo } from "react";
import type { SchemaGraphNode } from "@nexpress/core";
import { validateSchemaGraph } from "@nexpress/seo-core";

/** Otomatik üretilen JSON-LD düğümlerinin zengin sonuç kurallarına göre denetimi. */
export function SchemaIssues({ nodes }: { nodes: SchemaGraphNode[] }) {
  const issues = useMemo(() => validateSchemaGraph(nodes), [nodes]);
  if (issues.length === 0) {
    return <p className="text-[10px] text-emerald-700 dark:text-emerald-300">JSON-LD denetimi: sorun bulunamadı.</p>;
  }
  return (
    <ul className="space-y-0.5 text-[10px]">
      {issues.map((i, n) => (
        <li key={n} className={i.level === "error" ? "text-red-600" : "text-amber-700 dark:text-amber-300"}>
          {i.level === "error" ? "Hata" : "Uyarı"} · {i.type}: {i.message}
        </li>
      ))}
    </ul>
  );
}
