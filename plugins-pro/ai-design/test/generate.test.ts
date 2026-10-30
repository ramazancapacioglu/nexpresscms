import test from "node:test";
import assert from "node:assert/strict";
import type { ChatClient } from "@nexpress/core";
import { validateThemeOutput } from "@nexpress/themes/package";
import { generateDesign } from "../src";

type Call = { system: string; user: string; temperature?: number; maxTokens?: number };
function fake(replies: Array<string | Error>): { client: ChatClient; calls: Call[] } {
  const calls: Call[] = [];
  let i = 0;
  return {
    calls,
    client: {
      model: "fake-model",
      async completeJson(input) {
        calls.push(input);
        const r = replies[Math.min(i++, replies.length - 1)]!;
        if (r instanceof Error) throw r;
        return r;
      },
    },
  };
}

const heroJson = { type: "hero", props: { title: "Kurumsal web tasarım", subtitle: "Hızlı siteler", primaryCtaLabel: "Teklif iste", primaryCtaHref: "/tr/iletisim" } };
const tldrJson = { type: "tldr_box", props: { summary: "Firma KOBİ'ler için hızlı ve aranabilir kurumsal web siteleri tasarlar; kurulum iki haftada tamamlanır." } };
const para = { type: "paragraph", props: { text: "Sitenizin hızlı açılması aramada görünürlüğü ve dönüşümü doğrudan etkiler. ".repeat(6) } };
const goodPage = JSON.stringify({ title: "Kurumsal Web Tasarım", tldr: "Hızlı kurumsal siteler.", metaDescription: "KOBİ'ler için hızlı, güvenli ve aranabilir kurumsal web siteleri tasarlıyoruz; teklif almak için formu doldurun.", blocks: [heroJson, tldrJson, para] });

const tokens = {
  colors: { primary: "#1d4ed8", primaryForeground: "#ffffff", secondary: "#e2e8f0", secondaryForeground: "#0f172a", accent: "#0f766e", accentForeground: "#ffffff", background: "#ffffff", foreground: "#0f172a", muted: "#f1f5f9", mutedForeground: "#475569", border: "#cbd5e1" },
  darkColors: { primary: "#60a5fa", primaryForeground: "#0b1220", background: "#0b1220", foreground: "#e5e7eb", muted: "#111827", mutedForeground: "#9ca3af" },
  typography: { headingFont: "Georgia, serif", bodyFont: "system-ui, sans-serif", monoFont: "ui-monospace, monospace", baseSizePx: 16, scaleRatio: 1.25 },
  geometry: { borderRadius: "8px", containerMaxWidth: "1200px", sectionSpacingY: "64px", cardShadow: "sm" },
};

test("sayfa: ilk denemede geçerliyse tek çağrı; komut sitenin bağlamını ve ek kuralları taşır, tarif kırpılır", async () => {
  const { client, calls } = fake([goodPage]);
  const r = await generateDesign(client, { mode: "page", prompt: "x".repeat(5000), site: { siteName: "Acme", knownPaths: ["/tr/iletisim"], media: [], forms: [] }, extraRules: "Hep 'siz' dili kullan." });
  assert.equal(calls.length, 1);
  assert.equal(r.attempts, 1);
  assert.equal(r.model, "fake-model");
  assert.equal(r.mode, "page");
  if (r.mode === "page") {
    assert.equal(r.lint.errors.length, 0, r.lint.errors.join("|"));
    assert.equal(r.page!.slug, "kurumsal-web-tasarim");
  }
  assert.equal(calls[0]!.user.length, 2000);
  assert.ok(calls[0]!.system.includes("Acme") && calls[0]!.system.includes("/tr/iletisim") && calls[0]!.system.includes("Hep 'siz' dili"));
  assert.ok(calls[0]!.maxTokens! >= 3000);
});

