import React from "react";
import { CONSENT_COOKIE, CONSENT_MAX_AGE_SECONDS, safePolicyHref, type CookieConsentSettings } from "@nexpress/core";
import type { Translator } from "@nexpress/i18n";

/**
 * Kompakt çerez onayı kartı (0-KB React istemci paketi).
 * Kabul/ret sonrası hem çerez hem localStorage yazılır; sayfa önbellekten (s-maxage) gelse bile bir daha görünmez.
 */
export function CookieConsent({ settings, visible, t }: { settings: CookieConsentSettings; visible: boolean; t: Translator }) {
  if (!visible) return null;
  const policy = safePolicyHref(settings.policyHref);
  const inlineScript = `(function(){
  var el = document.getElementById("nx-consent-card");
  if (!el) return;
  var key = ${JSON.stringify(CONSENT_COOKIE)};
  var hasCookie = document.cookie.split(";").some(function(c){ return c.trim().indexOf(key + "=") === 0; });
  var hasStore = false;
  try { hasStore = Boolean(window.localStorage.getItem(key)); } catch(e) {}
  if (hasCookie || hasStore) { el.remove(); return; }
  el.addEventListener("click", function(e) {
    var btn = e.target.closest("button[data-consent-choice]");
    if (!btn) return;
    e.preventDefault();
    var val = btn.getAttribute("data-consent-choice") || "all";
    var sec = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = key + "=" + encodeURIComponent(val) + "; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax" + sec;
    try { window.localStorage.setItem(key, val); } catch(err) {}
    el.remove();
    try {
      var fd = new FormData();
      fd.append("choice", val);
      fetch("/api/consent", { method: "POST", body: fd, credentials: "same-origin" });
    } catch(err) {}
  });
})();`;

  return (
    <>
      <aside
        id="nx-consent-card"
        role="region"
        aria-label={t("consent.label")}
        className="nx-consent fixed bottom-3 left-3 z-50 w-[min(340px,calc(100vw-24px))] rounded-xl border border-black/10 bg-white/95 p-3.5 text-slate-800 shadow-[0_8px_28px_rgba(0,0,0,.14)] backdrop-blur-md"
      >
        <form method="post" action="/api/consent" className="space-y-2.5">
          <p className="text-xs leading-relaxed text-slate-600">
            {settings.message || t("consent.message")}
            {policy ? (
              <>
                {" "}
                <a href={policy} className="font-semibold text-slate-900 underline hover:opacity-80">
                  {t("consent.policy")}
                </a>
              </>
            ) : null}
          </p>
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="submit"
              name="choice"
              value="necessary"
              data-consent-choice="necessary"
              className="cursor-pointer rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("consent.reject")}
            </button>
            <button
              type="submit"
              name="choice"
              value="all"
              data-consent-choice="all"
              className="cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-700"
            >
              {t("consent.accept")}
            </button>
          </div>
        </form>
      </aside>
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
    </>
  );
}
