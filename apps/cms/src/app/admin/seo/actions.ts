"use server";

import { revalidatePath } from "@/lib/cache";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { clearWebmasterCaches } from "@/lib/webmaster/connection";
import {
  measurementIdOk,
  metrikaCounterOk,
  normalizeWebmasterVerification,
  scriptPlacement,
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
  const counterId = input.yandex?.counterId?.trim() || "";
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
