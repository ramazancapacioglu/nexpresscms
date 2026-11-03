# 07 — AI İle Sayfa ve Blok Tasarlatma Rehberi (`JSON AST Kontratı`)

Bu doküman; bir modele sıfırdan tam bir sayfa (`Page AST`) veya görsel bölüm (`BlockNode`) tasarlatıp **NexPress Görsel Editörüne (`/admin/contents`)** aktarmak içindir. Header ve footer için sözleşme `docs/08-AI-CHROME-SPEC.md` dosyasındadır.

---

## 1. Nasıl Kullanılır? (3 Adımda AI'dan Kanvasa Aktarım)

1. Aşağıdaki **"Kopyalanabilir AI Sistem Promptu"** kutusunu kopyalayın (veya `/admin/contents` ekranındaki **"AI Sayfa/Blok Şeması"** butonuna tıklayın).
2. Kullandığınız AI modeline yapıştırıp istediğiniz sayfayı tarif edin:
   > *"Bana kurumsal bir Siber Güvenlik (SOC / MDR) hizmeti için Hero, 4'lü İstatistik, Bento Özellik Izgarası, 3 Kademeli Fiyatlandırma ve 4 soruluk SSS içeren tam bir NexPress sayfası üret."*
3. AI'ın ürettiği JSON çıktısını kopyalayın ve `/admin/contents` ekranında:
   - Tam sayfa ise: **"Kod & AI AST (JSON)"** sekmesine yapıştırıp **"Kodu Görsel Kanvasa Uygula"** butonuna basın.
   - Tekil bir blok kalıbı ise: **"Tasarım & Blok Kütüphanesi -> + Yeni Tasarım Ekle"** sekmesine yapıştırıp kalıcı olarak kütüphanenize kaydedin.

---

## 2. Kopyalanabilir AI Sistem Promptu (LLM System Prompt)

```markdown
Sen bir NexPress CMS (Next.js 15 • 0-KB RSC) Görsel Sayfa ve Blok Mimarısın.
Kullanıcının istediği sayfa veya bölümü AŞAĞIDAKİ saf JSON AST formatında üret. Açıklama yazmadan doğrudan geçerli JSON döndür.

### A. TAM SAYFA ŞEMASI (Page AST)
{
  "title": "Sayfa Başlığı (H1)",
  "slug": "seo-uyumlu-sayfa-adresi",
  "type": "page | product | kb_tech | ai_prompt | campaign | post",
  "schemaType": "WebPage | SoftwareApplication | Product | TechArticle | FAQPage | Offer",
  "importanceScore": 9,
  "tldr": "SGE, ChatGPT ve Perplexity için 2-3 cümlelik doğrudan yanıt özeti (Answer-First).",
  "blocks": [ ...BlockNode[] ]
}

### B. BLOK DÜĞÜMÜ ŞEMASI (BlockNode)
{
  "id": "blk_benzersiz_id",
  "type": "hero | tldr_box | stats_strip | bento_features | pricing_table | product_embed | howto_steps | faq_accordion | callout | cta_banner | heading | paragraph | code_block",
  "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
  "props": { ... }
}
```

---

## 3. Desteklenen Blok Türleri ve `props` Kontratları

### 3.1. `hero` (Görsel Vitrin & Lansman Bölümü)
```json
{
  "id": "blk_hero_01",
  "type": "hero",
  "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
  "props": {
    "badge": "7/24 KURUMSAL SİBER SAVUNMA",
    "title": "Yapay Zeka Destekli Otonom SOC ve Tehdit Avcılığı",
    "subtitle": "Kritik altyapınızı sıfır gecikmeli MDR ve gerçek zamanlı telemetri analiziyle koruyun.",
    "primaryCtaLabel": "Ücretsiz Güvenlik Analizi",
    "primaryCtaHref": "/tr/iletisim",
    "secondaryCtaLabel": "Teknik Mimariyi İncele",
    "secondaryCtaHref": "/tr/mimari"
  }
}
```

