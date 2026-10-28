/**
 * Eklenti manifestleri ve çalışma zamanı kapısı (saf mantık + küçük kayıt defteri).
 * Çekirdek "Pro" kavramını bilmez: `license` yalnızca etikettir (AGENTS.md kural 4).
 */
export type PluginLicense = "free" | "pro";
/** `ready`: kodu var ve çalışır. `planned`: bildirildi, henüz taşınmadı (panelde "Yakında"). */
export type ModuleStatus = "ready" | "planned";

export interface PluginModuleDef {
  id: string;
  label: string;
  description: string;
  group: string;
  status: ModuleStatus;
  defaultEnabled: boolean;
  /** Yalnızca bilgi: modülün bağlandığı uç noktalar / yüzeyler */
  surfaces?: string[];
}

export type PluginSettingType = "text" | "textarea" | "number" | "boolean" | "select";

/** Eklenti ayar alanı; panel formu bundan üretilir. Değerler `site_plugins.settings` içinde tutulur. */
export interface PluginSettingField {
  key: string;
  label: string;
  type: PluginSettingType;
  /** Alanı hangi modül kullanıyor (modül kapalıysa form soluk gösterir) */
  module: string;
  group: string;
  help?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  maxLength?: number;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  vendor: string;
  license: PluginLicense;
  description: string;
  /** Çekirdeğe gömülü; kapatılamaz (ör. Temel SEO) */
  builtin?: boolean;
  /** Lucide simge adı (arayüz eşler) */
  icon: string;
  modules: PluginModuleDef[];
  settings?: PluginSettingField[];
  hooks?: string[];
  slots?: string[];
  endpoints?: string[];
  /** Eklentinin kendi ayar sayfası */
  settingsHref?: string;
}

/** `site_plugins` satırının eklentiyi ilgilendiren kısmı */
export interface PluginRow {
  enabled: boolean;
  modules: Record<string, boolean>;
  settings?: Record<string, unknown>;
}

export interface PluginState {
  enabled: boolean;
  modules: Record<string, boolean>;
  settings: Record<string, unknown>;
}

/** Kayıt yoksa manifest varsayılanları geçerlidir: mevcut kurulumlar davranış değiştirmez. */
export function resolvePluginState(manifest: PluginManifest, row?: PluginRow | null): PluginState {
  const modules: Record<string, boolean> = {};
  for (const m of manifest.modules) modules[m.id] = row?.modules?.[m.id] ?? m.defaultEnabled;
  return { enabled: manifest.builtin ? true : (row?.enabled ?? true), modules, settings: row?.settings ?? {} };
}

/** Eklenti açık, modül açık ve modül gerçekten taşınmış mı? */
export function isModuleActive(manifest: PluginManifest, state: PluginState, moduleId: string): boolean {
  const def = manifest.modules.find((m) => m.id === moduleId);
  if (!def || def.status !== "ready") return false;
  return state.enabled && state.modules[moduleId] === true;
}

export function pluginSummary(manifest: PluginManifest, state: PluginState) {
  const ready = manifest.modules.filter((m) => m.status === "ready");
  return {
    total: manifest.modules.length,
    ready: ready.length,
    planned: manifest.modules.length - ready.length,
    active: ready.filter((m) => state.modules[m.id]).length,
  };
}

class PluginManifestRegistry {
  private manifests = new Map<string, PluginManifest>();
  /** Uygulama tarafından bağlanır: (siteId, pluginId, moduleId) → açık mı */
  public gate: ((siteId: string, pluginId: string, moduleId: string) => Promise<boolean>) | null = null;
  /** Uygulama tarafından bağlanır: eklentinin kiracı ayarları (önbellekli) */
  public settingsProvider: ((siteId: string, pluginId: string) => Promise<Record<string, unknown>>) | null = null;

  public register(manifest: PluginManifest): void {
    this.manifests.set(manifest.id, manifest);
  }
  public list(): PluginManifest[] {
    return [...this.manifests.values()];
  }
  public get(id: string): PluginManifest | undefined {
    return this.manifests.get(id);
  }
}

const globalForPlugins = globalThis as unknown as { __nexpressPluginRegistry?: PluginManifestRegistry };
export const pluginRegistry = (globalForPlugins.__nexpressPluginRegistry ??= new PluginManifestRegistry());

/**
 * Eklenti kodunun çağırdığı kapı: kapalı modülün kancası/rotası atlanır.
 * Kapı bağlanmamışsa (test, betik) açık sayılır.
 */
export async function isPluginModuleEnabled(siteId: string, pluginId: string, moduleId: string): Promise<boolean> {
  return pluginRegistry.gate ? pluginRegistry.gate(siteId, pluginId, moduleId) : true;
}

/**
 * Panelden gelen ayar değerlerini manifestteki alanlara göre doğrular ve normalleştirir.
 * Bilinmeyen anahtarlar atılır; geçersiz değer `errors` içine yazılır ve kaydedilmez.
 */
export function normalizePluginSettings(
  fields: PluginSettingField[],
  input: Record<string, unknown>
): { values: Record<string, string | number | boolean>; errors: Record<string, string> } {
  const values: Record<string, string | number | boolean> = {};
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (!(f.key in input)) continue;
    const raw = input[f.key];
    if (f.type === "boolean") {
      values[f.key] = raw === true || raw === "true";
    } else if (f.type === "number") {
      if (raw === "" || raw === null || raw === undefined) {
        values[f.key] = "";
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n)) errors[f.key] = `${f.label}: sayı olmalı.`;
      else if (f.min !== undefined && n < f.min) errors[f.key] = `${f.label}: en az ${f.min}.`;
      else if (f.max !== undefined && n > f.max) errors[f.key] = `${f.label}: en çok ${f.max}.`;
      else values[f.key] = n;
    } else {
      const t = typeof raw === "string" ? raw.trim() : "";
      if (f.type === "select" && t !== "" && !f.options?.some((o) => o.value === t)) errors[f.key] = `${f.label}: geçersiz seçim.`;
      else if (t.length > (f.maxLength ?? (f.type === "textarea" ? 2000 : 300))) errors[f.key] = `${f.label}: çok uzun.`;
      else values[f.key] = t;
    }
  }
  return { values, errors };
}

/** Eklenti kodunun ayar okuması; sağlayıcı bağlı değilse boş. */
export async function getPluginSettings(siteId: string, pluginId: string): Promise<Record<string, unknown>> {
  return pluginRegistry.settingsProvider ? pluginRegistry.settingsProvider(siteId, pluginId) : {};
}
