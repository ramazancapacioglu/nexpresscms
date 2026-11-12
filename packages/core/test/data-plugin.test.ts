import assert from "node:assert/strict";
import test from "node:test";
import { describePermissions, parseTrustedKeys, sanitizeManifest, sanitizePluginContentTypes, sanitizeWebhooks, signPackageChecksum, signWebhook, validateWebhookUrl, verifyPackageSignature } from "../src/index";

test("manifest: geçerli kabul; kimlik, sürüm, anahtar ve adres sıkı denetlenir", () => {
  const ok = sanitizeManifest({ id: "acme-referanslar", name: " Acme  Referans ", version: "1.2.3", vendor: "Acme", description: "x".repeat(500) });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.deepEqual([ok.value.name, ok.value.description.length], ["Acme Referans", 300]);
  for (const bad of [
    { id: "Acme", name: "x", version: "1.0.0", vendor: "v" },
    { id: "ab", name: "x", version: "1.0.0", vendor: "v" },
    { id: "a--b", name: "x", version: "1.0.0", vendor: "v" },
    { id: "../x", name: "x", version: "1.0.0", vendor: "v" },
    { id: "acme-x", name: "", version: "1.0.0", vendor: "v" },
    { id: "acme-x", name: "x", version: "v1", vendor: "v" },
    { id: "acme-x", name: "x", version: "1.0.0", vendor: "" },
    { id: "acme-x", name: "x", version: "1.0.0", vendor: "v", homepage: "http://x.test" },
    { id: "acme-x", name: "x", version: "1.0.0", vendor: "v", publisherKey: "kısa" },
  ]) assert.equal(sanitizeManifest(bad).ok, false, JSON.stringify(bad));
  assert.equal(sanitizeManifest(null).ok, false);
});

test("webhook adresi: yalnızca https alan adı; IP, yerel ad, kullanıcı bilgisi reddedilir", () => {
  assert.equal(validateWebhookUrl("https://hooks.acme.com/in/abc?x=1#frag").ok, true);
  for (const bad of ["http://hooks.acme.com", "https://127.0.0.1/x", "https://[::1]/x", "https://169.254.169.254/latest", "https://localhost/x", "https://intranet/x", "https://printer.local/x", "https://u:p@acme.com/x", "https://hooks.acme.com:8443/x", "ftp://acme.com", "", "yok", "https://" + "a".repeat(300) + ".com"]) assert.equal(validateWebhookUrl(bad).ok, false, bad);
});

test("webhooks.json: olay beyaz listesi, tekil kimlik, en çok 5", () => {
  const good = { id: "yayin", event: "content.published", url: "https://hooks.acme.com/a" };
  assert.equal(sanitizeWebhooks([good]).ok, true);
  assert.equal(sanitizeWebhooks(undefined).ok, true);
  assert.equal(sanitizeWebhooks([{ ...good, event: "user.deleted" }]).ok, false);
  assert.equal(sanitizeWebhooks([good, good]).ok, false, "aynı kimlik");
  assert.equal(sanitizeWebhooks(Array.from({ length: 6 }, (_, i) => ({ ...good, id: `h${i}` }))).ok, false);
  assert.equal(sanitizeWebhooks("x").ok, false);
});

test("içerik türleri: geçersiz tür/alan sessizce atılmaz, paket reddedilir", () => {
  const ok = { id: "referans", label: "Referans", labelPlural: "Referanslar", fields: [{ key: "musteri", label: "Müşteri", kind: "text" }] };
  assert.equal(sanitizePluginContentTypes([ok]).ok, true);
  assert.equal(sanitizePluginContentTypes([{ ...ok, id: "page" }]).ok, false, "yerleşik ad");
  assert.equal(sanitizePluginContentTypes([{ ...ok, fields: [{ key: "x", label: "X", kind: "select" }] }]).ok, false, "boş seçenek listesi");
  assert.equal(sanitizePluginContentTypes([{ ...ok, archive: true, archiveSlug: "magaza", labelPlural: "Mağaza" }]).ok, false, "sistem rotası arşivi");
  assert.equal(sanitizePluginContentTypes([ok, ok]).ok, false, "çakışan kimlik");
});

test("imza: yok → unsigned; geçerli+güvenilmeyen; geçerli+güvenilen; bozuk/yanlış anahtar → invalid", async () => {
  const checksum = "a".repeat(64);
  const { publicKey, signature } = await signPackageChecksum(checksum);
  assert.equal(await verifyPackageSignature({ checksum, signature: undefined, publisherKey: undefined, trustedKeys: [] }), "unsigned");
  assert.equal(await verifyPackageSignature({ checksum, signature, publisherKey: publicKey, trustedKeys: [] }), "signed-untrusted");
  assert.equal(await verifyPackageSignature({ checksum, signature, publisherKey: publicKey, trustedKeys: [publicKey] }), "verified");
  assert.equal(await verifyPackageSignature({ checksum: "b".repeat(64), signature, publisherKey: publicKey, trustedKeys: [publicKey] }), "invalid", "içerik değişti");
  const other = await signPackageChecksum(checksum);
  assert.equal(await verifyPackageSignature({ checksum, signature, publisherKey: other.publicKey, trustedKeys: [other.publicKey] }), "invalid", "başka anahtar");
  assert.equal(await verifyPackageSignature({ checksum, signature: "bozuk", publisherKey: publicKey, trustedKeys: [publicKey] }), "invalid");
  assert.equal(await verifyPackageSignature({ checksum, signature, publisherKey: undefined, trustedKeys: [] }), "invalid", "imza var anahtar yok");
});

test("güvenilen anahtarlar: yalnızca geçerli biçim", async () => {
  const { publicKey } = await signPackageChecksum("x");
  assert.deepEqual(parseTrustedKeys(` ${publicKey}, kötü ,${publicKey.slice(1)}\n`), [publicKey]);
  assert.deepEqual(parseTrustedKeys(undefined), []);
});

test("webhook imzası: kararlı ve gövde/zaman/sır değişince değişir", async () => {
  const a = await signWebhook("sir", "1700000000", '{"x":1}');
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, await signWebhook("sir", "1700000000", '{"x":1}'));
  for (const [s, t, b] of [["sir2", "1700000000", '{"x":1}'], ["sir", "1700000001", '{"x":1}'], ["sir", "1700000000", '{"x":2}']] as const) assert.notEqual(a, await signWebhook(s, t, b));
});

test("izin özeti: paketin yapacağı her şey listelenir, webhook alan adları görünür", () => {
  const lines = describePermissions({
    contentTypes: [{ id: "referans", label: "Referans", labelPlural: "Referanslar", schemaType: "WebPage", inSitemap: true, fields: [{ key: "a", label: "A", kind: "text" }] }],
    pages: [{ slug: "referanslar-tanitim", title: "Referanslar" }],
    webhooks: [{ id: "h1", event: "content.published", url: "https://hooks.acme.com/in" }, { id: "h2", event: "content.updated", url: "https://other.acme.io/x" }],
  });
  assert.deepEqual(lines.map((l) => l.id), ["content-types", "pages", "webhooks"]);
  assert.match(lines[2]!.label, /hooks\.acme\.com, other\.acme\.io/);
  assert.deepEqual(describePermissions({ contentTypes: [], pages: [], webhooks: [] }), []);
});
