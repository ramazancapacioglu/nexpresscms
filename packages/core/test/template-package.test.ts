import assert from "node:assert/strict";
import { test } from "node:test";
import { STARTER_TEMPLATES } from "../src/templates";
import { PACKAGE_LIMITS, buildTemplatePackage, parseTemplatePackage, type TemplatePackageItem } from "../src/template-package";

const item = (over: Partial<TemplatePackageItem> = {}): TemplatePackageItem => ({ name: "Test", description: "d", kind: "post", blocks: STARTER_TEMPLATES.find((s) => s.id === "post-default")!.blocks, ...over });
const pack = (items: TemplatePackageItem[]) => buildTemplatePackage(items, { source: "Site", now: new Date("2026-11-03T00:00:00Z") });

test("gidiş-dönüş: tüm hazır şablonlar dışa aktarılıp geri alınır, kimlikler yenilenir", () => {
  const items = STARTER_TEMPLATES.map((s) => ({ name: s.name, description: s.description, kind: s.kind, blocks: s.blocks }));
  const { json } = pack(items);
  const back = parseTemplatePackage(json, "s1");
  assert.ok(back.ok);
  if (!back.ok) return;
  assert.equal(back.items.length, items.length);
  assert.deepEqual(back.items.map((i) => i.kind), items.map((i) => i.kind));
  const first = back.items[0]!.blocks[0]!;
  assert.ok(first.id.endsWith("_s10"), "kimlik yeni tohumla çakışmaz");
  assert.deepEqual(back.warnings, []);
});

test("dışa aktarma: yerel medya başvuruları boşaltılır ve sayılır; dış adresler kalır", () => {
  const blocks = [{ id: "a", type: "image_figure", props: { url: "/media/med_x?w=1&h=1", alt: "x", link: "https://x.test/a.jpg" } }] as never;
  const { json, report } = pack([item({ blocks })]);
  assert.equal(report.removedMedia, 1);
  const parsed = JSON.parse(json);
  assert.equal(parsed.templates[0].blocks[0].props.url, "");
  assert.equal(parsed.templates[0].blocks[0].props.link, "https://x.test/a.jpg");
});

test("içe aktarma güvenliği: javascript:/data: adresleri ve özel CSS temizlenir", () => {
  const blocks = [{ id: "a", type: "cta_banner", props: { buttonHref: "javascript:alert(1)", other: [{ href: "data:text/html,x" }], ok: "/tr/x" }, style: { customCss: "x{background:url(https://evil.test/a)}", backgroundImage: "url(javascript:x)", paddingTop: "10px", tablet: { background: "expression(alert(1))" } } }] as never;
  // Kötü niyetli paket elle üretilmiştir (dışa aktarma zaten temizlerdi): doğrudan JSON
  const json = JSON.stringify({ format: "nexpress-templates", version: 1, templates: [{ name: "Kötü", description: "", kind: "post", blocks }] });
  const r = parseTemplatePackage(json);
  assert.ok(r.ok);
  if (!r.ok) return;
  const b = r.items[0]!.blocks[0]!;
  assert.equal(b.props.buttonHref, "");
  assert.equal((b.props.other as Array<{ href: string }>)[0]!.href, "");
  assert.equal(b.props.ok, "/tr/x");
  assert.equal(b.style?.customCss, undefined);
  assert.equal(b.style?.backgroundImage, undefined);
  assert.equal(b.style?.paddingTop, "10px");
  assert.equal(b.style?.tablet?.background, undefined);
  assert.ok(r.warnings.some((w) => w.includes("güvensiz adres")) && r.warnings.some((w) => w.includes("CSS")));
});

test("reddedilenler: bozuk dosya, yabancı biçim, yeni sürüm, özet uyuşmazlığı, boş paket, fazla şablon", () => {
  assert.equal(parseTemplatePackage("").ok, false);
  assert.equal(parseTemplatePackage("{bozuk").ok, false);
  assert.equal(parseTemplatePackage(JSON.stringify({ format: "baska" })).ok, false);
  const good = JSON.parse(pack([item()]).json);
  assert.equal(parseTemplatePackage(JSON.stringify({ ...good, version: 99 })).ok, false);
  const tampered = { ...good, templates: [{ ...good.templates[0], name: "Elle değişti" }] };
  const t = parseTemplatePackage(JSON.stringify(tampered));
  assert.equal(t.ok, false);
  assert.equal(parseTemplatePackage(JSON.stringify({ ...good, templates: [], checksum: undefined })).ok, false);
  const many = Array.from({ length: PACKAGE_LIMITS.templates + 1 }, () => good.templates[0]);
  assert.equal(parseTemplatePackage(JSON.stringify({ ...good, templates: many, checksum: undefined })).ok, false);
  assert.equal(parseTemplatePackage("x".repeat(PACKAGE_LIMITS.bytes + 1)).ok, false);
});

test("geçersiz şablonlar uyarıyla atlanır, geçerliler alınır; hiç geçerli yoksa ret", () => {
  const good = JSON.parse(pack([item({ name: "İyi" })]).json).templates[0];
  const bad = [
    { ...good, name: "Bilinmeyen tür", kind: "hack" },
    { ...good, name: "Bilinmeyen blok", blocks: [{ id: "x", type: "evil_script", props: {} }] },
    { ...good, name: "", blocks: good.blocks },
    { ...good, name: "Boş", blocks: [] },
  ];
  const r = parseTemplatePackage(JSON.stringify({ format: "nexpress-templates", version: 1, templates: [good, ...bad] }));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.items.map((i) => i.name), ["İyi"]);
  assert.equal(r.warnings.length, 4);
  const none = parseTemplatePackage(JSON.stringify({ format: "nexpress-templates", version: 1, templates: bad }));
  assert.equal(none.ok, false);
});

test("derinlik ve düğüm sınırı", () => {
  let nested: unknown = { id: "leaf", type: "paragraph", props: {} };
  for (let i = 0; i < PACKAGE_LIMITS.depth + 2; i++) nested = { id: `n${i}`, type: "section", props: {}, children: [nested] };
  const r = parseTemplatePackage(JSON.stringify({ format: "nexpress-templates", version: 1, templates: [{ name: "Derin", description: "", kind: "page", blocks: [nested] }] }));
  assert.equal(r.ok, false);
});
