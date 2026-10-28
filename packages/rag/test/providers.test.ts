import assert from "node:assert/strict";
import { test } from "node:test";
import { EMBEDDING_DIMENSIONS } from "@nexpress/core";
import { createLocalProvider, createOpenAiProvider, providerFromEnv } from "../src/providers";

const vec = (seed: number) => Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => Math.sin(i + seed));

function fakeFetch(handler: (url: string, init: RequestInit, call: number) => Response | Promise<Response>) {
  const calls: Array<{ url: string; init: RequestInit; body: any }> = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init, body: JSON.parse(String(init.body)) });
    return handler(url, init, calls.length);
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const ok = (inputs: number, order?: number[]) =>
  new Response(JSON.stringify({ data: (order ?? Array.from({ length: inputs }, (_, i) => i)).map((index) => ({ index, embedding: vec(index) })) }), { status: 200 });

test("OpenAI sağlayıcısı: istek biçimi, yetki başlığı, boyut parametresi ve model kimliği", async () => {
  const { impl, calls } = fakeFetch(() => ok(2));
  const p = createOpenAiProvider({ apiKey: "sk-test", baseUrl: "https://example.test/v1/", fetchImpl: impl });
  const out = await p.embed(["a", "b"]);
  assert.equal(out.length, 2);
  assert.equal(calls[0]!.url, "https://example.test/v1/embeddings");
  assert.equal((calls[0]!.init.headers as Record<string, string>).authorization, "Bearer sk-test");
  assert.deepEqual(calls[0]!.body, { model: "text-embedding-3-small", input: ["a", "b"], encoding_format: "float", dimensions: 1536 });
  assert.equal(p.model, "openai:text-embedding-3-small:1536");
  assert.equal(p.semantic, true);
  const norm = Math.sqrt(out[0]!.reduce((s, x) => s + x * x, 0));
  assert.ok(Math.abs(norm - 1) < 1e-4, "vektör birim uzunluğa getirilir");
});

test("OpenAI: yanıt sırası karışsa da girdi sırasıyla döner; 64'ten büyük girdi gruplanır", async () => {
  const { impl, calls } = fakeFetch((_u, init) => {
    const n = JSON.parse(String(init.body)).input.length;
    return ok(n, Array.from({ length: n }, (_, i) => n - 1 - i));
  });
  const p = createOpenAiProvider({ apiKey: "k", fetchImpl: impl });
  const inputs = Array.from({ length: 130 }, (_, i) => `t${i}`);
  const out = await p.embed(inputs);
  assert.equal(out.length, 130);
  assert.deepEqual(calls.map((c) => c.body.input.length), [64, 64, 2]);
  const first = createOpenAiProvider({ apiKey: "k", fetchImpl: fakeFetch(() => ok(2, [1, 0])).impl });
  const [a] = await first.embed(["x", "y"]);
  assert.ok(Math.abs(a![0]! - (Math.sin(0) / Math.sqrt(vec(0).reduce((s, x) => s + x * x, 0)))) < 1e-4, "ilk vektör index 0'ın vektörüdür");
});

test("OpenAI: 429'da yeniden dener, kalıcı hatada açıklayıcı hata fırlatır, yanlış boyutu reddeder", async () => {
  let n = 0;
  const retry = fakeFetch(() => (++n < 2 ? new Response("rate", { status: 429 }) : ok(1)));
  await createOpenAiProvider({ apiKey: "k", fetchImpl: retry.impl }).embed(["a"]);
  assert.equal(retry.calls.length, 2);

  const bad = fakeFetch(() => new Response("nope", { status: 401 }));
  await assert.rejects(createOpenAiProvider({ apiKey: "k", fetchImpl: bad.impl }).embed(["a"]), /401/);
  assert.equal(bad.calls.length, 1, "401 yeniden denenmez");

  const wrongDims = fakeFetch(() => new Response(JSON.stringify({ data: [{ index: 0, embedding: [1, 2, 3] }] }), { status: 200 }));
  await assert.rejects(createOpenAiProvider({ apiKey: "k", fetchImpl: wrongDims.impl }).embed(["a"]), /boyutu 3/);
});

test("text-embedding-3 dışındaki modellerde dimensions gönderilmez", async () => {
  const { impl, calls } = fakeFetch(() => ok(1));
  await createOpenAiProvider({ apiKey: "k", model: "bge-m3", fetchImpl: impl }).embed(["a"]);
  assert.equal("dimensions" in calls[0]!.body, false);
});

test("sağlayıcı seçimi: anahtar yoksa yerel, anahtar varsa openai, zorunlu openai anahtarsız hata", () => {
  assert.equal(providerFromEnv({}).model, "local:hash-v1:1536");
  assert.equal(providerFromEnv({ OPENAI_API_KEY: "k" }).model, "openai:text-embedding-3-small:1536");
  assert.equal(providerFromEnv({ OPENAI_API_KEY: "k", EMBEDDING_PROVIDER: "local" }).model, "local:hash-v1:1536");
  assert.equal(providerFromEnv({ OPENAI_API_KEY: "k", EMBEDDING_MODEL: "text-embedding-3-large" }).model, "openai:text-embedding-3-large:1536");
  assert.throws(() => providerFromEnv({ EMBEDDING_PROVIDER: "openai" }), /OPENAI_API_KEY/);
});

test("yerel sağlayıcı anahtarsız çalışır ve semantik olmadığını bildirir", async () => {
  const p = createLocalProvider();
  assert.equal(p.semantic, false);
  const [v] = await p.embed(["merhaba dünya"]);
  assert.equal(v!.length, 1536);
});
