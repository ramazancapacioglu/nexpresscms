import assert from "node:assert/strict";
import { test } from "node:test";
import type { ChatClient } from "@nexpress/core";
import { cleanText, composeText, findClaims, findUnverifiedNumbers, parseCompose, type ComposeInput } from "../src/ai/compose";

const base: ComposeInput = { mode: "rewrite", instruction: "samimi yap", text: "Firmamız 2015 yılında kuruldu.", title: "Hakkımızda", kind: "paragraph", context: "" };
const fake = (replies: string[]): ChatClient & { calls: number } => {
  let i = 0;
  return { model: "fake", calls: 0, async completeJson() { this.calls++; return replies[Math.min(i++, replies.length - 1)]!; } } as never;
};

test("çıktı temizliği: HTML, Markdown, bağlantı ve işaretler atılır; uzunluk sınırlanır", () => {
  assert.equal(cleanText("<p>Merhaba <b>dünya</b></p> [site](https://x.test) **kalın** https://spam.test", 500), "Merhaba dünya site kalın");
  assert.ok(cleanText("kelime ".repeat(500), 100).length <= 100);
  assert.equal(cleanText(42, 10), "");
});

test("çıktı doğrulama: paragraf ve başlık sınırları, boş/bozuk çıktı hata verir", () => {
  const six = Array.from({ length: 9 }, (_, i) => `Paragraf ${i}`);
  assert.equal(parseCompose(JSON.stringify({ paragraphs: six }), "paragraph").length, 6);
  assert.deepEqual(parseCompose(JSON.stringify({ paragraphs: ["Başlık bir", "Başlık iki"] }), "heading"), ["Başlık bir"]);
  assert.deepEqual(parseCompose(JSON.stringify({ paragraphs: "tek metin" }), "paragraph"), ["tek metin"]);
  assert.throws(() => parseCompose("bozuk", "paragraph"));
  assert.throws(() => parseCompose(JSON.stringify({ paragraphs: ["  ", "<br>"] }), "paragraph"));
});

test("iddia ve rakam uyarıları", () => {
  const claims = findClaims("Müşterilerin %92'si memnun, 2024'te 3 milyon kişiye ulaştık ve en iyi çözümüz.");
  for (const c of ["%92", "2024", "3 milyon kişi", "en iyi"]) assert.ok(claims.some((x) => x.includes(c.split(" ")[0]!)), c);
  assert.deepEqual(findClaims("Sade ve açıklayıcı bir cümle."), []);
  assert.deepEqual(findUnverifiedNumbers("2015 yılında 40 çalışanla kuruldu.", "Firmamız 2015 yılında kuruldu."), ["40"]);
  assert.deepEqual(findUnverifiedNumbers("Rakam yok.", "x"), []);
});

test("üretim: temiz çıktı tek çağrı; yasak kalıp varsa bir kez düzeltilir; kalırsa bildirilir", async () => {
  const clean = fake([JSON.stringify({ paragraphs: ["Firmamız 2015 yılında kuruldu ve yolculuğuna devam ediyor."] })]);
  const r1 = await composeText(clean, base);
  assert.equal(clean.calls, 1);
  assert.equal(r1.refined, false);
  assert.deepEqual(r1.unverifiedNumbers, []);
  assert.deepEqual(r1.remainingForbidden, []);

  const dirty = fake([JSON.stringify({ paragraphs: ["Gelişen dijital çağda 40 uzman ekibimizle hizmetinizdeyiz."] }), JSON.stringify({ paragraphs: ["40 uzman ekibimizle hizmetinizdeyiz."] })]);
  const r2 = await composeText(dirty, base, { forbiddenPhrases: ["dijital çağda"] });
  assert.equal(dirty.calls, 2);
  assert.equal(r2.refined, true);
  assert.deepEqual(r2.remainingForbidden, []);
  assert.deepEqual(r2.unverifiedNumbers, ["40"], "kaynakta olmayan rakam işaretlenir");

  const stubborn = fake([JSON.stringify({ paragraphs: ["Dijital çağda hızlıyız."] })]);
  const r3 = await composeText(stubborn, base, { forbiddenPhrases: ["dijital çağda"] });
  assert.deepEqual(r3.remainingForbidden, ["dijital çağda"]);
});

test("bağlam yalnızca yazma/genişletmede istemde yer alır; düzenleme görevlerinde yeni içerik yasaklanır", async () => {
  const { composeUserPrompt } = await import("../src/ai/compose");
  const withCtx = { ...base, context: "GİZLİ-BAĞLAM" };
  assert.ok(composeUserPrompt({ ...withCtx, mode: "write" }).includes("GİZLİ-BAĞLAM"));
  assert.ok(composeUserPrompt({ ...withCtx, mode: "expand" }).includes("GİZLİ-BAĞLAM"));
  for (const mode of ["rewrite", "shorten", "fix"] as const) {
    const p = composeUserPrompt({ ...withCtx, mode });
    assert.ok(!p.includes("GİZLİ-BAĞLAM"), mode);
    assert.ok(p.includes("yeni cümle, olgu veya adım ekleme"), mode);
  }
});

test("düzenleme güvenlik ağı: fazla paragraf kırpılır, uzayan çıktı uyarılır; yaz/genişlet etkilenmez", async () => {
  const { guardEdit } = await import("../src/ai/compose");
  const input = "Kısa bir metin burada duruyor ve tek paragraftır.";
  const r = guardEdit("rewrite", input, ["Aynı anlam, başka söyleyiş.", "Modelin eklediği yeni bir paragraf."]);
  assert.equal(r.paragraphs.length, 1);
  assert.ok(r.warning);
  assert.equal(guardEdit("rewrite", input, ["Kısa bir metin duruyor burada ve tek paragraftır."]).warning, null);
  assert.ok(guardEdit("shorten", input, [input + " Üstüne ekleme yapılmış uzun bir cümle daha."]).warning, "kısaltma uzadı");
  assert.ok(guardEdit("fix", "a".repeat(200), ["a".repeat(400)]).warning, "düzeltme yarıya çıktı");
  assert.deepEqual(guardEdit("write", "", ["a", "b", "c"]), { paragraphs: ["a", "b", "c"], warning: null });
  assert.equal(guardEdit("expand", input, ["a", "b"]).paragraphs.length, 2);
  assert.equal(guardEdit("rewrite", "iki\n\nparagraf", ["x", "y", "z"]).paragraphs.length, 2);
});
