import test from "node:test";
import assert from "node:assert/strict";
import { auditLinks, extractLinks, type AuditContent } from "../src";

const opts = { baseUrl: "https://x.test", locales: ["tr"] };
const page = (slug: string, markdown = "", extra: Partial<AuditContent> = {}): AuditContent => ({ id: slug, title: slug, slug, locale: "tr", markdown, ...extra });

test("bağlantı çıkarma: Markdown ve href; görseller hariç", () => {
  assert.deepEqual(extractLinks('[a](/tr/x) ![img](/a.png) <a href="/tr/y">y</a>'), ["/tr/x", "/tr/y"]);
});

test("var olan, kırık ve taşınmış iç bağlantılar", () => {
  const r = auditLinks(
    [
      page("ana-sayfa", "[var](/tr/hakkimizda) [yok](/tr/yok) [eski](/tr/eski-ad?x=1#a) [kök](/tr) [abs](https://x.test/tr/hakkimizda/)"),
      page("hakkimizda", "", { slugHistory: ["eski-ad"] }),
    ],
    opts
  );
  assert.deepEqual(r.issues.map((i) => [i.url, i.kind, i.target]), [["/tr/yok", "broken", undefined], ["/tr/eski-ad?x=1#a", "redirect", "hakkimizda"]]);
  assert.equal(r.internalChecked, 5);
});

test("dış, mailto, sistem yolları ve çapa sayılmaz/atlanır", () => {
  const r = auditLinks([page("ana-sayfa", "[d](https://baska.test/x) [m](mailto:a@b.c) [c](#top) [i](/media/1/a.png) [f](/feed.xml) [s](/tr/ara?q=1)")], opts);
  assert.equal(r.issues.length, 0);
  assert.equal(r.externalCount, 1);
  assert.deepEqual(r.external, [{ fromId: "ana-sayfa", fromTitle: "ana-sayfa", url: "https://baska.test/x" }]);
});

test("iç içe yol kırık sayılır", () => {
  const r = auditLinks([page("ana-sayfa", "[x](/tr/a/b)")], opts);
  assert.equal(r.issues[0]!.kind, "broken");
});
