import test from "node:test";
import assert from "node:assert/strict";
import { auditSeo, countImagesMissingAlt, type SeoAuditPage } from "../src";

const page = (over: Partial<SeoAuditPage>): SeoAuditPage => ({ id: "a", locale: "tr", slug: "a", title: "Kurumsal web tasarım hizmetleri", type: "page", status: "published", metaTitle: null, metaDescription: "Kurumsal web siteleri tasarlıyoruz: hızlı, güvenli ve aranabilir. Teklif için bize yazın, iki haftada yayında olun.", tldr: "Kısa özet.", noIndex: false, seoScore: 90, words: 400, focusKeyword: "web tasarım", imagesMissingAlt: 0, ...over });

test("temiz sayfa sorunsuz; her kural kendi sorununu üretir", () => {
  const r = auditSeo([page({ id: "ok" }), page({ id: "x", title: "Kısa", metaDescription: null, tldr: null, words: 20, seoScore: 40, focusKeyword: "", imagesMissingAlt: 2, noIndex: true })]);
  const byId = Object.fromEntries(r.rows.map((x) => [x.id, x.issues.map((i) => i.id).sort()]));
  assert.deepEqual(byId.ok, []);
  assert.deepEqual(byId.x, ["low_score", "missing_alt", "no_description", "no_focus_keyword", "no_tldr", "noindex", "thin_content", "title_length"]);
  assert.equal(r.rows[0]!.id, "x", "en çok sorunlu önde");
  assert.deepEqual([r.summary.pages, r.summary.withErrors, r.summary.clean, r.summary.avgScore], [2, 1, 1, 65]);
  assert.equal(r.summary.byIssue.low_score, 1);
});

test("uzunluk eşikleri, puan eşikleri ve ürünlerde ince içerik uyarısı yok", () => {
  const issues = (p: SeoAuditPage) => auditSeo([p]).rows[0]!.issues.map((i) => i.id);
  assert.ok(issues(page({ metaTitle: "x".repeat(61) })).includes("title_length"));
  assert.ok(issues(page({ metaDescription: "x".repeat(161) })).includes("description_length"));
  assert.ok(issues(page({ metaDescription: "kısa" })).includes("description_length"));
  assert.ok(issues(page({ seoScore: 60 })).includes("low_score") && auditSeo([page({ seoScore: 60 })]).rows[0]!.issues[0]!.level === "warning");
  assert.ok(!issues(page({ type: "product", words: 10 })).includes("thin_content"));
});

test("yinelenen başlık ve açıklama (aynı dilde, büyük/küçük harf duyarsız); farklı dilde yinelenme sayılmaz", () => {
  const r = auditSeo([page({ id: "1", title: "Hizmetler ve Çözümler Sayfası", metaDescription: "Aynı açıklama metni burada yer alıyor ve yeterince uzun olması için bir miktar genişletildi." }), page({ id: "2", title: "hizmetler ve çözümler sayfası", metaDescription: "AYNI açıklama metni burada yer alıyor ve yeterince uzun olması için bir miktar genişletildi." }), page({ id: "3", locale: "en", title: "Hizmetler ve Çözümler Sayfası" })]);
  const ids = (id: string) => r.rows.find((x) => x.id === id)!.issues.map((i) => i.id);
  assert.ok(ids("1").includes("duplicate_title") && ids("1").includes("duplicate_description"));
  assert.ok(ids("2").includes("duplicate_title"));
  assert.ok(!ids("3").includes("duplicate_title"));
});

test("alt metni olmayan görseller iç içe bloklarda da sayılır", () => {
  assert.equal(countImagesMissingAlt([{ type: "image_figure", props: { url: "/media/med_1", altText: "" } }, { type: "image_figure", props: { url: "/media/med_2", altText: "Ofis" } }, { type: "section", children: [{ type: "split_content", props: { image: "/media/med_3", alt: " " } }, { type: "gallery", props: { items: [{ url: "/m/a", alt: "" }, { url: "/m/b", alt: "ok" }] } }] }]), 3);
});