### 3.2. `tldr_box` (Answer-First SGE & AI Özeti)
```json
{
  "id": "blk_tldr_01",
  "type": "tldr_box",
  "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
  "props": {
    "summary": "Bu rehberde sıfır istemci JavaScript yüküyle (0-KB RSC) kurumsal web sitelerinin Core Web Vitals INP skorunu 20ms altına indirme adımları açıklanmaktadır."
  }
}
```

### 3.3. `stats_strip` (Sayısal Kanıt & SLA Şeridi)
```json
{
  "id": "blk_stats_01",
  "type": "stats_strip",
  "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
  "props": {
    "stats": [
      { "value": "100 / 100", "label": "Lighthouse Performans" },
      { "value": "< 15 dk", "label": "Olay Müdahale SLA" },
      { "value": "0 KB", "label": "İstemci JS Yükü" },
      { "value": "%99.99", "label": "Uptime Garantisi" }
    ]
  }
}
```

### 3.4. `bento_features` (Bento Özellik Izgarası)
```json
{
  "id": "blk_bento_01",
  "type": "bento_features",
  "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
  "props": {
    "title": "Temel Platform Yetenekleri",
    "items": [
      {
        "title": "100/100 React Server Components",
        "description": "Tarayıcıya gereksiz hidratasyon yükü bindirmeden anında açılan sayfalar."
      },
      {
        "title": "Sıfır-Maliyetli MarkdownCache",
        "description": "Her içerik kaydında ?format=md ve /llms.txt için otomatik saf Markdown derlemesi."
      }
    ]
  }
}
```

### 3.5. `pricing_table` (3 Kademeli Fiyatlandırma Tablosu)
```json
{
  "id": "blk_pricing_01",
  "type": "pricing_table",
  "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
  "props": {
    "title": "Kurumsal Lisans Paketleri",
    "plans": [
      {
        "name": "Starter",
        "price": "Ücretsiz",
        "description": "Tekil site ve temel teknik SEO çekirdeği.",
        "ctaLabel": "Başla",
        "featured": false
      },
      {
        "name": "Enterprise Pro",
        "price": "4.900 TL / ay",
        "description": "WebMCP, @id Entity Graph ve 8 kaynaklı Soru Madenciliği.",
        "ctaLabel": "Pro'ya Geç",
        "featured": true
      }
    ]
  }
}
```

### 3.6. `product_embed` (`@id` Bağlantılı Ürün / Yazılım Kartı)
```json
{
  "id": "blk_prod_01",
  "type": "product_embed",
  "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
  "props": {
    "productName": "NexPress Enterprise Cloud v2026",
    "sku": "NXP-CLOUD-ENT",
    "price": "4.900 TL / ay",
    "summary": "Subdomain Multi-Tenant ve PostgreSQL pgvector RAG kümesi dahil."
  }
}
```

### 3.7. `howto_steps` (`HowTo` Adım Adım Prosedür) & `faq_accordion` (`FAQPage`)
```json
{
  "id": "blk_howto_01",
  "type": "howto_steps",
  "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
  "props": {
    "title": "3 Adımda Kurulum",
    "steps": [
      { "title": "1. Şemayı Aktarın", "description": "JSON AST kodunu editöre yapıştırın." },
      { "title": "2. Görsel Olarak Düzenleyin", "description": "Kanvas üzerinde metinleri satır içi özelleştirin." }
    ]
  }
}
```
```json
{
  "id": "blk_faq_01",
  "type": "faq_accordion",
  "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
  "props": {
    "title": "Sıkça Sorulan Sorular",
    "items": [
      {
        "question": "Bu JSON yapısı otomatik Markdown'a dönüşür mü?",
        "answer": "Evet, kaydedildiği anda compileBlocksToMarkdown motoru tarafından sıfır kayıplı MarkdownCache sütununa derlenir."
      }
    ]
  }
}
```


---

## Güncelleme (2026-10-30): sözleşmenin makine karşılığı

