import test from "node:test";
import assert from "node:assert/strict";
import { AI_BLOCK_CATALOG, buildDesignSystemPrompt, contrastRatio, extractJson, lintDesign, lintDesignOutput, lintThemeTokens, safeHref } from "../src";

const hero = (over: Record<string, unknown> = {}) => ({ type: "hero", props: { title: "İzmir'de kurumsal web tasarım", subtitle: "Hızlı, güvenli ve aranabilir siteler.", primaryCtaLabel: "Teklif iste", primaryCtaHref: "/tr/iletisim", ...over } });
const tldr = { type: "tldr_box", props: { summary: "Firma, KOBİ'ler için hızlı ve aranabilir kurumsal web siteleri tasarlar; teklif ve kurulum süreci iki haftada tamamlanır." } };
const body = (text: string) => ({ type: "paragraph", props: { text } });
const long = "Sitenizin hızlı açılması aramada görünürlüğü ve dönüşümü doğrudan etkiler. ".repeat(6);

test("güvenli bağlantı: yol, çapa, http(s), mailto, tel kabul; //x, javascript:, data: ve boşluklu reddedilir", () => {
  for (const ok of ["/tr/iletisim", "#bolum-1", "https://ornek.com/a", "mailto:a@b.co", "tel:+90 232 000 00 00"]) assert.equal(safeHref(ok), ok);
  for (const bad of ["//evil.com", "javascript:alert(1)", "data:text/html,x", "/a b", "ftp://x.y/z", "vbscript:x"]) assert.equal(safeHref(bad), null, bad);
  assert.equal(safeHref(""), "");
});

test("blok temizliği: bilinmeyen tür reddedilir, HTML atılır, uzun metin kısalır, bilinmeyen alan atılır, kimlikler yeniden üretilir", () => {
  const r = lintDesign([{ id: "x", type: "slider", props: {} }, { id: "same", type: "paragraph", props: { text: `<b>Merhaba</b> <script>x</script>${"a".repeat(2000)}`, hack: 1 } }, { id: "same", type: "paragraph", props: { text: "ikinci" } }], "section");
  assert.ok(r.errors.some((e) => e.includes("slider")), "AI'a kapalı blok");
  assert.equal(r.blocks.length, 2);
  assert.deepEqual(r.blocks.map((b) => b.id), ["ai_1", "ai_2"]);
  const t = String(r.blocks[0]!.props.text);
  assert.ok(!t.includes("<") && t.length <= 900);
  assert.ok(r.warnings.some((w) => w.includes("HTML") && true) || r.warnings.some((w) => w.includes("kısaltıldı")));
  assert.ok(r.warnings.some((w) => w.includes("hack")));
});

test("görsel ve bağlantı: yalnızca medya kitaplığı; olmayan kimlik ve dış adres hata; bilinmeyen iç yol uyarı", () => {
  const img = (url: string) => ({ type: "image_figure", props: { url, altText: "Ofis" } });
  assert.ok(lintDesign([img("https://evil.com/a.png")], "section").errors.some((e) => e.includes("medya kitaplığından")));
  assert.ok(lintDesign([img("/media/med_yok")], "section", { mediaIds: ["med_var"] }).errors.some((e) => e.includes("olmayan görsel")));
  assert.equal(lintDesign([img("/media/med_var?w=100")], "section", { mediaIds: ["med_var"] }).errors.length, 0);
  assert.ok(lintDesign([{ type: "cta_banner", props: { title: "Başla", buttonLabel: "Git", buttonHref: "/tr/yok" } }], "section", { knownPaths: ["/tr/iletisim"] }).warnings.some((w) => w.includes("/tr/yok")));
  assert.ok(lintDesign([{ type: "cta_banner", props: { title: "Başla", buttonLabel: "Git", buttonHref: "javascript:alert(1)" } }], "section").errors.length > 0);
});

test("sayfa kuralları: hero/h1, TL;DR uzunluğu ve konumu, ince içerik, başlık atlama, CTA sayısı, tek hero ve tek SSS", () => {
  const good = lintDesign([hero(), tldr, { type: "heading", props: { level: 2, text: "Neden biz" } }, body(long), { type: "faq_accordion", props: { title: "SSS", items: [{ question: "Süre?", answer: "İki hafta." }, { question: "Fiyat?", answer: "Teklifle belirlenir." }] } }], "page");
  assert.equal(good.errors.length, 0, good.errors.join("|"));
  assert.equal(good.stats.h1, 1);
  const bad = lintDesign([body("kısa"), { type: "heading", props: { level: 4, text: "Atlama" } }], "page");
  assert.ok(bad.errors.some((e) => e.includes("en az 3 blok")) && bad.errors.some((e) => e.includes("h1 yok")));
  assert.ok(bad.warnings.some((w) => w.includes("atlanıyor")) && bad.warnings.some((w) => w.includes("tldr_box")) && bad.warnings.some((w) => w.includes("ince")));
  const two = lintDesign([hero(), hero(), tldr, body(long)], "page");
  assert.ok(two.errors.some((e) => e.includes("en çok 1")), "ikinci hero (ikinci h1) reddedilir");
  assert.ok(lintDesign([hero(), { ...tldr, props: { summary: "çok kısa" } }, body(long)], "page").warnings.some((w) => w.includes("40–260")));
  assert.ok(lintDesign([hero(), body(long), tldr], "page").warnings.some((w) => w.includes("hemen sonra")));
});

