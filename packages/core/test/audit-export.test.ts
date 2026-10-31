import test from "node:test";
import assert from "node:assert/strict";
import { AUDIT_MIN_RETENTION_DAYS, auditCsv, auditPurgeCutoff } from "../src/audit-export";

test("CSV: BOM, başlık, CRLF, boş hedef", () => {
  const out = auditCsv([{ at: new Date("2026-10-31T10:00:00Z"), actorEmail: "a@b.co", action: "auth.login", target: null, detail: "2FA", ip: "1.2.3.4" }]);
  assert.ok(out.startsWith("﻿zaman,kullanici,eylem,hedef,ayrinti,ip\r\n"));
  assert.ok(out.includes("2026-10-31T10:00:00.000Z,a@b.co,auth.login,,2FA,1.2.3.4\r\n"));
  const evil = auditCsv([{ at: new Date(0), actorEmail: "", action: "x", target: "=HYPERLINK(\"u\")", detail: "a,b", ip: "" }]);
  assert.ok(evil.includes("\"'=HYPERLINK(\"\"u\"\")\""), "formül etkisizleşir");
  assert.ok(evil.includes('"a,b"'));
});

test("temizleme sınırı: en az 30 gün, en çok 10 yıl, tam sayı", () => {
  const now = Date.UTC(2026, 9, 31);
  assert.equal(auditPurgeCutoff(AUDIT_MIN_RETENTION_DAYS - 1, now), null);
  assert.equal(auditPurgeCutoff(0, now), null);
  assert.equal(auditPurgeCutoff(30.5, now), null);
  assert.equal(auditPurgeCutoff(3651, now), null);
  assert.equal(auditPurgeCutoff(90, now)!.getTime(), now - 90 * 86_400_000);
});
