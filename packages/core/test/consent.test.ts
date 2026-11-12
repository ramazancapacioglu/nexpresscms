import assert from "node:assert/strict";
import test from "node:test";
import { consentBannerVisible, optionalScriptsAllowed, readConsent, resolveSiteSettings, safeBackPath, safePolicyHref, sanitizeCookieConsent } from "../src/index";

const on = { enabled: true, message: "", policyHref: "" };
const off = { enabled: false, message: "", policyHref: "" };

test("onay kapalıyken betikler serbest ve banner yok; açıkken yalnızca 'all' ile serbest", () => {
  assert.equal(optionalScriptsAllowed(off, undefined), true);
  assert.equal(consentBannerVisible(off, undefined), false);
  assert.equal(optionalScriptsAllowed(on, undefined), false);
  assert.equal(optionalScriptsAllowed(on, "necessary"), false);
  assert.equal(optionalScriptsAllowed(on, "all"), true);
  assert.equal(optionalScriptsAllowed(on, "bozuk"), false);
  assert.equal(consentBannerVisible(on, undefined), true);
  assert.equal(consentBannerVisible(on, "necessary"), false);
  assert.equal(readConsent("all"), "all");
  assert.equal(readConsent("x"), null);
});

test("politika bağlantısı yalnızca site içi yol ya da https; geri dönüş yalnızca aynı site", () => {
  assert.equal(safePolicyHref("/gizlilik"), "/gizlilik");
  assert.equal(safePolicyHref("https://ornek.test/p"), "https://ornek.test/p");
  assert.equal(safePolicyHref("//kotu.test"), "");
  assert.equal(safePolicyHref("javascript:alert(1)"), "");
  assert.equal(safePolicyHref("http://ornek.test"), "");
  assert.equal(safeBackPath("https://ornek.test/hizmetler?x=1", "ornek.test"), "/hizmetler?x=1");
  assert.equal(safeBackPath("https://kotu.test/x", "ornek.test"), "/");
  assert.equal(safeBackPath(null, "ornek.test"), "/");
  assert.equal(safeBackPath("bozuk", "ornek.test"), "/");
});

test("ayar temizliği ve çözümü", () => {
  assert.deepEqual(sanitizeCookieConsent(null), off);
  assert.deepEqual(sanitizeCookieConsent({ enabled: "evet", message: "  a   b  ", policyHref: "ftp://x" }), { enabled: false, message: "a b", policyHref: "" });
  assert.equal(sanitizeCookieConsent({ message: "x".repeat(900) }).message.length, 400);
  assert.equal(resolveSiteSettings({ general: { cookieConsent: { enabled: true, policyHref: "/gizlilik" } } }).general.cookieConsent?.enabled, true);
  assert.equal(resolveSiteSettings({}).general.cookieConsent?.enabled, false);
});