test("yer tutucu veri bayrağı ve sınır dışı sayı/enum düzeltmeleri", () => {
  const r = lintDesign([{ type: "stats_strip", props: { stats: [{ value: "99%", label: "Memnuniyet" }, { value: "10", label: "Yıl" }] } }, { type: "heading", props: { level: 9, text: "Başlık" } }, { type: "callout", props: { tone: "BOGUS", text: "not" } }], "section");
  assert.equal(r.placeholderData, true);
  assert.ok(r.warnings.some((w) => w.includes("yer tutucu")));
  assert.equal(r.blocks[1]!.props.level, 4);
  assert.equal(r.blocks[2]!.props.tone, "TIP");
  assert.ok(lintDesign([{ type: "stats_strip", props: { stats: [{ value: "1", label: "a" }] } }], "section").errors.some((e) => e.includes("en az 2")));
});

test("blok stili: yalnızca izinli anahtarlar, renkler hex, düşük kontrast hata", () => {
  const ok = lintDesign([{ type: "paragraph", props: { text: "x" }, style: { backgroundColor: "#0f172a", textColor: "#ffffff", paddingTop: "48px", textAlign: "center", boxShadow: "lg", customCss: "a{}" } }], "section");
  assert.equal(ok.errors.length, 0);
  assert.deepEqual(ok.blocks[0]!.style, { backgroundColor: "#0f172a", textColor: "#ffffff", paddingTop: "48px", textAlign: "center" });
  assert.ok(ok.warnings.some((w) => w.includes("customCss")));
  const lowContrast = lintDesign([{ type: "paragraph", props: { text: "x" }, style: { backgroundColor: "#ffffff", textColor: "#cccccc" } }], "section");
  assert.ok(lowContrast.errors.some((e) => e.includes("kontrast")));
  assert.ok(lintDesign([{ type: "paragraph", props: { text: "x" }, style: { backgroundColor: "red" } }], "section").errors.some((e) => e.includes("#rrggbb")));
});

test("yanıt ayrıştırma: markdown çiti ve önsöz toleranslı; sayfa meta alanları ve slug", () => {
  const j = extractJson('Tabii!\n```json\n{"title":"Çözüm Önerisi Şahin","blocks":[]}\n```\nBitti');
  assert.ok(j.ok);
  assert.equal(extractJson("düz metin").ok, false);
  assert.equal(extractJson("{bozuk").ok, false);
  const out = lintDesignOutput("page", { title: "Çözüm Önerisi Işık", tldr: "x".repeat(60), metaTitle: "m".repeat(70), metaDescription: "kısa", blocks: [hero(), tldr, body(long)] });
  assert.equal(out.page!.slug, "cozum-onerisi-isik");
  assert.ok(out.lint.warnings.some((w) => w.includes("meta başlık")) && out.lint.warnings.some((w) => w.includes("meta açıklama")));
  const sec = lintDesignOutput("section", { name: "Vitrin", category: "yok", blocks: [hero()] });
  assert.equal(sec.category, "text");
});

test("tema jetonları: kontrast hesabı, hex zorunluluğu, koyu kip uyarısı, yazı tipi ve geometri sınırları", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  assert.equal(contrastRatio("#777777", "#ffffff") < 4.5, true);
  const tokens = {
    colors: { primary: "#1d4ed8", primaryForeground: "#ffffff", secondary: "#e2e8f0", secondaryForeground: "#0f172a", accent: "#0f766e", accentForeground: "#ffffff", background: "#ffffff", foreground: "#0f172a", muted: "#f1f5f9", mutedForeground: "#475569", border: "#cbd5e1" },
    typography: { headingFont: "Georgia, serif", bodyFont: "system-ui, sans-serif", monoFont: "ui-monospace, monospace", baseSizePx: 16, scaleRatio: 1.25 },
    geometry: { borderRadius: "8px", containerMaxWidth: "1200px", sectionSpacingY: "64px", cardShadow: "sm" },
  };
  const ok = lintThemeTokens(tokens);
  assert.equal(ok.ok, true, ok.errors.join("|"));
  assert.ok(ok.warnings.some((w) => w.includes("darkColors")));
  assert.ok(ok.contrast.length >= 8 && ok.contrast.every((c) => c.pass));
  const bad = lintThemeTokens({ ...tokens, colors: { ...tokens.colors, mutedForeground: "#aaaaaa", primary: "rgb(1,2,3)" }, typography: { ...tokens.typography, headingFont: "Comic Neue" }, darkColors: { foreground: "#222222", background: "#111111" } });
  assert.ok(bad.errors.some((e) => e.includes("primary: #rrggbb")) && bad.errors.some((e) => e.includes("mutedForeground")) && bad.errors.some((e) => e.includes("koyu kip")) && bad.errors.some((e) => e.includes("genel bir aile")));
  assert.equal(lintThemeTokens(null).ok, false);
});

test("bilgi paketi: katalogdan üretilir, bağlamı ve kuralları içerir, kapalı blokları anmaz; tema kipinde jeton şeması", () => {
  const sys = buildDesignSystemPrompt("page", { siteName: "Acme", locale: "tr", sector: "yazılım", knownPaths: ["/tr/iletisim"], media: [{ id: "med_1", alt: "Ofis" }], forms: [{ id: "frm_a", name: "İletişim" }] });
  for (const type of Object.keys(AI_BLOCK_CATALOG)) assert.ok(sys.includes(`* ${type} `), type);
  assert.ok(sys.includes("Acme") && sys.includes("/tr/iletisim") && sys.includes("/media/med_1") && sys.includes("frm_a") && sys.includes("TEK h1"));
  assert.ok(!sys.includes("* slider ") && !sys.includes("countdown"));
  assert.ok(buildDesignSystemPrompt("page").includes("Medya kitaplığı boş"));
  const theme = buildDesignSystemPrompt("theme");
  assert.ok(theme.includes("primaryForeground") && theme.includes("≥ 4.5") && !theme.includes("BLOK KATALOĞU"));
});
