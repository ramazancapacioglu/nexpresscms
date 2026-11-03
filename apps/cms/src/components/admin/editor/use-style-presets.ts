"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { StylePreset } from "@nexpress/core";
import { deleteStylePresetAction, listStylePresetsAction, saveStylePresetAction } from "@/app/admin/style-preset-actions";

// Editör oturumu boyunca tek kopya: Stil sekmesi ve kayan araç çubuğu aynı listeyi paylaşır.
let cache: StylePreset[] | null = null;
const listeners = new Set<(p: StylePreset[]) => void>();
const publish = (p: StylePreset[]) => { cache = p; listeners.forEach((l) => l(p)); };

export function useStylePresets() {
  const [presets, setPresets] = useState<StylePreset[]>(cache ?? []);
  const [pending, start] = useTransition();
  useEffect(() => {
    listeners.add(setPresets);
    if (cache === null) void listStylePresetsAction().then((r) => r.ok && publish(r.presets));
    return () => { listeners.delete(setPresets); };
  }, []);
  const save = useCallback((name: string, style: Parameters<typeof saveStylePresetAction>[0]["style"]) =>
    new Promise<{ ok: boolean; error?: string }>((resolve) => start(async () => {
      const r = await saveStylePresetAction({ name, style });
      if (r.ok) publish(r.presets);
      resolve(r.ok ? { ok: true } : { ok: false, error: r.error });
    })), []);
  const remove = useCallback((id: string) =>
    new Promise<{ ok: boolean; error?: string }>((resolve) => start(async () => {
      const r = await deleteStylePresetAction({ id });
      if (r.ok) publish(r.presets);
      resolve(r.ok ? { ok: true } : { ok: false, error: r.error });
    })), []);
  return { presets, pending, save, remove };
}
