import assert from "node:assert/strict";
import test from "node:test";
import { AKINSOFT_DEMO_HOME_SLUG, getThemeDemoPack } from "../src/demo-pack";

test("AKINSOFT demo paketi benzersiz adresler ve ayrı vitrin kullanır", () => {
  const pack = getThemeDemoPack("akinsoft-merkez");
  assert.ok(pack);
  assert.equal(pack.homeSlug, AKINSOFT_DEMO_HOME_SLUG);
  assert.notEqual(pack.homeSlug, "ana-sayfa");
  const slugs = pack.entries.map((entry) => entry.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(slugs.includes(AKINSOFT_DEMO_HOME_SLUG));
  assert.ok(pack.entries.some((entry) => entry.type === "post"));
  assert.ok(pack.entries.some((entry) => entry.slug === "e-donusum"));
  assert.equal(getThemeDemoPack("corporate-aurora"), null);
});
