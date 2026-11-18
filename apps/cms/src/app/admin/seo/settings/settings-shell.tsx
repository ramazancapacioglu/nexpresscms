"use client";

import { useState } from "react";
import type { PluginSettingField, SeoEngineSettings } from "@nexpress/core";
import { PermalinkCard } from "@/components/admin/seo/permalink-card";
import { SeoStudio } from "@/components/admin/seo/seo-studio";
import { IndexNowCard } from "./indexnow-card";
import { LocalSeoForm } from "./local-seo-form";
import { SeoSettingsPanel } from "./settings-panel";

const TABS = [
  { id: "publish", label: "Yayın" },
  { id: "identity", label: "Başlık ve kimlik" },
  { id: "local", label: "Yerel işletme" },
  { id: "brand", label: "Marka ve yazım" },
  { id: "keys", label: "Anahtarlar" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** SEO ayarlarını tek uzun sayfa yerine beş sekmeye böler. */
export function SeoSettingsShell({
  seo,
  siteName,
  pluginId,
  fields,
  initial,
  moduleOn,
  siteDna,
  showDna,
  indexNowStored,
  indexNowEnv,
}: {
  seo: SeoEngineSettings;
  siteName: string;
  pluginId: string | null;
  fields: PluginSettingField[];
  initial: Record<string, unknown>;
  moduleOn: Record<string, boolean>;
  siteDna: string;
  showDna: boolean;
  indexNowStored: boolean;
  indexNowEnv: boolean;
}) {
  const [tab, setTab] = useState<TabId>("publish");
  const engine = tab === "publish" || tab === "identity";

  return (
    <div className="space-y-4">
      <nav aria-label="Ayar bölümleri" className="flex gap-1 overflow-x-auto border-b border-[#E6E7EA] pb-2 dark:border-[#23262E]">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium ${tab === item.id ? "bg-[#266DF0] text-white" : "text-[#454B55] hover:bg-[#E9ECF1] dark:text-[#B4BAC5] dark:hover:bg-[#22252D]"}`}
            aria-current={tab === item.id ? "page" : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className={engine ? "space-y-4" : "hidden"}>
        {tab === "publish" ? <PermalinkCard initial={seo.permalinkStructure ?? "postname"} /> : null}
        <SeoStudio initial={seo} siteName={siteName} settingsOnly section={tab === "identity" ? "identity" : "publish"} />
      </div>
      {tab === "local" && pluginId ? <LocalSeoForm pluginId={pluginId} fields={fields} initial={initial} moduleOn={moduleOn} /> : null}
      {tab === "brand" && pluginId ? (
        <SeoSettingsPanel pluginId={pluginId} fields={fields} initial={initial} moduleOn={moduleOn} siteDna={siteDna} showDna={showDna} groups={["Marka profili", "AI yazım asistanı"]} />
      ) : null}
      {tab === "keys" ? (
        <div className="space-y-4">
          <IndexNowCard stored={indexNowStored} fromEnv={indexNowEnv} />
          {pluginId ? (
            <SeoSettingsPanel pluginId={pluginId} fields={fields} initial={initial} moduleOn={moduleOn} siteDna={siteDna} showDna={false} groups={["Google Yorumları", "Serper SERP"]} />
          ) : null}
        </div>
      ) : null}
      {!pluginId && tab !== "publish" && tab !== "identity" && tab !== "keys" ? <p className="text-[13px] text-[#5F6570]">SEO eklentisi yüklü değil.</p> : null}
    </div>
  );
}
