import test from "node:test";
import assert from "node:assert/strict";
import { buildPlan, parseWxr, WxrError } from "../src";

const WXR = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
<title>Eski Site</title><link>https://eski.example</link><language>tr-TR</language>
<wp:base_site_url>https://eski.example</wp:base_site_url>
<wp:category><wp:term_id>2</wp:term_id><wp:category_nicename>haberler</wp:category_nicename><wp:category_parent></wp:category_parent><wp:cat_name><![CDATA[Haberler]]></wp:cat_name></wp:category>
<wp:category><wp:term_id>3</wp:term_id><wp:category_nicename>uncategorized</wp:category_nicename><wp:category_parent></wp:category_parent><wp:cat_name><![CDATA[Uncategorized]]></wp:cat_name></wp:category>
<wp:tag><wp:term_id>9</wp:term_id><wp:tag_slug>seo</wp:tag_slug><wp:tag_name><![CDATA[SEO]]></wp:tag_name></wp:tag>
<item><title>Görsel</title><wp:post_id>50</wp:post_id><wp:post_type>attachment</wp:post_type><wp:status>inherit</wp:status><wp:attachment_url>https://eski.example/wp-content/uploads/kapak.jpg</wp:attachment_url></item>
<item>
 <title><![CDATA[Merhaba <b>Dünya</b>]]></title>
 <link>https://eski.example/2025/03/merhaba-dunya/</link>
 <dc:creator><![CDATA[ayse]]></dc:creator>
 <content:encoded><![CDATA[<!-- wp:paragraph --><p>Bu yazı yeterince uzun bir ilk paragraf içeriyor ve özet olarak kullanılacak.</p><!-- /wp:paragraph -->[gallery ids="1"]]]></content:encoded>
 <excerpt:encoded><![CDATA[Kısa özet]]></excerpt:encoded>
 <wp:post_id>10</wp:post_id><wp:post_date>2025-03-01 10:00:00</wp:post_date><wp:post_date_gmt>2025-03-01 07:00:00</wp:post_date_gmt>
 <wp:post_name><![CDATA[merhaba-d%c3%bcnya]]></wp:post_name><wp:status>publish</wp:status><wp:post_type>post</wp:post_type>
 <category domain="category" nicename="haberler"><![CDATA[Haberler]]></category>
 <category domain="category" nicename="uncategorized"><![CDATA[Uncategorized]]></category>
 <category domain="post_tag" nicename="seo"><![CDATA[SEO]]></category>
 <wp:postmeta><wp:meta_key><![CDATA[_thumbnail_id]]></wp:meta_key><wp:meta_value><![CDATA[50]]></wp:meta_value></wp:postmeta>
 <wp:postmeta><wp:meta_key><![CDATA[_yoast_wpseo_title]]></wp:meta_key><wp:meta_value><![CDATA[Özel SEO başlığı]]></wp:meta_value></wp:postmeta>
 <wp:postmeta><wp:meta_key><![CDATA[_yoast_wpseo_metadesc]]></wp:meta_key><wp:meta_value><![CDATA[%%title%% %%sep%% %%sitename%%]]></wp:meta_value></wp:postmeta>
