import assert from "node:assert/strict";
import { test } from "node:test";
import { addMenuNode, brokenMenuIds, countMenuNodes, findMenuNode, indentMenuNode, indentMenuNodes, isSafeMenuHref, megaChildLayout, menuLibraryFrom, moveMenuNode, outdentMenuNode, outdentMenuNodes, removeMenuNode, removeMenuNodes, resolveMenuHref, resolveMenuTree, sanitizeMenu, sanitizeMenus, updateMenuNode, type MenuLookup } from "../src/menu";
import type { NavigationMenuItem } from "../src/types";

const lookup: MenuLookup = {
  locale: "tr",
  contents: { c1: { slug: "hakkimizda", published: true }, home: { slug: "ana-sayfa", published: true }, draft: { slug: "taslak", published: false } },
  taxonomies: { t1: { slug: "rehber", type: "category" }, t2: { slug: "seo", type: "tag" } },
  products: { p1: { slug: "kirmizi-ayakkabi", published: true }, p2: { slug: "gizli", published: false } },
};
const L = (id: string, extra: Partial<NavigationMenuItem> = {}): NavigationMenuItem => ({ id, label: id.toUpperCase(), href: `/tr/${id}`, ...extra });

test("adres çözümleme: kaynak türlerine göre güncel adres; eksik/yayında olmayan hedef null", () => {
  assert.equal(resolveMenuHref({ kind: "content", refId: "c1" }, "/eski", lookup), "/tr/hakkimizda");
  assert.equal(resolveMenuHref({ kind: "content", refId: "home" }, "", lookup), "/tr");
  assert.equal(resolveMenuHref({ kind: "content", refId: "draft" }, "", lookup), null);
  assert.equal(resolveMenuHref({ kind: "content", refId: "yok" }, "", lookup), null);
  assert.equal(resolveMenuHref({ kind: "category", refId: "t1" }, "", lookup), "/tr/kategori/rehber");
  assert.equal(resolveMenuHref({ kind: "tag", refId: "t2" }, "", lookup), "/tr/etiket/seo");
  assert.equal(resolveMenuHref({ kind: "category", refId: "t2" }, "", lookup), null, "etiket kimliği kategori olarak çözülmez");
  assert.equal(resolveMenuHref({ kind: "product", refId: "p1" }, "", lookup), "/tr/magaza/kirmizi-ayakkabi");
  assert.equal(resolveMenuHref({ kind: "product", refId: "p2" }, "", lookup), null);
  assert.equal(resolveMenuHref({ kind: "store" }, "", lookup), "/tr/magaza");
  assert.equal(resolveMenuHref({ kind: "home" }, "", lookup), "/tr");
  assert.equal(resolveMenuHref(undefined, "https://x.test/a", lookup), "https://x.test/a");
  assert.equal(resolveMenuHref({ kind: "custom" }, "javascript:alert(1)", lookup), null);
});

test("güvenli adres kuralı", () => {
  for (const ok of ["/tr", "#bolum", "https://a.test", "http://a.test", "mailto:a@b.co", "tel:+90555"]) assert.equal(isSafeMenuHref(ok), true, ok);
  for (const bad of ["javascript:x", "data:text/html,x", "//evil.test", "vbscript:x", "ftp://x", ""]) assert.equal(isSafeMenuHref(bad), false, bad);
});

test("ağaç çözümleme: hedefi olmayan öğe ve altındakiler elenir, adresler güncellenir", () => {
  const tree: NavigationMenuItem[] = [
    L("a", { source: { kind: "content", refId: "c1" }, children: [L("a1", { source: { kind: "content", refId: "draft" }, children: [L("a11")] }), L("a2", { source: { kind: "category", refId: "t1" } })] }),
    L("b", { source: { kind: "product", refId: "p2" } }),
  ];
  const r = resolveMenuTree(tree, lookup);
  assert.deepEqual(r.map((x) => x.id), ["a"]);
  assert.equal(r[0]!.href, "/tr/hakkimizda");
  assert.deepEqual(r[0]!.children!.map((x) => [x.id, x.href]), [["a2", "/tr/kategori/rehber"]]);
  assert.deepEqual(brokenMenuIds(tree, lookup).sort(), ["a1", "b"]);
});

