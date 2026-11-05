"use client";

import { useState } from "react";
import type { PluginSettingField } from "@nexpress/core";
import { PluginSettingsForm } from "@/app/admin/plugins/plugin-settings-form";
import { SiteDnaCard } from "@/app/admin/plugins/site-dna-card";

/** SEO ayar formu. Kayıt notu bu panelde kalır. */
export function SeoSettingsPanel({
  pluginId,
  fields,
  initial,
  moduleOn,
  siteDna,
  showDna,
}: {
  pluginId: string;
  fields: PluginSettingField[];
  initial: Record<string, unknown>;
  moduleOn: Record<string, boolean>;
  siteDna: string;
  showDna: boolean;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3">
      {note && <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">{note}</p>}
      <PluginSettingsForm
        pluginId={pluginId}
        fields={fields}
        initial={initial}
        moduleOn={moduleOn}
        onNotice={(_tone, text) => setNote(text)}
        extra={showDna ? <SiteDnaCard initial={siteDna} onNotice={(_tone, text) => setNote(text)} /> : null}
      />
    </div>
  );
}
