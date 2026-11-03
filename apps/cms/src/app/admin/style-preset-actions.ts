"use server";

import { extractPresetStyle, MAX_STYLE_PRESETS, resolveSiteSettings, sanitizeStylePresets, type BlockStyle, type StylePreset } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function load(siteId: string) {
  const repo = getScopedRepository(siteId);
  const settings = resolveSiteSettings((await repo.getSite())?.settings);
  return { repo, presets: settings.customizer.stylePresets };
}

/** Blok stil ön ayarlarını listeler (editör açılırken/Stil sekmesinde). */
export async function listStylePresetsAction(): Promise<Result<{ presets: StylePreset[] }>> {
  const me = await requireUser({ audit: "style-preset.list" });
  return { ok: true, presets: (await load(me.siteId)).presets };
}

/** Bir bloğun görsel stilini adlandırıp ön ayar olarak kaydeder (aynı adlı ön ayar güncellenir). */
export async function saveStylePresetAction(input: { name: string; style: BlockStyle }): Promise<Result<{ presets: StylePreset[] }>> {
  const me = await requireUser({ audit: "style-preset.save" });
  const name = String(input.name ?? "").trim().slice(0, 60);
  if (!name) return { ok: false, error: "Ön ayara bir ad verin." };
  const style = extractPresetStyle(input.style);
  if (Object.keys(style).length === 0) return { ok: false, error: "Kaydedilecek bir stil yok: önce bloğa stil verin." };
  const { repo, presets } = await load(me.siteId);
  const existing = presets.find((p) => p.name.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr"));
  if (!existing && presets.length >= MAX_STYLE_PRESETS) return { ok: false, error: `En çok ${MAX_STYLE_PRESETS} ön ayar kaydedilebilir.` };
  const next = existing
    ? presets.map((p) => (p.id === existing.id ? { ...p, style } : p))
    : [...presets, { id: `sp_${Math.random().toString(36).slice(2, 10)}`, name, style }];
  const saved = await repo.saveSiteSettings({ customizer: { stylePresets: next } as never });
  return { ok: true, presets: sanitizeStylePresets(saved.customizer.stylePresets) };
}

export async function deleteStylePresetAction(input: { id: string }): Promise<Result<{ presets: StylePreset[] }>> {
  const me = await requireUser({ audit: "style-preset.delete" });
  const { repo, presets } = await load(me.siteId);
  if (!presets.some((p) => p.id === input.id)) return { ok: false, error: "Ön ayar bulunamadı." };
  const saved = await repo.saveSiteSettings({ customizer: { stylePresets: presets.filter((p) => p.id !== input.id) } as never });
  return { ok: true, presets: sanitizeStylePresets(saved.customizer.stylePresets) };
}