test("otomatik onarım: ilk çıktı reddedilirse hatalar modele geri verilir ve düzelen ikinci çıktı seçilir", async () => {
  const bad = JSON.stringify({ title: "Sayfa", blocks: [{ type: "slider", props: {} }, para] });
  const { client, calls } = fake([bad, goodPage]);
  const r = await generateDesign(client, { mode: "page", prompt: "kurumsal bir sayfa tasarla" });
  assert.equal(calls.length, 2);
  assert.equal(r.attempts, 2);
  assert.ok(calls[1]!.user.includes("reddedildi") && calls[1]!.user.includes("slider"), "hata listesi ve önceki çıktı gönderilir");
  assert.equal(r.mode === "page" && r.lint.errors.length, 0);
});

test("onarım da başarısızsa en az hatalı sonuç döner; onarım turu hata verirse ilk sonuç korunur", async () => {
  const worse = JSON.stringify({ title: "S", blocks: [{ type: "slider", props: {} }, { type: "countdown", props: {} }, { type: "map_embed", props: {} }] });
  const better = JSON.stringify({ title: "Sayfa", blocks: [{ type: "slider", props: {} }, para] });
  const a = await generateDesign(fake([better, worse]).client, { mode: "page", prompt: "kurumsal bir sayfa tasarla" });
  assert.ok(a.mode === "page" && a.lint.errors.length <= 4);
  const b = await generateDesign(fake([better, new Error("ağ")]).client, { mode: "page", prompt: "kurumsal bir sayfa tasarla" });
  assert.equal(b.attempts, 1);
  await assert.rejects(generateDesign(fake(["düz metin", "yine düz metin"]).client, { mode: "section", prompt: "bir vitrin bölümü tasarla" }), /JSON/);
  await assert.rejects(generateDesign(fake([new Error("OpenAI anahtarı geçersiz.")]).client, { mode: "section", prompt: "bir vitrin bölümü tasarla" }), /anahtarı/);
});

test("bölüm: markdown çitli yanıt, kategori ve temizlik", async () => {
  const { client } = fake(["İşte:\n```json\n" + JSON.stringify({ name: "Vitrin", category: "hero", blocks: [heroJson] }) + "\n```"]);
  const r = await generateDesign(client, { mode: "section", prompt: "kurumsal bir vitrin bölümü" });
  assert.equal(r.mode, "section");
  if (r.mode === "section") {
    assert.equal(r.category, "hero");
    assert.equal(r.lint.blocks[0]!.id, "ai_1");
  }
});

test("tema: geçerli jetonlar kabul, kimlik slug'lanır; düşük kontrast ve şema hataları reddedilir ve onarımla düzelir", async () => {
  const ok = validateThemeOutput({ id: "Deniz Mavisi!", name: "Deniz Mavisi", tagline: "Sakin", description: "<b>Mavi</b> tema", tokens });
  assert.equal(ok.ok, true, ok.errors.join("|"));
  assert.equal(ok.theme.id, "deniz-mavisi");
  assert.equal(ok.theme.description, "Mavi tema");
  assert.equal(ok.theme.version, "1.0.0");
  const low = { ...tokens, colors: { ...tokens.colors, mutedForeground: "#bbbbbb" } };
  const bad = validateThemeOutput({ id: "x", name: "", tokens: low });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => e.includes("mutedForeground")) && bad.errors.some((e) => e.includes("tema adı")));
  assert.equal(validateThemeOutput({ name: "T", tokens: { colors: {} } }).ok, false);
  const { client, calls } = fake([JSON.stringify({ id: "deniz", name: "Deniz", tokens: low }), JSON.stringify({ id: "deniz", name: "Deniz", tokens })]);
  const r = await generateDesign(client, { mode: "theme", prompt: "sakin mavi tonlu bir tema" });
  assert.equal(r.attempts, 2);
  assert.ok(calls[0]!.system.includes("primaryForeground") && !calls[0]!.system.includes("BLOK KATALOĞU"));
  assert.equal(r.mode === "theme" && r.ok, true);
});
