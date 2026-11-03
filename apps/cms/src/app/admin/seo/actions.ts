"use server";

import { revalidatePath } from "@/lib/cache";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import {
  fetchGscSearchQueries,
  fetchBingQueryStats,
  fetchYandexOrganicLandings,
  fetchGa4AiReferrals,
  fetchGa4LandingPages,
  type GscQueryRow,
  type BingQueryRow,
  type YandexOrganicLandingRow,
  type Ga4AiReferrerRow,
  type Ga4LandingRow,
} from "@nexpress/seo-core";
import { resolveSiteSettings } from "@nexpress/core";

export interface SaveIntegrationsInput {
  gsc?: {
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    siteUrl?: string;
    enabled?: boolean;
    lastSync?: string;
  };
  ga4?: {
    propertyId?: string;
    measurementId?: string;
    enabled?: boolean;
    lastSync?: string;
  };
  bing?: {
    apiKey?: string;
    siteUrl?: string;
    enabled?: boolean;
    lastSync?: string;
  };
  yandex?: {
    token?: string;
    counterId?: string;
    enabled?: boolean;
    lastSync?: string;
  };
}

export type ActionResponse<T = unknown> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

/**
 * Arama motoru ve analitik entegrasyon ayarlarını kaydeder.
 */
export async function saveSeoIntegrationsAction(
  input: SaveIntegrationsInput
): Promise<ActionResponse> {
  const admin = await requireAdmin("seo.integrations.save");
  const repo = getScopedRepository(admin.siteId);
  const site = await repo.getSite();
  const currentSeo = resolveSiteSettings(site?.settings).seo;

  const updatedSeo = {
    ...currentSeo,
    integrations: {
      gsc: {
        clientId: input.gsc?.clientId?.trim() || "",
        clientSecret: input.gsc?.clientSecret?.trim() || "",
        refreshToken: input.gsc?.refreshToken?.trim() || "",
        siteUrl: input.gsc?.siteUrl?.trim() || "",
        enabled: Boolean(input.gsc?.enabled),
        lastSync: input.gsc?.lastSync || currentSeo.integrations?.gsc?.lastSync,
      },
      ga4: {
        propertyId: input.ga4?.propertyId?.trim() || "",
        measurementId: input.ga4?.measurementId?.trim() || "",
        enabled: Boolean(input.ga4?.enabled),
        lastSync: input.ga4?.lastSync || currentSeo.integrations?.ga4?.lastSync,
      },
      bing: {
        apiKey: input.bing?.apiKey?.trim() || "",
        siteUrl: input.bing?.siteUrl?.trim() || "",
        enabled: Boolean(input.bing?.enabled),
        lastSync: input.bing?.lastSync || currentSeo.integrations?.bing?.lastSync,
      },
      yandex: {
        token: input.yandex?.token?.trim() || "",
        counterId: input.yandex?.counterId?.trim() || "",
        enabled: Boolean(input.yandex?.enabled),
        lastSync: input.yandex?.lastSync || currentSeo.integrations?.yandex?.lastSync,
      },
    },
  };

  await repo.saveSiteSettings({ seo: updatedSeo });
  await recordAudit({ id: admin.sub, email: admin.email }, "seo.integrations.saved", {
    target: "seo_integrations",
    detail: `GSC: ${Boolean(input.gsc?.enabled)}, GA4: ${Boolean(input.ga4?.enabled)}, Bing: ${Boolean(input.bing?.enabled)}, Yandex: ${Boolean(input.yandex?.enabled)}`,
  });

  await revalidatePath("/admin/seo");
  return { ok: true, message: "Entegrasyon ayarları başarıyla kaydedildi." };
}

/**
 * Google Search Console sorgularını çeker.
 */
