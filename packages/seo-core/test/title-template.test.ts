import assert from "node:assert/strict";
import test from "node:test";
import { healCutDescription, normalizeTitleTemplate, resolveSeoMeta } from "../src/engine";

const base = { siteName: "Akınsoft İzmir Ana Bayi", tagline: "Yazılım", baseUrl: "https://x.test", locale: "tr", path: "/akinsoft", title: "Akınsoft" };

test("başka SEO eklentilerinin değişkenleri kendi kümemize çevrilir, tanınmayanlar atılır", () => {
  assert.equal(normalizeTitleTemplate("%%title%% %%sep%% %%sitename%%"), "%title% %sep% %site%");
  assert.equal(normalizeTitleTemplate("%title% %sep% %sitename% %bilinmeyen%"), "%title% %sep% %site% ");
});

test("ana sayfa şablonu sayfa şablonu olarak yazılmışsa sayfa başlığı yine doğru çıkar (canlıdaki '|' hatası)", () => {
  // `%sitename% %sep% %sitedesc%`: eskiden bilinmeyen değişken boşalıp yalnız "|" kalıyordu
  const meta = resolveSeoMeta({ ...base, settings: { titleTemplate: "%sitename% %sep% %sitedesc%" } as never });
  assert.ok(/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(meta.title), meta.title);
  assert.notEqual(meta.title, "|");
  // Eski kayıtlı değişken `%page%`: başlığa çözülür
  const only = resolveSeoMeta({ ...base, settings: { titleTemplate: "%sep%" } as never });
  assert.equal(only.title, "Akınsoft | Akınsoft İzmir Ana Bayi");
});

test("normal şablon ve yedek davranış", () => {
  assert.equal(resolveSeoMeta({ ...base }).title, "Akınsoft | Akınsoft İzmir Ana Bayi");
  assert.equal(resolveSeoMeta({ ...base, settings: { titleTemplate: "%title% — %site%" } as never }).title, "Akınsoft — Akınsoft İzmir Ana Bayi");
  assert.equal(resolveSeoMeta({ ...base, title: "-40% indirim" }).title.startsWith("-40%"), true);
});

test("yarıda kesilmiş açıklama toparlanır; tam cümle ve kısa metin değişmez", () => {
  const cut = "Türkiye’nin Yerli Yazılım Markası Akınsoft — İzmir Ana Bayi AKINSOFT, Türkiye’nin öncü yerli yazılım markası olarak işletmelerin verimliliğini artıran ERP, MRP,";
  const healed = healCutDescription(cut);
  assert.ok(healed.endsWith("…"));
  assert.ok(!healed.endsWith(",…") && !/MRP,…/.test(healed));
  assert.ok(healed.length < cut.length + 1);
  const full = "Kısa ve eksiksiz bir açıklama cümlesi burada biter. İkinci cümle de tam olarak noktayla sonlanır ve toplam uzunluk yüz elli karakteri aşar, böylece sınır denenir.";
  assert.equal(healCutDescription(full), full);
  assert.equal(healCutDescription("Kısa açıklama"), "Kısa açıklama");
  const twoSentences = "Birinci cümle oldukça uzun ve ayrıntılı bir biçimde yazılmıştır, konuyu baştan sona anlatır ve okuyucuya net bilgi verir. İkinci cümle kısa ve yarım kalıyor çünkü sınır dolmuş";
  assert.ok(healCutDescription(twoSentences).endsWith("."));
});

import { extractContentStats } from "../src/engine";

test("analiz: zengin metindeki (html) iç ve dış bağlantılar sayılır, başlık düzeyi 'h2' çözülür", () => {
  const s = extractContentStats([
    { id: "a", type: "paragraph", props: { text: "Fiyat sayfamıza ve kaynağa bakın.", html: '<p><a href="/fiyat">Fiyat sayfamıza</a> ve <a href="https://example.org/x">kaynağa</a> bakın.</p>' } },
    { id: "b", type: "heading_element", props: { text: "Alt başlık", level: "h2" } },
    { id: "c", type: "info_box", props: { title: "Kutu", text: "Bilgi metni burada", href: "/iletisim" } },
  ] as never);
  assert.equal(s.internalLinks, 2);
  assert.equal(s.externalLinks, 1);
  assert.deepEqual(s.headings, [{ level: 2, text: "Alt başlık" }]);
  assert.ok(s.plainText.includes("Bilgi metni"));
});
