import test from "node:test";
import assert from "node:assert/strict";
import { rewriteAbsoluteUrl, rewriteBlockLinks, rewriteTextLinks } from "../src/links";

const origin = "https://www.ornek.test";

test("iç bağlantı yerel yola iner, www ve yalın alan aynı sayılır", () => {
  assert.equal(rewriteAbsoluteUrl("https://ornek.test/hakkimizda/", origin, ""), "/hakkimizda/");
  assert.equal(rewriteAbsoluteUrl("https://www.ornek.test/blog/yazi", origin, "/tr"), "/tr/blog/yazi");
  assert.equal(rewriteAbsoluteUrl("https://www.ornek.test", origin, ""), "/");
});

test("posta, telefon ve başka site durur", () => {
  assert.equal(rewriteAbsoluteUrl("mailto:bilgi@ornek.test", origin, ""), "mailto:bilgi@ornek.test");
  assert.equal(rewriteAbsoluteUrl("tel:+902320000000", origin, ""), "tel:+902320000000");
  assert.equal(rewriteAbsoluteUrl("https://baska.test/sayfa", origin, ""), "https://baska.test/sayfa");
});

test("HTML ve blok adresleri taranır", () => {
  const html = rewriteTextLinks('<a href="https://ornek.test/iletisim">Yaz</a>', origin, "");
  assert.equal(html.count, 1);
  assert.equal(html.text, '<a href="/iletisim">Yaz</a>');
  const blocks = rewriteBlockLinks(
    [{ id: "b1", type: "button_element", props: { label: "Demo", href: "https://www.ornek.test/demo" } }],
    origin,
    "",
  );
  assert.equal(blocks.count, 1);
  assert.equal(blocks.blocks[0]?.props.href, "/demo");
});
