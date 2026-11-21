"use client";

import { useState } from "react";
import type { PluginSettingField, SeoEngineSettings } from "@nexpress/core";
import { PermalinkCard } from "@/components/admin/seo/permalink-card";
import { SeoStudio } from "@/components/admin/seo/seo-studio";
import { IndexNowCard } from "./indexnow-card";
import { LocalSeoForm } from "./local-seo-form";
import { SeoSettingsPanel } from "./settings-panel";

const SECTIONS = [
  { id: "publish", label: "Yayın & İndeks", hint: "İndeks, robots, kalıcı bağlantı" },
  { id: "identity", label: "Başlık & Kimlik", hint: "Şablonlar, kurum ve simge" },
  { id: "local", label: "Yerel İşletme", hint: "Firma, adres ve harita" },
  { id: "brand", label: "Marka & Yazım", hint: "Site DNA ve AI tonu" },
  { id: "keys", label: "Anahtarlar", hint: "IndexNow ve dış API’ler" },
] as const;

type TabId = (typeof SECTIONS)[number]["id"];

/** SEO ayarları: üst üste çift yatay sekme yerine sol dikey ayar menüsü + sağ form alanı. */
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
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav
        aria-label="Ayar bölümleri"
        className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
      >
        {SECTIONS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-md px-3 py-2 text-left transition lg:w-full ${
                active
                  ? "bg-[#EAECED] text-[#14151A] dark:bg-[#22252D] dark:text-[#F3F4F6]"
                  : "text-[#5C5F66] hover:bg-[#EAECED]/60 hover:text-[#14151A] dark:text-[#9CA3AF] dark:hover:bg-[#1C1E24] dark:hover:text-[#F3F4F6]"
              }`}
            >
              <div className={`text-[12px] ${active ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </div>
              <div className="hidden text-[11px] text-[#5F6570] dark:text-[#8C9099] lg:block">
                {item.hint}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 space-y-4">
        <div className={engine ? "space-y-4" : "hidden"}>
          {tab === "publish" ? <PermalinkCard initial={seo.permalinkStructure ?? "postname"} /> : null}
          <SeoStudio initial={seo} siteName={siteName} settingsOnly section={tab === "identity" ? "identity" : "publish"} />
        </div>
        {tab === "local" && pluginId ? (
          <LocalSeoForm pluginId={pluginId} fields={fields} initial={initial} moduleOn={moduleOn} />
        ) : null}
        {tab === "brand" && pluginId ? (
          <SeoSettingsPanel
            pluginId={pluginId}
            fields={fields}
            initial={initial}
            moduleOn={moduleOn}
            siteDna={siteDna}
            showDna={showDna}
            groups={["Marka profili", "AI yazım asistanı"]}
          />
        ) : null}
        {tab === "keys" ? (
          <div className="space-y-4">
            <IndexNowCard stored={indexNowStored} fromEnv={indexNowEnv} />
            {pluginId ? (
              <SeoSettingsPanel
                pluginId={pluginId}
                fields={fields}
                initial={initial}
                moduleOn={moduleOn}
                siteDna={siteDna}
                showDna={false}
                groups={["Google Yorumları", "Serper SERP"]}
              />
            ) : null}
          </div>
        ) : null}
        {!pluginId && tab !== "publish" && tab !== "identity" && tab !== "keys" ? (
          <p className="text-[13px] text-[#5F6570]">SEO eklentisi yüklü değil.</p>
        ) : null}
      </div>
    </div>
  );
}
