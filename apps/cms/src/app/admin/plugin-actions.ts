"use server";

import { pluginActions, type PluginActionResult } from "@nexpress/core";
import { requireUser } from "@/lib/auth/session";
import "@/plugins/register";

const NAME_RE = /^[a-z0-9-]+\.[a-z0-9-]+$/;

/**
 * Panelin eklenti eylemlerini çağırdığı tek kapı. Oturum zorunludur; eylemin kendi kapısı
 * (modül açık mı), hız sınırı ve doğrulaması eklenti işleyicisindedir.
 */
export async function runPluginAction(input: { name: string; payload: Record<string, unknown> }): Promise<PluginActionResult> {
  const session = await requireUser({ audit: "plugins.action" });
  if (!NAME_RE.test(input.name)) return { ok: false, error: "Geçersiz eylem adı.", code: "invalid" };
  return pluginActions.run(input.name, { siteId: session.siteId, userId: session.sub, input: input.payload ?? {} });
}
