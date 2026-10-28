import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createLocalProvider, type EmbeddingProvider } from "../src/providers";

const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-rag-"));
// RAG_TEST_PG_URL verilirse aynı paket pgvector üzerinde çalışır (geçici veritabanı kullanın).
const pgUrl = process.env.RAG_TEST_PG_URL;
const env = pgUrl
  ? { ...process.env, DB_DIALECT: "postgresql", DATABASE_URL: pgUrl }
  : { ...process.env, DB_DIALECT: "sqlite", SQLITE_URL: `file:${path.join(dbDir, "t.db")}` };
Object.assign(process.env, env);

const dbPkg = path.resolve(import.meta.dirname, "../../database");
const tsx = path.resolve(import.meta.dirname, "../../../node_modules/.bin/tsx");

let svc: typeof import("../src/service");
let db: typeof import("@nexpress/database");

/** Çağrı sayısını ve gömülen metinleri sayan yerel sağlayıcı */
function counting(): EmbeddingProvider & { calls: number; texts: number } {
  const base = createLocalProvider();
  const p = {
    ...base,
    calls: 0,
    texts: 0,
    async embed(texts: string[]) {
      p.calls++;
      p.texts += texts.length;
      return base.embed(texts);
    },
  };
  return p;
}

before(async () => {
  for (const script of ["migrate.ts", "seed.ts"]) execFileSync(tsx, [`src/scripts/${script}`], { cwd: dbPkg, env, stdio: "pipe" });
  svc = await import("../src/service");
  db = await import("@nexpress/database");
});
after(() => fs.rmSync(dbDir, { recursive: true, force: true }));

test("tüm yayınlanmış içerik dizinlenir; ikinci çalıştırmada hiç gömme çağrısı olmaz", async () => {
  const p = counting();
  const first = await svc.reindexSite("default", "tr", p);
  assert.ok(first.indexed > 5, JSON.stringify(first));
  assert.equal(first.failed.length, 0);
  assert.ok(first.chunks >= first.indexed);

  const calls = p.calls;
  const second = await svc.reindexSite("default", "tr", p);
  assert.equal(second.indexed, 0);
  assert.equal(second.unchanged, first.indexed);
  assert.equal(p.calls, calls, "değişmeyen içerik için gömme çağrısı yok");
});

test("ilgili sorgu doğru içeriği getirir, sonuçlar benzerliğe göre sıralıdır", async () => {
  const p = createLocalProvider();
  const res = await svc.searchCorpus("default", "yapay zeka botları için llms.txt ve ?format=md markdown beslemesi", p, { limit: 3 });
  assert.equal(res.indexed, true);
  assert.equal(res.semantic, false);
  assert.ok(res.passages.length > 0 && res.contents.length > 0);
  assert.ok(res.contents[0]!.similarity >= res.contents.at(-1)!.similarity, "benzerliğe göre sıralı");
  const top = (await db.getScopedRepository("default").listContents({ locale: "tr", status: "published" })).find((c) => c.contentId === res.contents[0]!.contentId);
  assert.ok(top, "en üstteki yayınlanmış içeriktir");
  assert.match(`${top.title} ${top.markdownCache}`.toLowerCase(), /llms|markdown|agentic|yapay zeka/);
  assert.ok(res.passages.every((x) => x.text.length > 0 && x.similarity <= 1.0001));
});

