import test from "node:test";
import assert from "node:assert/strict";
import { backupReminder, canSeeNotification, healthNotifications, loginFailureAlert } from "../src";

test("sağlık denetimlerinden bildirim: yalnızca fail/warn, kararlı anahtar, doğru önem ve bağlantı", () => {
  const n = healthNotifications([
    { id: "db", group: "Veritabanı", label: "Bağlantı", level: "fail", detail: "Sorgu başarısız" },
    { id: "404", group: "İçerik", label: "404 izleyici", level: "warn", detail: "60 adres" },
    { id: "trash", group: "İçerik", label: "Çöp", level: "info", detail: "3" },
    { id: "ok1", group: "x", label: "y", level: "ok", detail: "" },
  ]);
  assert.deepEqual(n.map((x) => [x.dedupeKey, x.severity, x.href]), [["sys:health:db", "critical", "/admin/system"], ["sys:health:404", "warning", "/admin/redirects"]]);
  assert.equal(n[0]!.window, "open");
  assert.equal(n[0]!.title, "Veritabanı: Bağlantı");
});

test("yedek hatırlatması: boş sitede yok, taze yedekte yok, eski/hiç yoksa var", () => {
  const now = new Date("2026-10-28T12:00:00Z");
  assert.equal(backupReminder(null, false, now), null);
  assert.equal(backupReminder(new Date("2026-10-10T00:00:00Z"), true, now), null);
  assert.match(backupReminder(new Date("2026-08-01T00:00:00Z"), true, now)!.body!, /88 gün/);
  assert.match(backupReminder(null, true, now)!.body!, /hiç yedek/);
});

test("giriş hatası uyarısı: eşik altında yok, eşikte uyarı, 4 katında kritik; görünürlük", () => {
  assert.equal(loginFailureAlert(4), null);
  assert.equal(loginFailureAlert(5)!.severity, "warning");
  assert.equal(loginFailureAlert(20)!.severity, "critical");
  assert.equal(canSeeNotification("admin", "editor"), false);
  assert.equal(canSeeNotification("admin", "admin"), true);
  assert.equal(canSeeNotification("all", "editor"), true);
});
