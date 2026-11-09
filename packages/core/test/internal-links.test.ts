import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { suggestInternalLinks } from "../src/internal-links";

describe("internal-links (vektörsüz başlık ve odak anahtar kelime iç bağlantı önericisi)", () => {
  it("metinde geçen ancak henüz bağlantı verilmemiş hedef sayfaları önerir", () => {
    const docs = [
      {
        id: "1",
        title: "Kurumsal SEO Rehberi",
        slug: "kurumsal-seo-rehberi",
        locale: "tr",
        markdown: "Modern sitelerde teknik hız ve yapısal veri denetimi çok önemlidir.",
        focusKeyword: "kurumsal seo",
      },
      {
        id: "2",
        title: "Yapısal Veri Denetimi",
        slug: "yapisal-veri-denetimi",
        locale: "tr",
        markdown: "Schema.org grafiği ve kurumsal seo çalışmaları birlikte yürütülmelidir.",
        focusKeyword: "yapısal veri",
      },
      {
        id: "3",
        title: "Zaten Bağlantılı Sayfa",
        slug: "zaten-baglantili",
        locale: "tr",
        markdown: "Burada [Kurumsal SEO Rehberi](/tr/kurumsal-seo-rehberi) bağlantısı zaten var.",
        focusKeyword: "bağlantılı",
      },
    ];

    const suggestions = suggestInternalLinks(docs);
    // 1 -> 2 ("Yapısal Veri Denetimi" başlığı 1'in gövdesinde geçiyor)
    assert.ok(suggestions.some((s) => s.fromId === "1" && s.toId === "2" && s.matchKind === "title"));
    // 2 -> 1 ("kurumsal seo" odak anahtar kelimesi 2'nin gövdesinde geçiyor)
    assert.ok(suggestions.some((s) => s.fromId === "2" && s.toId === "1" && s.matchKind === "focus_keyword"));
    // 3 -> 1 zaten bağlantılı olduğu için önerilmez
    assert.ok(!suggestions.some((s) => s.fromId === "3" && s.toId === "1"));
  });
});

