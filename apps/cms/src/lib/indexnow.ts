import "server-only";
import { cmsHooks } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const PLUGIN_ID = "@nexpress/indexnow";
let registered = false;

/**
 * Yayınlanan adresi IndexNow'a bildirir (Bing, Yandex vb.).
 * Yalnızca üretimde, anahtar tanımlıysa, site ayarı açıksa ve adres genel ise çalışır.
 * Hata yayın akışını asla bozmaz.
 */
export function registerIndexNow(): void {
  if (registered) return;
  registered = true;

  cmsHooks.registerAction(
    "content:afterPublish",
    PLUGIN_ID,
    async ({ siteId, url }) => {
      const key = process.env.INDEXNOW_API_KEY?.trim();
      if (!key || process.env.NODE_ENV !== "production") return;
      try {
        const site = await getScopedRepository(siteId).getSite();
        if (site?.settings?.seo?.enableIndexNow === false) return;
        const target = new URL(url, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
        if (target.hostname === "localhost" || target.hostname.endsWith(".localhost")) return;
        await fetch(ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host: target.hostname,
            key,
            keyLocation: `${target.origin}/indexnow-key.txt`,
            urlList: [target.toString()],
          }),
          signal: AbortSignal.timeout(4000),
        });
      } catch (error) {
        console.warn("[IndexNow] bildirim gönderilemedi:", error instanceof Error ? error.message : error);
      }
    }
  );
}
