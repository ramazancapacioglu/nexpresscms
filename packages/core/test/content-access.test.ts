import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contentAccessCookieName,
  evaluateContentAccess,
  signContentAccessToken,
  verifyContentAccessToken,
  verifyContentPasswordInput,
} from "../src/content-access";
import { resolveLocalizedSiteIdentity } from "../src/site-settings";

describe("content-access (parola ve üye korumalı içerik kapısı)", () => {
  const secret = "test-secret-key-for-content-access-hmac";

  it("çerez adını güvenli biçimde üretir", () => {
    assert.equal(contentAccessCookieName("cnt_123-abc"), "nx_pwd_cnt_123-abc");
  });

  it("sabit süreli parola karşılaştırması doğru ve yanlış parolayı ayırır", () => {
    assert.equal(verifyContentPasswordInput("Kurumsal2026!", "Kurumsal2026!"), true);
    assert.equal(verifyContentPasswordInput("Kurumsal2026!", "Kurumsal2026?"), false);
    assert.equal(verifyContentPasswordInput("Kurumsal2026!", "kısa"), false);
    assert.equal(verifyContentPasswordInput("", ""), false);
  });

  it("HMAC erişim belirtecini imzalar ve parola/kiracı değişince reddeder", async () => {
    const token = await signContentAccessToken(secret, "default", "cnt_1", "Gizli123");
    assert.equal(await verifyContentAccessToken(secret, "default", "cnt_1", "Gizli123", token), true);
    // Parola değişirse eski çerez düşer
    assert.equal(await verifyContentAccessToken(secret, "default", "cnt_1", "YeniParola", token), false);
    // Başka kiracıda veya başka içerikte geçersizdir
    assert.equal(await verifyContentAccessToken(secret, "other-site", "cnt_1", "Gizli123", token), false);
    assert.equal(await verifyContentAccessToken(secret, "default", "cnt_2", "Gizli123", token), false);
  });

  it("evaluateContentAccess görünürlük ve oturum kurallarını uygular", () => {
    // Herkese açık içerik
    assert.deepEqual(
      evaluateContentAccess({
        status: "published",
        visibility: "public",
        hasSession: false,
        hasValidPasswordToken: false,
      }),
      { allowed: true, gate: "none" }
    );

    // Parola korumalı içerik: çerez yokken kilitli, çerez varken açık
    assert.deepEqual(
      evaluateContentAccess({
        status: "published",
        visibility: "password",
        accessPassword: "secret",
        hasSession: false,
        hasValidPasswordToken: false,
      }),
      { allowed: false, gate: "password" }
    );
    assert.deepEqual(
      evaluateContentAccess({
        status: "published",
        visibility: "password",
        accessPassword: "secret",
        hasSession: false,
        hasValidPasswordToken: true,
      }),
      { allowed: true, gate: "none" }
    );

    // Üyelere özel içerik: oturumsuz kilitli, oturumlu açık
    assert.deepEqual(
      evaluateContentAccess({
        status: "published",
        visibility: "members_only",
        hasSession: false,
        hasValidPasswordToken: false,
      }),
      { allowed: false, gate: "members_only" }
    );
    assert.deepEqual(
      evaluateContentAccess({
        status: "published",
        visibility: "members_only",
        hasSession: true,
        hasValidPasswordToken: false,
      }),
      { allowed: true, gate: "none" }
    );
  });

  it("resolveLocalizedSiteIdentity ikincil dilde özel site adı, slogan ve başlık şablonunu çözer", () => {
    const site = {
      name: "NexPress Türkiye",
      tagline: "Yeni nesil açık çekirdekli CMS",
      settings: {
        seo: { titleTemplate: "%title% | %site%" },
        general: {
          locales: {
            en: {
              name: "NexPress Global",
              tagline: "Next-gen open-core CMS",
              titleTemplate: "%title% — %site%",
            },
          },
        },
      },
    };
    const trId = resolveLocalizedSiteIdentity(site, "tr");
    assert.equal(trId.name, "NexPress Türkiye");
    assert.equal(trId.tagline, "Yeni nesil açık çekirdekli CMS");
    assert.equal(trId.seo.titleTemplate, "%title% | %site%");

    const enId = resolveLocalizedSiteIdentity(site, "en");
    assert.equal(enId.name, "NexPress Global");
    assert.equal(enId.tagline, "Next-gen open-core CMS");
    assert.equal(enId.seo.titleTemplate, "%title% — %site%");
  });
});

it("ziyaretçi üyesi: üyelere özel ve kısıtlı içeriği açar; parola korumalı ve taslak kapılarını açmaz", () => {
  const base = { hasSession: false, hasValidPasswordToken: false };
  assert.deepEqual(evaluateContentAccess({ ...base, status: "published", visibility: "members_only", hasMemberSession: true }), { allowed: true, gate: "none" });
  assert.deepEqual(evaluateContentAccess({ ...base, status: "published", visibility: "members_only" }), { allowed: false, gate: "members_only" });
  assert.deepEqual(evaluateContentAccess({ ...base, status: "restricted", visibility: "public", hasMemberSession: true }), { allowed: true, gate: "none" });
  assert.deepEqual(evaluateContentAccess({ ...base, status: "published", visibility: "password", accessPassword: "x", hasMemberSession: true }), { allowed: false, gate: "password" }, "üyelik parola kapısını açmaz");
  assert.deepEqual(evaluateContentAccess({ ...base, status: "restricted", visibility: "public", accessPassword: "x", hasMemberSession: true }), { allowed: false, gate: "password" });
});
