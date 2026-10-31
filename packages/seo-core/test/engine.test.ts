import assert from "node:assert/strict";
import { test } from "node:test";
import type { BlockNode } from "@nexpress/core";
import { analyzeSeo, resolveSeoMeta, slugify, truncateSmart } from "../src/engine";

const blocks: BlockNode[] = [
  { id: "h", type: "heading", props: { text: "Alt başlık", level: 2 } },
  { id: "p", type: "paragraph", props: { text: "Next.js ile hızlı bir CMS kurmak mümkündür. ".repeat(20) } },
];

test("slugify Türkçe karakterleri dönüştürür", () => {
  assert.equal(slugify("Çılgın Şöför Ürünü"), "cilgin-sofor-urunu");
  assert.equal(slugify("  Çok   boşluk -- var "), "cok-bosluk-var");
});

test("truncateSmart sınırı aşmaz", () => {
  const out = truncateSmart("Bu uzun bir cümledir ve kesilmelidir tamamen", 20);
  assert.ok(out.length <= 21, out);
});

test("analyzeSeo skor ve not üretir; tam girdi boş girdiden iyidir", () => {
  const weak = analyzeSeo({ title: "", slug: "", blocks: [] });
  const good = analyzeSeo({
    title: "Next.js ile hızlı CMS rehberi",
    slug: "nextjs-hizli-cms",
    tldr: "Next.js ile hızlı bir CMS kurmanın kısa yolu.",
    metaTitle: "Next.js ile hızlı CMS rehberi | NexPress",
    metaDescription: "Next.js ve RSC ile sıfır istemci JavaScript'li bir CMS nasıl kurulur, adım adım anlatıyoruz. Hız, SEO ve GEO birlikte.",
    focusKeyword: "cms",
    blocks,
  });
  assert.ok(good.score > weak.score, `${good.score} > ${weak.score}`);
  assert.ok(good.score >= 0 && good.score <= 100);
  assert.ok(["A", "B", "C", "D"].includes(good.grade));
  assert.ok(good.checks.length >= 10);
});

import { slugify as slugifyLocale } from "../src";

test("slugify: Türkçe geriye uyumlu, Almanca/İspanyolca/Fransızca ve NFKD yedeği", () => {
  assert.equal(slugifyLocale("Işık Çözümleri & Öğrenci"), "isik-cozumleri-ogrenci");
  assert.equal(slugifyLocale("Größe und Übung", "de"), "groesse-und-uebung");
  assert.equal(slugifyLocale("¿Cómo está el niño?", "es"), "como-esta-el-nino");
  assert.equal(slugifyLocale("Œuvre à l'écoute", "fr-CA"), "oeuvre-a-lecoute");
  assert.equal(slugifyLocale("Zażółć gęślą", "pl"), "zazolc-gesla");
});

import { analyzeSeo, seoLanguageProfile } from "../src";

test("SEO dil profili: Türkçe I/ı kuralı yalnızca tr/az'da; okunabilirlik eşiği dile göre", () => {
  assert.equal(seoLanguageProfile("tr").lower("INTERNET"), "ınternet");
  assert.equal(seoLanguageProfile("en").lower("INTERNET"), "internet");
  assert.equal(seoLanguageProfile("en-GB").maxAvgSentenceWords, 20);
  assert.equal(seoLanguageProfile("xx").maxAvgSentenceWords, 22);
  const base = { title: "A guide to internet speed for everyone", slug: "internet-speed", focusKeyword: "INTERNET", blocks: [] };
  const en = analyzeSeo({ ...base, locale: "en" }).checks.find((c) => c.id === "kw_title")!;
  assert.equal(en.status, "pass", "İngilizce: INTERNET başlıktaki internet ile eşleşir");
  const tr = analyzeSeo({ ...base, locale: "tr" }).checks.find((c) => c.id === "kw_title")!;
  assert.equal(tr.status, "fail", "Türkçe kuralıyla ınternet ≠ internet (profil farkı)");
});

test("autoCanonical: açıkken sayfa adresi yazılır, kapalıyken yalnızca elle verilen canonical kalır", () => {
  const base = { siteName: "S", baseUrl: "https://x.test", locale: "tr", path: "/tr/yazi", title: "Başlık" };
  assert.equal(resolveSeoMeta({ ...base, settings: { autoCanonical: true } }).canonical, "https://x.test/tr/yazi");
  const off = resolveSeoMeta({ ...base, settings: { autoCanonical: false } });
  assert.equal(off.canonical, undefined);
  assert.equal(off.openGraph.url, "https://x.test/tr/yazi", "OG adresi canonical'sız da dolu");
  assert.equal(resolveSeoMeta({ ...base, canonicalUrl: " https://basla.test/a ", settings: { autoCanonical: false } }).canonical, "https://basla.test/a");
});
