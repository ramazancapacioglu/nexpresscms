import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_HEADER_ZONES, deriveMobileZones, resolveHeaderZones, resolveMobileHeaderZones, socialLinksFromSameAs, zonesToWidgets } from "../src/header-layout";

test("boş diziler şerit varsayılanına düşer", () => {
  const zones = resolveHeaderZones({ leftWidgets: [], centerWidgets: [], rightWidgets: [] }, DEFAULT_HEADER_ZONES.main);
  assert.deepEqual(zones, DEFAULT_HEADER_ZONES.main);
});

test("yalnızca bilinmeyen kimlik varsa varsayılan kullanılır", () => {
  const zones = resolveHeaderZones({ leftWidgets: ["geo_selector"], centerWidgets: [], rightWidgets: [] }, DEFAULT_HEADER_ZONES.top);
  assert.deepEqual(zones, DEFAULT_HEADER_ZONES.top);
});

test("eski kimlikler kanonik öğeye çevrilir ve sıra korunur", () => {
  const zones = resolveHeaderZones(
    {
      leftWidgets: ["logo"],
      centerWidgets: ["mega_menu"],
      rightWidgets: ["search_bar", "cta_button", "contact_info"],
    },
    DEFAULT_HEADER_ZONES.main,
  );
  assert.deepEqual(zones, { left: ["logo"], center: ["menu"], right: ["search", "cta", "contact"] });
});

test("aynı öğe iki bölgedeyse soldan sağa ilk konum kalır", () => {
  const zones = resolveHeaderZones(
    { leftWidgets: ["campaign_links"], centerWidgets: ["links", "category_drawer"], rightWidgets: [] },
    DEFAULT_HEADER_ZONES.bottom,
  );
  assert.deepEqual(zones, { left: ["links"], center: [], right: [] });
});

test("bölgeler widget dizisine geri yazılır", () => {
  const widgets = zonesToWidgets({ left: ["logo"], center: ["menu"], right: ["cta"] });
  assert.deepEqual(widgets, { leftWidgets: ["logo"], centerWidgets: ["menu"], rightWidgets: ["cta"] });
});

test("mobil düzen yazılmamışsa logo solda, kalan öğeler sağda", () => {
  const desktop = { left: ["logo"] as const, center: ["menu"] as const, right: ["search", "cta"] as const };
  assert.deepEqual(deriveMobileZones(desktop), { left: ["logo"], center: [], right: ["menu", "search", "cta"] });
  assert.deepEqual(resolveMobileHeaderZones({}, desktop), { left: ["logo"], center: [], right: ["menu", "search", "cta"] });
});

test("yazılı mobil dizi masaüstünü ezer", () => {
  const zones = resolveMobileHeaderZones(
    { mobileLeftWidgets: ["logo", "search"], mobileRightWidgets: ["menu"] },
    { left: ["logo"], center: ["menu"], right: ["cta"] },
  );
  assert.deepEqual(zones, { left: ["logo", "search"], center: [], right: ["menu"] });
});

test("yeni öğeler (telefon, e-posta, ikinci düğme, sosyal, sepet, metin, ayırıcı) her şeritte çözülür", () => {
  const zones = resolveHeaderZones(
    { leftWidgets: ["logo", "divider"], centerWidgets: ["menu"], rightWidgets: ["phone", "social", "cart", "button2", "cta", "html", "email"] },
    DEFAULT_HEADER_ZONES.main,
  );
  assert.deepEqual(zones, { left: ["logo", "divider"], center: ["menu"], right: ["phone", "social", "cart", "button2", "cta", "html", "email"] });
});

test("öğe başlıkları her öğe için tanımlı", async () => {
  const { HEADER_WIDGETS, HEADER_WIDGET_META } = await import("../src/header-layout");
  for (const id of HEADER_WIDGETS) assert.ok(HEADER_WIDGET_META[id].label.length > 1 && HEADER_WIDGET_META[id].hint.length > 3, id);
});

test("sosyal bağlantılar: yalnızca https, ad eşlenir, tekrar ve bozuk adres atılır", () => {
  const out = socialLinksFromSameAs(["https://www.linkedin.com/company/x", "http://insecure.test/a", "javascript:alert(1)", "not a url", "https://x.com/firma", "https://www.linkedin.com/company/x", "https://ornek.org/profil"]);
  assert.deepEqual(out.map((i) => i.label), ["LinkedIn", "X", "ornek.org"]);
  assert.deepEqual(socialLinksFromSameAs(undefined), []);
});

test("telefon düzeni: geniş öğeler (telefon, e-posta, ikinci düğme, sosyal, metin, ayırıcı) kendiliğinden gelmez", () => {
  const mobile = deriveMobileZones({ left: ["logo"], center: ["menu", "phone", "divider"], right: ["search", "button2", "social", "cta", "cart"] });
  assert.deepEqual(mobile, { left: ["logo"], center: [], right: ["menu", "search", "cta", "cart"] });
});
