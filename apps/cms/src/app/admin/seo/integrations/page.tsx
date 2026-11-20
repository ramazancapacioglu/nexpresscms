import React from "react";
import { headers } from "next/headers";
import { resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { SeoTabs } from "@/components/admin/section-tabs";
import { WebmasterDashboard } from "@/components/admin/webmaster/webmaster-dashboard";
import { requireAdminPage } from "@/lib/auth/session";
import { connectionStatus } from "@/lib/webmaster/connection";
import { GOOGLE_CALLBACK_PATH, googleRedirectOrigin } from "./google-oauth";

export const dynamic = "force-dynamic";

const GOOGLE_NOTICES: Record<string, string> = {
  ok: "Google hesabı bağlandı. Search Console ve Analytics aynı kimliği kullanır; mülk adresini seçip bağlantıyı test edin.",
  state: "Google dönüşü doğrulanamadı (oturum süresi dolmuş olabilir). Bağlantıyı yeniden başlatın.",
  reddedildi: "Google izin ekranı kapatıldı ya da izin verilmedi.",
  kod: "Google dönüş kodu gelmedi.",
  eksik: "İstemci kimliği ve sırrı kayıtlı değil. Önce kaydedip yeniden bağlanın.",
  token: "Google jetonu alınamadı. Çoğunlukla yönlendirme adresi Cloud kaydıyla birebir aynı değildir ya da istemci sırrı hatalıdır.",
  jeton: "Google yenileme jetonu vermedi. Hesap izinlerinden uygulamayı kaldırıp bağlantıyı yeniden deneyin.",
};

export default async function AdminSeoIntegrationsPage({ searchParams }: { searchParams: Promise<{ google?: string; neden?: string; detay?: string }> }) {
  await requireAdminPage();
  const reqHeaders = await headers();
  const query = await searchParams;
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const site = await getScopedRepository(siteId).getSite();
  const seo = resolveSiteSettings(site?.settings).seo;
  const integrations = seo.integrations;
  const statuses = await connectionStatus(siteId);
  const origin = await googleRedirectOrigin();
  const siteHost = (site?.domain ?? "").replace(/^https?:\/\//, "").split("/")[0] || origin.replace(/^https?:\/\//, "");

  const googleNotice =
    query.google === "ok"
      ? GOOGLE_NOTICES.ok!
      : query.google === "hata"
        ? `${GOOGLE_NOTICES[query.neden ?? ""] ?? "Google bağlantısı tamamlanmadı."}${query.detay ? ` (Google: ${query.detay})` : ""}`
        : null;

  return (
    <div className="space-y-4">
      <SeoTabs />
      <WebmasterDashboard
        // Gizli alanlar (sır, jeton, API anahtarı) istemciye gönderilmez; yalnızca kayıtlı olup olmadığı bildirilir
        initial={{
          gsc: { clientId: integrations?.gsc?.clientId ?? "", clientSecret: "", refreshToken: "", siteUrl: integrations?.gsc?.siteUrl || (origin ? `${origin}/` : ""), enabled: integrations?.gsc?.enabled ?? false },
          ga4: { propertyId: integrations?.ga4?.propertyId ?? "", measurementId: integrations?.ga4?.measurementId ?? "", placement: integrations?.ga4?.placement === "body" ? "body" : "head", enabled: integrations?.ga4?.enabled ?? false },
          bing: { apiKey: "", siteUrl: integrations?.bing?.siteUrl || (origin ? `${origin}/` : ""), enabled: integrations?.bing?.enabled ?? false },
          yandex: { token: "", counterId: integrations?.yandex?.counterId ?? "", placement: integrations?.yandex?.placement === "body" ? "body" : "head", enabled: integrations?.yandex?.enabled ?? false },
        }}
        initialVerification={seo.verification ?? {}}
        secrets={{
          gscClientSecret: Boolean(integrations?.gsc?.clientSecret),
          gscRefreshToken: Boolean(integrations?.gsc?.refreshToken),
          bingApiKey: Boolean(integrations?.bing?.apiKey),
          yandexToken: Boolean(integrations?.yandex?.token),
        }}
        statuses={statuses}
        siteUrl={origin}
        siteHost={siteHost}
        redirectUri={`${origin}${GOOGLE_CALLBACK_PATH}`}
        googleNotice={googleNotice}
        openDialog={query.google === "hata"}
      />
    </div>
  );
}
