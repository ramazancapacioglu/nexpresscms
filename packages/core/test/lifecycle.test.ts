import test from "node:test";
import assert from "node:assert/strict";
import { isScheduleDue, normalizeRedirectPath, readTrashMeta, resolveRedirectChain, trashDaysLeft, trashExpired, validateRedirect, zonedLocalToUtc, type RedirectCode } from "../src";

test("saat dilimi çözümü: İstanbul UTC+3, New York yazın/kışın, geçersiz girdi null", () => {
  assert.equal(zonedLocalToUtc("2026-11-01T10:30", "Europe/Istanbul")?.toISOString(), "2026-11-01T07:30:00.000Z");
  assert.equal(zonedLocalToUtc("2026-07-01T12:00", "America/New_York")?.toISOString(), "2026-07-01T16:00:00.000Z");
  assert.equal(zonedLocalToUtc("2026-01-01T12:00", "America/New_York")?.toISOString(), "2026-01-01T17:00:00.000Z");
  assert.equal(zonedLocalToUtc("2026-02-31T10:00", "UTC"), null);
  assert.equal(zonedLocalToUtc("yarın", "UTC"), null);
  assert.equal(zonedLocalToUtc("2026-01-01T10:00", "Bu/Yok"), null);
});

test("zamanlanmış yayın zamanı: gelmedi / geldi / tarih yok", () => {
  const now = new Date("2026-11-01T07:30:00Z");
  assert.equal(isScheduleDue("2026-11-01T10:30", "Europe/Istanbul", now), true);
  assert.equal(isScheduleDue("2026-11-01T10:31", "Europe/Istanbul", now), false);
  assert.equal(isScheduleDue("", "UTC", now), false);
  assert.equal(isScheduleDue(undefined, "UTC", now), false);
});

test("çöp kutusu: işaret okuma, süre dolumu, kalan gün", () => {
  assert.deepEqual(readTrashMeta({ _trash: { previousStatus: "published", deletedAt: "2026-10-01T00:00:00Z", deletedBy: "a@x" } }), { previousStatus: "published", deletedAt: "2026-10-01T00:00:00Z", deletedBy: "a@x" });
  assert.equal(readTrashMeta({}), null);
  const now = new Date("2026-10-31T00:00:00Z");
  assert.equal(trashExpired("2026-10-01T00:00:00Z", now), true);
  assert.equal(trashExpired("2026-10-02T00:00:00Z", now), false);
  assert.equal(trashDaysLeft("2026-10-02T00:00:00Z", now), 1);
  assert.equal(trashDaysLeft("2026-09-01T00:00:00Z", now), 0);
});

test("yönlendirme doğrulama: yol sadeleştirme, rezerve yollar, döngü, hedef türleri", () => {
  assert.equal(normalizeRedirectPath("tr//eski/?a=1#x"), "/tr/eski");
  assert.deepEqual(validateRedirect("/eski", "/yeni"), { ok: true, from: "/eski", to: "/yeni" });
  assert.deepEqual(validateRedirect("eski/", "https://x.test/a"), { ok: true, from: "/eski", to: "https://x.test/a" });
  for (const [f, t] of [["/", "/a"], ["/admin/x", "/a"], ["/api", "/a"], ["/a", "/a/"], ["/a b", "/c"], ["/a", "javascript:alert(1)"], ["/a", "//evil.test"], ["/a", "https://u:p@x.test"], ["/a", ""]] as const) {
    assert.equal(validateRedirect(f, t).ok, false, `${f} → ${t}`);
  }
});

test("yönlendirme zinciri: tek adım, çok adım, döngü, dış hedef, eşleşme yok", () => {
  const rules = new Map<string, { to: string; code: RedirectCode }>([
    ["/a", { to: "/b", code: 301 }],
    ["/b", { to: "/c", code: 302 }],
    ["/x", { to: "/y", code: 301 }],
    ["/y", { to: "/x", code: 301 }],
    ["/d", { to: "https://x.test/z", code: 308 }],
  ]);
  assert.deepEqual(resolveRedirectChain(rules, "/b"), { to: "/c", code: 302, hops: 1 });
  assert.deepEqual(resolveRedirectChain(rules, "/a"), { to: "/c", code: 301, hops: 2 });
  assert.deepEqual(resolveRedirectChain(rules, "/x"), { loop: true });
  assert.deepEqual(resolveRedirectChain(rules, "/d"), { to: "https://x.test/z", code: 308, hops: 1 });
  assert.equal(resolveRedirectChain(rules, "/yok"), null);
});
