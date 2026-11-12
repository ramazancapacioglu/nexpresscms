import assert from "node:assert/strict";
import test from "node:test";
import { resolveSiteSettings, safeLinkUrl, safeMemberNext, normalizeMemberEmail, sanitizeMembership } from "../src/index";
import { MEMBER_LINK_TTL_SECONDS, MEMBER_SESSION_TTL_SECONDS, createMemberLinkToken, createMemberSessionToken, verifyMemberLinkToken, verifyMemberSessionToken } from "../src/member-token";

const secret = "test-secret-with-enough-length-0123456789";
const member = { id: "mem_0123456789abcdef", linkSeq: 3, sessionVersion: 2 };
const now = 1_800_000_000_000;

test("ayarlar: varsayılan kapalı; bilinmeyen mod kapalıya düşer; aydınlatma bağlantısı güvenli", () => {
  assert.deepEqual(sanitizeMembership(undefined), { mode: "closed", privacyUrl: "" });
  assert.equal(sanitizeMembership({ mode: "open" }).mode, "open");
  assert.equal(sanitizeMembership({ mode: "herkes" }).mode, "closed");
  assert.equal(sanitizeMembership({ privacyUrl: "javascript:alert(1)" }).privacyUrl, "");
  assert.equal(sanitizeMembership({ privacyUrl: "//evil.test" }).privacyUrl, "");
  assert.equal(sanitizeMembership({ privacyUrl: "/gizlilik" }).privacyUrl, "/gizlilik");
  assert.equal(safeLinkUrl("http://x.test"), "", "yalnızca https");
  assert.equal(resolveSiteSettings({}).general.membership?.mode, "closed", "mevcut siteler değişmez");
  assert.equal(resolveSiteSettings({ general: { membership: { mode: "invite" } } }).general.membership?.mode, "invite");
});

test("e-posta: küçük harf, kırpma, geçersiz reddedilir", () => {
  assert.equal(normalizeMemberEmail("  Ayse@Example.COM "), "ayse@example.com");
  for (const bad of ["", "a@b", "a b@c.com", "@x.com", 5, null, `${"a".repeat(250)}@x.com`]) assert.equal(normalizeMemberEmail(bad), null, String(bad));
});

test("dönüş adresi: yalnızca site içi yol; açık yönlendirme, panel ve API reddedilir", () => {
  assert.equal(safeMemberNext("/gizli-sayfa?x=1"), "/gizli-sayfa?x=1");
  for (const bad of ["//evil.test", "/\\evil.test", "https://evil.test", "javascript:x", "/admin/users", "/api/members", "/login", "gizli", "", undefined, "/a\u0000b", "/" + "x".repeat(400)]) assert.equal(safeMemberNext(bad, "/uye"), "/uye", String(bad));
});

test("giriş bağlantısı: geçerli, süresi dolunca, kurcalanınca, başka kiracıda ve çerez olarak kullanılamaz", () => {
  const t = createMemberLinkToken(secret, "site-a", member, now);
  assert.deepEqual(verifyMemberLinkToken(secret, "site-a", t, now), { memberId: member.id, linkSeq: 3 });
  assert.equal(verifyMemberLinkToken(secret, "site-a", t, now + (MEMBER_LINK_TTL_SECONDS + 1) * 1000), null, "süresi doldu");
  assert.equal(verifyMemberLinkToken(secret, "site-b", t, now), null, "başka kiracı");
  assert.equal(verifyMemberLinkToken("baska-secret-baska-secret-baska-secret", "site-a", t, now), null);
  const parts = t.split(".");
  parts[1] = "4";
  assert.equal(verifyMemberLinkToken(secret, "site-a", parts.join("."), now), null, "sıra kurcalandı");
  assert.equal(verifyMemberSessionToken(secret, "site-a", t, now), null, "bağlantı oturum çerezi olamaz");
  for (const junk of [undefined, "", "a.b.c", "x".repeat(300), 5]) assert.equal(verifyMemberLinkToken(secret, "site-a", junk, now), null);
});

test("oturum çerezi: sürüm taşır, süre sınırı vardır, bağlantı belirteci olarak geçmez", () => {
  const t = createMemberSessionToken(secret, "site-a", member, now);
  assert.deepEqual(verifyMemberSessionToken(secret, "site-a", t, now), { memberId: member.id, sessionVersion: 2 });
  assert.equal(verifyMemberSessionToken(secret, "site-a", t, now + (MEMBER_SESSION_TTL_SECONDS + 1) * 1000), null);
  assert.equal(verifyMemberLinkToken(secret, "site-a", t, now), null, "oturum çerezi giriş bağlantısı olamaz");
  assert.throws(() => createMemberSessionToken(secret, "site-a", { id: "../x", sessionVersion: 0 }, now));
});
