import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeSchemaPlacements, schemaPlacementFor } from "../src/site-settings";

test("şema kuralı temizlenir; kategori kuralı yazı türünden önce gelir", () => {
  const rules = sanitizeSchemaPlacements([
    { id: "sch_blog", name: "Blog", schemaType: "BlogPosting", scope: "post", category: "", enabled: true },
    { id: "sch_sss", name: "SSS", schemaType: "FAQPage", scope: "category", category: "sss", enabled: true },
    { id: "bad", name: "", schemaType: "Nope", scope: "page" },
  ]);
  assert.equal(rules.length, 2);
  const hit = schemaPlacementFor(rules, { type: "post", schemaType: "BlogPosting", categories: ["sss"] });
  assert.equal(hit?.schemaType, "FAQPage");
  const kept = schemaPlacementFor(rules, { type: "page", schemaType: "SoftwareApplication", categories: ["sss"] });
  assert.equal(kept, null);
});
