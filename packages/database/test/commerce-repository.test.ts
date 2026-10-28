import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createTempPgDatabase } from "./helpers/pg-temp";

/**
 * Ticaret ve pazar yeri depoları: motorlar arası tek kod yolu ve KİRACI YALITIMI.
 * DB_TEST_PG_URL (sunucu adresi) ile PostgreSQL'e karşı da koşar.
 */
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-com-"));
const tempPg = await createTempPgDatabase();
const env = tempPg
  ? { ...process.env, DB_DIALECT: "postgresql", DATABASE_URL: tempPg.url }
  : { ...process.env, DB_DIALECT: "sqlite", SQLITE_URL: `file:${path.join(dbDir, "t.db")}` };
Object.assign(process.env, env);
process.env.AUTH_SECRET = "test-secret-for-marketplace-encryption-0123456789";

const pkg = path.resolve(import.meta.dirname, "..");
const tsx = path.resolve(pkg, "node_modules/.bin/tsx");
let commerce: typeof import("../src/commerce-repository");
let ops: typeof import("../src/commerce-ops-repository");
let market: typeof import("../src/marketplace-repository");

before(async () => {
  execFileSync(tsx, ["src/scripts/migrate.ts"], { cwd: pkg, env, stdio: "pipe" });
  commerce = await import("../src/commerce-repository");
  ops = await import("../src/commerce-ops-repository");
  market = await import("../src/marketplace-repository");
});
after(async () => {
  fs.rmSync(dbDir, { recursive: true, force: true });
  await tempPg?.drop();
});

const A = "tenant-a";
const B = "tenant-b";
const product = (over: Record<string, unknown> = {}) => ({ sku: "SKU-1", slug: "urun-1", name: "Ürün 1", priceCents: 12900, status: "published" as const, stockQuantity: 5, ...over });

test("ürün: kaydet, oku, güncelle (createdAt korunur), listele ve sil", async () => {
  const repo = commerce.getCommerceRepository(A);
  const p = await repo.saveProduct(product());
  assert.equal(p.priceCents, 12900);
  assert.equal((await repo.getProductBySlug("urun-1"))!.id, p.id);
  const updated = await repo.saveProduct(product({ id: p.id, name: "Ürün 1 (yeni)", priceCents: 9900 }));
  assert.equal(updated.name, "Ürün 1 (yeni)");
  assert.equal(updated.priceCents, 9900);
  assert.equal(+updated.createdAt, +p.createdAt, "oluşturma zamanı güncellemede değişmez");
  assert.equal((await repo.listProducts({ status: "published" })).length, 1);
  assert.equal((await repo.getProductsByIds([p.id, "yok"])).length, 1);
  await repo.deleteProduct(p.id);
  assert.equal(await repo.getProductById(p.id), null);
});

test("kiracı yalıtımı: başka kiracının kimliğiyle yazma satırı ELE GEÇİRMEZ", async () => {
  const a = commerce.getCommerceRepository(A);
  const b = commerce.getCommerceRepository(B);
  const mine = await a.saveProduct(product({ sku: "A-1", slug: "a-urun", name: "A'nın ürünü", priceCents: 1000 }));

  // B, A'nın ürün kimliğini kullanarak yazmayı dener: reddedilmeli, A'nın satırı değişmemeli
  await assert.rejects(b.saveProduct(product({ id: mine.id, sku: "B-1", slug: "b-urun", name: "ELE GEÇİRİLDİ", priceCents: 1 })), /kaydedilemedi/);
  const still = (await a.getProductById(mine.id))!;
  assert.equal(still.name, "A'nın ürünü");
  assert.equal(still.priceCents, 1000);
  assert.equal(await b.getProductById(mine.id), null, "B bu satırı göremez");
  assert.equal((await b.listProducts({})).length, 0);

  // Aynısı operasyon depoları için (kategori / grup / kupon / kargo)
  const oa = ops.getCommerceOpsRepository(A);
  const ob = ops.getCommerceOpsRepository(B);
  const catId = await oa.saveCategory({ name: "Elektronik", slug: "elektronik" });
  await ob.saveCategory({ id: catId, name: "ELE GEÇİRİLDİ", slug: "hijack" });
  assert.equal((await oa.listCategories()).find((c) => c.id === catId)!.name, "Elektronik");
  assert.equal((await ob.listCategories()).length, 0);
  const groupId = await oa.saveGroup({ name: "VIP" });
  await ob.saveGroup({ id: groupId, name: "ELE GEÇİRİLDİ" });
  assert.equal((await oa.listGroups()).find((g) => g.id === groupId)!.name, "VIP");
  const shipId = await oa.saveShipping({ name: "Standart", carrier: "X", flatRateCents: 5000, freeThresholdCents: 50000, enabled: true });
  await ob.saveShipping({ id: shipId, name: "ELE GEÇİRİLDİ", carrier: "Y", flatRateCents: 0, freeThresholdCents: 0, enabled: false });
  assert.equal((await oa.listShipping()).find((s) => s.id === shipId)!.name, "Standart");
});