</item>
<item><title>Taslak</title><link>https://eski.example/?p=11</link><wp:post_id>11</wp:post_id><wp:post_name></wp:post_name><wp:status>draft</wp:status><wp:post_type>page</wp:post_type><content:encoded><![CDATA[Tek satır]]></content:encoded></item>
<item><title>Özel</title><wp:post_id>12</wp:post_id><wp:status>private</wp:status><wp:post_type>post</wp:post_type><wp:post_name>ozel</wp:post_name><link>https://eski.example/ozel/</link><content:encoded><![CDATA[<p>x</p>]]></content:encoded></item>
<item><title>Menü</title><wp:post_id>13</wp:post_id><wp:status>publish</wp:status><wp:post_type>nav_menu_item</wp:post_type></item>
<item><title>Çöp</title><wp:post_id>14</wp:post_id><wp:status>trash</wp:status><wp:post_type>post</wp:post_type></item>
<item><title>Ürün</title><wp:post_id>15</wp:post_id><wp:status>publish</wp:status><wp:post_type>product</wp:post_type><wp:post_name>urun</wp:post_name><link>https://eski.example/urun/urun/</link><content:encoded><![CDATA[<p>Ürün açıklaması</p>]]></content:encoded></item>
</channel></rss>`;

test("WXR okuyucu: site, terimler, öğeler, CDATA, meta, kategori/etiket, tarih (GMT)", () => {
  const d = parseWxr(WXR);
  assert.equal(d.siteTitle, "Eski Site");
  assert.equal(d.baseUrl, "https://eski.example");
  assert.deepEqual(d.terms.map((t) => [t.kind, t.slug, t.name]), [["category", "haberler", "Haberler"], ["category", "uncategorized", "Uncategorized"], ["tag", "seo", "SEO"]]);
  const post = d.items.find((i) => i.id === "10")!;
  assert.equal(post.title, "Merhaba <b>Dünya</b>");
  assert.deepEqual([post.categories, post.tags], [["haberler", "uncategorized"], ["seo"]]);
  assert.equal(post.date!.toISOString(), "2025-03-01T07:00:00.000Z");
  assert.equal(post.meta._thumbnail_id, "50");
  assert.equal(d.items.find((i) => i.type === "attachment")!.attachmentUrl.endsWith("kapak.jpg"), true);
});

test("WXR güvenliği: ENTITY, bozuk XML, WXR olmayan dosya ve boş girdi reddedilir", () => {
  assert.throws(() => parseWxr(`<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "aaaa">]><rss><channel/></rss>`), WxrError);
  assert.throws(() => parseWxr("<rss><channel><item></rss>"), WxrError);
  assert.throws(() => parseWxr("<html><body/></html>"), WxrError);
  assert.throws(() => parseWxr(""), WxrError);
});

test("içe aktarma planı: tür/durum eşleme, slug, SEO alanları, şablon değişkenleri atılır, öne çıkan görsel, yönlendirme yolu, atlananlar", () => {
  const plan = buildPlan(parseWxr(WXR), { locale: "tr", types: ["post", "page", "product"], includeDrafts: true });
  assert.deepEqual(plan.items.map((i) => [i.wpId, i.contentType, i.status, i.visibility]), [["10", "post", "published", "public"], ["11", "page", "draft", "public"], ["12", "post", "published", "private"], ["15", "product", "published", "public"]]);
  const p = plan.items[0]!;
  assert.equal(p.title, "Merhaba Dünya");
  assert.equal(p.slug, "merhaba-dunya");
  assert.equal(p.metaTitle, "Özel SEO başlığı");
  assert.equal(p.metaDescription, "", "%%title%% gibi şablon değişkenleri alınmaz");
  assert.equal(p.featuredImageUrl, "https://eski.example/wp-content/uploads/kapak.jpg");
  assert.equal(p.oldPath, "/2025/03/merhaba-dunya/");
  assert.deepEqual([p.categories, p.tags], [["haberler"], ["seo"]], "uncategorized atılır");
  assert.ok(p.tldr.startsWith("Bu yazı yeterince uzun"));
  assert.equal(p.excerpt, "Kısa özet");
  assert.ok(p.warnings.some((w) => w.includes("gallery")));
  assert.equal(plan.items[1]!.oldPath, "", "?p=ID biçimi yönlendirilemez");
  assert.equal(plan.items[1]!.slug, "taslak");
  assert.ok(plan.items[3]!.warnings.some((w) => w.includes("fiyat")));
  assert.deepEqual(plan.skipped, { "tür: nav_menu_item": 1, "durum: trash": 1 });
  assert.deepEqual(plan.imageUrls, ["https://eski.example/wp-content/uploads/kapak.jpg"]);
  assert.deepEqual([plan.totals.posts, plan.totals.pages, plan.totals.products, plan.totals.drafts, plan.totals.attachments], [2, 1, 1, 1, 1]);
});

test("seçenekler: taslaklar ve türler süzülür", () => {
  const plan = buildPlan(parseWxr(WXR), { locale: "tr", types: ["post"], includeDrafts: false });
  assert.deepEqual(plan.items.map((i) => i.wpId), ["10", "12"]);
  assert.equal(plan.skipped["seçilmedi: page"], 1);
  assert.equal(plan.skipped["seçilmedi: product"], 1);
});