test("noindex ve taslak içerik aramada çıkmaz", async () => {
  const repo = db.getScopedRepository("default");
  const p = createLocalProvider();
  const all = await repo.listContents({ locale: "tr", status: "published" });
  const victim = all.find((c) => c.markdownCache.length > 200)!;
  const ids = (r: Awaited<ReturnType<typeof svc.searchCorpus>>) => r.contents.map((c) => c.contentId);
  const q = victim.title;
  assert.ok(ids(await svc.searchCorpus("default", q, p, { limit: 10 })).includes(victim.contentId), "başlangıçta bulunur");

  const base = {
    contentId: victim.contentId, locale: "tr", type: victim.type, slug: victim.slug, title: victim.title, blocks: victim.blocks,
    tldr: victim.tldr ?? undefined, schemaType: victim.schemaType, importanceScore: victim.importanceScore,
  };
  await repo.saveContent({ ...base, status: "published", noIndex: true } as never);
  assert.ok(!ids(await svc.searchCorpus("default", q, p, { limit: 10 })).includes(victim.contentId), "noindex süzülür");

  await repo.saveContent({ ...base, status: "draft", noIndex: false } as never);
  assert.ok(!ids(await svc.searchCorpus("default", q, p, { limit: 10 })).includes(victim.contentId), "taslak süzülür");
});

test("farklı model vektörleri karışmaz: yeni modelde dizin boşken indexed=false döner", async () => {
  const other: EmbeddingProvider = { ...createLocalProvider(), model: "fake:other:1536" };
  const res = await svc.searchCorpus("default", "herhangi", other);
  assert.equal(res.indexed, false);
  assert.deepEqual(res.passages, []);
});

test("benzerlik raporu: kendi içeriği hariç, benzerliğe göre sıralı, eşik işareti taşır", async () => {
  const p = createLocalProvider();
  const contents = await db.getScopedRepository("default").listContents({ locale: "tr", status: "published" });
  const one = contents.find((c) => c.type === "post") ?? contents[0]!;
  const report = await svc.similarityReport("default", one.contentId, "tr", p, 4);
  assert.equal(report.indexed, true);
  assert.ok(report.similar.every((s) => s.contentId !== one.contentId));
  assert.ok(report.similar.length > 0 && report.similar.length <= 4);
  for (let i = 1; i < report.similar.length; i++) assert.ok(report.similar[i - 1]!.similarity >= report.similar[i]!.similarity);
  assert.ok(report.similar.every((s) => s.cannibalizing === s.similarity >= report.threshold));
});

test("içerik değişince yalnızca o içerik yeniden gömülür", async () => {
  const repo = db.getScopedRepository("default");
  const p = counting();
  const [c] = (await repo.listContents({ locale: "tr", status: "published" })).filter((x) => x.markdownCache.length > 300);
  assert.ok(c);
  await svc.indexContent("default", c.contentId, "tr", p);
  assert.equal((await svc.indexContent("default", c.contentId, "tr", p)).status, "unchanged");
  const before = p.calls;
  await repo.saveContent({
    contentId: c.contentId, locale: "tr", type: c.type, slug: c.slug, title: c.title, status: "published", tldr: "Tamamen yeni bir özet cümlesi burada.",
    blocks: [{ id: "p1", type: "paragraph", props: { text: "Bambaşka bir paragraf: kahve çekirdeklerinin kavrulması ve demleme teknikleri." } }],
    schemaType: c.schemaType, importanceScore: c.importanceScore,
  } as never);
  const res = await svc.indexContent("default", c.contentId, "tr", p);
  assert.equal(res.status, "indexed");
  assert.equal(p.calls, before + 1);
});

test("hibrit arama: anahtar kelime eşleşmesi birleşik sıralamaya girer, hybrid:false yalnızca vektör", async () => {
  const p = createLocalProvider();
  const contents = await db.getScopedRepository("default").listContents({ locale: "tr", status: "published" });
  const target = contents.find((c) => !c.noIndex && c.markdownCache.length > 200)!;
  const hybrid = await svc.searchCorpus("default", target.title, p, { limit: 5 });
  assert.equal(hybrid.ranking, "hybrid");
  assert.equal(hybrid.contents[0]!.contentId, target.contentId);
  assert.ok(typeof hybrid.contents[0]!.fusedScore === "number");
  const vectorOnly = await svc.searchCorpus("default", target.title, p, { limit: 5, hybrid: false });
  assert.equal(vectorOnly.ranking, "vector");
});
