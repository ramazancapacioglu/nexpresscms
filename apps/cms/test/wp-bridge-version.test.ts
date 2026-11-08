import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");

test("WordPress eklenti sürümü panel sabitiyle aynı", () => {
  const php = fs.readFileSync(path.join(root, "plugins/wp-bridge/nexpress-bridge/nexpress-bridge.php"), "utf8");
  const ts = fs.readFileSync(path.join(root, "apps/cms/src/plugins/wp-bridge.ts"), "utf8");
  const phpVersion = php.match(/Version:\s*([0-9.]+)/)?.[1];
  const constVersion = ts.match(/WP_BRIDGE_VERSION = "([0-9.]+)"/)?.[1];
  assert.equal(phpVersion, constVersion);
  assert.ok(php.includes(`define("NEXPRESS_BRIDGE_VERSION", "${constVersion}")`));
});
