import assert from "node:assert/strict";
import test from "node:test";
import { memberMeetsTier, readPageOptions, writePageOptions, tierRank, suggestTierId, resolveSiteSettings, safeLinkUrl, safeMemberNext, normalizeMemberEmail, sanitizeMembership } from "../src/index";
import { MEMBER_LINK_TTL_SECONDS, MEMBER_SESSION_TTL_SECONDS, createMemberLinkToken, createMemberSessionToken, verifyMemberLinkToken, verifyMemberSessionToken } from "../src/member-token";

const secret = "test-secret-with-enough-length-0123456789";
const member = { id: "mem_0123456789abcdef", linkSeq: 3, sessionVersion: 2 };
const now = 1_800_000_000_000;

test("ayarlar: varsayılan kapalı; bilinmeyen mod kapalıya düşer; aydınlatma bağlantısı güvenli", () => {
  assert.deepEqual(sanitizeMembership(undefined), { mode: "closed", tiers: [], privacyUrl: "" });
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

test("kademeler: temizlik, sıra rütbedir; kademesiz üye 0", () => {
  const s = sanitizeMembership({ tiers: [{ id: "gumus", label: " Gümüş  Üye " }, { id: "altin", label: "Altın" }, { id: "altin", label: "Kopya" }, { id: "Kötü Kimlik", label: "x" }, { id: "bos", label: "" }, "x", null, ...Array.from({ length: 9 }, (_, i) => ({ id: `k${i}x`, label: `K${i}` }))] });
  assert.deepEqual(s.tiers.slice(0, 2), [{ id: "gumus", label: "Gümüş Üye" }, { id: "altin", label: "Altın" }]);
  assert.equal(s.tiers.length, 5, "en çok 5 kademe");
  assert.deepEqual(sanitizeMembership({ tiers: "x" }).tiers, []);
  assert.equal(tierRank(s.tiers, "gumus"), 1);
  assert.equal(tierRank(s.tiers, "altin"), 2);
  assert.equal(tierRank(s.tiers, ""), 0);
  assert.equal(tierRank(s.tiers, "yok"), 0);
  assert.equal(suggestTierId("Altın Üye"), "altin-uye");
  assert.match(suggestTierId("!!!"), /^kademe-/);
});

test("kademe kuralı: gereksinim boş/bilinmeyen herkesi geçirir; yüksek kademe düşüğü de açar, tersi açmaz", () => {
  const tiers = [{ id: "gumus", label: "Gümüş" }, { id: "altin", label: "Altın" }];
  assert.equal(memberMeetsTier(tiers, "", ""), true);
  assert.equal(memberMeetsTier(tiers, "", "yok"), true, "silinmiş kademe gereksinimi yok sayılır");
  assert.equal(memberMeetsTier([], "", "altin"), true, "kademesiz sitede gereksinim anlamsız");
  assert.equal(memberMeetsTier(tiers, "", "gumus"), false, "kademesiz üye");
  assert.equal(memberMeetsTier(tiers, "gumus", "gumus"), true);
  assert.equal(memberMeetsTier(tiers, "gumus", "altin"), false);
  assert.equal(memberMeetsTier(tiers, "altin", "gumus"), true);
  assert.equal(memberMeetsTier(tiers, "silinmis", "gumus"), false, "bilinmeyen üye kademesi 0");
});

test("sayfa seçeneği: memberTier okunur, geçersiz atılır, varsayılan yazılmaz", () => {
  assert.equal(readPageOptions({ _page: { memberTier: "altin" } }).memberTier, "altin");
  assert.equal(readPageOptions({ _page: { memberTier: "<x>" } }).memberTier, "");
  assert.equal(readPageOptions({}).memberTier, "");
  const w = writePageOptions({}, { ...readPageOptions({}), memberTier: "altin" });
  assert.deepEqual(w._page, { memberTier: "altin" });
  assert.equal("_page" in writePageOptions({}, readPageOptions({})), false);
});
