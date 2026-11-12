import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createTempPgDatabase } from "./helpers/pg-temp";

// DB_TEST_PG_URL verilirse aynı testler PostgreSQL'de çalışır (geçici veritabanı kullanın).
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-mem-"));
const tempPg = await createTempPgDatabase();
const env = tempPg
  ? { ...process.env, DB_DIALECT: "postgresql", DATABASE_URL: tempPg.url }
  : { ...process.env, DB_DIALECT: "sqlite", SQLITE_URL: `file:${path.join(dbDir, "t.db")}` };
Object.assign(process.env, env);

const tsx = path.resolve(import.meta.dirname, "../../../node_modules/.bin/tsx");
let members: typeof import("../src/member-repository");

before(async () => {
  execFileSync(tsx, ["src/scripts/migrate.ts"], { cwd: path.resolve(import.meta.dirname, ".."), env, stdio: "pipe" });
  members = await import("../src/member-repository");
});
after(async () => {
  fs.rmSync(dbDir, { recursive: true, force: true });
  await tempPg?.drop();
});

const A = "site-a";
const B = "site-b";

test("üye oluşturma: e-posta küçük harfe iner, kiracılar ayrıdır, aynı e-posta farklı kiracıda olabilir", async () => {
  const a = members.getMemberRepository(A);
  const m = await a.create({ id: "mem_aaaaaaaaaaaa", email: " Ayse@Example.COM ", name: " Ayşe ", status: "pending", consent: true });
  assert.equal(m.email, "ayse@example.com");
  assert.equal(m.status, "pending");
  assert.ok(m.consentAt);
  assert.equal((await a.findByEmail("AYSE@example.com"))?.id, "mem_aaaaaaaaaaaa");
  assert.equal(await members.getMemberRepository(B).findByEmail("ayse@example.com"), null, "başka kiracı göremez");
  await members.getMemberRepository(B).create({ id: "mem_bbbbbbbbbbbb", email: "ayse@example.com", status: "active", consent: false });
  await assert.rejects(a.create({ id: "mem_cccccccccccc", email: "ayse@example.com", status: "pending", consent: false }), "aynı kiracıda e-posta tekil");
});

test("bağlantı: tek kullanım, yeni bağlantı eskisini geçersiz kılar, pending → active", async () => {
  const a = members.getMemberRepository(A);
  const seq1 = await a.beginLink("mem_aaaaaaaaaaaa");
  const seq2 = await a.beginLink("mem_aaaaaaaaaaaa");
  assert.equal(seq2, seq1 + 1);
  assert.equal(await a.consumeLink("mem_aaaaaaaaaaaa", seq1), null, "eski bağlantı geçersiz");
  const ok = await a.consumeLink("mem_aaaaaaaaaaaa", seq2);
  assert.equal(ok?.status, "active");
  assert.ok(ok?.emailVerifiedAt && ok?.lastLoginAt);
  assert.equal(await a.consumeLink("mem_aaaaaaaaaaaa", seq2), null, "aynı bağlantı ikinci kez kullanılamaz");
  assert.equal(await members.getMemberRepository(B).consumeLink("mem_aaaaaaaaaaaa", seq2 + 1), null, "başka kiracının üyesi tüketilemez");
});

test("yarış: aynı bağlantıyı eşzamanlı kullanan iki istekten yalnızca biri kazanır", async () => {
  const a = members.getMemberRepository(A);
  await a.create({ id: "mem_dddddddddddd", email: "yaris@example.com", status: "pending", consent: true });
  const seq = await a.beginLink("mem_dddddddddddd");
  const results = await Promise.all([a.consumeLink("mem_dddddddddddd", seq), a.consumeLink("mem_dddddddddddd", seq), a.consumeLink("mem_dddddddddddd", seq)]);
  assert.equal(results.filter(Boolean).length, 1);
});

test("devre dışı üye: bağlantı tüketemez, oturum sürümü artar; silme gerçek silmedir", async () => {
  const a = members.getMemberRepository(A);
  const before = (await a.findById("mem_aaaaaaaaaaaa"))!;
  await a.setStatus("mem_aaaaaaaaaaaa", "disabled");
  const after = (await a.findById("mem_aaaaaaaaaaaa"))!;
  assert.equal(after.status, "disabled");
  assert.equal(after.sessionVersion, before.sessionVersion + 1, "çerezler düşer");
  const seq = await a.beginLink("mem_aaaaaaaaaaaa");
  assert.equal(await a.consumeLink("mem_aaaaaaaaaaaa", seq), null, "devre dışı hesap giriş yapamaz");
  assert.equal(await a.delete("mem_aaaaaaaaaaaa"), true);
  assert.equal(await a.findById("mem_aaaaaaaaaaaa"), null);
  assert.equal(await a.delete("mem_aaaaaaaaaaaa"), false);
  assert.equal((await members.getMemberRepository(B).list()).length, 1, "diğer kiracı etkilenmez");
});
