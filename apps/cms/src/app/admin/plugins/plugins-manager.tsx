"use client";

import { useMemo, useState, useTransition } from "react";
import { Blocks, Check, ExternalLink, Search, Sparkles } from "lucide-react";
import type { PluginSettingField } from "@nexpress/core";
import { SiteDnaCard } from "./site-dna-card";
import { PluginSettingsForm } from "./plugin-settings-form";
import { PluginSwitch } from "./plugin-switch";
import { setPluginEnabledAction, setPluginModuleAction } from "./actions";

export interface PluginCardData {
  id: string;
  name: string;
  version: string;
  vendor: string;
  license: "free" | "pro";
  builtin: boolean;
  icon: string;
  description: string;
  settingsHref?: string;
  endpoints: string[];
  settingFields: PluginSettingField[];
  settingValues: Record<string, unknown>;
  enabled: boolean;
  modules: Array<{
    id: string;
    label: string;
    description: string;
    group: string;
    status: "ready" | "planned";
    on: boolean;
    surfaces: string[];
  }>;
}

const ICONS: Record<string, typeof Blocks> = { Sparkles, Search, Blocks };
type Filter = "all" | "ready" | "planned";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "ready", label: "Hazır" },
  { id: "planned", label: "Yakında" },
];

/** Eklenti listesi + seçili eklentinin modül paneli. Anahtarlar iyimser güncellenir, hata olursa geri alınır. */
export function PluginsManager({ plugins, initialId, siteDna }: { plugins: PluginCardData[]; initialId: string; siteDna: string }) {
  const [state, setState] = useState(plugins);
  const [selectedId, setSelectedId] = useState(initialId);
  const [view, setView] = useState<"modules" | "settings">("modules");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [, start] = useTransition();

  const plugin = state.find((p) => p.id === selectedId) ?? state[0]!;
  const Icon = ICONS[plugin.icon] ?? Blocks;

  const groups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const visible = plugin.modules.filter(
      (m) =>
        (filter === "all" || m.status === filter) &&
        (!q || `${m.label} ${m.description} ${m.group}`.toLocaleLowerCase("tr-TR").includes(q))
    );
    const map = new Map<string, typeof visible>();
    for (const m of visible) map.set(m.group, [...(map.get(m.group) ?? []), m]);
    return [...map.entries()];
  }, [plugin, filter, query]);

  const flash = (tone: "ok" | "err", text: string) => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice(null), 3500);
  };

  const patch = (fn: (p: PluginCardData) => PluginCardData) => setState((prev) => prev.map((p) => (p.id === plugin.id ? fn(p) : p)));

  const togglePlugin = (enabled: boolean) => {
    const before = plugin.enabled;
    setBusy(plugin.id);
    patch((p) => ({ ...p, enabled }));
    start(async () => {
      try {
        const res = await setPluginEnabledAction({ pluginId: plugin.id, enabled });
        if (!res.ok) {
          patch((p) => ({ ...p, enabled: before }));
          flash("err", res.error);
        } else flash("ok", `${plugin.name} ${enabled ? "açıldı" : "kapatıldı"}.`);
      } catch {
        patch((p) => ({ ...p, enabled: before }));
        flash("err", "İşlem tamamlanamadı.");
      } finally {
        setBusy(null);
      }
    });
  };

  const toggleModule = (moduleId: string, on: boolean) => {
    const label = plugin.modules.find((m) => m.id === moduleId)?.label ?? moduleId;
    setBusy(moduleId);
    patch((p) => ({ ...p, modules: p.modules.map((m) => (m.id === moduleId ? { ...m, on } : m)) }));
    start(async () => {
      try {
        const res = await setPluginModuleAction({ pluginId: plugin.id, moduleId, enabled: on });
        if (!res.ok) {
          patch((p) => ({ ...p, modules: p.modules.map((m) => (m.id === moduleId ? { ...m, on: !on } : m)) }));
          flash("err", res.error);
        } else flash("ok", `${label} ${on ? "açıldı" : "kapatıldı"}.`);
      } catch {
        patch((p) => ({ ...p, modules: p.modules.map((m) => (m.id === moduleId ? { ...m, on: !on } : m)) }));
        flash("err", "İşlem tamamlanamadı.");
      } finally {
        setBusy(null);
      }
    });
  };

  const readyCount = (p: PluginCardData) => p.modules.filter((m) => m.status === "ready").length;
  const activeCount = (p: PluginCardData) => (p.enabled ? p.modules.filter((m) => m.status === "ready" && m.on).length : 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Eklenti listesi */}
      <nav aria-label="Kurulu eklentiler" className="space-y-2">
        {state.map((p) => {
          const PIcon = ICONS[p.icon] ?? Blocks;
          const selected = p.id === plugin.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              aria-current={selected}
              className={`w-full rounded-lg border p-3 text-left transition ${
                selected
                  ? "border-[#266DF0] bg-[#266DF0]/5 shadow-sm"
                  : "border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] hover:border-[#C9CDD4] dark:hover:border-[#343843]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md ${p.license === "pro" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"}`}>
                  <PIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">{p.name}</span>
                    <span className={`rounded px-1.5 py-px text-[10px] font-semibold ${p.license === "pro" ? "bg-violet-500/10 text-violet-700 dark:text-violet-300" : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"}`}>
                      {p.license === "pro" ? "Pro" : "Ücretsiz"}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                    <span className={`h-1.5 w-1.5 rounded-full ${p.enabled ? "bg-emerald-500" : "bg-[#C9CDD4]"}`} />
                    {p.enabled ? `${activeCount(p)}/${readyCount(p)} modül açık` : "Kapalı"} · v{p.version}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Ayrıntı paneli */}
      <section className="min-w-0 rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C]">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E6E7EA] dark:border-[#23262E] p-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">
                {plugin.name} <span className="font-mono text-[11px] font-normal text-[#5F6570] dark:text-[#8C9099]">v{plugin.version}</span>
              </h2>
              <p className="mt-1 max-w-[62ch] text-[12px] leading-relaxed text-[#5C5F66] dark:text-[#9CA3AF]">{plugin.description}</p>
              <p className="mt-1.5 font-mono text-[10px] text-[#5F6570] dark:text-[#8C9099]">{plugin.id} · {plugin.vendor}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {plugin.settingsHref && plugin.settingsHref !== "/admin/plugins" && (
              <a href={plugin.settingsHref} className="inline-flex h-7 items-center gap-1 rounded-md border border-[#E6E7EA] dark:border-[#23262E] px-2.5 text-[12px] text-[#1D5ED8] dark:text-[#7AA7FF] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]">
                Ayarlar <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {plugin.builtin ? (
              <span className="rounded-md bg-[#F4F5F7] dark:bg-[#1C1E24] px-2 py-1 text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">Çekirdek · her zaman açık</span>
            ) : (
              <label className="flex items-center gap-2 text-[12px] font-medium text-[#14151A] dark:text-[#F3F4F6]">
                {plugin.enabled ? "Açık" : "Kapalı"}
                <PluginSwitch checked={plugin.enabled} onChange={togglePlugin} busy={busy === plugin.id} label={`${plugin.name} eklentisi`} />
              </label>
            )}
          </div>
        </header>

        {!plugin.enabled && (
          <p role="status" className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[12px] text-amber-800 dark:text-amber-300">
            Eklenti kapalı: tüm modülleri bu sitede devre dışıdır. Verileriniz silinmez, tekrar açınca kaldığı yerden devam eder.
          </p>
        )}

        {plugin.settingFields.length > 0 && (
          <div role="tablist" aria-label="Eklenti bölümü" className="flex gap-4 border-b border-[#E6E7EA] dark:border-[#23262E] px-4">
            {([["modules", "Modüller"], ["settings", "Ayarlar"]] as const).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={`-mb-px border-b-2 py-2 text-[12px] font-medium ${view === id ? "border-[#266DF0] text-[#14151A] dark:text-[#F3F4F6]" : "border-transparent text-[#5F6570]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {view === "settings" && plugin.settingFields.length > 0 ? (
          <PluginSettingsForm
            key={plugin.id}
            pluginId={plugin.id}
            fields={plugin.settingFields}
            initial={plugin.settingValues}
            moduleOn={Object.fromEntries(plugin.modules.map((m) => [m.id, plugin.enabled && m.on]))}
            onNotice={flash}
            extra={plugin.modules.some((m) => m.id === "ai-brand" && plugin.enabled && m.on) ? <SiteDnaCard initial={siteDna} onNotice={flash} /> : null}
          />
        ) : (
        <>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] dark:border-[#23262E] px-4 py-2.5">
          <div role="tablist" aria-label="Modül filtresi" className="inline-flex rounded-md bg-[#F4F5F7] dark:bg-[#1C1E24] p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded px-2.5 py-1 text-[12px] font-medium transition ${filter === f.id ? "bg-white dark:bg-[#2A2D35] text-[#14151A] dark:text-[#F3F4F6] shadow-sm" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}
              >
                {f.label}
                <span className="ml-1 text-[10px] text-[#5F6570] dark:text-[#8C9099]">
                  {f.id === "all" ? plugin.modules.length : plugin.modules.filter((m) => m.status === f.id).length}
                </span>
              </button>
            ))}
          </div>
          <label className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5F6570] dark:text-[#8C9099]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Modül ara…"
              aria-label="Modül ara"
              className="h-7 w-48 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent pl-7 pr-2 text-[12px] outline-none focus:border-[#266DF0]"
            />
          </label>
        </div>

        <div className={plugin.enabled ? "" : "opacity-60"}>
          {groups.length === 0 && <p className="px-4 py-10 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]">Bu filtreyle eşleşen modül yok.</p>}
          {groups.map(([group, mods]) => (
            <div key={group}>
              <div className="sticky top-0 border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">
                {group} <span className="font-normal">· {mods.length}</span>
              </div>
              <ul className="divide-y divide-[#E6E7EA] dark:divide-[#23262E]">
                {mods.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-medium text-[#14151A] dark:text-[#F3F4F6]">{m.label}</span>
                        {m.status === "ready" ? (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-px text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                            <Check className="h-2.5 w-2.5" /> Hazır
                          </span>
                        ) : (
                          <span className="rounded bg-amber-500/10 px-1.5 py-px text-[10px] font-semibold text-amber-800 dark:text-amber-300">Yakında</span>
                        )}
                      </div>
                      <p className="mt-0.5 max-w-[70ch] text-[12px] leading-relaxed text-[#5C5F66] dark:text-[#9CA3AF]">{m.description}</p>
                      {m.surfaces.length > 0 && (
                        <p className="mt-1 flex flex-wrap gap-1">
                          {m.surfaces.map((s) => (
                            <code key={s} className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-1.5 py-px text-[10px] text-[#5C5F66] dark:text-[#9CA3AF]">{s}</code>
                          ))}
                        </p>
                      )}
                    </div>
                    <PluginSwitch
                      checked={m.status === "ready" && m.on}
                      onChange={(next) => toggleModule(m.id, next)}
                      disabled={m.status !== "ready" || !plugin.enabled}
                      busy={busy === m.id}
                      label={`${m.label} modülü`}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        </>
        )}
      </section>

      {notice && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 rounded-lg border px-3.5 py-2 text-[12px] font-medium shadow-lg ${
            notice.tone === "ok" ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200" : "border-red-500/30 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"
          }`}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}
