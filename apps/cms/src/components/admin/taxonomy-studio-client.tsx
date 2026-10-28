"use client";

import React from "react";
import { useTaxonomyStudio, type TaxonomyStudioClientProps } from "./use-taxonomy-studio";
import { TaxonomyStudioToast } from "./taxonomy-studio-toast";
import { TaxonomyStudioHeader } from "./taxonomy-studio-header";
import { TaxonomyStudioWorkspace } from "./taxonomy-studio-workspace";
import { TaxonomyStudioMediaModal } from "./taxonomy-studio-media-modal";

export type { TaxonomyStudioClientProps } from "./use-taxonomy-studio";

export function TaxonomyStudioClient(props: TaxonomyStudioClientProps) {
  const s = useTaxonomyStudio(props);
  return (
    <div className="space-y-4">
      <TaxonomyStudioToast s={s} />
      <TaxonomyStudioHeader s={s} />
      <TaxonomyStudioWorkspace s={s} />
      <TaxonomyStudioMediaModal s={s} />
    </div>
  );
}
