import "server-only";
import { createHash } from "node:crypto";
import { strFromU8, unzipSync, type UnzipFileInfo } from "fflate";
import {
  DATA_PLUGIN_LIMITS,
  describePermissions,
  parseTrustedKeys,
  sanitizeManifest,
  sanitizePluginContentTypes,
  sanitizeWebhooks,
  verifyPackageSignature,
  type CustomContentType,
  type DataPluginManifest,
  type DataPluginWebhook,
  type PermissionLine,
  type SignatureStatus,
} from "@nexpress/core";
import { StarterPageSchema, badEntryName } from "@nexpress/themes/package";
import { getScopedRepository } from "@nexpress/database";
import { invalidateSite } from "@/lib/cache";

/** Pakete girebilen dosyalar. Çalıştırılabilir ya da ön yüze yüklenebilir her şey (js, html, svg, wasm…) reddedilir. */
const ALLOWED = /^(plugin\.json|content-types\.json|webhooks\.json|plugin\.sig|README\.md|pages\/[a-z0-9][a-z0-9-]*\.json)$/;
const CODE_LIKE = /\.(m?js|cjs|jsx?|tsx?|html?|svg|wasm|php|sh|bash|bat|cmd|ps1|exe|dll|so|node|py|rb|jar)$/i;

export interface ParsedDataPlugin {
  manifest: DataPluginManifest;
  contentTypes: CustomContentType[];
  pages: Array<Record<string, unknown> & { slug: string; title: string }>;
  webhooks: DataPluginWebhook[];
  signature: SignatureStatus;
  checksum: string;
  permissions: PermissionLine[];
}

export type DataPluginParse = { ok: true; value: ParsedDataPlugin; warnings: string[] } | { ok: false; errors: string[]; warnings: string[] };

