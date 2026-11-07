import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ICON_LABELS,
  ICON_NAMES,
  appendRepeaterItem,
  canAppendRepeaterItem,
  canInsertInto,
  compileBlocksToMarkdown,
  getBlockAncestors,
  summarizeBlockPreview,
  type BlockNode,
} from "../src/index";

describe("block-tree editor helpers", () => {
  const sampleTree: BlockNode[] = [
    {
      id: "sec_1",
      type: "section",
      props: { title: "Kurumsal Mimari", containerMode: "boxed" },
      children: [
        {
          id: "row_1",
          type: "columns",
          props: { layout: "6+6" },
          children: [
            {
              id: "col_1",
              type: "column",
              props: { widthPct: 50 },
              children: [
                {
                  id: "h_1",
                  type: "heading",
                  props: { level: 2, text: "Hızlı ve Modern Blok Editörü" },
                },
              ],
            },
            {
              id: "col_2",
              type: "column",
              props: { widthPct: 50 },
              children: [],
            },
          ],
        },
      ],
    },
  ];

  it("getBlockAncestors returns full ancestor chain from root to target block", () => {
    const chain = getBlockAncestors(sampleTree, "h_1");
    assert.deepEqual(
      chain.map((b) => b.id),
      ["sec_1", "row_1", "col_1", "h_1"]
    );
    assert.deepEqual(getBlockAncestors(sampleTree, "olmayan_id"), []);
  });

  it("summarizeBlockPreview formats layout ratios and truncates long text", () => {
    assert.equal(summarizeBlockPreview(sampleTree[0]!), "Kurumsal Mimari · Kutu");
    assert.equal(summarizeBlockPreview(sampleTree[0]!.children![0]!), "6+6");
    assert.equal(summarizeBlockPreview(sampleTree[0]!.children![0]!.children![0]!), "50%");
    assert.equal(
      summarizeBlockPreview(sampleTree[0]!.children![0]!.children![0]!.children![0]!),
      "Hızlı ve Modern Blok Editörü"
    );
  });

  it("canAppendRepeaterItem and appendRepeaterItem add items to multi-item blocks", () => {
    assert.equal(canAppendRepeaterItem("faq_accordion"), true);
    assert.equal(canAppendRepeaterItem("pricing_table"), true);
    assert.equal(canAppendRepeaterItem("heading"), false);

    const faq: BlockNode = {
      id: "faq_1",
      type: "faq_accordion",
      props: { items: [{ question: "Soru 1?", answer: "Yanıt 1" }] },
    };
    const nextFaq = appendRepeaterItem(faq);
    assert.equal((nextFaq.props.items as unknown[]).length, 2);

    const tabs: BlockNode = {
      id: "tabs_1",
      type: "tabs",
      props: { items: [{ label: "Sekme 1", body: "Metin 1" }] },
      children: [
        {
          id: "tab_pane_1",
          type: "column",
          props: { label: "Sekme 1", icon: "sparkles" },
          children: [
            { id: "h_in_tab", type: "heading", props: { level: 3, text: "Sekme İçi Başlık" } },
          ],
        },
      ],
    };
    const nextTabs = appendRepeaterItem(tabs);
    assert.equal((nextTabs.props.items as unknown[]).length, 2);
    assert.equal((nextTabs.children ?? []).length, 2);
    assert.equal(canInsertInto("tabs", "column"), true);
    assert.equal(canInsertInto("column", "columns"), true);

    const md = compileBlocksToMarkdown([nextTabs]);
    assert.ok(md.includes("### Sekme 1"));
    assert.ok(md.includes("Sekme İçi Başlık"));
  });

  it("ICON_NAMES and ICON_LABELS provide Turkish labels for all built-in SVG icons", () => {
    assert.ok(ICON_NAMES.length >= 40);
    for (const name of ICON_NAMES) {
      assert.ok(typeof ICON_LABELS[name] === "string" && ICON_LABELS[name]!.length > 0, `label missing for ${name}`);
    }
  });
});


it("repairBlockNesting: dışarıda kalan sütun bölüme dönüşür, columns çocukları sütuna sarılır, sorun yoksa aynı dizi", async () => {
  const { repairBlockNesting } = await import("../src/block-tree");
  const ok = [{ id: "r", type: "columns", props: {}, children: [{ id: "c1", type: "column", props: {}, children: [{ id: "p", type: "paragraph_element", props: { text: "a" } }] }] }] as never;
  assert.equal(repairBlockNesting(ok), ok);
  const nested = [{ id: "r", type: "columns", props: {}, children: [{ id: "c1", type: "column", props: {}, children: [{ id: "c2", type: "column", props: {}, style: { cssClass: "x" }, children: [{ id: "p", type: "paragraph_element", props: { text: "a" } }] }] }] }] as never;
  const fixed = repairBlockNesting(nested) as Array<{ children: Array<{ children: Array<{ type: string; style?: unknown; props: unknown }> }> }>;
  const inner = fixed[0]!.children[0]!.children[0]!;
  assert.equal(inner.type, "section");
  assert.deepEqual(inner.props, { containerMode: "full" });
  assert.deepEqual(inner.style, { cssClass: "x" });
  const stray = [{ id: "r", type: "columns", props: {}, children: [{ id: "h", type: "heading_element", props: { text: "t" } }] }] as never;
  const wrapped = repairBlockNesting(stray) as Array<{ children: Array<{ type: string; id: string }> }>;
  assert.equal(wrapped[0]!.children[0]!.type, "column");
  const tabs = [{ id: "t", type: "tabs", props: {}, children: [{ id: "pane", type: "column", props: { label: "A" }, children: [] }] }] as never;
  assert.equal(repairBlockNesting(tabs), tabs);
});
