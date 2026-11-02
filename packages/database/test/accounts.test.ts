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

const tsx = path.resolve(import.meta.dirname, "../../../node_modules/.bin/tsx");
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

test("panel arayüz dili: varsayılan boş, kaydedilir, başka kiracıdaki kullanıcıyı etkilemez", async () => {
  const a = users.getUserRepository("site-ui-a");
  const b = users.getUserRepository("site-ui-b");
  const u = await a.create({ email: "ui@example.com", passwordHash: "h", role: "editor" });
  assert.equal(u.uiLocale, null);
  await a.setUiLocale(u.id, "en");
  assert.equal((await a.findById(u.id))!.uiLocale, "en");
  await b.setUiLocale(u.id, "de"); // başka kiracı kapsamı: satır güncellenmez
  assert.equal((await a.findById(u.id))!.uiLocale, "en");
  await a.setUiLocale(u.id, null);
  assert.equal((await a.findById(u.id))!.uiLocale, null);
});

test("iki adımlı doğrulama: kurulum bekler, açılır, adım yalnızca ilerler, kod tek kullanımlık, kapanınca silinir, kiracıya kapalı", async () => {
  const a = users.getUserRepository("site-2fa-a");
  const b = users.getUserRepository("site-2fa-b");
  const u = await a.create({ email: "iki@example.com", passwordHash: "h", role: "admin" });
  assert.equal(toSummaryFlag(u), false);

  await a.setTotpPending(u.id, "enc:gizli");
  let cur = (await a.findById(u.id))!;
  assert.equal(cur.totpSecret, "enc:gizli");
  assert.equal(cur.totpEnabledAt, null, "kurulum bitmeden giriş ikinci adım istemez");

  await a.enableTotp(u.id, 100, ["h1", "h2"]);
  cur = (await a.findById(u.id))!;
  assert.equal(toSummaryFlag(cur), true);
  assert.equal(cur.totpLastStep, 100);

  assert.equal(await a.advanceTotpStep(u.id, 100), false, "aynı adım");
  assert.equal(await a.advanceTotpStep(u.id, 99), false, "eski adım");
  assert.equal(await a.advanceTotpStep(u.id, 101), true);
  assert.equal(await a.advanceTotpStep(u.id, 101), false, "yeniden kullanım");
  assert.equal(await b.advanceTotpStep(u.id, 500), false, "başka kiracı");

  const json = cur.recoveryCodes;
  assert.equal(await a.replaceRecoveryCodes(u.id, json, ["h2"]), true);
  assert.equal(await a.replaceRecoveryCodes(u.id, json, ["h1"]), false, "eski listeye dayalı ikinci kullanım reddedilir");
  assert.deepEqual(JSON.parse((await a.findById(u.id))!.recoveryCodes!), ["h2"]);

  const sv = cur.sessionVersion;
  await a.disableTotp(u.id);
  cur = (await a.findById(u.id))!;
  assert.equal(cur.totpSecret, null);
  assert.equal(cur.recoveryCodes, null);
  assert.equal(toSummaryFlag(cur), false);
  assert.ok(cur.sessionVersion > sv, "oturumlar kapanır");
});

const toSummaryFlag = (u: import("../src/user-repository").UserDto) => users.toSummary(u).twoFactorEnabled;

test("denetim günlüğü: bitiş süzgeci ve eski kayıtları temizleme yalnızca kendi kiracısını etkiler", async () => {
  const a = audit.getAuditRepository("site-purge-a");
  const b = audit.getAuditRepository("site-purge-b");
  const day = 86_400_000;
  const now = Date.now();
  for (const [age, who] of [[100, "eski1"], [60, "eski2"], [10, "yeni"]] as const) {
    await a.record({ action: "x.y", actorEmail: `${who}@example.com`, at: new Date(now - age * day) });
  }
  await b.record({ action: "x.y", actorEmail: "baska@example.com", at: new Date(now - 200 * day) });

  assert.equal(await a.count({ until: new Date(now - 30 * day) }), 2);
  assert.equal(await a.count({ since: new Date(now - 70 * day), until: new Date(now - 30 * day) }), 1);

  assert.equal(await a.purgeOlderThan(new Date(now - 30 * day)), 2);
  assert.deepEqual((await a.list()).map((r) => r.actorEmail), ["yeni@example.com"]);
  assert.equal(await a.purgeOlderThan(new Date(now - 30 * day)), 0, "ikinci çağrı silecek bir şey bulmaz");
  assert.equal(await b.count(), 1, "başka kiracının kaydı korunur");
});

test("parola zamanı: aynı saniyede arka arkaya değişimde bile saniye cinsinden ilerler (tek kullanımlık bağlantılar için)", async () => {
  const a = users.getUserRepository("site-pwd-stamp");
  const u = await a.create({ email: "damga@example.com", passwordHash: "h", role: "editor" });
  const sec = (d: Date | null) => Math.floor((d?.getTime() ?? 0) / 1000);
  let prev = sec((await a.findById(u.id))!.passwordChangedAt);
  for (const h of ["h2", "h3", "h4"]) {
    await a.setPassword(u.id, h);
    const cur = sec((await a.findById(u.id))!.passwordChangedAt);
    assert.ok(cur > prev, "her değişim önceki saniyeyi geçer");
    prev = cur;
  }
});

test("MCP günlüğü: kayıt, özet (araç/ajan/gün), eski kayıtları temizleme ve kiracı yalıtımı", async () => {
  const mcp = await import("../src/mcp-log-repository");
  const a = mcp.getMcpLogRepository("site-mcp-a");
  const b = mcp.getMcpLogRepository("site-mcp-b");
  const now = new Date("2026-11-02T12:00:00Z");
  const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000);
  await a.record({ tool: "nexpress_search_corpus", agent: "ChatGPT-User/1.0", ok: true, durationMs: 40, at: at(0) });
  await a.record({ tool: "nexpress_search_corpus", agent: "ChatGPT-User/1.0", ok: false, durationMs: 80, at: at(1) });
  await a.record({ tool: "tools/list", agent: "", ok: true, durationMs: 3, at: at(2) });
  await a.record({ tool: "eski", agent: "x", ok: true, durationMs: 1, at: at(120) });
  await b.record({ tool: "baska", ok: true, durationMs: 1, at: at(0) });

  const s = await a.summary(30, now);
  assert.equal(s.total, 3, "30 günden eski ve başka kiracı sayılmaz");
  assert.equal(s.errors, 1);
  assert.equal(s.avgMs, 41);
  assert.deepEqual(s.byTool[0], { tool: "nexpress_search_corpus", count: 2, errors: 1 });
  assert.deepEqual(s.byAgent.map((x) => x.agent), ["ChatGPT-User/1.0", "(bilinmiyor)"]);
  assert.equal(s.byDay.length, 30);
  assert.equal(s.byDay.at(-1)!.day, "2026-11-02");
  assert.equal(s.byDay.at(-1)!.count, 1);

  await a.prune(now);
  assert.equal((await a.summary(365, now)).total, 3, "90 günden eski kayıt silindi");
  assert.equal((await b.summary(30, now)).total, 1);
});