Bu dokümandaki elle yazılmış blok listesi **referanstır**; AI'ın gerçekten uyması gereken sözleşme `@nexpress/core/ai-design` kataloğudur (`AI_BLOCK_CATALOG`) ve komut metni oradan üretilir. Panel (`/admin/design-library`) ve editörün "JSON aktar" sekmesi sitenize özel komutu (sayfalarınız, medyanız, formlarınız, SEO ve kontrast sınırlarıyla) üretir ve yapıştırılan JSON'u aynı doğrulayıcıdan geçirir. Katalog dışı bloklar (slider, geri sayım, harita, kullanıcı kartı, galeri…) AI'a bilinçli olarak kapalıdır; elle eklenmeye devam eder. Bkz. `docs/18` ve `docs/05` "AI Tasarım Pro".

## Ek (2026-11-02): `media_file` bloğu

`media_file` (Dosya / Video / Ses): `props = { url, kind: "document"|"video"|"audio", title, description, mime, size, uploadDate, poster? }`. Yalnızca medya kitaplığından seçilir; `url` yalnızca `/…` veya `http(s)` olabilir (aksi hâlde blok çizilmez). Belge bir indirme kartı, video/ses yerel `<video>`/`<audio controls>` olarak çizilir (istemci JS'i yok). Markdown'a bağlantı olarak derlenir. **AI tasarım kataloğunda yoktur**: model medya dosyası uyduramaz.

## Ek (2026-11-02): `dynamic_list` bloğu

`dynamic_list`: `props = { source: "posts"|"pages"|"products", category?, tag?, limit (1-24), orderBy: "newest"|"oldest"|"title", excludeCurrent, layout: "cards"|"list", columns (1-4), showImage, showExcerpt, showDate, heading?, emptyText? }`. `category`/`tag` taksonomi **slug**'ıdır. Çözüm ziyaretçi isteğinde yapılır; Markdown/llms çıktısına girmez. **AI tasarım kataloğunda yoktur** (model sorgu uyduramaz).

## Ek (2026-11-03): `schema_card` ve `tpl_*` blokları

- `schema_card`: `props = { schema: "software"|"offer"|"qa"|"tech" }`; veri `schemaAttributes.richSchema`'dan gelir. **AI tasarım kataloğunda yoktur.**
- `tpl_post_title`, `tpl_post_content`, `tpl_featured_image`, `tpl_post_meta`, `tpl_breadcrumb`, `tpl_archive_title`, `tpl_archive_list`, `tpl_site_logo`, `tpl_menu`, `tpl_copyright`: yalnızca şablonlarda anlamlıdır (yuva blokları); sayfa içeriğinde kullanılmaz ve AI kataloğunda yoktur.

## Ek (2026-11-03): hareket ve süs blokları
`single_icon` (`icon`: yerleşik 24 simgeden biri, `size`, `color`, `background`, `href`, `label`, `align`), `countup` (`value`, `prefix`, `suffix`, `label`, `duration` sn), `marquee` (`items: string[]`, `speed` sn, `direction`), `shape_divider` (`shape`: wave|tilt|curve|triangle|slant, `color`, `height`, `flip`). `button_element` artık `icon` + `iconSide`; `columns` artık `stackAt` (`mobile`|`tablet`) ve `mobileReverse` alır. Sözleşme `AI_BLOCK_CATALOG` içindedir.

## Ek (2026-11-03): `dynamic_list` ziyaretçi denetimleri
Yeni boolean özellikler (varsayılan `false`): `showSearch`, `showSort`, `showFilters`, `paginate`. Açıkken blok `id="nx-dl-{anahtar}"` taşır; parametreler `{anahtar}_q`, `_cat`, `_sort` (`newest|oldest|title`), `_page`. Anahtar = `q` + blok kimliğinin son 6 güvenli karakteri (`dynamicParamKey`). Sonuç her istekte güncel veriden üretilir, Markdown önbelleğine girmez.
