# 08 — AI İle Header ve Footer Tasarlatma Rehberi

Bu doküman, bir modele **header** veya **footer** tasarlatıp sonucu yönetim kütüphanesine aktarmak içindir. Sayfa blokları için sözleşme `docs/07-AI-PAGE-AND-BLOCK-SPEC.md` dosyasındadır. Header ve footer sayfa bloğu değildir; menü ağacı da bu JSON’a girmez.

Kütüphane: `/admin/appearance/header` ve `/admin/appearance/footer` içinde **Tasarım kütüphanesi**. JSON sekmesi bu sözleşmeyi kabul eder. Prompt, aynı penceredeki **AI promptunu kopyala** düğmesindedir.

---

## 1. Nasıl kullanılır

1. Header veya footer kütüphanesinde **AI promptunu kopyala** deyin.
2. Modele yapıştırın ve isteği yazın. Örnek: “Kısa bir duyuru şeridi, yapışkan menü ve sağda Demo çağrısı olan bir header üret.”
3. Dönen JSON’u kütüphanenin **JSON aktar** alanına yapıştırıp **Forma uygula** deyin.
4. Alanları düzenleyin. Ön yüze geçmesi için **Kaydet** gerekir.

---

## 2. Kopyalanabilir prompt

```markdown
Sen bir NexPress yerleşim mimarısın. Header ve footer sayfa bloğu değildir. Açıklama yazmadan yalnızca geçerli JSON döndür.

Header istenirse kind değeri "header" olur ve header nesnesi topBar, mainBar, bottomBar içerir.
Footer istenirse kind değeri "footer" olur ve footer nesnesi columns, showNewsletter, showLocalBusinessCard, copyrightText, bottomLinks içerir.

Menü ağacı üretme. id değerleri benzersiz olsun. Adresler /tr veya /admin ile başlasın.
topBar.enabled true ise announcementText dolu olsun.
bottomBar.enabled true ise links en az iki öğe içersin.
Kolon sayısı 0 ile 4 arasında kalsın.
```

---

## 3. Header sözleşmesi

```json
{
  "kind": "header",
  "header": {
    "topBar": {
      "enabled": true,
      "announcementText": "Yeni sürüm yayında.",
      "contactPhone": "+90 (212) 555 01 99",
      "leftWidgets": ["announcement"],
      "centerWidgets": [],
      "rightWidgets": ["contact"]
    },
    "mainBar": {
      "enabled": true,
      "sticky": true,
      "glassmorphism": false,
      "leftWidgets": ["logo"],
      "centerWidgets": ["menu"],
      "rightWidgets": ["cta"],
      "ctaLabel": "Demo",
      "ctaHref": "/tr/kurumsal"
    },
    "bottomBar": {
      "enabled": true,
      "leftWidgets": [],
      "centerWidgets": ["links"],
      "rightWidgets": [],
      "links": [
        { "id": "b_docs", "label": "Doküman", "href": "/tr/dokuman" },
        { "id": "b_price", "label": "Fiyat", "href": "/tr/fiyatlandirma" }
      ]
    }
  }
}
```

`sticky` yapışkan şerit, `glassmorphism` cam yüzeydir. Menü etiketleri `/admin/appearance/menus` kaydından gelir.

---

## 4. Footer sözleşmesi

```json
{
  "kind": "footer",
  "footer": {
    "columns": [
      {
        "id": "c_product",
        "title": "Ürün",
        "colSpan": 1,
        "links": [
          { "label": "Vitrin", "href": "/tr/vitrin" },
          { "label": "Fiyat", "href": "/tr/fiyatlandirma" }
        ]
      }
    ],
    "showNewsletter": true,
    "showLocalBusinessCard": false,
    "copyrightText": "© 2026 NexPress",
    "bottomLinks": [{ "label": "İletişim", "href": "/tr/kurumsal" }]
  }
}
```

`showNewsletter` true ise ön yüzde e-posta satırı basılır. Kolonlar kütüphanede ve footer ekranında düzenlenir.

---

## 5. Kütüphane kategorileri

Header: Sade, Duyuru, Vitrin, Katalog.  
Footer: Sade, Kolon, Bülten, Vitrin.

Hazır kayıtlar `HEADER_LIBRARY` ve `FOOTER_LIBRARY` içindedir. Seçilen tasarım forma kopyalanır; kaynak şablon değişmez.