/** Paketi (zip) açmadan önce boyut ve dosya sayısı denetlenir (zip bombası), sonra yalnızca izinli dosyalar açılır. */
export async function parseDataPluginPackage(bytes: Uint8Array): Promise<DataPluginParse> {
  const warnings: string[] = [];
  const fail = (...errors: string[]): DataPluginParse => ({ ok: false, errors, warnings });
  if (bytes.length === 0) return fail("Dosya boş.");
  if (bytes.length > DATA_PLUGIN_LIMITS.zipBytes) return fail(`Paket ${DATA_PLUGIN_LIMITS.zipBytes / 1024 / 1024} MB sınırını aşıyor.`);

  const entries: UnzipFileInfo[] = [];
  try {
    unzipSync(bytes, { filter: (f) => (entries.push(f), false) });
  } catch {
    return fail("Geçerli bir zip dosyası değil.");
  }
  const files = entries.filter((e) => !e.name.endsWith("/") && !e.name.startsWith("__MACOSX/") && !e.name.endsWith(".DS_Store"));
  if (files.length > DATA_PLUGIN_LIMITS.files) return fail(`En çok ${DATA_PLUGIN_LIMITS.files} dosya olabilir (${files.length}).`);
  if (files.reduce((n, f) => n + f.originalSize, 0) > DATA_PLUGIN_LIMITS.totalBytes) return fail("Açılmış boyut sınırı aşıldı (zip bombası koruması).");

  // Tek üst klasör sarmalayıcısı atılır
  const top = new Set(files.map((f) => f.name.split("/")[0]));
  const wrapper = top.size === 1 && files.every((f) => f.name.includes("/")) ? `${[...top][0]}/` : "";
  const rel = new Map(files.map((f) => [f.name, wrapper ? f.name.slice(wrapper.length) : f.name]));

  const errors: string[] = [];
  const accepted: string[] = [];
  for (const [orig, name] of rel) {
    const bad = badEntryName(name);
    if (bad) errors.push(`${name}: ${bad}.`);
    else if (CODE_LIKE.test(name)) errors.push(`${name}: veri eklentisi kod ya da ön yüze yüklenebilir dosya içeremez.`);
    else if (!ALLOWED.test(name)) warnings.push(`${name}: tanınmayan dosya yok sayıldı.`);
    else accepted.push(orig);
  }
  for (const orig of accepted) {
    const size = files.find((f) => f.name === orig)?.originalSize ?? 0;
    if (size > DATA_PLUGIN_LIMITS.jsonBytes) errors.push(`${rel.get(orig)} çok büyük (${Math.round(size / 1024)} KB; sınır ${DATA_PLUGIN_LIMITS.jsonBytes / 1024} KB).`);
  }
  if (errors.length) return { ok: false, errors, warnings };

  const keep = new Set(accepted);
  let raw: Record<string, Uint8Array>;
  try {
    raw = unzipSync(bytes, { filter: (f) => keep.has(f.name) });
  } catch {
    return fail("Zip açılamadı (bozuk olabilir).");
  }
  const data = new Map<string, Uint8Array>(Object.entries(raw).map(([k, v]) => [rel.get(k)!, v]));

  const json = (name: string): { ok: true; value: unknown } | { ok: false; error: string } | null => {
    const b = data.get(name);
    if (!b) return null;
    try {
      return { ok: true, value: JSON.parse(strFromU8(b)) };
    } catch {
      return { ok: false, error: `${name}: geçerli JSON değil.` };
    }
  };

  const m = json("plugin.json");
  if (!m) return fail("plugin.json eksik.");
  if (!m.ok) return fail(m.error);
  const manifest = sanitizeManifest(m.value);
  if (!manifest.ok) return fail(...manifest.errors);

  const optional = <T,>(name: string, check: (v: unknown) => { ok: true; value: T } | { ok: false; errors: string[] }, empty: T): T => {
    const j = json(name);
    if (!j) return empty;
    if (!j.ok) {
      errors.push(j.error);
      return empty;
    }
    const r = check(j.value);
    if (!r.ok) {
      errors.push(...r.errors);
      return empty;
    }
    return r.value;
  };
  const contentTypes = optional("content-types.json", sanitizePluginContentTypes, [] as CustomContentType[]);
  const webhooks = optional("webhooks.json", sanitizeWebhooks, [] as DataPluginWebhook[]);

  const pages: ParsedDataPlugin["pages"] = [];
  const pageFiles = [...data.keys()].filter((n) => n.startsWith("pages/")).sort();
  if (pageFiles.length > DATA_PLUGIN_LIMITS.pages) errors.push(`En çok ${DATA_PLUGIN_LIMITS.pages} başlangıç sayfası olabilir.`);
  for (const file of pageFiles.slice(0, DATA_PLUGIN_LIMITS.pages)) {
    const j = json(file)!;
    if (!j.ok) errors.push(j.error);
    else {
      const r = StarterPageSchema.safeParse(j.value);
      if (!r.success) errors.push(...r.error.issues.slice(0, 4).map((i) => `${file} › ${i.path.join(".")}: ${i.message}`));
      else pages.push(r.data as ParsedDataPlugin["pages"][number]);
    }
  }
  if (new Set(pages.map((p) => p.slug)).size !== pages.length) errors.push("Başlangıç sayfalarının slug'ları benzersiz olmalı.");
  if (contentTypes.length === 0 && pages.length === 0 && webhooks.length === 0 && errors.length === 0) errors.push("Paket boş: içerik türü, sayfa ya da webhook tanımlamalı.");
  if (errors.length) return { ok: false, errors, warnings };

  // Bütünlük: imza dışındaki tüm kabul edilen dosyaların SHA-256 özeti (ad + uzunluk + bayt, sıralı)
  const hash = createHash("sha256");
  for (const name of [...data.keys()].filter((n) => n !== "plugin.sig").sort()) {
    const b = data.get(name)!;
    hash.update(`${name}\0${b.length}\0`);
    hash.update(b);
  }
  const checksum = hash.digest("hex");

  let sigValue: string | undefined;
  const s = json("plugin.sig");
  if (s) {
    sigValue = s.ok ? (typeof (s.value as { signature?: unknown })?.signature === "string" ? (s.value as { signature: string }).signature : "") : "";
  }
  const signature = await verifyPackageSignature({ checksum, signature: sigValue, publisherKey: manifest.value.publisherKey, trustedKeys: parseTrustedKeys(process.env.PLUGIN_TRUSTED_KEYS) });
  if (signature === "invalid") return fail("İmza doğrulanamadı: paket değiştirilmiş ya da imza/yayıncı anahtarı uyuşmuyor. Kurulmadı.");
  if (signature === "unsigned") warnings.push("Paket imzalı değil: yayıncı doğrulanamaz. Yalnızca güvendiğiniz kaynaktan kurun.");
  if (signature === "signed-untrusted") warnings.push("İmza geçerli ama yayıncı anahtarı güvenilen listede (PLUGIN_TRUSTED_KEYS) değil.");

  return {
    ok: true,
    warnings,
    value: { manifest: manifest.value, contentTypes, pages, webhooks, signature, checksum, permissions: describePermissions({ contentTypes, pages, webhooks }) },
  };
}

export type DataPluginInstallReport =
  | { ok: true; replaced: boolean; plugin: { id: string; name: string; version: string }; signature: SignatureStatus; permissions: PermissionLine[]; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

/** Doğrular ve kurar (etkinleştirmez; hiçbir içeriğe ya da ayara dokunmaz). */
export async function installDataPluginPackage(siteId: string, bytes: Uint8Array): Promise<DataPluginInstallReport> {
  const parsed = await parseDataPluginPackage(bytes);
  if (!parsed.ok) return parsed;
  const { manifest, contentTypes, pages, webhooks, signature, checksum, permissions } = parsed.value;
  const res = await getScopedRepository(siteId).installDataPlugin({ manifest, contentTypes: contentTypes.map((t) => ({ ...t, plugin: manifest.id })), pages, webhooks, signature, checksum });
  if (!res.ok) return { ok: false, errors: [res.error], warnings: parsed.warnings };
  await invalidateSite(siteId);
  return { ok: true, replaced: res.replaced, plugin: { id: manifest.id, name: manifest.name, version: manifest.version }, signature, permissions, warnings: parsed.warnings };
}