test("temizleme: sınırlar, güvenli adres, tekil kimlik, derinlik 3, mega menü doğrulaması", () => {
  const dirty = [
    L("a", { children: [L("a1", { children: [L("a11", { children: [L("a111")] })] })] }),
    { id: "x", label: "Kötü", href: "javascript:alert(1)" },
    { id: "a", label: "Aynı kimlik", href: "/tr/z" },
    { id: "bos", label: "   ", href: "/tr" },
    { id: "m", label: "Mega", href: "/tr/m", megaMenu: { enabled: true, columns: 99, items: [{ id: "i", label: "K", href: "javascript:x" }, { id: "j", label: "Geçerli", href: "/tr/j" }], promoBanner: { title: "Fırsat", subtitle: "", ctaText: "Git", ctaHref: "https://x.test" } } },
    { id: "kapali", label: "Kapalı", href: "/tr/k", megaMenu: { enabled: false, columns: 3, items: [] } },
    { id: "ext", label: "Dış", href: "https://x.test", target: "_blank" },
  ];
  const clean = sanitizeMenu(dirty);
  assert.deepEqual(clean.map((x) => x.id), ["a", "a_", "m", "kapali", "ext"]);
  assert.equal(findMenuNode(clean, "a111"), null, "4. düzey atılır");
  assert.ok(findMenuNode(clean, "a11"));
  const m = clean.find((x) => x.id === "m")!.megaMenu!;
  assert.equal(m.columns, 4);
  assert.deepEqual(m.items.map((i) => i.label), ["Geçerli"]);
  assert.equal(m.mode, "custom", "mod yok + kart var = eski kayıt, elle kartlar");
  assert.equal(sanitizeMenu([{ id: "z", label: "Z", href: "/tr/z", megaMenu: { enabled: true, columns: 2, items: [] } }])[0]!.megaMenu!.mode, "children");
  assert.ok(m.promoBanner);
  assert.equal(clean.find((x) => x.id === "kapali")!.megaMenu, undefined, "kapalı mega menü saklanmaz");
  assert.equal(clean.find((x) => x.id === "ext")!.target, "_blank");
  assert.equal(sanitizeMenu("bozuk").length, 0);
  const many = sanitizeMenu(Array.from({ length: 300 }, (_, i) => L(`n${i}`)));
  assert.equal(many.length, 200);
});

test("ağaç işlemleri: ekle, sil, taşı, girinti, girinti azalt, güncelle", () => {
  let t: NavigationMenuItem[] = [L("a"), L("b"), L("c")];
  t = moveMenuNode(t, "c", -1);
  assert.deepEqual(t.map((x) => x.id), ["a", "c", "b"]);
  assert.deepEqual(moveMenuNode(t, "a", -1).map((x) => x.id), ["a", "c", "b"], "başta yukarı taşınmaz");
  t = indentMenuNode(t, "c");
  assert.deepEqual(t.map((x) => x.id), ["a", "b"]);
  assert.deepEqual(t[0]!.children!.map((x) => x.id), ["c"]);
  assert.equal(indentMenuNode(t, "a"), t, "ilk öğe girintilenemez");
  t = addMenuNode(t, L("d"), "c");
  assert.equal(findMenuNode(t, "d")!.depth, 3);
  assert.equal(addMenuNode(t, L("e"), "d"), t, "4. düzeye eklenemez");
  const deep = [L("x"), L("y", { children: [L("y1", { children: [L("y11")] })] })];
  assert.equal(indentMenuNode(deep, "y"), deep, "alt ağaç zaten 3 düzeyse girintilenemez (4. düzey olurdu)");
  t = outdentMenuNode(t, "d");
  assert.deepEqual(t[0]!.children!.map((x) => x.id), ["c", "d"]);
  t = outdentMenuNode(t, "c");
  assert.deepEqual(t.map((x) => x.id), ["a", "c", "b"]);
  assert.deepEqual(t[0]!.children!.map((x) => x.id), ["d"]);
  const single = removeMenuNode(addMenuNode([L("p")], L("q"), "p"), "q");
  assert.equal(single[0]!.children, undefined, "boş çocuk listesi kalmaz");
  t = updateMenuNode(t, "b", { label: "Yeni ad" });
  assert.equal(findMenuNode(t, "b")!.node.label, "Yeni ad");
  t = removeMenuNode(t, "d");
  assert.equal(countMenuNodes(t), countMenuNodes(t));
  assert.equal(findMenuNode(removeMenuNode(t, "a"), "a"), null);
});

test("çoklu seçim: kardeşler aynı üstün altına iner, silme altları da götürür", () => {
  const tree = [L("a"), L("b"), L("c", { children: [L("c1")] })];
  const indented = indentMenuNodes(tree, ["b", "c"]);
  assert.deepEqual(indented.map((x) => x.id), ["a"]);
  assert.deepEqual(indented[0]!.children!.map((x) => x.id), ["b", "c"]);
  const back = outdentMenuNodes(indented, ["b", "c"]);
  assert.deepEqual(back.map((x) => x.id), ["a", "b", "c"]);
  const gone = removeMenuNodes(tree, ["c"]);
  assert.equal(findMenuNode(gone, "c1"), null);
});

test("menü kitaplığı ve mega alt liste", () => {
  const lib = sanitizeMenus([
    { id: "m1", name: "Ana", header: true, items: [L("a", { icon: "rocket" })] },
    { id: "m1", name: "Footer", header: true, items: [L("b")] },
  ]);
  assert.equal(lib.length, 2);
  assert.equal(lib[0]!.header, true);
  assert.equal(lib[1]!.header, false);
  assert.equal(lib[1]!.id, "m1_");
  assert.equal(lib[0]!.items[0]!.icon, "rocket");
  assert.equal(menuLibraryFrom([L("z")], undefined)[0]!.id, "menu_header");
  const parent = L("p", { megaMenu: { enabled: true, mode: "children", columns: 3, items: [] }, children: [L("k1"), L("k2")] });
  assert.equal(megaChildLayout(parent), "list");
  const columns = L("p", { megaMenu: { enabled: true, mode: "children", columns: 3, items: [] }, children: [L("k1", { children: [L("g")] })] });
  assert.equal(megaChildLayout(columns), "columns");
  const cards = L("p", { megaMenu: { enabled: true, mode: "custom", columns: 2, items: [{ id: "c", label: "Kart", href: "/tr" }] }, children: [L("k1")] });
  assert.equal(megaChildLayout(cards), "cards-and-list");
});
