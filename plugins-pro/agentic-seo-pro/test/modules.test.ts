import test from "node:test";
import assert from "node:assert/strict";
import { buildAiFeed, freshnessOf, importanceOf, type FeedSource } from "../src/geo/ai-feed";
import { buildAiPluginManifest, buildNlwebManifest, buildOpenApiYaml } from "../src/geo/discovery-files";
import { contentSignalLine } from "../src/geo/content-signal";
import { buildGeoMeta, buildLocalBusinessNode } from "../src/schema/local-seo";
import { addSpeakable } from "../src/schema/speakable";
import { findStale } from "../src/content-ops/freshness";

const now = new Date("2026-10-28T00:00:00Z");
const d = (days: number) => new Date(now.getTime() - days * 86_400_000);
const src = (o: Partial<FeedSource>): FeedSource => ({ id: "i", title: "T", slug: "t", type: "page", schemaType: "WebPage", importanceScore: 5, tldr: null, updatedAt: d(10), publishedAt: d(10), ...o });

test("ai-feed: önem sıralaması, blog yaş azalması, tazelik, ana sayfa adresi", () => {
  assert.equal(importanceOf(src({ importanceScore: 9 }), now), 0.9);
  assert.equal(importanceOf(src({ type: "post", publishedAt: d(0) }), now), 0.7);
  assert.equal(importanceOf(src({ type: "post", publishedAt: d(2000) }), now), 0.4);
  assert.equal(freshnessOf(d(30), now), "fresh");
  assert.equal(freshnessOf(d(120), now), "aging");
  assert.equal(freshnessOf(d(400), now), "stale");
  const feed = buildAiFeed({ siteName: "S", baseUrl: "https://x.test/", locale: "tr", now, items: [src({ id: "a", slug: "a", importanceScore: 3 }), src({ id: "h", slug: "ana-sayfa", importanceScore: 10 })] });
  assert.deepEqual(feed.items.map((i) => i.id), ["h", "a"]);
  assert.equal(feed.items[0]!.url, "https://x.test/tr");
  assert.equal(feed.items[1]!.markdownUrl, "https://x.test/tr/a?format=md");
});

test("keşif dosyaları: yalnızca var olan uç noktaları bildirir", () => {
  const i = { siteName: "Akın Yazılım", description: "Açıklama", baseUrl: "https://x.test/" };
  assert.equal(buildNlwebManifest(i).ask.url, "https://x.test/api/mcp");
  assert.equal(buildAiPluginManifest(i).name_for_model, "ak_n_yaz_l_m");
  assert.equal(buildAiPluginManifest(i).api.url, "https://x.test/.well-known/openapi.yaml");
  const yaml = buildOpenApiYaml(i);
  assert.match(yaml, /^openapi: 3\.0\.3/);
  assert.match(yaml, /\/api\/mcp:/);
  assert.doesNotMatch(yaml, /\/lead|\/support-ticket/);
});

test("Content-Signal: bot politikasından türer", () => {
  assert.equal(contentSignalLine({}), "Content-Signal: search=yes, ai-input=yes, ai-train=yes");
  assert.equal(contentSignalLine({ ccbot: "block", bytespider: "block", "meta-agent": "block" }), "Content-Signal: search=yes, ai-input=yes, ai-train=no");
  assert.equal(contentSignalLine({ ccbot: "block" }), "Content-Signal: search=yes, ai-input=yes, ai-train=yes", "kısmi engel eğitimi kapatmaz");
});

test("LocalBusiness: boşsa null, doluysa adres+geo; geo meta", () => {
  const ctx = { siteName: "Site", url: "https://x.test/tr", id: "https://x.test/tr#local" };
  assert.equal(buildLocalBusinessNode({}, ctx), null);
  const node = buildLocalBusinessNode({ city: "İzmir", street: "Cad. 1", latitude: 38.4, longitude: 27.1, phone: " 0232 " }, ctx)!;
  assert.equal(node["@type"], "LocalBusiness");
  assert.equal(node.telephone, "0232");
  assert.deepEqual((node.address as Record<string, unknown>).addressCountry, "TR");
  assert.deepEqual(node.geo, { "@type": "GeoCoordinates", latitude: 38.4, longitude: 27.1 });
  assert.deepEqual(buildGeoMeta({ city: "İzmir", region: "35", latitude: 38.4, longitude: 27.1 }).map((t) => t.name), ["geo.region", "geo.placename", "geo.position", "ICBM"]);
  assert.equal(buildLocalBusinessNode({ latitude: "", longitude: "" }, ctx), null);
});

