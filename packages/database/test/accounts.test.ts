import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createTempPgDatabase } from "./helpers/pg-temp";

// DB_TEST_PG_URL verilirse aynı testler PostgreSQL'de çalışır (geçici veritabanı kullanın).
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-acc-"));
const tempPg = await createTempPgDatabase();
const env = tempPg
  ? { ...process.env, DB_DIALECT: "postgresql", DATABASE_URL: tempPg.url }
  : { ...process.env, DB_DIALECT: "sqlite", SQLITE_URL: `file:${path.join(dbDir, "t.db")}` };
Object.assign(process.env, env);

const tsx = path.resolve(import.meta.dirname, "../node_modules/.bin/tsx");
let users: typeof import("../src/user-repository");
let audit: typeof import("../src/audit-repository");

before(async () => {
  execFileSync(tsx, ["src/scripts/migrate.ts"], { cwd: path.resolve(import.meta.dirname, ".."), env, stdio: "pipe" });
  users = await import("../src/user-repository");
  audit = await import("../src/audit-repository");
});
after(async () => {
  fs.rmSync(dbDir, { recursive: true, force: true });
  await tempPg?.drop();
});

const siteA = "site-a";
const siteB = "site-b";

test("kullanıcı oluşturma: e-posta küçük harfe iner, varsayılanlar doğru, kiracılar ayrıdır", async () => {
  const a = users.getUserRepository(siteA);
  const created = await a.create({ email: "Ayse@Example.COM", name: " Ayşe ", passwordHash: "h", role: "admin" });
  assert.equal(created.email, "ayse@example.com");
  assert.equal(created.name, "Ayşe");
  assert.equal(created.status, "active");
  assert.equal(created.sessionVersion, 0);
  assert.equal((await a.findByEmail("AYSE@example.com"))?.id, created.id);
  assert.equal(await users.getUserRepository(siteB).findByEmail("ayse@example.com"), null, "başka kiracıda görünmez");
  assert.equal(await users.getUserRepository(siteB).findById(created.id), null);
  await users.getUserRepository(siteB).create({ email: "ayse@example.com", passwordHash: "x", role: "editor" }); // aynı e-posta farklı kiracıda serbest
  assert.equal(await a.count(), 1);
  await assert.rejects(a.create({ email: "ayse@example.com", passwordHash: "h", role: "editor" }), undefined, "aynı kiracıda tekrar reddedilir");
});

test("oturum sürümü: rol, durum ve parola değişimi sürümü artırır; ardışık iptaller kaybolmaz", async () => {
  const repo = users.getUserRepository(siteA);
  const u = await repo.create({ email: "sv@example.com", passwordHash: "h1", role: "editor" });
  assert.equal((await repo.findById(u.id))!.sessionVersion, 0);
  await repo.setRole(u.id, "admin");
  assert.equal((await repo.findById(u.id))!.sessionVersion, 1);
  assert.equal((await repo.findById(u.id))!.role, "admin");
  await repo.setStatus(u.id, "disabled");
  const afterStatus = (await repo.findById(u.id))!;
  assert.equal(afterStatus.status, "disabled");
  assert.equal(afterStatus.sessionVersion, 2);
  const v = await repo.setPassword(u.id, "h2");
  assert.equal(v, 3);
  assert.equal((await repo.findById(u.id))!.passwordHash, "h2");
  await Promise.all([repo.revokeSessions(u.id), repo.revokeSessions(u.id), repo.revokeSessions(u.id)]);
  assert.equal((await repo.findById(u.id))!.sessionVersion, 6, "eşzamanlı artışlar atomiktir");
});

test("kullanıcı özeti parola özetini içermez; liste kiracıya özgü ve oluşturma sırasıdır", async () => {
  const list = await users.getUserRepository(siteA).list();
  assert.ok(list.length >= 2);
  assert.ok(list.every((u) => u.siteId === siteA));
  const summary = users.toSummary(list[0]!) as unknown as Record<string, unknown>;
  assert.equal("passwordHash" in summary, false);
  assert.deepEqual(list.map((u) => +u.createdAt), [...list.map((u) => +u.createdAt)].sort((x, y) => x - y));
});

test("denetim günlüğü: kayıt, süzme, ön ek joker karakter kaçışı, sayfalama, kiracı yalıtımı, ayrıntı kırpma", async () => {
  const a = audit.getAuditRepository(siteA);
  const t0 = new Date("2026-10-28T10:00:00Z");
  await a.record({ actorId: "u1", actorEmail: "x@example.com", action: "cms.saveContent", target: "c1", at: new Date(+t0 + 1000) });
  await a.record({ actorId: "u1", actorEmail: "x@example.com", action: "cms.deleteTaxonomy", at: new Date(+t0 + 2000) });
  await a.record({ actorEmail: "", action: "auth.login_failed", detail: "y@example.com", at: new Date(+t0 + 3000) });
  await a.record({ actorId: "u2", actorEmail: "z@example.com", action: "auth_x.weird", at: new Date(+t0 + 4000) });
  await a.record({ actorId: "u1", actorEmail: "x@example.com", action: "user.created", detail: "a".repeat(900), at: new Date(+t0 + 5000) });
  await audit.getAuditRepository(siteB).record({ action: "cms.saveContent", actorEmail: "other@example.com" });

  assert.equal(await a.count(), 5);
  const all = await a.list();
  assert.equal(all[0]!.action, "user.created", "yeniden eskiye");
  assert.equal(all[0]!.detail.length, 500, "ayrıntı 500 karakterle sınırlı");
  assert.deepEqual((await a.list({ actionPrefix: "cms." })).map((r) => r.action).sort(), ["cms.deleteTaxonomy", "cms.saveContent"]);
  assert.equal((await a.list({ actionPrefix: "auth." })).length, 1, "'_' joker olarak davranmaz: auth_x.weird eşleşmez");
  assert.equal((await a.list({ actorEmail: "X@Example.com" })).length, 3, "e-posta büyük/küçük harfe duyarsız");
  assert.equal(await a.count({ since: new Date(+t0 + 2500) }), 3);
  assert.equal((await a.list({ limit: 2, offset: 1 })).map((r) => r.action).join(), "auth_x.weird,auth.login_failed");
  assert.equal(await audit.getAuditRepository(siteB).count(), 1, "kiracılar ayrı");
  assert.equal(await audit.getAuditRepository("yok").count(), 0);
});
