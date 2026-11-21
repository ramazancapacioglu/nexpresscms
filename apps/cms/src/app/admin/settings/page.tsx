import React from "react";
import { getCmsMode, resolveSiteSettings } from "@nexpress/core";
import { getDbDialect, getScopedRepository } from "@nexpress/database";
import { providerFromEnv } from "@nexpress/rag";
import { requireAdminPage } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SettingsTabsShell } from "@/components/admin/settings-tabs-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { SiteOps } from "@/components/admin/site-ops";
import { LocalesCard } from "@/components/admin/locales-card";
import { CookieConsentCard } from "@/components/admin/cookie-consent-card";
import { mediaRoot } from "@/lib/media/storage";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const me = await requireAdminPage();
  const site = await getScopedRepository(me.siteId).getSite();
  const general = resolveSiteSettings(site?.settings).general;
  const timezones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [general.timezone];
  if (!timezones.includes(general.timezone)) timezones.unshift(general.timezone);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Genel Ayarlar"
        description="Site kimliği, dil yönetimi, çerez/KVKK onayı ve bakım modu."
      />
      <SettingsTabsShell
        general={
          <SettingsForm
            initial={{
              name: site?.name ?? "",
              tagline: site?.tagline ?? "",
              contactEmail: general.contactEmail,
              timezone: general.timezone,
            }}
            timezones={timezones}
            info={{
              siteId: me.siteId,
              domain: site?.domain ?? "",
              defaultLocale: site?.defaultLocale ?? "tr",
              supportedLocales: site?.supportedLocales ?? ["tr"],
              cmsMode: getCmsMode(),
              dbDialect: getDbDialect(),
              nodeEnv: process.env.NODE_ENV ?? "development",
              embeddingModel: providerFromEnv().model,
              mediaDir: mediaRoot(),
            }}
          />
        }
        locales={
          <LocalesCard
            initial={site?.supportedLocales ?? ["tr"]}
            defaultLocale={site?.defaultLocale ?? "tr"}
            initialIdentities={general.locales ?? {}}
          />
        }
        consent={
          <CookieConsentCard
            initial={
              general.cookieConsent ?? {
                enabled: false,
                message: "",
                policyHref: "",
              }
            }
          />
        }
        ops={
          <SiteOps
            maintenance={{
              enabled: general.maintenanceEnabled,
              message: general.maintenanceMessage,
            }}
          />
        }
      />
    </div>
  );
}
