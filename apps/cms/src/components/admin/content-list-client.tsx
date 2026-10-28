"use client";

import React from "react";
import { useContentList, type ContentListClientProps } from "./use-content-list";
import { ContentListToast } from "./content-list-toast";
import { ContentListHeader } from "./content-list-header";
import { ContentListFilters } from "./content-list-filters";
import { ContentListBulkBar } from "./content-list-bulk-bar";
import { ContentListTable } from "./content-list-table";

export type { ContentListClientProps } from "./use-content-list";

export function ContentListClient(props: ContentListClientProps) {
  const s = useContentList(props);
  return (
    <div className="space-y-4">
      <ContentListToast s={s} />
      <ContentListHeader s={s} />
      <ContentListFilters s={s} />
      <ContentListBulkBar s={s} />
      <ContentListTable s={s} />
    </div>
  );
}
