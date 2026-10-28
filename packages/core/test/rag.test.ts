import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkMarkdown, embeddingInputOf, fnv1a64 } from "../src/chunker";
import { decodeVector, dot, encodeVector, hashEmbed, normalizeVector, tokenize } from "../src/vector";

const words = (n: number, w = "kelime") => Array.from({ length: n }, (_, i) => `${w}${i}`).join(" ");

test("başlık yolu iç içe başlıklardan kurulur ve kardeş başlıkta sıfırlanır", () => {
  const md = `# Rehber\n\nGiriş metni ${words(50)}.\n\n## Kurulum\n\n${words(50, "kur")}.\n\n### Docker\n\n${words(50, "dock")}.\n\n## Kullanım\n\n${words(50, "kul")}.`;
  const paths = chunkMarkdown(md, { maxWords: 60, minWords: 5, overlapWords: 0 }).map((c) => c.headingPath);
  assert.deepEqual(paths, ["Rehber", "Rehber > Kurulum", "Rehber > Kurulum > Docker", "Rehber > Kullanım"]);
});

test("parçalar maxWords'ü aşmaz (örtüşme payı hariç); büyük paragraf cümlede bölünür", () => {
  const long = Array.from({ length: 40 }, (_, i) => `Bu ${i}. cümle ${words(10, "x")} sonu.`).join(" ");
  const chunks = chunkMarkdown(long, { maxWords: 80, minWords: 10, overlapWords: 0 });
  assert.ok(chunks.length >= 5, String(chunks.length));
  for (const c of chunks) assert.ok(c.wordCount <= 80, `${c.wordCount}`);
  assert.ok(chunks.every((c) => /[.!?]$|sonu\.$/.test(c.text.trim()) || c.text.trim().endsWith("sonu.")));
});

test("kod çiti bölünmez ve içindeki başlık gibi satırlar başlık sayılmaz", () => {
  const md = "# T\n\n```bash\n# bu bir yorum\npnpm install\n\npnpm build\n```\n\nSon.";
  const chunks = chunkMarkdown(md, { maxWords: 200, minWords: 1, overlapWords: 0 });
  assert.equal(chunks.length, 1);
  assert.match(chunks[0]!.text, /pnpm install\n\npnpm build/);
  assert.equal(chunks[0]!.headingPath, "T");
});

test("başlık ve TL;DR ilk parçada yer alır; kısa parçalar birleşir", () => {
  const chunks = chunkMarkdown("## A\n\nkısa.\n\n## B\n\nbu da kısa.", { title: "Başlık", tldr: "Özet cümlesi.", maxWords: 100, minWords: 20, overlapWords: 0 });
  assert.equal(chunks.length, 1);
  assert.match(chunks[0]!.text, /^Başlık\nÖzet cümlesi\./);
});

test("örtüşme aynı başlık altında bir önceki parçanın sonunu taşır", () => {
  const md = `# H\n\n${words(70, "a")}\n\n${words(70, "b")}`;
  const [first, second] = chunkMarkdown(md, { maxWords: 80, minWords: 5, overlapWords: 10 });
  assert.ok(first && second);
  assert.match(second.text, /a69 …/);
});

test("özet deterministiktir ve içerik değişince değişir", () => {
  const a = chunkMarkdown("# H\n\nmerhaba dünya");
  const b = chunkMarkdown("# H\n\nmerhaba dünya");
  const c = chunkMarkdown("# H\n\nmerhaba dünyalı");
  assert.equal(a[0]!.hash, b[0]!.hash);
  assert.notEqual(a[0]!.hash, c[0]!.hash);
  assert.equal(fnv1a64("").length, 16);
});

test("gömme girdisi başlık yolunu bağlam olarak ekler", () => {
  assert.equal(embeddingInputOf({ headingPath: "A > B", text: "metin" }, "Başlık"), "Başlık — A > B\nmetin");
  assert.equal(embeddingInputOf({ headingPath: "", text: "metin" }), "metin");
});

test("Türkçe tokenleştirme aksanları açar", () => {
  assert.deepEqual(tokenize("Çılgın ŞÖFÖR, ığdır!"), ["cilgin", "sofor", "igdir"]);
});

test("yerel gömme: birim uzunluk, deterministik, ilgili metin ilgisizden yakın", () => {
  const q = hashEmbed("llms.txt dosyası yapay zeka botları için nasıl hazırlanır");
  const near = hashEmbed("yapay zeka botları llms.txt dosyasını okuyarak siteyi anlar ve hazırlanır");
  const far = hashEmbed("Hamur için un, maya ve su karıştırılır, fırında pişirilir");
  assert.ok(Math.abs(dot(q, q) - 1) < 1e-5);
  assert.deepEqual(hashEmbed("aynı metin"), hashEmbed("aynı metin"));
  assert.ok(dot(q, near) > dot(q, far) + 0.15, `${dot(q, near)} vs ${dot(q, far)}`);
});

test("Türkçe ek farkı kök özniteliğiyle yakalanır", () => {
  const a = hashEmbed("kurumsal sitelerde optimizasyon yapılır");
  const b = hashEmbed("kurumsal sitenin optimizasyonu");
  const c = hashEmbed("tamamen alakasız bir cümle burada");
  assert.ok(dot(a, b) > dot(a, c));
});

test("vektör kodlama gidiş-dönüşte bire bir aynı kalır", () => {
  const v = normalizeVector(Float32Array.from({ length: 1536 }, (_, i) => Math.sin(i)));
  const back = decodeVector(encodeVector(v));
  assert.equal(back.length, 1536);
  assert.ok(back.every((x, i) => x === v[i]));
  assert.throws(() => decodeVector("json:[1]"));
});
