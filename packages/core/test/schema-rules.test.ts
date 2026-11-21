import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdditionalSchemaNodes,
  buildPlacementExtraProps,
  expandSchemaVariables,
  matchesSchemaPlacement,
  resolveSchemaPlacements,
  sanitizeSchemaPlacements,
  schemaPlacementFor,
} from "../src/schema-rules";

describe("schema-rules", () => {
  it("eski 6 alanlı kayıtlarla geriye dönük uyumludur", () => {
    const clean = sanitizeSchemaPlacements([
      { id: "r1", name: "Blog kuralı", schemaType: "BlogPosting", scope: "post", category: "", enabled: true },
      { id: "r2", name: "ERP kategorisi", schemaType: "TechArticle", scope: "category", category: "erp", enabled: true },
    ]);
    assert.equal(clean.length, 2);
    assert.deepEqual(clean[1]?.categories, ["erp"]);
    const hit = schemaPlacementFor(clean, { type: "post", schemaType: "BlogPosting", categories: ["erp"] });
    assert.equal(hit?.id, "r2");
  });

  it("dahil et, hariç tut, öncelik ve ek @graph düğümlerini doğru çözer", () => {
    const rules = sanitizeSchemaPlacements([
      {
        id: "all_blog",
        name: "Tüm Blog",
        schemaType: "BlogPosting",
        scope: "post",
        category: "",
        excludeCategories: ["duyuru"],
        enabled: true,
      },
      {
        id: "specific_page",
        name: "Özel Hizmet",
        schemaType: "Service",
        scope: "content",
        category: "",
        contentIds: ["cnt_1"],
        mode: "primary",
        speakable: true,
        properties: { serviceType: "%title% Hizmeti", areaServed: "İzmir" },
        entities: [{ relation: "about", name: "ERP", type: "SoftwareApplication", sameAs: "https://www.wikidata.org/wiki/Q131508" }],
        enabled: true,
      },
      {
        id: "extra_local",
        name: "Yerel İşletme Ek Düğüm",
        schemaType: "LocalBusiness",
        scope: "all",
        category: "",
        mode: "additional",
        properties: { areaServed: "İzmir, Türkiye" },
        enabled: true,
      },
    ]);

    assert.equal(
      matchesSchemaPlacement(rules[0]!, { type: "post", schemaType: "Article", categories: ["duyuru"] }),
      false
    );
    const resolved = resolveSchemaPlacements(rules, {
      contentId: "cnt_1",
      type: "page",
      schemaType: "WebPage",
      categories: [],
    });
    assert.equal(resolved.primary?.id, "specific_page");
    assert.equal(resolved.additional.length, 1);
    assert.equal(resolved.additional[0]?.id, "extra_local");

    const vars = {
      title: "Wolvox ERP",
      tldr: "Kurumsal kaynak planlama",
      url: "https://ornek.com/wolvox-erp",
      site: "Akınsoft İzmir",
      siteUrl: "https://ornek.com",
    };
    const extra = buildPlacementExtraProps(resolved.primary, vars);
    assert.equal(extra.serviceType, "Wolvox ERP Hizmeti");
    assert.deepEqual(extra.speakable, { "@type": "SpeakableSpecification", cssSelector: ["h1", ".nx-tldr"] });
    assert.deepEqual(extra.about, {
      "@type": "SoftwareApplication",
      name: "ERP",
      sameAs: "https://www.wikidata.org/wiki/Q131508",
    });

    const nodes = buildAdditionalSchemaNodes(resolved.additional, vars);
    assert.equal(nodes[0]?.["@type"], "LocalBusiness");
    assert.equal(nodes[0]?.["@id"], "https://ornek.com/wolvox-erp#rule-extra_local");
  });

  it("tehlikeli property anahtarlarını ve geçersiz sameAs adreslerini ayıklar", () => {
    const clean = sanitizeSchemaPlacements([
      {
        id: "sec",
        name: "Güvenlik testi",
        schemaType: "Service",
        scope: "all",
        category: "",
        properties: { "@type": "Evil", __proto__: "x", serviceType: "Danışmanlık" },
        entities: [{ relation: "about", name: "Test", sameAs: "javascript:alert(1)" }],
        enabled: true,
      },
    ]);
    assert.deepEqual(clean[0]?.properties, { serviceType: "Danışmanlık" });
    assert.equal(clean[0]?.entities?.[0]?.sameAs, undefined);
    assert.equal(expandSchemaVariables("%title% | %site%", { title: "A", url: "https://x", site: "B", siteUrl: "https://x" }), "A | B");
  });
});