export async function syncGscAction(credentials: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  siteUrl: string;
}): Promise<ActionResponse<GscQueryRow[]>> {
  await requireAdmin("seo.gsc.sync");
  if (!credentials.clientId || !credentials.refreshToken) {
    // Demo verisi döner
    return {
      ok: true,
      data: [
        { query: "ön muhasebe programı", clicks: 320, impressions: 5400, ctr: 5.92, position: 2.1 },
        { query: "erp programı izmir", clicks: 145, impressions: 2100, ctr: 6.9, position: 1.8 },
        { query: "wolvox erp fiyat", clicks: 92, impressions: 1650, ctr: 5.57, position: 4.2 },
        { query: "e-fatura entegrasyonu", clicks: 68, impressions: 1980, ctr: 3.43, position: 6.5 },
      ],
      message: "GSC API anahtarı boş olduğundan tohum performans verisi yüklendi.",
    };
  }

  try {
    const rows = await fetchGscSearchQueries(credentials, 28, 50);
    return { ok: true, data: rows, message: `${rows.length} sorgu Search Console'dan çekildi.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "GSC verisi çekilemedi." };
  }
}

/**
 * Bing Webmaster sorgularını çeker.
 */
export async function syncBingAction(credentials: {
  apiKey: string;
  siteUrl: string;
}): Promise<ActionResponse<BingQueryRow[]>> {
  await requireAdmin("seo.bing.sync");
  if (!credentials.apiKey) {
    return {
      ok: true,
      data: [
        { query: "akınsoft wolvox izmir", clicks: 42, impressions: 680, position: 1.4 },
        { query: "ticari muhasebe yazılımı", clicks: 28, impressions: 510, position: 2.8 },
        { query: "barkodlu satış programı", clicks: 15, impressions: 390, position: 4.1 },
      ],
      message: "Bing API anahtarı girilmediğinden örnek Bing verisi yüklendi.",
    };
  }

  try {
    const rows = await fetchBingQueryStats(credentials.apiKey, credentials.siteUrl);
    return { ok: true, data: rows, message: `${rows.length} sorgu Bing Webmaster'dan çekildi.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Bing API çağrısı başarısız oldu." };
  }
}

/**
 * Yandex Metrika organik arama giriş sayfalarını çeker.
 */
export async function syncYandexAction(credentials: {
  token: string;
  counterId: string;
}): Promise<ActionResponse<YandexOrganicLandingRow[]>> {
  await requireAdmin("seo.yandex.sync");
  if (!credentials.token || !credentials.counterId) {
    return {
      ok: true,
      data: [
        { path: "/tr/wolvox-erp", visits: 114 },
        { path: "/tr/on-muhasebe-programi", visits: 85 },
        { path: "/tr/iletisim", visits: 42 },
      ],
      message: "Yandex OAuth token boş olduğundan örnek organik trafik verisi yüklendi.",
    };
  }

  try {
    const rows = await fetchYandexOrganicLandings(credentials.token, credentials.counterId);
    return { ok: true, data: rows, message: `${rows.length} sayfa Yandex Metrika'dan çekildi.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Yandex Metrika API hatası." };
  }
}

/**
 * Google Analytics 4 AI Referrals ve Landing sayfalarını çeker.
 */
export async function syncGa4Action(credentials: {
  propertyId: string;
  accessToken: string;
}): Promise<ActionResponse<{ referrals: Ga4AiReferrerRow[]; landings: Ga4LandingRow[] }>> {
  await requireAdmin("seo.ga4.sync");
  if (!credentials.propertyId || !credentials.accessToken) {
    return {
      ok: true,
      data: {
        referrals: [
          { source: "chatgpt.com", label: "ChatGPT", sessions: 142 },
          { source: "perplexity.ai", label: "Perplexity", sessions: 88 },
          { source: "gemini.google.com", label: "Gemini", sessions: 65 },
          { source: "claude.ai", label: "Claude", sessions: 34 },
          { source: "copilot.microsoft.com", label: "Copilot", sessions: 29 },
        ],
        landings: [
          { path: "/tr/wolvox-erp", sessions: 820 },
          { path: "/tr/on-muhasebe-programi", sessions: 540 },
          { path: "/tr/akinsoft-kampanyalar", sessions: 390 },
          { path: "/tr/akinsoft-destek", sessions: 280 },
        ],
      },
      message: "GA4 Access Token girilmediğinden örnek GA4 analitik verisi yüklendi.",
    };
  }

  try {
    const [referrals, landings] = await Promise.all([
      fetchGa4AiReferrals(credentials.propertyId, credentials.accessToken),
      fetchGa4LandingPages(credentials.propertyId, credentials.accessToken),
    ]);
    return { ok: true, data: { referrals, landings }, message: "GA4 analitik verileri başarıyla senkronize edildi." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "GA4 API çağrısı başarısız oldu." };
  }
}

