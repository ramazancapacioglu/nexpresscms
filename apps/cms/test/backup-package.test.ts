import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { strToU8, zipSync } from "fflate";
import { BACKUP_LIMITS, parseBackup } from "../src/lib/backup-package";

const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4, 5, 6, 7, 8]);

function pack(opts: { rows?: unknown; version?: number; format?: string; tamper?: boolean; extra?: Record<string, Uint8Array>; media?: Record<string, Uint8Array> } = {}): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  files["data/redirects.json"] = strToU8(JSON.stringify(opts.rows ?? [{ id: "r1", fromPath: "/a", toPath: "/b" }]));
  for (const [id, buf] of Object.entries(opts.media ?? {})) files[`media/${id}/original`] = buf;
  Object.assign(files, opts.extra ?? {});
  const hashes = Object.fromEntries(Object.entries(files).map(([p, b]) => [p, sha(b)]));
  if (opts.tamper) hashes["data/redirects.json"] = "0".repeat(64);
  const manifest = { format: opts.format ?? "nexpress-backup", version: opts.version ?? 1, createdAt: new Date(0).toISOString(), siteId: "default", tables: { redirects: 1 }, hasSite: false, media: { files: 0, bytes: 0, skipped: 0 }, personal: false, files: hashes };
  return zipSync({ "manifest.json": strToU8(JSON.stringify(manifest)), ...files });
}

test("geçerli paket ayrıştırılır", () => {
  const r = parseBackup(pack({ media: { med_abc123: PNG } }));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.data.tables.redirects?.length, 1);
  assert.equal(r.media.size, 1);
});

test("boş, zip olmayan ve manifest'siz dosyalar reddedilir", () => {
  assert.equal(parseBackup(new Uint8Array()).ok, false);
  assert.equal(parseBackup(strToU8("zip değil")).ok, false);
  const noManifest = zipSync({ "data/redirects.json": strToU8("[]") });
  const r = parseBackup(noManifest);
  assert.equal(r.ok, false);
});

test("yanlış biçim, daha yeni sürüm ve bozuk özet reddedilir", () => {
  assert.equal(parseBackup(pack({ format: "baska" })).ok, false);
  const newer = parseBackup(pack({ version: 99 }));
  assert.equal(newer.ok, false);
  const bad = parseBackup(pack({ tamper: true }));
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.match(bad.errors.join(" "), /Bozuk dosya/);
});

test("güvenli olmayan dosya adları (yol aşma, beklenmeyen) reddedilir", () => {
  for (const name of ["../evil.json", "data/../../x.json", "scripts/run.sh", "media/a/b/original"]) {
    const r = parseBackup(pack({ extra: { [name]: strToU8("x") } }));
    assert.equal(r.ok, false, name);
  }
});

test("satır şekli: kimliksiz satır reddedilir; bilinmeyen tablo ve görsel olmayan medya uyarıyla atlanır", () => {
  assert.equal(parseBackup(pack({ rows: [{ fromPath: "/a" }] })).ok, false);
  assert.equal(parseBackup(pack({ rows: "nesne" })).ok, false);
  const r = parseBackup(pack({ extra: { "data/bilinmeyenTablo.json": strToU8("[]") }, media: { med_x1: strToU8("görsel değil"), med_y2: PNG } }));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.media.size, 1);
  assert.ok(r.warnings.some((w) => w.includes("Bilinmeyen tablo")));
  assert.ok(r.warnings.some((w) => w.includes("Görsel olmayan")));
});

test("sınırlar tanımlı ve makul", () => {
  assert.ok(BACKUP_LIMITS.zipBytes < BACKUP_LIMITS.totalBytes);
  assert.ok(BACKUP_LIMITS.mediaFile <= BACKUP_LIMITS.mediaBytes);
});
