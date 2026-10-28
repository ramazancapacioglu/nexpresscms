import assert from "node:assert/strict";
import { test } from "node:test";
import { canInsertInto, findBlock, removeBlockById, updateBlockById } from "../src/block-tree";
import { inlineHtmlToMarkdown, sanitizeInlineHtml } from "../src/inline-html";
import { compileBlocksToMarkdown } from "../src/markdown-compiler";
import { resolveSiteIdFromHost } from "../src/tenancy";
import type { BlockNode } from "../src/types";

const tree: BlockNode[] = [
  {
    id: "cols",
    type: "columns",
    props: {},
    children: [{ id: "c1", type: "column", props: {}, children: [{ id: "p1", type: "paragraph", props: { text: "Merhaba" } }] }],
  },
];

test("blok ağacı: bul, güncelle, sil", () => {
  assert.equal(findBlock(tree, "p1")?.type, "paragraph");
  const updated = updateBlockById(tree, "p1", (b) => ({ ...b, props: { text: "Yeni" } }));
  assert.equal(findBlock(updated, "p1")?.props.text, "Yeni");
  assert.equal(findBlock(tree, "p1")?.props.text, "Merhaba", "orijinal değişmez");
  assert.equal(findBlock(removeBlockById(tree, "p1"), "p1"), null);
});

test("kapsayıcı kuralları", () => {
  assert.equal(canInsertInto(null, "column"), false);
  assert.equal(canInsertInto("columns", "column"), true);
  assert.equal(canInsertInto("columns", "paragraph"), false);
  assert.equal(canInsertInto("column", "column"), false);
});

test("markdown derleyici başlık, TL;DR ve metni üretir", () => {
  const md = compileBlocksToMarkdown(tree, { title: "Başlık", tldr: "Kısa özet" });
  assert.match(md, /^# Başlık/);
  assert.match(md, /TL;DR \(Özet\):\*\* Kısa özet/);
  assert.match(md, /Merhaba/);
  assert.ok(md.endsWith("\n"));
});

test("sanitizeInlineHtml script, olay ve tehlikeli bağlantıları atar", () => {
  const out = sanitizeInlineHtml(
    '<p onclick="x()">a<script>alert(1)</script><a href="javascript:alert(1)">b</a><a href="https://e.com">c</a></p>'
  );
  assert.ok(!/script|onclick|javascript:/i.test(out), out);
  assert.match(out, /href="https:\/\/e\.com"/);
});

test("inlineHtmlToMarkdown kalın ve bağlantıyı çevirir", () => {
  const md = inlineHtmlToMarkdown('<p><strong>kalın</strong> <a href="/x">link</a></p>');
  assert.match(md, /\*\*kalın\*\*/);
  assert.match(md, /\[link\]\(\/x\)/);
});

test("kiracı çözümleme: tek mod ve alt alan adı", () => {
  const prev = { mode: process.env.CMS_MODE, root: process.env.NEXT_PUBLIC_ROOT_DOMAIN };
  try {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "demo.nexpress.com";
    process.env.CMS_MODE = "single";
    assert.equal(resolveSiteIdFromHost("firma.demo.nexpress.com"), "default");
    process.env.CMS_MODE = "multi_subdomain";
    assert.equal(resolveSiteIdFromHost("firma.demo.nexpress.com"), "firma");
    assert.equal(resolveSiteIdFromHost("demo.nexpress.com"), "default");
    assert.equal(resolveSiteIdFromHost("admin.demo.nexpress.com"), "default");
    assert.equal(resolveSiteIdFromHost("A_B!.demo.nexpress.com"), "a_b");
  } finally {
    process.env.CMS_MODE = prev.mode;
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = prev.root;
  }
});
