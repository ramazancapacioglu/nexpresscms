import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateLicenseKeyPair,
  isLicenseKeyExpiredOrInvalid,
  signPluginLicenseKey,
  verifyPluginLicenseKey,
} from "../src/plugin-license";

describe("plugin-license (Ed25519 çevrimdışı eklenti lisansı doğrulaması)", () => {
  it("geçerli Ed25519 lisansını doğrular ve kalan günü hesaplar", async () => {
    const { publicKeyBase64Url, privateKeyPkcs8Base64Url } = await generateLicenseKeyPair();
    const now = 1_700_000_000;
    const token = await signPluginLicenseKey(
      {
        plugin: "@nexpress-pro/agentic-seo",
        siteDomain: "*.nexpress.com",
        exp: now + 10 * 86_400,
        holder: "Dijital Evre A.Ş.",
      },
      privateKeyPkcs8Base64Url
    );

    const res = await verifyPluginLicenseKey(token, {
      pluginId: "@nexpress-pro/agentic-seo",
      siteDomain: "demo.nexpress.com",
      nowSeconds: now,
      publicKeyBase64Url,
    });
    assert.equal(res.status, "valid");
    assert.equal(res.daysRemaining, 10);
    assert.equal(res.payload?.holder, "Dijital Evre A.Ş.");
    assert.equal(isLicenseKeyExpiredOrInvalid(token, "@nexpress-pro/agentic-seo", now), false);
  });

  it("süresi dolmuş lisansı expired olarak işaretler ve kapıyı kapatır", async () => {
    const { publicKeyBase64Url, privateKeyPkcs8Base64Url } = await generateLicenseKeyPair();
    const now = 1_700_000_000;
    const token = await signPluginLicenseKey(
      {
        plugin: "@nexpress-pro/agentic-seo",
        siteDomain: "*",
        exp: now - 3600,
      },
      privateKeyPkcs8Base64Url
    );

    const res = await verifyPluginLicenseKey(token, {
      pluginId: "@nexpress-pro/agentic-seo",
      nowSeconds: now,
      publicKeyBase64Url,
    });
    assert.equal(res.status, "expired");
    assert.equal(res.daysRemaining, 0);
    assert.equal(isLicenseKeyExpiredOrInvalid(token, "@nexpress-pro/agentic-seo", now), true);
  });

  it("sahte imzayı veya yanlış eklenti/alan adını reddeder", async () => {
    const { publicKeyBase64Url, privateKeyPkcs8Base64Url } = await generateLicenseKeyPair();
    const otherKeys = await generateLicenseKeyPair();
    const now = 1_700_000_000;
    const token = await signPluginLicenseKey(
      {
        plugin: "@nexpress-pro/agentic-seo",
        siteDomain: "kurumsal.com",
        exp: now + 86_400,
      },
      privateKeyPkcs8Base64Url
    );

    // Yanlış açık anahtar
    const badSig = await verifyPluginLicenseKey(token, {
      pluginId: "@nexpress-pro/agentic-seo",
      siteDomain: "kurumsal.com",
      nowSeconds: now,
      publicKeyBase64Url: otherKeys.publicKeyBase64Url,
    });
    assert.equal(badSig.status, "invalid");

    // Yanlış alan adı
    const badDomain = await verifyPluginLicenseKey(token, {
      pluginId: "@nexpress-pro/agentic-seo",
      siteDomain: "baska-site.org",
      nowSeconds: now,
      publicKeyBase64Url,
    });
    assert.equal(badDomain.status, "invalid");
  });
});