test("kategori/öznitelik: oluştur, güncelle, öznitelik değerleri yeniden yazılır", async () => {
  const o = ops.getCommerceOpsRepository(A);
  const attrId = await o.saveAttribute({ name: "Renk", slug: "renk", labels: ["Kırmızı", "", "Mavi"] });
  let attrs = await o.listAttributes();
  assert.deepEqual(attrs.find((a) => a.id === attrId)!.values.map((v) => v.label), ["Kırmızı", "Mavi"], "boş etiket atlanır, sıra korunur");
  await o.saveAttribute({ id: attrId, name: "Renk", slug: "renk", labels: ["Yeşil"] });
  attrs = await o.listAttributes();
  assert.deepEqual(attrs.find((a) => a.id === attrId)!.values.map((v) => v.label), ["Yeşil"]);
  assert.equal(attrs.filter((a) => a.id === attrId).length, 1, "aynı kimlik çoğalmaz");
  const parent = await o.saveCategory({ name: "Üst", slug: "ust" });
  const child = await o.saveCategory({ name: "Alt", slug: "alt", parentId: parent, sortOrder: 3 });
  assert.equal((await o.listCategories()).find((c) => c.id === child)!.parentId, parent);
  await o.deleteCategory(child);
  assert.ok(!(await o.listCategories()).some((c) => c.id === child));
});

test("müşteri/sadakat/kupon: kaydet, güncelle (puan korunur), kupon teklifi ve tüketimi", async () => {
  const o = ops.getCommerceOpsRepository(A);
  const cid = await o.saveCustomer({ source: "site", name: "Ali", email: "ali@example.com" });
  await o.addLoyalty(cid, 120, "ilk alışveriş");
  await o.saveCustomer({ id: cid, source: "site", name: "Ali Veli", email: "ali@example.com" });
  const customer = (await o.getCustomer(cid))!;
  assert.equal(customer.name, "Ali Veli");
  assert.equal(customer.loyaltyPoints, 120, "güncelleme sadakat puanını sıfırlamaz");
  assert.equal((await o.listLoyalty(cid)).length, 1);
  assert.equal((await o.listCustomers("site")).length, 1);

  const couponId = await o.saveCoupon({ campaignId: null, code: " yaz10 ", discountType: "percent", value: 10, customerId: null, groupId: null, usageLimit: 1, active: true });
  assert.ok(couponId);
  const quote = await o.quoteCoupon("YAZ10", 20000, cid);
  assert.equal(quote.coupon?.code, "YAZ10");
  assert.equal(quote.discountCents, 2000);
  await o.consumeCoupon("YAZ10");
  const exhausted = await o.quoteCoupon("YAZ10", 20000, cid);
  assert.equal(exhausted.discountCents, 0, "kullanım limiti dolunca indirim yok");
  assert.match(exhausted.message ?? "", /limit/i);
  assert.equal((await o.quoteCoupon("YOK", 100)).coupon, null);
});

test("kampanya ve kargo: kaydet ve güncelle", async () => {
  const o = ops.getCommerceOpsRepository(A);
  const id = await o.saveCampaign({ name: "Bahar", discountType: "percent", value: 15, audience: "all", groupId: null, customerId: null, active: true, startsAt: null, endsAt: null });
  await o.saveCampaign({ id, name: "Bahar (yeni)", discountType: "percent", value: 20, audience: "all", groupId: null, customerId: null, active: false, startsAt: null, endsAt: null });
  const c = (await o.listCampaigns()).filter((x) => x.id === id);
  assert.equal(c.length, 1);
  assert.equal(c[0]!.value, 20);
  assert.equal(c[0]!.active, false);
});

test("pazar yeri kanalı: sırlar şifreli saklanır, boş gönderim önceki sırrı korur, kiracı ayrıdır", async () => {
  const m = market.getMarketplaceRepository(A);
  const ch = await m.saveChannel({ driverId: "trendyol", label: "TY", enabled: true, environment: "sandbox", credentials: { apiKey: "k1", apiSecret: "s1" } });
  assert.equal(ch.credentials.apiSecret, "s1", "okurken çözülür");
  const again = await m.saveChannel({ id: ch.id, driverId: "trendyol", label: "TY 2", enabled: true, environment: "production", credentials: { apiKey: "k2", apiSecret: "" } });
  assert.equal(again.label, "TY 2");
  assert.equal(again.environment, "production");
  assert.equal(again.credentials.apiKey, "k2");
  assert.equal(again.credentials.apiSecret, "s1", "boş alan önceki sırrı korur");

  // Kiracı B aynı kanal kimliğiyle yazmayı dener
  const b = market.getMarketplaceRepository(B);
  await assert.rejects(b.saveChannel({ id: ch.id, driverId: "n11", label: "ELE GEÇİRİLDİ", enabled: false, environment: "sandbox", credentials: { appkey: "x" } }), /kaydedilemedi/);
  assert.equal((await m.getChannel(ch.id))!.label, "TY 2");
  assert.equal((await b.listChannels()).length, 0);

  await m.markConnection(ch.id, "error", "401");
  const marked = (await m.getChannel(ch.id))!;
  assert.equal(marked.connectionStatus, "error");
  assert.equal(marked.lastError, "401");
  await m.addJob(ch.id, "test", "ok", "tamam");
  assert.equal((await m.listJobs(ch.id)).length, 1);
  await m.deleteChannel(ch.id);
  assert.equal(await m.getChannel(ch.id), null);
});