test("Speakable: yalnızca makale/sayfa düğümlerine, mevcut olana dokunmaz", () => {
  const out = addSpeakable([{ "@type": "BlogPosting" }, { "@type": "Organization" }, { "@type": "WebPage", speakable: { x: 1 } }]);
  assert.equal((out[0]!.speakable as { "@type": string })["@type"], "SpeakableSpecification");
  assert.equal(out[1]!.speakable, undefined);
  assert.deepEqual(out[2]!.speakable, { x: 1 });
});

test("tazelik: süresi dolanlar önce, sonra en eski; yeni içerik görünmez", () => {
  const items = [
    { id: "1", title: "yeni", slug: "1", type: "page", updatedAt: d(10) },
    { id: "2", title: "eski", slug: "2", type: "page", updatedAt: d(300) },
    { id: "3", title: "daha eski", slug: "3", type: "page", updatedAt: d(500) },
    { id: "4", title: "kampanya", slug: "4", type: "campaign", updatedAt: d(20), expiresAt: d(1) },
  ];
  const r = findStale(items, now);
  assert.deepEqual(r.map((i) => [i.id, i.reason]), [["4", "expired"], ["3", "stale"], ["2", "stale"]]);
});

import { buildAskResult } from "../src/geo/ask";

test("NLWeb ask: bilinmeyen içerik atlanır, sıra yeniden numaralanır, ana sayfa kök adres", () => {
  const r = buildAskResult({
    query: "q", baseUrl: "https://x.test/", locale: "tr", ranking: "hybrid",
    hits: [{ contentId: "yok" }, { contentId: "h" }, { contentId: "a" }],
    contents: [
      { contentId: "h", slug: "ana-sayfa", title: "Ana", schemaType: "WebPage", tldr: null },
      { contentId: "a", slug: "a", title: "A", schemaType: "", tldr: "özet" },
    ],
  });
  assert.equal(r.numberOfItems, 2);
  assert.deepEqual(r.itemListElement.map((i) => [i.position, i.item.url]), [[1, "https://x.test/tr"], [2, "https://x.test/tr/a"]]);
  assert.equal(r.itemListElement[1]!.item["@type"], "WebPage");
  assert.equal(r.retrieval, "hybrid");
});

import { validateAgentRequest } from "../src/agent/requests";

test("ajan talebi doğrulama: zorunlu alanlar, e-posta, telefon, slug, kontrol karakterleri", () => {
  const ok = validateAgentRequest("lead", { companyName: " ACME ", contactEmail: "A@X.test", message: "Merhaba\u0000dünya", requestedProductSlug: "erp-1" });
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.equal(ok.value.email, "a@x.test");
    assert.equal(ok.value.company, "ACME");
    assert.equal(ok.value.name, "ACME");
    assert.equal(ok.value.message, "Merhabadünya");
    assert.equal(ok.value.productSlug, "erp-1");
  }
  assert.deepEqual(validateAgentRequest("lead", { email: "a@x.test" }), { ok: false, error: "name (veya companyName) gerekli." });
  assert.match((validateAgentRequest("lead", { name: "A", email: "bozuk" }) as { error: string }).error, /e-posta/);
  assert.match((validateAgentRequest("lead", { name: "A", email: "a@x.test", phone: "abc" }) as { error: string }).error, /phone/);
  assert.match((validateAgentRequest("lead", { name: "A", email: "a@x.test", productSlug: "../etc" }) as { error: string }).error, /productSlug/);
  assert.match((validateAgentRequest("ticket", { name: "A", email: "a@x.test", message: "kısa" }) as { error: string }).error, /message/);
  assert.ok(validateAgentRequest("demo", { name: "A", email: "a@x.test", message: "Salı 14:00" }).ok);
  assert.equal((validateAgentRequest("lead", { name: "x".repeat(500), email: "a@x.test" }) as { value: { name: string } }).value.name.length, 120);
});
