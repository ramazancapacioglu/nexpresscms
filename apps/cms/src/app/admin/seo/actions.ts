"use server";

import { revalidatePath } from "@/lib/cache";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { clearWebmasterCaches } from "@/lib/webmaster/connection";
import {
  extractMetrikaCounterId,
  measurementIdOk,
  mergeBingAiSnapshots,
  metrikaCounterOk,
  normalizeWebmasterVerification,
  parseBingAiPerformanceCsv,
  scriptPlacement,
  validateMetrikaHtml,
  type BingAiPerformanceSnapshot,
  type WebmasterVerification,
  resolveSiteSettings,
} from "@nexpress/core";

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
    placement?: "head" | "body";
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
    counterHtml?: string;
    loadBeforeConsent?: boolean;
    placement?: "head" | "body";
    enabled?: boolean;
    lastSync?: string;
  };
}

export type ActionResponse<T = unknown> =
  | { ok: true; data?: T; message?: string; sample?: boolean }
  | { ok: false; error: string };

export type SaveIntegrationsPayload = SaveIntegrationsInput & {
  verification?: WebmasterVerification;
  /** Gizli alanlar istemciye gönderilmez; `true` olanlar boş bırakıldıysa kayıtlı değer korunur. */
  keep?: { gscClientSecret?: boolean; gscRefreshToken?: boolean; bingApiKey?: boolean; yandexToken?: boolean };
};

/**
 * Arama motoru ve analitik entegrasyon ayarlarını kaydeder.
 */
