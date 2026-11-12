import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createTempPgDatabase } from "./helpers/pg-temp";

// DB_TEST_PG_URL verilirse aynı testler PostgreSQL'de çalışır (geçici veritabanı kullanın).
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-del-"));
const tempPg = await createTempPgDatabase();
const env = tempPg
  ? { ...process.env, DB_DIALECT: "postgresql", DATABASE_URL: tempPg.url }
  : { ...process.env, DB_DIALECT: "sqlite", SQLITE_URL: `file:${path.join(dbDir, "t.db")}` };
Object.assign(process.env, env);

const tsx = path.resolve(import.meta.dirname, "../../../node_modules/.bin/tsx");
let repoMod: typeof import("../src/repository");

before(async () => {
  execFileSync(tsx, ["src/scripts/migrate.ts"], { cwd: path.resolve(import.meta.dirname, ".."), env, stdio: "pipe" });
  repoMod = await import("../src/repository");
});
after(async () => {
  fs.rmSync(dbDir, { recursive: true, force: true });
  await tempPg?.drop();
});

const repo = (site: string) => new repoMod.ScopedCmsRepository(site, (process.env.DB_DIALECT as "sqlite" | "postgresql") ?? "sqlite");
const d = (id: string) => ({ id, pluginId: "acme-x", webhookId: "h1", event: "content.published", body: "{}" });

test("kuyruk: zamanı gelen bekleyenler listelenir, koşullu sonuç tek kez yazılır", async () => {
  const a = repo("site-a");
  await a.enqueueDelivery(d("d1"));
  const due = await a.dueDeliveries(new Date());
  assert.deepEqual(due.map((x) => [x.id, x.status, x.attempts]), [["d1", "pending", 0]]);
  // yarış: aynı beklenen deneme sayısıyla iki yazım, yalnızca biri geçer
  const [w1, w2] = await Promise.all([a.recordAttempt("d1", 0, { ok: false, status: 503, error: "HTTP 503", nextAttemptAt: new Date(Date.now() + 60_000) }), a.recordAttempt("d1", 0, { ok: false, status: 503, error: "HTTP 503", nextAttemptAt: new Date(Date.now() + 60_000) })]);
  assert.equal([w1, w2].filter(Boolean).length, 1);
  assert.equal((await a.dueDeliveries(new Date())).length, 0, "bekleme süresi dolmadan listelenmez");
  assert.equal((await a.dueDeliveries(new Date(Date.now() + 120_000))).length, 1, "süre dolunca listelenir");
});

test("kuyruk: başarı kapatır, vazgeçme failed olur, yeniden kuyruğa alma yalnızca failed için", async () => {
  const a = repo("site-a");
  await a.enqueueDelivery(d("d2"));
  assert.equal(await a.recordAttempt("d2", 0, { ok: true, status: 200 }), true);
  assert.equal((await a.listDeliveries("acme-x")).find((x) => x.id === "d2")?.status, "delivered");
  assert.equal(await a.recordAttempt("d2", 1, { ok: true, status: 200 }), false, "tamamlanmış kayıt tekrar yazılmaz");
  await a.enqueueDelivery(d("d3"));
  assert.equal(await a.recordAttempt("d3", 0, { ok: false, status: 404, error: "HTTP 404", giveUp: true }), true);
  assert.equal((await a.listDeliveries("acme-x")).find((x) => x.id === "d3")?.status, "failed");
  assert.equal(await a.requeueDelivery("d2"), false, "teslim edilen yeniden kuyruğa alınmaz");
  assert.equal(await a.requeueDelivery("d3"), true);
  assert.equal((await a.dueDeliveries(new Date())).some((x) => x.id === "d3"), true);
});

test("kuyruk: kiracı ayrımı ve eski tamamlanmış kayıtların temizliği (bekleyen korunur)", async () => {
  const b = repo("site-b");
  await b.enqueueDelivery(d("d9"));
  assert.equal((await repo("site-a").listDeliveries("acme-x")).some((x) => x.id === "d9"), false);
  assert.equal(await repo("site-a").recordAttempt("d9", 0, { ok: true, status: 200 }), false, "başka kiracının kaydı yazılamaz");
  await repo("site-a").purgeOldDeliveries(0);
  const left = await repo("site-a").listDeliveries("acme-x");
  assert.equal(left.some((x) => x.status === "delivered" || x.status === "failed"), false, "tamamlananlar silindi");
  assert.equal((await repo("site-b").listDeliveries("acme-x")).length, 1, "diğer kiracı etkilenmez");
});
