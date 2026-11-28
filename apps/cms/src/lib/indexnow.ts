import "server-only";
import { cmsHooks, isPrefixless, resolveSiteSettings } from "@nexpress/core";
import { decryptSecret } from "@nexpress/core/secret-box";
import { getScopedRepository } from "@nexpress/database";
import { notify } from "./notify";
import { siteOriginFor } from "./site-origin";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const PLUGIN_ID = "@nexpress/indexnow";
let registered = false;

/** Paneldeki şifreli anahtar, yoksa ortam değişkeni. Düz metin panele dönmez. */
export async function resolveIndexNowKey(siteId: string): Promise<string> {
  const site = await getScopedRepository(siteId).getSite();
  const stored = resolveSiteSettings(site?.settings).seo.indexNowKey?.trim() ?? "";
  if (stored) {
    try {
      const plain = decryptSecret(stored).trim();
      if (plain) return plain;
    } catch {
      /* bozuk kayıt ortam anahtarına düşer */
    }
  }
  return process.env.INDEXNOW_API_KEY?.trim() ?? "";
}

export interface IndexNowSubmitResult {
  ok: boolean;
  submitted: number;
  status?: number;
  error?: string;
}

/**
 * Verilen URL listesini tek toplu istekle IndexNow'a bildirir (Bing, Yandex vb.).
 * Tek dilli sitede `/{defaultLocale}/...` ön ekini otomatik temizler.
 */
export async function submitIndexNowUrls(
  siteId: string,
  rawUrls: string[],
  options?: { force?: boolean }
): Promise<IndexNowSubmitResult> {
  const key = await resolveIndexNowKey(siteId);
  if (!key) {
    return { ok: false, submitted: 0, error: "IndexNow anahtarı tanımlı değil (SEO → Ayarlar → Anahtarlar)." };
  }
  if (!options?.force && process.env.NODE_ENV !== "production") {
    return { ok: true, submitted: 0 };
  }

  const site = await getScopedRepository(siteId).getSite();
  if (!options?.force && site?.settings?.seo?.enableIndexNow === false) {
    return { ok: true, submitted: 0 };
  }

  const base = siteOriginFor(site);
  const defaultLocale = site?.defaultLocale ?? "tr";
  const prefixless = isPrefixless(site, defaultLocale);
  const localeRe = new RegExp(`^/${defaultLocale}(?=/|$)`);

  const urlSet = new Set<string>();
  let host = "";
  let origin = "";
  for (const raw of rawUrls) {
    try {
      const u = new URL(raw, base);
      if (u.hostname === "localhost" || u.hostname.endsWith(".localhost")) continue;
      if (prefixless && localeRe.test(u.pathname)) {
        u.pathname = u.pathname.replace(localeRe, "") || "/";
      }
      if (u.pathname === "/ana-sayfa") u.pathname = "/";
      host = u.hostname;
      origin = u.origin;
      urlSet.add(u.toString());
    } catch {
      /* geçersiz URL atlanır */
    }
  }

  const urlList = [...urlSet].slice(0, 500);
  if (urlList.length === 0 || !host || !origin) {
    return { ok: false, submitted: 0, error: "Bildirilecek geçerli genel URL bulunamadı." };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${origin}/indexnow-key.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      await notify(siteId, {
        kind: "indexnow.failed",
        severity: "warning",
        title: "IndexNow bildirimi reddedildi",
        body: `Arama motoru HTTP ${res.status} döndü. Anahtarı ve /indexnow-key.txt adresini denetleyin.`,
        href: "/admin/system",
        dedupeKey: "indexnow-failed",
        audience: "admin",
      });
      return { ok: false, submitted: 0, status: res.status, error: `IndexNow HTTP ${res.status} döndü.` };
    }
    return { ok: true, submitted: urlList.length, status: res.status };
  } catch (error) {
    const msg = error instanceof Error ? error.message.slice(0, 200) : "Ağ hatası";
    await notify(siteId, {
      kind: "indexnow.failed",
      severity: "warning",
      title: "IndexNow bildirimi gönderilemedi",
      body: msg,
      href: "/admin/system",
      dedupeKey: "indexnow-failed",
      audience: "admin",
    });
    console.warn("[IndexNow] bildirim gönderilemedi:", msg);
    return { ok: false, submitted: 0, error: msg };
  }
}

/**
 * Yayınlanan veya güncellenen içeriğin adresini IndexNow'a bildirir (Bing, Yandex vb.).
 * Yalnızca üretimde, anahtar tanımlıysa, site ayarı açıksa ve adres genel ise çalışır.
 */
export function registerIndexNow(): void {
  if (registered) return;
  registered = true;

  cmsHooks.registerAction("content:afterPublish", PLUGIN_ID, async ({ siteId, url }) => {
    await submitIndexNowUrls(siteId, [url]);
  });
}
