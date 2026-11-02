import assert from "node:assert/strict";
import { test } from "node:test";
import { backupFileName, isBackupFileName, pickBackupsToDelete } from "../src/lib/backup-names";

test("dosya adı: kiracı güvenli karakterlere indirilir, zaman damgası sıralanabilir", () => {
  const n = backupFileName("firma/../x", new Date("2026-11-02T10:30:05.123Z"));
  assert.equal(n, "nexpress-firma_.._x-20261102-103005Z.nxbackup".replace("..", "__").replace("firma_", "firma_"));
  assert.ok(!n.includes("/"));
  assert.ok(isBackupFileName(backupFileName("default", new Date()), "default"));
});

test("başka kiracının, zararlı ya da yarım dosyalar tanınmaz", () => {
  const mine = backupFileName("default", new Date("2026-11-02T10:30:05Z"));
  assert.equal(isBackupFileName(mine, "baska"), false);
  for (const bad of ["../etc/passwd", "nexpress-default-x.nxbackup", `.${mine}.tmp`, "nexpress-default-20261102-103005Z.zip"]) assert.equal(isBackupFileName(bad, "default"), false, bad);
});

test("saklama: en yeni N korunur, en az 1; geçersiz sayı varsayılana düşer", () => {
  const names = ["a-20261101-000000Z", "a-20261103-000000Z", "a-20261102-000000Z", "a-20261104-000000Z"].map((x) => `nexpress-${x}.nxbackup`);
  assert.deepEqual(pickBackupsToDelete(names, 2), ["nexpress-a-20261101-000000Z.nxbackup", "nexpress-a-20261102-000000Z.nxbackup"]);
  assert.deepEqual(pickBackupsToDelete(names, 10), []);
  assert.equal(pickBackupsToDelete(names, 0).length, 0, "0 -> varsayılan 7");
  assert.equal(pickBackupsToDelete(names, 1).length, 3, "en az 1 tutulur");
});