export async function saveSeoIntegrationsAction(
  input: SaveIntegrationsPayload
): Promise<ActionResponse> {
  const admin = await requireAdmin("seo.integrations.save");
  const measurementId = input.ga4?.measurementId?.trim() || "";
  if (measurementId && !measurementIdOk(measurementId)) {
    return { ok: false, error: "Ölçüm kimliği G- ile başlayan Analytics kimliği olmalı. Sayısal mülk numarası ayrı alandır." };
  }
  const metrikaHtml = validateMetrikaHtml(input.yandex?.counterHtml);
  if (metrikaHtml.error) return { ok: false, error: metrikaHtml.error };
  const counterId = input.yandex?.counterId?.trim() || extractMetrikaCounterId(metrikaHtml.value) || "";
  if (counterId && !metrikaCounterOk(counterId)) {
    return { ok: false, error: "Metrika sayaç numarası 5–12 haneli olmalıdır." };
  }
  const verification = normalizeWebmasterVerification(input.verification);
  if (verification.error) return { ok: false, error: verification.error };

  const repo = getScopedRepository(admin.siteId);
  const site = await repo.getSite();
  const currentSeo = resolveSiteSettings(site?.settings).seo;

  const updatedSeo = {
    ...currentSeo,
    verification: verification.value,
    integrations: {
      gsc: {
        clientId: input.gsc?.clientId?.trim() || "",
        clientSecret: input.gsc?.clientSecret?.trim() || (input.keep?.gscClientSecret ? currentSeo.integrations?.gsc?.clientSecret ?? "" : ""),
        refreshToken: input.gsc?.refreshToken?.trim() || (input.keep?.gscRefreshToken ? currentSeo.integrations?.gsc?.refreshToken ?? "" : ""),
        siteUrl: input.gsc?.siteUrl?.trim() || "",
        enabled: Boolean(input.gsc?.enabled),
        lastSync: input.gsc?.lastSync || currentSeo.integrations?.gsc?.lastSync,
      },
      ga4: {
        propertyId: input.ga4?.propertyId?.trim() || "",
        measurementId,
        placement: scriptPlacement(input.ga4?.placement),
        enabled: Boolean(input.ga4?.enabled),
        lastSync: input.ga4?.lastSync || currentSeo.integrations?.ga4?.lastSync,
      },
      bing: {
        apiKey: input.bing?.apiKey?.trim() || (input.keep?.bingApiKey ? currentSeo.integrations?.bing?.apiKey ?? "" : ""),
        siteUrl: input.bing?.siteUrl?.trim() || "",
        enabled: Boolean(input.bing?.enabled),
        lastSync: input.bing?.lastSync || currentSeo.integrations?.bing?.lastSync,
      },
      yandex: {
        token: input.yandex?.token?.trim() || (input.keep?.yandexToken ? currentSeo.integrations?.yandex?.token ?? "" : ""),
        counterId,
        counterHtml: metrikaHtml.value,
        loadBeforeConsent: Boolean(input.yandex?.loadBeforeConsent),
        placement: scriptPlacement(input.yandex?.placement),
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

  clearWebmasterCaches(admin.siteId);
  await revalidatePath("/admin/seo");
  await revalidatePath("/admin/seo/integrations");
  await revalidatePath("/");
  return { ok: true, message: "Entegrasyon ayarları kaydedildi." };
}

/** Önerilen iç bağlantıları kiracıya kapalı Bilgi Ağına (`content_entity_links`) tek tıkla ekler. */
export async function applyEntityLinksAction(
  links: Array<{ sourceContentId: string; targetContentId: string; relationType?: string; anchorText?: string }>
): Promise<{ ok: boolean; created: number; message: string }> {
  const me = await requireUser({ audit: "seo.entityLink" });
  const repo = getScopedRepository(me.siteId);
  let created = 0;
  for (const item of links.slice(0, 30)) {
    const res = await repo.upsertEntityLink({
      sourceContentId: item.sourceContentId,
      targetContentId: item.targetContentId,
      relationType: item.relationType ?? "mentions",
      anchorText: item.anchorText,
    });
    if (res.created) created += 1;
  }
  await revalidatePath("/admin/seo/audit");
  await revalidatePath("/admin/seo");
  return {
    ok: true,
    created,
    message: created > 0 ? `${created} varlık bağı Bilgi Ağına eklendi.` : "Seçili bağlar zaten Bilgi Ağında mevcut.",
  };
}

const MAX_BING_CSV_BYTES = 2 * 1024 * 1024;

/** Bing Webmaster Tools → AI Performance (Cited Pages / Grounding Queries) CSV verisini kiracıya özel kaydeder. */
export async function importBingAiPerformanceCsvAction(input: {
  csvText: string;
  fileName?: string;
  mode?: "merge" | "replace";
}): Promise<ActionResponse<BingAiPerformanceSnapshot>> {
  const me = await requireUser({ audit: "seo.bingAiCsv.import" });
  const raw = typeof input?.csvText === "string" ? input.csvText : "";
  if (!raw.trim()) {
    return { ok: false, error: "CSV içeriği boş. Lütfen Bing Webmaster Tools'dan indirilen CSV dosyasını seçin." };
  }
  if (Buffer.byteLength(raw, "utf8") > MAX_BING_CSV_BYTES) {
    return { ok: false, error: "CSV dosyası 2 MB sınırını aşıyor." };
  }

  const repo = getScopedRepository(me.siteId);
  const site = await repo.getSite();
  const currentSeo = resolveSiteSettings(site?.settings).seo;
  const parsed = parseBingAiPerformanceCsv(raw, {
    defaultLocale: site?.defaultLocale ?? "tr",
    fileName: input.fileName,
  });

  if (parsed.citedPages.length === 0 && parsed.groundingQueries.length === 0) {
    return {
      ok: false,
      error: "Geçerli Bing AI Performance sütunu bulunamadı. 'Page URL' / 'Query' ve 'Citations' sütunlarını içeren CSV yükleyin.",
    };
  }

  const next =
    input.mode === "replace" ? parsed : mergeBingAiSnapshots(currentSeo.bingAiPerformance, parsed);

  await repo.saveSiteSettings({
    seo: {
      ...currentSeo,
      bingAiPerformance: next,
    },
  });

  await recordAudit({ id: me.sub, email: me.email }, "seo.bingAiCsv.imported", {
    target: "seo_bing_ai_csv",
    detail: `Dosya: ${input.fileName ?? "-"}, Sayfa: ${next.citedPages.length}, Sorgu: ${next.groundingQueries.length}, Atıf: ${next.totalCitations}`,
  });

  await revalidatePath("/admin/seo/reports");
  return {
    ok: true,
    data: next,
    message: `${parsed.citedPages.length} sayfa ve ${parsed.groundingQueries.length} grounding sorgusu içe aktarıldı.`,
  };
}

/** Kayıtlı Bing AI Performance CSV verisini temizler. */
export async function clearBingAiPerformanceAction(): Promise<ActionResponse> {
  const me = await requireUser({ audit: "seo.bingAiCsv.clear" });
  const repo = getScopedRepository(me.siteId);
  const site = await repo.getSite();
  const currentSeo = resolveSiteSettings(site?.settings).seo;

  await repo.saveSiteSettings({
    seo: {
      ...currentSeo,
      bingAiPerformance: null,
    },
  });

  await recordAudit({ id: me.sub, email: me.email }, "seo.bingAiCsv.cleared", {
    target: "seo_bing_ai_csv",
    detail: "Bing AI Performance CSV verisi temizlendi.",
  });

  await revalidatePath("/admin/seo/reports");
  return { ok: true, message: "Bing AI Performance CSV verisi temizlendi." };
}
