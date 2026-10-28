import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { ChatError, createChatClient, type ChatClient } from "../src/ai/openai-chat";
import { LIMITS, buildSystemPrompt, parseList, parseSuggestions, suggestSeoCopy } from "../src/ai/suggest";

const good = JSON.stringify({ tldr: "NexPress, 0 KB istemci JS ile hızlı sayfa sunar.", metaTitle: "NexPress hızlı CMS", metaDescription: "Açıklama", faq: [{ question: "Nedir?", answer: "Bir CMS." }, { question: "", answer: "x" }] });
const fake = (...replies: string[]): ChatClient & { calls: number } => {
  let i = 0;
  const c = { model: "fake", calls: 0, async completeJson() { c.calls++; return replies[Math.min(i++, replies.length - 1)]!; } };
  return c;
};

test("çıktı doğrulama: sınırlar uygulanır, boş soru atılır, bozuk JSON hata", () => {
  const long = parseSuggestions(JSON.stringify({ tldr: "kelime ".repeat(100), metaTitle: "b".repeat(200), metaDescription: "c".repeat(400), faq: [] }));
  assert.ok(long.tldr.length <= LIMITS.tldr && long.metaTitle.length <= LIMITS.metaTitle && long.metaDescription.length <= LIMITS.metaDescription);
  assert.equal(parseSuggestions(good).faq.length, 1);
  assert.throws(() => parseSuggestions("düz metin"), /geçersiz JSON/);
  assert.throws(() => parseSuggestions("{}"), /boş öneri/);
});

test("marka kuralları isteme girer; liste ayrıştırma", () => {
  const p = buildSystemPrompt({ tone: "kurumsal", forbiddenPhrases: ["Hızlı Teslimat"], customRules: "Rakam uydurma." });
  assert.match(p, /Marka tonu: kurumsal/);
  assert.match(p, /hızlı teslimat/);
  assert.match(p, /bu makalede/);
  assert.deepEqual(parseList("a, b\n c ,,"), ["a", "b", "c"]);
});

test("2 geçiş: yasak kalıp çıkarsa bir kez düzeltir; düzelmezse uyarı taşır", async () => {
  const bad = JSON.stringify({ tldr: "Sonuç olarak bu sistem hızlıdır ve kullanımı kolaydır.", metaTitle: "T", metaDescription: "D", faq: [] });
  const fixedClient = fake(bad, good);
  const fixed = await suggestSeoCopy(fixedClient, { title: "t", markdown: "m" });
  assert.equal(fixedClient.calls, 2);
  assert.equal(fixed.refined, true);
  assert.deepEqual(fixed.remainingForbidden, []);
  const stuck = await suggestSeoCopy(fake(bad, bad), { title: "t", markdown: "m" });
  assert.deepEqual(stuck.remainingForbidden, ["sonuç olarak"]);
  const clean = fake(good);
  assert.equal((await suggestSeoCopy(clean, { title: "t", markdown: "m" })).refined, false);
  assert.equal(clean.calls, 1);
});

test("OpenAI istemcisi: istek biçimi, 429'da yeniden deneme, 401'de anlamlı hata", async () => {
  let hits = 0;
  let seen: { auth?: string; body?: Record<string, unknown> } = {};
  const server = http.createServer((req, res) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      hits++;
      seen = { auth: req.headers.authorization, body: JSON.parse(data) };
      if (req.url!.startsWith("/denied")) return void res.writeHead(401).end("no");
      if (hits === 1) return void res.writeHead(429).end("slow");
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ choices: [{ message: { content: good } }] }));
    });
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as { port: number }).port;
  try {
    const client = createChatClient({ apiKey: "k-test", baseUrl: `http://127.0.0.1:${port}`, model: "m1", maxRetries: 2 });
    assert.equal(await client.completeJson({ system: "s", user: "u" }), good);
    assert.equal(hits, 2);
    assert.equal(seen.auth, "Bearer k-test");
    assert.equal(seen.body!.model, "m1");
    assert.deepEqual(seen.body!.response_format, { type: "json_object" });
    const denied = createChatClient({ apiKey: "x", baseUrl: `http://127.0.0.1:${port}/denied` });
    await assert.rejects(denied.completeJson({ system: "s", user: "u" }), (e: unknown) => e instanceof ChatError && /anahtarı geçersiz/.test(e.message));
  } finally {
    server.close();
  }
});

import { createRateLimiter } from "../src/ai/rate-limit";

test("hız sınırı: pencere içinde sınırı aşan reddedilir, süre geçince açılır, anahtarlar bağımsız", () => {
  let t = 0;
  const l = createRateLimiter(2, 1000, () => t);
  assert.deepEqual([l.take("a"), l.take("a"), l.take("a"), l.take("b")], [true, true, false, true]);
  t = 1001;
  assert.equal(l.take("a"), true);
});

import { brandContextBlock, buildDnaUserPrompt, dnaSamples, parseDna, pickStyleExamples } from "../src/ai/brand";

const long = (w: string) => `${w} `.repeat(80);

test("stil örnekleri: ana sayfa ve kısa metin elenir, yüksek skor önce, uzunluk sınırlı", () => {
  const ex = pickStyleExamples([
    { title: "Ana", type: "page", markdown: long("ana"), seoScore: 99, isHome: true },
    { title: "Kısa", type: "post", markdown: "çok kısa", seoScore: 100 },
    { title: "Düşük", type: "post", markdown: long("düşük"), seoScore: 60 },
    { title: "Yüksek", type: "post", markdown: `# Başlık\n[bağ](http://x) ${long("yüksek")}`, seoScore: 90 },
  ]);
  assert.equal(ex.length, 2);
  assert.match(ex[0]!, /^bağ yüksek/);
  assert.ok(!ex[0]!.includes("http") && !ex[0]!.includes("#"));
  assert.ok(ex[0]!.length <= 381);
});

test("marka bağlamı: boş alanlar atlanır, DNA ve örnekler girer; DNA örneklemi ana sayfayı öne alır", () => {
  assert.equal(brandContextBlock({}), "");
  const b = brandContextBlock({ sector: "yazılım", siteDna: "Biz X.", styleExamples: ["örnek metin"] });
  assert.match(b, /Sektör: yazılım/);
  assert.match(b, /Site kimliği \(Site DNA\):\nBiz X\./);
  assert.match(b, /1\) örnek metin/);
  const s = dnaSamples([
    { title: "B", type: "post", markdown: long("b"), seoScore: 1, importanceScore: 9 },
    { title: "Ana", type: "page", markdown: long("a"), seoScore: 1, importanceScore: 1, isHome: true },
    { title: "Boş", type: "post", markdown: "", seoScore: 1, importanceScore: 10 },
  ]);
  assert.deepEqual(s.map((x) => x.title), ["Ana", "B"]);
  assert.match(buildDnaUserPrompt({ siteName: "S", samples: s }), /\[1\] \(page\) Ana/);
});

test("DNA çıktısı: kısa/bozuk reddedilir, fazla boş satır sıkıştırılır", () => {
  assert.throws(() => parseDna("{}"), /yeterli/);
  assert.throws(() => parseDna("x"), /geçersiz JSON/);
  assert.equal(parseDna(JSON.stringify({ dna: `${"a".repeat(100)}\n\n\n\n${"b".repeat(100)}` })).includes("\n\n\n"), false);
});
