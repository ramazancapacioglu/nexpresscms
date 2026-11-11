import React from "react";
import { safePolicyHref, type CookieConsentSettings } from "@nexpress/core";
import type { Translator } from "@nexpress/i18n";

/**
 * Çerez onayı bannerı: istemci JS'i yok. İki düğme düz bir formla `/api/consent`'e gider; sunucu çerezi yazar ve sayfaya döner.
 * `visible=false` iken yalnızca küçük "Çerez tercihleri" düğmesi durur (seçimi sıfırlar).
 */
export function CookieConsent({ settings, visible, t }: { settings: CookieConsentSettings; visible: boolean; t: Translator }) {
  const policy = safePolicyHref(settings.policyHref);
  if (!visible) {
    return (
      <form method="post" action="/api/consent" className="nx-consent-prefs fixed bottom-2 left-2 z-30">
        <input type="hidden" name="choice" value="reset" />
        <button type="submit" className="rounded-md border border-black/10 bg-white/90 px-2 py-1 text-[11px] text-slate-700 shadow-sm hover:bg-white">{t("consent.preferences")}</button>
      </form>
    );
  }
  return (
    <section role="region" aria-label={t("consent.label")} className="nx-consent fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white px-4 py-4 text-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,.12)] sm:px-6">
      <form method="post" action="/api/consent" className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed">
          {settings.message || t("consent.message")}
          {policy ? <> <a href={policy} className="font-medium underline">{t("consent.policy")}</a></> : null}
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="submit" name="choice" value="necessary" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">{t("consent.reject")}</button>
          <button type="submit" name="choice" value="all" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">{t("consent.accept")}</button>
        </div>
      </form>
    </section>
  );
}
