import "server-only";
import { getScopedRepository } from "@nexpress/database";
import { setCacheTtlSeconds } from "@/lib/cache";
import { PERFORNEXT_PLUGIN_ID } from "@/plugins/perfornext";

/** Kayıtlı süreyi süreç belleğine alır. Sunucu açılışında ve ayar ekranında çağrılır. */
export async function hydratePerfornextCache(siteId = "default"): Promise<void> {
  try {
    const row = await getScopedRepository(siteId).getSitePlugin(PERFORNEXT_PLUGIN_ID);
    const raw = Number(row?.settings?.cacheTtlSeconds);
    if (Number.isFinite(raw) && raw > 0) setCacheTtlSeconds(raw);
  } catch {
    // Veritabanı hazır değilse varsayılan süre kalır.
  }
}
