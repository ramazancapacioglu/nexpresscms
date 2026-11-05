import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createTempPgDatabase } from "./helpers/pg-temp";

const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-reset-"));
const tempPg = await createTempPgDatabase();
const env = tempPg
  ? { ...process.env, DB_DIALECT: "postgresql", DATABASE_URL: tempPg.url }
  : { ...process.env, DB_DIALECT: "sqlite", SQLITE_URL: `file:${path.join(dbDir, "t.db")}` };
Object.assign(process.env, env);

const pkg = path.resolve(import.meta.dirname, "..");
const tsx = path.resolve(pkg, "../../node_modules/.bin/tsx");
let repo: ReturnType<typeof import("../src/repository").getScopedRepository>;
let reset: typeof import("../src/site-reset-repository");

before(async () => {
  for (const s of ["migrate.ts", "seed.ts"]) execFileSync(tsx, [`src/scripts/${s}`], { cwd: pkg, env, stdio: "pipe" });
  repo = (await import("../src/repository")).getScopedRepository("default");
  reset = await import("../src/site-reset-repository");
});

after(async () => {
  fs.rmSync(dbDir, { recursive: true, force: true });
  await tempPg?.drop();
});

test("sayfa sıfırlama yazıyı ve şablonu bırakır", async () => {
  const pages = (await repo.listContents({ locale: "tr", type: "page" })).length;
  const posts = (await repo.listContents({ locale: "tr", type: "post" })).length;
  assert.ok(pages > 0);
  await repo.saveContent({
    type: "template",
    locale: "tr",
    slug: "sablon-kalir",
    title: "Şablon",
    blocks: [{ id: "p1", type: "paragraph", props: { text: "Şablon metni burada durur." } }],
  });
  const templates = (await repo.listContents({ locale: "tr", type: "template" })).length;
  const wiped = await reset.getSiteResetRepository("default").wipeContent("pages");
  assert.equal(wiped.contents, pages);
  assert.equal(wiped.mediaIds.length, 0);
  assert.equal((await repo.listContents({ locale: "tr", type: "page" })).length, 0);
  assert.equal((await repo.listContents({ locale: "tr", type: "post" })).length, posts);
  assert.equal((await repo.listContents({ locale: "tr", type: "template" })).length, templates);
});

test("medya sıfırlama içeriği bırakır", async () => {
  const posts = (await repo.listContents({ locale: "tr", type: "post" })).length;
  await repo.saveMediaAsset({ id: "med_resettest01", filename: "deneme.webp", url: "/media/med_resettest01", altText: "deneme" });
  const wiped = await reset.getSiteResetRepository("default").wipeContent("media");
  assert.ok(wiped.mediaIds.includes("med_resettest01"));
  assert.equal(wiped.contents, 0);
  assert.equal((await repo.listMediaAssets()).length, 0);
  assert.equal((await repo.listContents({ locale: "tr", type: "post" })).length, posts);
});

test("tasarım sıfırlama sayfa ve yazıya dokunmaz", async () => {
  const posts = (await repo.listContents({ locale: "tr", type: "post" })).length;
  const wiped = await reset.getSiteResetRepository("default").wipeDesign();
  assert.ok(wiped.templates >= 1);
  assert.equal((await repo.listContents({ locale: "tr", type: "template" })).length, 0);
  assert.equal((await repo.listContents({ locale: "tr", type: "post" })).length, posts);
  assert.equal((await repo.getSite())?.activeThemeId, "corporate-aurora");
});
