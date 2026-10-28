import React from "react";
import { getCmsMode, resolveSiteSettings } from "@nexpress/core";
import { getDbDialect, getScopedRepository } from "@nexpress/database";
import { providerFromEnv } from "@nexpress/rag";
import { requireAdminPage } from "@/lib/auth/session";
import { SettingsForm } from "@/components/admin/settings-form";
import { mediaRoot } from "@/lib/media/storage";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const me = await requireAdminPage();
  const site = await getScopedRepository(me.siteId).getSite();
  const general = resolveSiteSettings(site?.settings).general;
  const timezones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [general.timezone];
  if (!timezones.includes(general.timezone)) timezones.unshift(general.timezone);

  return (
    <SettingsForm
      initial={{ name: site?.name ?? "", tagline: site?.tagline ?? "", contactEmail: general.contactEmail, timezone: general.timezone }}
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
  );
}
