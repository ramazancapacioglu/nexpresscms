import type { DesignLibraryItem } from "./library-types";

/**
 * NexPress Studio Tasarım Kütüphanesi:
 * 0-KB RSC Uyumlu Görsel Blok & Bölüm Kütüphanesi
 */
export const BASE_LIBRARY: DesignLibraryItem[] = [
  {
    id: "lib_hero_aurora_split",
    name: "Aurora Kurumsal Hero (Çift Aksiyonlu)",
    category: "hero",
    description:
      "Üst rozet, yüksek kontrastlı H1 başlık, değer önerisi alt metni ve birincil/ikincil CTA butonları.",
    badge: "En Çok Kullanılan",
    previewKind: "hero-split",
    block: {
      type: "hero",
      variant: "aurora-split",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        badge: "NEXT.JS 15 • 100/100 LIGHTHOUSE RSC",
        title: "Kurumsal Dijital Varlığınızı Sıfır İstemci JS İle Hızlandırın",
        subtitle:
          "Hem insan ziyaretçiler için kusursuz görsel deneyim hem de AI ajanları için sıfır maliyetli Markdown ve Schema.org bilgi grafiği.",
        primaryCtaLabel: "Hemen Başlayın",
        primaryCtaHref: "/admin",
        secondaryCtaLabel: "Teknik Dokümantasyon",
        secondaryCtaHref: "/tr?format=md",
      },
    },
  },
  {
    id: "lib_hero_commerce_offer",
    name: "Kampanya & Ürün Lansman Hero",
    category: "hero",
    description:
      "Aciliyet rozeti, indirim vurgulu başlık ve doğrudan dönüşüm odaklı tekil aksiyon şeridi.",
    badge: "Dönüşüm Odaklı",
    previewKind: "hero-centered",
    block: {
      type: "hero",
      variant: "commerce-spotlight",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        badge: "SINIRLI SÜRELİ LANSMAN TEKLİFİ",
        title: "Kurumsal Göç Paketinde Yıllık %30 İndirim Fırsatı",
        subtitle:
          "Eski nesil hantal site altyapınızı 60 saniyede 0-KB RSC mimarisine taşıyın, Core Web Vitals skorunuzu 100/100 seviyesine çıkarın.",
        primaryCtaLabel: "Teklifi Etkinleştir",
        primaryCtaHref: "/tr/nexpress-enterprise-cloud",
      },
    },
  },
  {
    id: "lib_hero_saas_split_row",
    name: "2 Sütunlu Modern SaaS Vitrin Bölümü (Metin + Görsel Kart)",
    category: "hero",
    description:
      "Sol sütunda rozet, başlık, ikonlu madde listesi ve aksiyon butonları; sağ sütunda öne çıkan ürün görseli ve bilgi kartı.",
    badge: "Yeni • Çok Sütunlu",
    previewKind: "hero-split",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { title: "", containerMode: "boxed" },
      style: {
        paddingTop: "48px",
        paddingRight: "36px",
        paddingBottom: "48px",
        paddingLeft: "36px",
        backgroundColor: "#f8fafc",
        borderRadius: "20px",
        borderWidth: "1px",
        borderColor: "#e2e8f0",
      },
      children: [
        {
          id: "saas_hero_row",
          type: "columns",
          props: { layout: "6+6", gap: "32px", verticalAlign: "center" },
          children: [
            {
              id: "saas_hero_col_left",
              type: "column",
              props: { widthPct: 50 },
              children: [
                {
                  id: "saas_hero_h",
                  type: "heading",
                  props: {
                    level: 2,
                    text: "Tüm Dijital Operasyonunuzu Tek Merkezden Yönetin",
                  },
                },
                {
                  id: "saas_hero_p",
                  type: "paragraph",
                  props: {
                    text: "Yüksek trafikli kurumsal siteler, çok dilli yayın akışları ve e-ticaret katalogları için sıfır istemci yüküyle çalışan yeni nesil içerik platformu.",
                  },
                },
                {
                  id: "saas_hero_list",
                  type: "icon_list",
                  props: {
                    items: [
                      {
                        icon: "zap",
                        mark: "✓",
                        title: "Anında Sunucu Render (0-KB JS)",
                        text: "Ziyaretçi tarayıcısına gereksiz betik yüklenmez.",
                      },
                      {
                        icon: "shield",
                        mark: "✓",
                        title: "Çoklu Kiracı & Kurumsal Güvenlik",
                        text: "Her alt alan adı ve şube kendi izole verisiyle çalışır.",
                      },
                    ],
                  },
                },
                {
                  id: "saas_hero_btns",
                  type: "button_row",
                  props: {
                    align: "left",
                    buttons: [
                      { label: "Ücretsiz Başlayın", href: "/tr/iletisim", variant: "primary" },
                      { label: "Canlı Mimariyi İncele", href: "/tr", variant: "outline" },
                    ],
                  },
                },
              ],
            },
            {
              id: "saas_hero_col_right",
              type: "column",
              props: { widthPct: 50 },
              style: {
                paddingTop: "24px",
                paddingRight: "24px",
                paddingBottom: "24px",
                paddingLeft: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                borderWidth: "1px",
                borderColor: "#cbd5e1",
                boxShadow: "lg",
              },
              children: [
                {
                  id: "saas_hero_info",
                  type: "info_box",
                  props: {
                    icon: "sparkles",
                    kicker: "CANLI PERFORMANS RAPORU",
                    title: "100 / 100 Core Web Vitals Garantisi",
                    text: "Görsel stüdyoda hazırladığınız tüm karmaşık satır ve sütun düzenleri, yayın anında saf HTML ve CSS değişkenlerine derlenir.",
                    linkLabel: "Hız Testi Sonuçlarını Gör →",
                    href: "/tr",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_layout_tabs_showcase",
    name: "Zengin Kapsayıcı Sekmeli Çözüm Vitrini (İç İçe Satır & Sütunlu)",
    category: "layout",
    description:
      "Her sekmenin içinde iki sütunlu yerleşim, ikonlu özellik listesi ve aksiyon butonu barındıran gelişmiş kapsayıcı sekmeler bloğu.",
    badge: "Yeni • Kapsayıcı Sekme",
    previewKind: "bento-3",
    block: {
      type: "tabs",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        title: "Ekipler İçin Özelleştirilmiş Çözüm Katmanları",
        tabStyle: "pills",
        align: "left",
        items: [
          { label: "Pazarlama & İçerik", icon: "sparkles", body: "Pazarlama ekipleri için görsel hız." },
          { label: "Yazılım & Mimari", icon: "code", body: "Mühendislik ekipleri için temiz AST." },
          { label: "E-Ticaret & Satış", icon: "cart", body: "Dönüşüm odaklı vitrin yönetimi." },
        ],
      },
      children: [
        {
          id: "lib_tab_pane_1",
          type: "column",
          props: { label: "Pazarlama & İçerik", icon: "sparkles" },
          children: [
            {
              id: "lib_tab1_row",
              type: "columns",
              props: { layout: "6+6", gap: "24px", verticalAlign: "center" },
              children: [
                {
                  id: "lib_tab1_c1",
                  type: "column",
                  props: { widthPct: 50 },
                  children: [
                    { id: "lib_tab1_h", type: "heading", props: { level: 3, text: "Geliştirici Beklemeden Dakikalar İçinde Kampanya Sayfası Açın" } },
                    { id: "lib_tab1_p", type: "paragraph", props: { text: "Hazır bölüm şablonlarını sürükleyip bırakın, metinleri doğrudan tuval üzerinde düzenleyin ve SEO puanınızı canlı denetleyin." } },
                    { id: "lib_tab1_btn", type: "button_element", props: { label: "Editör Özelliklerini Keşfet", href: "/tr", icon: "arrow-right", styleVariant: "primary", align: "left" } },
                  ],
                },
                {
                  id: "lib_tab1_c2",
                  type: "column",
                  props: { widthPct: 50 },
                  children: [
                    {
                      id: "lib_tab1_list",
                      type: "icon_list",
                      props: {
                        items: [
                          { icon: "check", mark: "✓", title: "Canlı SEO & Okunabilirlik Puanı", text: "Başlık hiyerarşisi ve alt metin kontrolü." },
                          { icon: "globe", mark: "✓", title: "Çok Dilli Çeviri Matrisi", text: "Tek tıkla tüm dillerde eşzamanlı yayın." },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "lib_tab_pane_2",
          type: "column",
          props: { label: "Yazılım & Mimari", icon: "code" },
          children: [
            {
              id: "lib_tab2_h",
              type: "heading",
              props: { level: 3, text: "Tip Güvenli JSON AST ve Çift Veritabanı Esnekliği" },
            },
            {
              id: "lib_tab2_p",
              type: "paragraph",
              props: { text: "Yerel geliştirmede sıfır kurulumlu SQLite/LibSQL, üretim ortamında PostgreSQL 16 + pgvector ile yüksek ölçeklenebilirlik." },
            },
          ],
        },
        {
          id: "lib_tab_pane_3",
          type: "column",
          props: { label: "E-Ticaret & Satış", icon: "cart" },
          children: [
            {
              id: "lib_tab3_h",
              type: "heading",
              props: { level: 3, text: "Hızlı Ürün Vitrinleri ve Pazar Yeri Entegrasyonu" },
            },
            {
              id: "lib_tab3_p",
              type: "paragraph",
              props: { text: "Ürün kartlarını makale ve kampanya sayfalarının içine doğrudan gömün; stok ve fiyat şeması otomatik güncellensin." },
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_layout_asymmetric_feature",
    name: "Asimetrik Özellik & Hikâye Bölümü (4+8 Sütun)",
    category: "layout",
    description:
      "Sol dar sütunda bölüm başlığı, özet ve çağrı butonu; sağ geniş sütunda simgeli bilgi kartları.",
    badge: "Modern Kurumsal",
    previewKind: "columns",
    block: {
      type: "columns",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { layout: "4+8", gap: "32px", verticalAlign: "top" },
      style: { paddingTop: "24px", paddingBottom: "24px" },
      children: [
        {
          id: "asym_col_left",
          type: "column",
          props: { widthPct: 33.33 },
          children: [
            { id: "asym_h", type: "heading", props: { level: 2, text: "Kurumsal Ölçekte Neden Fark Yaratıyoruz?" } },
            { id: "asym_p", type: "paragraph", props: { text: "Sadece güzel görünen sayfalar değil; arama motorları ve yapay zeka ajanları tarafından anında anlaş지는 semantik veri mimarisi kuruyoruz." } },
            { id: "asym_b", type: "button_element", props: { label: "Detaylı Bilgi Alın", href: "/tr/iletisim", icon: "arrow-right", styleVariant: "primary", align: "left" } },
          ],
        },
        {
          id: "asym_col_right",
          type: "column",
          props: { widthPct: 66.67 },
          children: [
            {
              id: "asym_bento",
              type: "bento_features",
              props: {
                title: "",
                items: [
                  { icon: "rocket", title: "Anında Sayfa Açılışı", description: "Ön belleğe alınmış sunucu bileşenleriyle milisaniyeler içinde ilk boyama." },
                  { icon: "layers", title: "Modüler Eklenti Yuvaları", description: "Çekirdek kodu kirletmeden genişleyen temiz kanca ve yuva mimarisi." },
                  { icon: "database", title: "Veri Taşınabilirliği", description: "Tema değişse bile içerik ağacınız ve SEO verileriniz %100 korunur." },
                  { icon: "shield", title: "Rol Bazlı Denetim İzi", description: "Tüm yönetici işlemleri ve içerik revizyonları kayıt altındadır." },
                ],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_layout_faq_contact_split",
    name: "İki Sütunlu SSS + Canlı Destek Kartı (8+4 Sütun)",
    category: "aio_sge",
    description:
      "Sol geniş sütunda FAQPage şemalı sık sorulan sorular; sağ dar sütunda doğrudan iletişim ve destek bilgi kartı.",
    badge: "Yüksek Dönüşüm",
    previewKind: "columns",
    block: {
      type: "columns",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { layout: "8+4", gap: "28px", verticalAlign: "top" },
      children: [
        {
          id: "faq_split_left",
          type: "column",
          props: { widthPct: 66.67 },
          children: [
            {
              id: "faq_split_acc",
              type: "faq_accordion",
              props: {
                title: "Sıkça Sorulan Sorular",
                items: [
                  { question: "Mevcut sitemdeki içerikleri ve URL yapısını koruyabilir miyim?", answer: "Evet. İçe aktarma aracımız tüm yazılarınızı, görsellerinizi ve eski URL yönlendirmelerinizi (301) otomatik olarak taşır." },
                  { question: "Teknik ekip olmadan sayfa tasarımlarını güncelleyebilir miyiz?", answer: "Evet. Görsel stüdyo ile satır, sütun, sekme ve hazır bölümleri kod yazmadan yönetebilirsiniz." },
                  { question: "Çok dilli yayın ve bölgesel SEO destekleniyor mu?", answer: "Evet. Her dil için ayrı URL, hreflang kümeleri ve bağımsız çeviri durumu yerleşik olarak sunulur." },
                ],
              },
            },
          ],
        },
        {
          id: "faq_split_right",
          type: "column",
          props: { widthPct: 33.33 },
          style: {
            paddingTop: "24px",
            paddingRight: "24px",
            paddingBottom: "24px",
            paddingLeft: "24px",
            backgroundColor: "#eff6ff",
            borderRadius: "16px",
            borderWidth: "1px",
            borderColor: "#bfdbfe",
          },
          children: [
            {
              id: "faq_split_box",
              type: "info_box",
              props: {
                icon: "headphones",
                kicker: "UZMAN DESTEĞİ",
                title: "Farklı Bir Sorunuz mu Var?",
                text: "Çözüm mimarlarımız projenize özel canlı demo ve teknik geçiş planı için hazır.",
                linkLabel: "Bize Ulaşın →",
                href: "/tr/iletisim",
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_bento_4grid",
    name: "4'lü Kurumsal Bento Özellik Izgarası",
    category: "bento",
    description:
      "Numaralandırılmış 2x2 simetrik özellik kartları; B2B yazılım ve hizmet tanıtımları için ideal.",
    badge: "Bento Grid",
    previewKind: "bento-4",
    block: {
      type: "bento_features",
      variant: "bento-2x2",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        title: "Neden Mühendislik Ekipleri NexPress'i Seçiyor?",
        items: [
          {
            title: "0-KB İstemci JavaScript",
            description:
              "Görsel editör yalnızca yönetim panelinde çalışır; ön yüz %100 React Server Components olarak sunulur.",
          },
          {
            title: "Ön-Derlenmiş MarkdownCache",
            description:
              "Her kayıt anında ?format=md ve /llms.txt için 0ms CPU maliyetli saf Markdown üretilir.",
          },
          {
            title: "Çift Veritabanı Motoru",
            description:
              "Yerelde Docker'sız LibSQL/SQLite, kurumsal ölçekte PostgreSQL 16 + pgvector.",
          },
          {
            title: "Bağlantılı @id Bilgi Grafiği",
            description:
              "Makale, Ürün ve Kampanya sayfaları birbirine otomatik Schema.org düğümleriyle bağlanır.",
          },
        ],
      },
    },
  },
  {
    id: "lib_stats_4col",
    name: "4 Sütunlu Kurumsal Metrik & Kanıt Şeridi",
    category: "bento",
    description:
      "Sayısal başarı metriklerini, SLA garantilerini ve hız skorlarını sergileyen yatay kanıt bloğu.",
    previewKind: "stats-4",
    block: {
      type: "stats_strip",
      variant: "metrics-bar",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        stats: [
          { value: "100 / 100", label: "Core Web Vitals & SEO" },
          { value: "< 18 ms", label: "TTFB & INP Yanıt Süresi" },
          { value: "0 KB", label: "Ön Yüz Hidratasyon Yükü" },
          { value: "%99.99", label: "Multi-Tenant İzolasyon" },
        ],
      },
    },
  },
  {
    id: "lib_pricing_3tier",
    name: "3 Kademeli Kurumsal Fiyatlandırma Tablosu",
    category: "pricing",
    description:
      "Başlangıç, Profesyonel ve Enterprise paketlerini karşılaştıran dönüşüm odaklı fiyatlandırma kartları.",
    badge: "SaaS & Paket",
    previewKind: "pricing-3",
    block: {
      type: "pricing_table",
      variant: "tiers-3",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        title: "Şeffaf ve Ölçeklenebilir Lisanslama",
        plans: [
          {
            name: "Open-Core Starter",
            price: "Ücretsiz",
            description:
              "Tekil site (Single-Tenant), LibSQL/SQLite, 0-KB RSC Görsel Editör ve temel /llms.txt.",
            ctaLabel: "Hemen İndir",
            featured: false,
          },
          {
            name: "Agentic Growth Pro",
            price: "2.400 TL / ay",
            description:
              "@nexpress-pro/agentic-seo, WebMCP JSON-RPC sunucusu, bağlı @id Entity Graph ve rDNS Bot Doğrulayıcı.",
            ctaLabel: "Pro'ya Geç",
            featured: true,
          },
          {
            name: "Enterprise Cloud RAG",
            price: "4.900 TL / ay",
            description:
              "Subdomain Multi-Tenant, PostgreSQL pgvector, 8 kaynaklı Soru Madenciliği ve 2-Pass AI İçerik Fabrikası.",
            ctaLabel: "Demo Talep Et",
            featured: false,
          },
        ],
      },
    },
  },
  {
    id: "lib_commerce_product_embed",
    name: "Canlı @id Ürün & Yazılım Kartı Gömmesi",
    category: "commerce",
    description:
      "SKU, fiyat, özet ve otomatik #product / #softwareapplication şema bağlantısıyla gömülü ürün kutusu.",
    badge: "@id Entity",
    previewKind: "product-card",
    block: {
      type: "product_embed",
      variant: "inline-card",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        contentId: "cnt_product_cloud",
        productName: "NexPress Enterprise Cloud v2026",
        sku: "NXP-CLOUD-ENT",
        price: "4.900 TL / ay",
        summary:
          "Çoklu alt alan adı (Subdomain Tenancy), PostgreSQL pgvector RAG kümesi ve gerçek zamanlı AI Bot Doğrulayıcı dahil kurumsal paket.",
      },
    },
  },
  {
    id: "lib_aio_tldr_box",
    name: "Answer-First TL;DR Özeti (SGE & AI Optimize)",
    category: "aio_sge",
    description:
      "ChatGPT, Perplexity ve Google AI Overviews (SGE) tarafından doğrudan kaynak gösterilmek üzere tasarlanmış özet kutusu.",
    badge: "Zorunlu GEO",
    previewKind: "tldr-summary",
    block: {
      type: "tldr_box",
      variant: "answer-first",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        summary:
          "Bu sayfanın temel çıkarımı: 0-KB RSC mimarisi ve ön-derlenmiş markdownCache sayesinde hem tarayıcı performansı 100/100 seviyesine ulaşır hem de AI botları sıfır CPU maliyetiyle beslenir.",
      },
    },
  },
  {
    id: "lib_aio_howto_steps",
    name: "Adım Adım Prosedür Rehberi (HowTo Schema)",
    category: "aio_sge",
    description:
      "Numaralı teknik kurulum veya uygulama adımları; otomatik HowTo ve HowToStep şeması üretir.",
    previewKind: "howto-timeline",
    block: {
      type: "howto_steps",
      variant: "numbered-steps",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        title: "Uygulama Adımları",
        steps: [
          {
            title: "1. Veritabanı Bağlantısını Seçin",
            description:
              ".env dosyasında DB_DIALECT değerini sqlite veya postgresql olarak belirleyin.",
          },
          {
            title: "2. Görsel Bloklarınızı Kurgulayın",
            description:
              "Tasarım kütüphanesinden hazır bölümleri seçip kanvas üzerinde satır içi düzenleyin.",
          },
          {
            title: "3. Yayınlayın ve Markdown Akışını Doğrulayın",
            description:
              "Kaydet butonuna bastığınızda hem RSC sayfası hem de ?format=md uç noktası anında güncellenir.",
          },
        ],
      },
    },
  },
  {
    id: "lib_aio_faq_accordion",
    name: "Etkileşimli SSS Akordeonu (FAQPage Schema)",
    category: "aio_sge",
    description:
      "Soru Madenciliği (PAA) kümelerini sıfır-JS HTML5 details/summary ve FAQPage şemasıyla sunar.",
    badge: "FAQPage",
    previewKind: "faq-list",
    block: {
      type: "faq_accordion",
      variant: "clean-border",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        title: "Sıkça Sorulan Sorular",
        items: [
          {
            question: "Yeni eklediğim blok tasarımları sayfa hızını yavaşlatır mı?",
            answer:
              "Hayır. Eklediğiniz tüm bloklar sunucu tarafında saf HTML ve CSS değişkenlerine derlenir; istemciye 0 KB ek JS gönderilir.",
          },
          {
            question: "Yapay zekaya (Claude / ChatGPT) özel blok tasarlatıp aktarabilir miyim?",
            answer:
              "Evet! Editördeki 'AI Tasarım Şeması' rehberini kopyalayıp herhangi bir LLM'e vererek ürettiği JSON AST kodunu tek tıkla kütüphanenize veya sayfanıza aktarabilirsiniz.",
          },
        ],
      },
    },
  },
  {
    id: "lib_editorial_callout",
    name: "Teknik Bilgi & Uyarı Kutusu (Callout)",
    category: "editorial",
    description:
      "NOTE, TIP, IMPORTANT ve WARNING tonlarında dikkat çekici bilgi kutusu.",
    previewKind: "callout-box",
    block: {
      type: "callout",
      variant: "info-border",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        tone: "TIP",
        title: "Performans İpucu",
        text: "Sayfa içindeki tüm görseller ve kod blokları otomatik olarak MarkdownCache çıktısına dahil edilir.",
      },
    },
  },
  {
    id: "lib_editorial_cta_banner",
    name: "Tam Genişlik Dönüşüm Şeridi (CTA Banner)",
    category: "editorial",
    description:
      "Sayfa sonlarında veya makale ortasında okuyucuyu aksiyona davet eden kompakt çağrı kutusu.",
    previewKind: "cta-strip",
    block: {
      type: "cta_banner",
      variant: "dark-contrast",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        title: "Sitenizi Bugün 100/100 Lighthouse Hızına Taşıyın",
        subtitle:
          "WordPress göç aracımızla mevcut içeriklerinizi 60 saniyede kayıpsız aktarın.",
        buttonLabel: "Göç Aracını Başlat →",
        buttonHref: "/admin/migration",
      },
    },
  },
  {
    id: "lib_editorial_code",
    name: "Teknik Kod & Terminal Bloğu",
    category: "editorial",
    description:
      "Teknik bilgi bankası (kb_tech) makaleleri için kopyalanabilir kod bloğu.",
    previewKind: "code-terminal",
    block: {
      type: "code_block",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        language: "bash",
        code: "curl -H 'Accept: text/markdown' https://siteniz.com/tr/ornek-sayfa",
      },
    },
  },
  {
    id: "lib_editorial_prose",
    name: "Başlık + Zengin Paragraf Çifti",
    category: "editorial",
    description: "Standart H2 alt başlığı ve yüksek okunabilirlikli metin bloğu.",
    previewKind: "prose-section",
    block: {
      type: "heading",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        level: 2,
        text: "Yeni Bölüm Başlığı",
      },
    },
  },
  {
    id: "lib_tpl_tpl_post_title",
    name: "Sayfa / Yazı Başlığı (h1)",
    category: "template",
    description: "İçeriğin başlığını tek h1 olarak yazar.",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_post_title", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_tpl_tpl_post_content",
    name: "İçerik Yuvası",
    category: "template",
    description: "Sayfanın veya yazının kendi blokları buraya gelir. Sayfa/yazı şablonunda zorunludur.",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_post_content", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_tpl_tpl_featured_image",
    name: "Öne Çıkan Görsel",
    category: "template",
    description: "İçeriğin öne çıkan görselini (alt metin ve alt yazıyla) gösterir.",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_featured_image", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_tpl_tpl_post_meta",
    name: "Yazı Bilgi Satırı",
    category: "template",
    description: "Tarih, yazar ve kategori bağlantıları.",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_post_meta", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_tpl_tpl_breadcrumb",
    name: "Sayfa Yolu (Breadcrumb)",
    category: "template",
    description: "Ana sayfa / kategori / sayfa yolu.",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_breadcrumb", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_tpl_tpl_archive_title",
    name: "Arşiv Başlığı (h1)",
    category: "template",
    description: "Kategori/etiket adı ve açıklaması.",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_archive_title", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_tpl_tpl_archive_list",
    name: "Arşiv Listesi + Sayfalama",
    category: "template",
    description: "Terime ait yayınları kart veya liste olarak sayfalı listeler. Arşiv şablonunda zorunludur.",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_archive_list", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_tpl_tpl_site_logo",
    name: "Site Logosu",
    category: "template",
    description: "Site adı veya logo görseli; ana sayfaya bağlanır (Özelleştirici ayarlarından gelir).",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_site_logo", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_tpl_tpl_menu",
    name: "Menü",
    category: "template",
    description: "Menüler sayfasındaki menüyü gösterir (yatay ya da dikey liste).",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_menu", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_tpl_tpl_copyright",
    name: "Telif Satırı",
    category: "template",
    description: "Footer ayarlarındaki telif metni.",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_copyright", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_schema_software",
    name: "Yazılım / Ürün Kartı (SoftwareApplication)",
    category: "schema",
    description: "Ad, kategori, işletim sistemi, sürüm, fiyat, özellik listesi ve indirme düğmesi hazır gelir. Bilgileri SEO › Şema sekmesinden ya da bloktan girin; hem kartta hem şemada görünür.",
    badge: "Şema",
    previewKind: "prose-section",
    block: { type: "schema_card", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: { schema: "software" } },
  },
  {
    id: "lib_schema_offer",
    name: "Kampanya Teklifi (Offer)",
    category: "schema",
    description: "Fiyat, bitiş günü ve stok durumu. Bitiş günü geçince kart ve şema kendiliğinden kalkar.",
    badge: "Şema",
    previewKind: "prose-section",
    block: { type: "schema_card", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: { schema: "offer" } },
  },
  {
    id: "lib_schema_qa",
    name: "Soru-Cevap Kartı (QAPage)",
    category: "schema",
    description: "Sayfa başlığı soru, TL;DR cevap olarak hem kartta hem QAPage şemasında görünür.",
    badge: "Şema",
    previewKind: "prose-section",
    block: { type: "schema_card", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: { schema: "qa" } },
  },
  {
    id: "lib_schema_tech",
    name: "Teknik Künye (TechArticle)",
    category: "schema",
    description: "Bilgi düzeyi ve gereksinimler; TechArticle şemasıyla birlikte.",
    badge: "Şema",
    previewKind: "prose-section",
    block: { type: "schema_card", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: { schema: "tech" } },
  },
  {
    id: "lib_tpl_tpl_product_buy",
    name: "Fiyat ve Satın Alma Kutusu",
    category: "template",
    description: "Mağaza ürün sayfasında fiyat, stok, varyasyon, adet ve sepete ekle. Ürün şablonunda satın alma için gereklidir.",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_product_buy", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_tpl_tpl_cart_link",
    name: "Sepet Bağlantısı",
    category: "template",
    description: "Mağaza sepetine bağlantı (ürün adedi ile).",
    badge: "Şablon",
    previewKind: "prose-section",
    block: { type: "tpl_cart_link", gridSpan: { desktop: 12, tablet: 12, mobile: 12 }, props: {} },
  },
  {
    id: "lib_atomic_dynamic_list",
    name: "Dinamik İçerik Listesi (Son Yazılar, İlgili İçerik, Ürünler)",
    category: "editorial",
    description: "Kategori/etikete göre yazı, sayfa veya ürünleri yayın anında otomatik listeler; yeni içerik eklendikçe kendiliğinden güncellenir. Kartlar gerçek iç bağlantılardır.",
    previewKind: "prose-section",
    block: {
      type: "dynamic_list",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { source: "posts", limit: 6, orderBy: "newest", layout: "cards", columns: 3, showImage: true, showExcerpt: true, showDate: true, heading: "Son yazılar" },
    },
  },
  {
    id: "lib_atomic_media_file",
    name: "Dosya, Video veya Ses (Medya Kitaplığı)",
    category: "editorial",
    description: "Kitaplıktaki PDF, video ya da ses dosyasını sayfaya ekler. Video/ses için VideoObject/AudioObject şeması otomatik üretilir.",
    previewKind: "prose-section",
    block: {
      type: "media_file",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { url: "", kind: "document", title: "", description: "" },
    },
  },
  {
    id: "lib_atomic_image_figure",
    name: "SEO Optimize Görsel & Altyazı (Figure)",
    category: "editorial",
    description: "Alt metni, başlık etiketi, odak noktası ve figcaption açıklamasıyla tam Schema.org ImageObject uyumlu görsel elementi.",
    previewKind: "prose-section",
    block: {
      type: "image_figure",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'><rect width='1200' height='630' fill='%230F172A'/><text x='80' y='300' fill='%23FFFFFF' font-family='sans-serif' font-size='44' font-weight='bold'>NexPress Görsel SEO Figure Elementi</text></svg>",
        altText: "NexPress 0-KB RSC Görsel SEO ve Schema ImageObject Örneği",
        titleText: "NexPress Mimari Görseli",
        caption: "Şekil: Görsel alt metni ve figcaption açıklaması hem Google Görseller hem de MarkdownCache için derlenir.",
        aspectRatio: "16:9",
      },
    },
  },
  {
    id: "lib_atomic_button",
    name: "Aksiyon Butonu Elementi (Button)",
    category: "commerce",
    description: "Birincil, ikincil veya çerçeveli (outline) tekil aksiyon butonu elementi.",
    previewKind: "cta-strip",
    block: {
      type: "button_element",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        label: "Ücretsiz Canlı Stüdyoyu Dene →",
        href: "/admin",
        styleVariant: "primary",
        align: "left",
        openInNewTab: false,
      },
    },
  },
  {
    id: "lib_atomic_review_box",
    name: "Editoryal İnceleme & Puan Kutusu (Review Box)",
    category: "commerce",
    description: "5 üzerinden yıldız puanı, Artılar (Pros), Eksiler (Cons) ve karar özeti içeren Schema.org Review elementi.",
    previewKind: "bento-4",
    block: {
      type: "review_box",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        itemName: "NexPress Enterprise Cloud v2026",
        rating: 4.9,
        verdict: "Kurumsal hız, teknik SEO otomasyonu ve AI ajan uyumluluğunda sınıfının lideri.",
        pros: [
          "100/100 Lighthouse ve 0 KB İstemci JS",
          "Çift veritabanı (SQLite & PostgreSQL/pgvector)",
          "Yerleşik /llms.txt ve Markdown derleyici",
        ],
        cons: ["Klasik PHP eklentileri yerine modern TypeScript kancaları kullanır"],
      },
    },
  },
  {
    id: "lib_studio_row_2col",
    name: "2 Sütunlu Esnek Satır (50% / 50%)",
    category: "bento",
    description:
      "Her sütunun içine bağımsız başlık, paragraf, görsel veya buton ekleyebileceğiniz iç içe (nested) satır/sütun düzeni.",
    badge: "İç İçe Sütun",
    previewKind: "bento-4",
    block: {
      type: "columns",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        layout: "6+6",
        gap: "24px",
        verticalAlign: "stretch",
      },
      style: {
        paddingTop: "16px",
        paddingBottom: "16px",
      },
      children: [
        {
          id: "col_preset_1",
          type: "column",
          props: { widthPct: 50 },
          style: {
            paddingTop: "24px",
            paddingRight: "24px",
            paddingBottom: "24px",
            paddingLeft: "24px",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            borderWidth: "1px",
            borderColor: "#e2e8f0",
          },
          children: [
            {
              id: "col_preset_1_h",
              type: "heading",
              props: { level: 3, text: "Sol Sütun Başlığı" },
            },
            {
              id: "col_preset_1_p",
              type: "paragraph",
              props: {
                text: "Bu sütunun içine istediğiniz kadar başlık, paragraf, görsel, liste veya buton bloğu ekleyebilirsiniz.",
              },
            },
          ],
        },
        {
          id: "col_preset_2",
          type: "column",
          props: { widthPct: 50 },
          style: {
            paddingTop: "24px",
            paddingRight: "24px",
            paddingBottom: "24px",
            paddingLeft: "24px",
            backgroundColor: "#eff6ff",
            borderRadius: "12px",
            borderWidth: "1px",
            borderColor: "#bfdbfe",
          },
          children: [
            {
              id: "col_preset_2_h",
              type: "heading",
              props: { level: 3, text: "Sağ Sütun Başlığı" },
            },
            {
              id: "col_preset_2_p",
              type: "paragraph",
              props: {
                text: "Sağ sütun kendi arka plan rengine, iç boşluğuna (padding) ve bağımsız alt bloklarına sahiptir.",
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_studio_row_3col",
    name: "3 Sütunlu Özellik & Kart Satırı (33% x 3)",
    category: "bento",
    description:
      "3 eşit sütunlu esnek satır düzeni; her sütuna ayrı bloklar ve özel kenarlık/arka plan stili uygulanabilir.",
    badge: "3 Sütun Grid",
    previewKind: "bento-3",
    block: {
      type: "columns",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        layout: "4+4+4",
        gap: "20px",
        verticalAlign: "stretch",
      },
      children: [
        {
          id: "col3_1",
          type: "column",
          props: { widthPct: 33.33 },
          style: {
            paddingTop: "20px",
            paddingRight: "20px",
            paddingBottom: "20px",
            paddingLeft: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            borderWidth: "1px",
            borderColor: "#e2e8f0",
          },
          children: [
            { id: "col3_1_h", type: "heading", props: { level: 3, text: "01. 0-KB RSC Hızı" } },
            { id: "col3_1_p", type: "paragraph", props: { text: "Sıfır gereksiz istemci JavaScript yükü." } },
          ],
        },
        {
          id: "col3_2",
          type: "column",
          props: { widthPct: 33.33 },
          style: {
            paddingTop: "20px",
            paddingRight: "20px",
            paddingBottom: "20px",
            paddingLeft: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            borderWidth: "1px",
            borderColor: "#e2e8f0",
          },
          children: [
            { id: "col3_2_h", type: "heading", props: { level: 3, text: "02. SEO Motoru" } },
            { id: "col3_2_p", type: "paragraph", props: { text: "Her kayıtta otomatik JSON-LD ve 301." } },
          ],
        },
        {
          id: "col3_3",
          type: "column",
          props: { widthPct: 33.33 },
          style: {
            paddingTop: "20px",
            paddingRight: "20px",
            paddingBottom: "20px",
            paddingLeft: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            borderWidth: "1px",
            borderColor: "#e2e8f0",
          },
          children: [
            { id: "col3_3_h", type: "heading", props: { level: 3, text: "03. Agentic RAG" } },
            { id: "col3_3_p", type: "paragraph", props: { text: "Ön-derlenmiş Markdown ve /llms.txt." } },
          ],
        },
      ],
    },
  },
  {
    id: "lib_editorial_comparison_table",
    name: "Kurumsal Karşılaştırma Tablosu (Comparison Table)",
    category: "editorial",
    description:
      "Ürün, mimari veya rakip karşılaştırmaları için SGE ve LLM dostu yapılandırılmış tablo bloğu.",
    badge: "SGE Tablo",
    previewKind: "bento-4",
    block: {
      type: "comparison_table",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        title: "Mimari Karşılaştırma Tablosu",
        headers: ["Özellik", "NexPress 0-KB RSC", "Geleneksel CMS"],
        rows: [
          ["Ön Yüz JS Yükü", "0 KB (Saf RSC)", "650 KB - 1.2 MB"],
          ["SEO & Schema", "Yerleşik Çekirdek Motor", "Üçüncü Parti Eklenti"],
          ["Markdown / llms.txt", "Kayıt Anında Otomatik (0ms)", "Desteklenmiyor"],
        ],
      },
    },
  },
  {
    id: "lib_sticky_anchor_bar",
    name: "Yapışkan HTML Çapa Gezgini (Bölüm Sekmeleri)",
    category: "layout",
    description:
      "Kategori ve ürün sayfalarında hero altına yerleşen, sayfa kaydırıldıkça ekranda yapışkan kalan ve tıklandığında #genel-bakis, #urunler, #sss vb. bölümlere yumuşak kaydıran 0-KB RSC gezgin çubuğu.",
    badge: "Yeni • Yapışkan Çapa",
    previewKind: "columns",
    block: {
      type: "anchor_nav",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        title: "Bölümler",
        sticky: true,
        styleVariant: "underline",
        ctaLabel: "Sizi Arayalım",
        ctaHref: "#teklif-formu",
        items: [
          { label: "Genel Bakış", href: "#genel-bakis", icon: "sparkles" },
          { label: "Ürünler & Çözümler", href: "#urunler", icon: "layers" },
          { label: "Detaylı İncele", href: "#detayli-incele", icon: "check-circle" },
          { label: "Karşılaştırma", href: "#karsilastirma", icon: "bar-chart" },
          { label: "Sıkça Sorulan Sorular", href: "#sss", icon: "help-circle" },
          { label: "Başarı Hikayeleri", href: "#basari-hikayeleri", icon: "award" },
          { label: "Referanslar", href: "#referanslar", icon: "shield" },
          { label: "Teklif Formu", href: "#teklif-formu", icon: "send" },
        ],
      },
    },
  },
  {
    id: "lib_erp_overview_3col",
    name: "Genel Bakış — 3 Sütunlu Ön Muhasebe Özellik Kartları (#genel-bakis)",
    category: "bento",
    description:
      "Ön Muhasebe nedir, özellikleri ve neler yapılabileceğini açıklayan 3 sütunlu kurumsal bilgi matrisi. HTML çapa kimliği #genel-bakis ile hazır gelir.",
    badge: "Ön Muhasebe • #genel-bakis",
    previewKind: "bento-3",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        title: "",
        containerMode: "boxed",
      },
      style: {
        anchorId: "genel-bakis",
        paddingTop: "64px",
        paddingRight: "24px",
        paddingBottom: "64px",
        paddingLeft: "24px",
        backgroundColor: "#ffffff",
      },
      children: [
        {
          id: "erp_ov_header",
          type: "heading",
          props: {
            level: 2,
            text: "Genel Bakış",
            align: "center",
          },
        },
        {
          id: "erp_ov_subtitle",
          type: "paragraph",
          props: {
            text: "Ön Muhasebe Programı'nın temel özelliklerini keşfedin.",
            align: "center",
          },
          style: {
            textAlign: "center",
            textColor: "#64748b",
            marginBottom: "36px",
          },
        },
        {
          id: "erp_ov_cols",
          type: "columns",
          props: {
            layout: "4+4+4",
            gap: "28px",
            verticalAlign: "stretch",
          },
          children: [
            {
              id: "erp_ov_col1",
              type: "column",
              props: { widthPct: 33.33 },
              style: {
                paddingTop: "28px",
                paddingRight: "24px",
                paddingBottom: "28px",
                paddingLeft: "24px",
                backgroundColor: "#fcfcfd",
                borderRadius: "16px",
                borderWidth: "1px",
                borderColor: "#f1f2f6",
              },
              children: [
                {
                  id: "erp_c1_icon",
                  type: "single_icon",
                  props: {
                    icon: "help-circle",
                    size: 36,
                    color: "#c8102e",
                    align: "left",
                  },
                },
                {
                  id: "erp_c1_h",
                  type: "heading",
                  props: {
                    level: 3,
                    text: "Ön Muhasebe Programı nedir?",
                  },
                  style: { marginTop: "16px", marginBottom: "12px" },
                },
                {
                  id: "erp_c1_p",
                  type: "paragraph",
                  props: {
                    text: "Ön muhasebe programı işletmelerin günlük finansal işlemlerini takip etmelerini sağlayan bir yazılımdır. Ön muhasebe programları karmaşık muhasebe süreçlerine girmeden temel finansal kayıtların tutulmasını sağlar. Bu sayede işletmeler faturalarını düzenleyebilir, ödemelerini planlayabilir, tahsilatlarını takip edebilir ve müşterileriyle olan finansal ilişkilerini yönetebilir.",
                  },
                  style: { textColor: "#4b5563" },
                },
              ],
            },
            {
              id: "erp_ov_col2",
              type: "column",
              props: { widthPct: 33.33 },
              style: {
                paddingTop: "28px",
                paddingRight: "24px",
                paddingBottom: "28px",
                paddingLeft: "24px",
                backgroundColor: "#fcfcfd",
                borderRadius: "16px",
                borderWidth: "1px",
                borderColor: "#f1f2f6",
              },
              children: [
                {
                  id: "erp_c2_icon",
                  type: "single_icon",
                  props: {
                    icon: "bar-chart",
                    size: 36,
                    color: "#c8102e",
                    align: "left",
                  },
                },
                {
                  id: "erp_c2_h",
                  type: "heading",
                  props: {
                    level: 3,
                    text: "Ön Muhasebe Programı'nın özellikleri",
                  },
                  style: { marginTop: "16px", marginBottom: "12px" },
                },
                {
                  id: "erp_c2_list",
                  type: "list_element",
                  props: {
                    listType: "bullet",
                    items: [
                      "Fatura yönetimi ve e-Fatura entegrasyonu",
                      "Stok takibi ve kritik stok uyarıları",
                      "Kasa ve banka hesap hareketleri",
                      "Finansal durum ve kârlılık raporları",
                      "Cari hesap takibi ve bakiye yaşlandırma",
                      "Tam entegrasyon ve mobil uyumluluk",
                      "Kullanıcı dostu, sade ve hızlı arayüz",
                    ],
                  },
                  style: { textColor: "#374151" },
                },
              ],
            },
            {
              id: "erp_ov_col3",
              type: "column",
              props: { widthPct: 33.33 },
              style: {
                paddingTop: "28px",
                paddingRight: "24px",
                paddingBottom: "28px",
                paddingLeft: "24px",
                backgroundColor: "#fcfcfd",
                borderRadius: "16px",
                borderWidth: "1px",
                borderColor: "#f1f2f6",
              },
              children: [
                {
                  id: "erp_c3_icon",
                  type: "single_icon",
                  props: {
                    icon: "check-circle",
                    size: 36,
                    color: "#c8102e",
                    align: "left",
                  },
                },
                {
                  id: "erp_c3_h",
                  type: "heading",
                  props: {
                    level: 3,
                    text: "Ön Muhasebe ile neler yapabilirsiniz?",
                  },
                  style: { marginTop: "16px", marginBottom: "12px" },
                },
                {
                  id: "erp_c3_list",
                  type: "list_element",
                  props: {
                    listType: "bullet",
                    items: [
                      "Fatura ve irsaliye düzenleme (e-Arşiv / e-Fatura)",
                      "Müşteri ve tedarikçi cari hesap yönetimi",
                      "Çek, senet ve taksitli tahsilat takibi",
                      "Depolar arası transfer ve barkodlu stok",
                      "Nakit akışı kontrolü ve gelecek öngörüsü",
                      "Detaylı KDV, ciro ve kâr-zarar analizi",
                    ],
                  },
                  style: { textColor: "#374151" },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_erp_split_hero_form",
    name: "Ön Muhasebe & ERP Split Hero + Sizi Arayalım Kartı",
    category: "hero",
    description:
      "Sol sütunda değer önerisi, rozet ve metrik şeridi; sağ sütunda 'Sizi Arayalım / Ücretsiz Demo' formu bulunan 7+5 oranlı kurumsal açılış vitrini.",
    badge: "Kurumsal Vitrin • 7+5",
    previewKind: "hero-split",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed" },
      style: {
        paddingTop: "56px",
        paddingRight: "24px",
        paddingBottom: "56px",
        paddingLeft: "24px",
        backgroundColor: "#f7f8fa",
        borderRadius: "20px",
        borderWidth: "1px",
        borderColor: "#e5e7eb",
      },
      children: [
        {
          id: "erp_hero_cols",
          type: "columns",
          props: { layout: "8+4", gap: "36px", verticalAlign: "center" },
          children: [
            {
              id: "erp_hero_left",
              type: "column",
              props: { widthPct: 65 },
              children: [
                {
                  id: "erp_hero_badge",
                  type: "callout",
                  props: {
                    tone: "NOTE",
                    title: "BULUT TABANLI YENİ NESİL ÖN MUHASEBE",
                    text: "14 gün ücretsiz deneyin • Kredi kartı gerekmez • 0-KB RSC hızı",
                  },
                },
                {
                  id: "erp_hero_h1",
                  type: "heading",
                  props: {
                    level: 1,
                    text: "İşletmenizin Tüm Ön Muhasebe Süreçlerini Tek Merkezden Yönetin",
                  },
                  style: { marginTop: "16px", marginBottom: "16px" },
                },
                {
                  id: "erp_hero_p",
                  type: "paragraph",
                  props: {
                    text: "Fatura ve e-Fatura kesme, gelir-gider takibi, stok yönetimi, cari hesap ve banka entegrasyonlarını saniyeler içinde yapın. Masaüstünden veya mobilden 7/24 finansal kontrol parmaklarınızın ucunda.",
                  },
                  style: { textColor: "#4b5563", marginBottom: "24px" },
                },
                {
                  id: "erp_hero_stats",
                  type: "stats_strip",
                  props: {
                    stats: [
                      { value: "45.000+", label: "Aktif İşletme" },
                      { value: "%99.9", label: "Bulut Erişilebilirlik" },
                      { value: "0 TL", label: "Kurulum & Güncelleme" },
                    ],
                  },
                },
              ],
            },
            {
              id: "erp_hero_right",
              type: "column",
              props: { widthPct: 35 },
              style: {
                paddingTop: "28px",
                paddingRight: "24px",
                paddingBottom: "28px",
                paddingLeft: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                borderWidth: "1px",
                borderColor: "#e5e7eb",
              },
              children: [
                {
                  id: "erp_lead_h",
                  type: "heading",
                  props: { level: 3, text: "Sizi Arayalım" },
                },
                {
                  id: "erp_lead_p",
                  type: "paragraph",
                  props: {
                    text: "Uzman danışmanlarımız işletmenize en uygun çözümü sunmak için hemen arasın.",
                  },
                  style: { textColor: "#64748b", marginBottom: "16px" },
                },
                {
                  id: "erp_lead_form",
                  type: "form_block",
                  props: {
                    title: "Hızlı Teklif Formu",
                    submitLabel: "Beni Arayın",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_erp_solution_tabs",
    name: "Ön Muhasebe Çözüm Ailesi (Bulut & On-Premise) (#urunler)",
    category: "layout",
    description:
      "Bulut ve On-Premise ön muhasebe çözümlerini sekmeli vitrinde sunar. HTML çapa kimliği #urunler ile önceden bağlıdır.",
    badge: "Çözüm Ailesi • #urunler",
    previewKind: "columns",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed" },
      style: {
        anchorId: "urunler",
        paddingTop: "60px",
        paddingRight: "24px",
        paddingBottom: "60px",
        paddingLeft: "24px",
        backgroundColor: "#f7f8fa",
      },
      children: [
        {
          id: "erp_sol_h",
          type: "heading",
          props: { level: 2, text: "Ön Muhasebe Çözüm Ailesi", align: "center" },
        },
        {
          id: "erp_sol_p",
          type: "paragraph",
          props: {
            text: "İşletmenizin büyüklüğüne ve çalışma şekline göre özelleştirilmiş çözümler.",
            align: "center",
          },
          style: { textAlign: "center", textColor: "#64748b", marginBottom: "32px" },
        },
        {
          id: "erp_sol_tabs",
          type: "tabs",
          props: {
            tabStyle: "pills",
            align: "center",
            items: [
              {
                label: "Bulut Ön Muhasebe",
                icon: "sparkles",
                title: "Bulut Ön Muhasebe Çözümü",
                body: "Web tarayıcısından ve mobilden her an erişilebilir. Sunucu maliyeti olmadan anında kullanmaya başlayın.",
              },
              {
                label: "Masaüstü & Hibrit Çözüm",
                icon: "layers",
                title: "Masaüstü ve Hibrit ERP Entegre Ön Muhasebe",
                body: "Gelişmiş üretim, çoklu şube ve offline çalışabilen kurumsal ön muhasebe altyapısı.",
              },
              {
                label: "e-Dönüşüm Entegrasyonu",
                icon: "shield",
                title: "e-Fatura, e-Arşiv ve e-İrsaliye Paketi",
                body: "GİB mevzuatına %100 uyumlu, kontör maliyetlerini minimuma indiren entegre e-dönüşüm modülü.",
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: "lib_erp_scale_comparison",
    name: "Ölçeğe Göre Paket Karşılaştırma Matrisi (#karsilastirma)",
    category: "editorial",
    description:
      "Mikro İşletmeler, KOBİ'ler ve Büyüyen Şirketler için özellik karşılaştırma tablosu. HTML çapa kimliği #karsilastirma ile önceden bağlıdır.",
    badge: "Karşılaştırma • #karsilastirma",
    previewKind: "bento-4",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed" },
      style: {
        anchorId: "karsilastirma",
        paddingTop: "60px",
        paddingRight: "24px",
        paddingBottom: "60px",
        paddingLeft: "24px",
        backgroundColor: "#ffffff",
      },
      children: [
        {
          id: "erp_comp_h",
          type: "heading",
          props: {
            level: 2,
            text: "İşletme Büyüklüğünüze En Uygun Paketi Seçin",
            align: "center",
          },
        },
        {
          id: "erp_comp_p",
          type: "paragraph",
          props: {
            text: "İhtiyacınız olan özellikleri şeffafça karşılaştırın, bütçenize göre en doğru kararı verin.",
            align: "center",
          },
          style: { textAlign: "center", textColor: "#64748b", marginBottom: "32px" },
        },
        {
          id: "erp_comp_table",
          type: "comparison_table",
          props: {
            title: "Ön Muhasebe Paket Özellik Karşılaştırması",
            headers: ["Özellik", "Mikro Paket", "KOBİ Standart", "Kurumsal Pro"],
            rows: [
              ["Kullanıcı Sayısı", "1 Kullanıcı", "3 Kullanıcı", "Sınırsız"],
              ["Fatura & e-Fatura", "Aylık 100 Adet", "Aylık 1.000 Adet", "Sınırsız"],
              ["Stok & Depo Takibi", "Temel", "Gelişmiş + Kritik Stok", "Çoklu Depo + Barkod"],
              ["Banka Entegrasyonu", "Opsiyonel", "Dahil (5 Banka)", "Dahil (Tüm Bankalar)"],
              ["Mobil Uygulama (iOS/Android)", "Dahil", "Dahil", "Dahil"],
              ["7/24 Teknik Destek", "E-posta", "Telefon + E-posta", "Özel Müşteri Temsilcisi"],
            ],
          },
        },
      ],
    },
  },
  {
    id: "lib_erp_faq_section",
    name: "Ön Muhasebe Sıkça Sorulan Sorular (#sss)",
    category: "aio_sge",
    description:
      "Ön muhasebe, e-fatura geçişi ve veri güvenliğiyle ilgili en çok sorulan soruları içeren FAQPage uyumlu akordeon bölümü (#sss).",
    badge: "SSS • #sss",
    previewKind: "faq-list",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed" },
      style: {
        anchorId: "sss",
        paddingTop: "60px",
        paddingRight: "24px",
        paddingBottom: "60px",
        paddingLeft: "24px",
        backgroundColor: "#f7f8fa",
      },
      children: [
        {
          id: "erp_faq_h",
          type: "heading",
          props: {
            level: 2,
            text: "Sıkça Sorulan Sorular",
            align: "center",
          },
        },
        {
          id: "erp_faq_p",
          type: "paragraph",
          props: {
            text: "Ön muhasebe programları ve geçiş süreci hakkında merak edilenler.",
            align: "center",
          },
          style: { textAlign: "center", textColor: "#64748b", marginBottom: "32px" },
        },
        {
          id: "erp_faq_acc",
          type: "faq_accordion",
          props: {
            title: "Sıkça Sorulan Sorular",
            items: [
              {
                question: "Ön muhasebe programı ile genel muhasebe arasındaki fark nedir?",
                answer:
                  "Ön muhasebe işletmenin günlük fatura, cari, kasa, stok ve banka hareketlerini yönetir. Genel muhasebe ise devlet kurumlarına verilecek resmi defterler, beyannameler ve bilanço gibi yasal süreçleri kapsar. Ön muhasebe verileri doğrudan mali müşavirinize tek tıkla aktarılabilir.",
              },
              {
                question: "Mevcut Excel veya eski programdaki verilerimi aktarabilir miyim?",
                answer:
                  "Evet, mevcut cari kartlarınızı, stok listelerinizi ve fiyatlarınızı Excel şablonuyla saniyeler içinde kayıpsız içe aktarabilirsiniz.",
              },
              {
                question: "e-Fatura ve e-Arşiv faturaya geçiş zorunlu mu?",
                answer:
                  "GİB mevzuatına göre belirlenen ciro sınırını aşan firmalar için e-fatura zorunludur. Ancak sınırın altında kalsanız dahi kağıt, kargo ve arşivleme maliyetlerinden tasarruf etmek için isteğe bağlı olarak hemen e-faturaya geçebilirsiniz.",
              },
              {
                question: "Verilerim nerede saklanıyor, ne kadar güvende?",
                answer:
                  "Verileriniz ISO 27001 sertifikalı Türkiye lokasyonlu Tier-3 veri merkezlerinde 256-bit SSL şifrelemeyle ve günlük otomatik yedeklemeyle korunur.",
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: "lib_erp_bottom_dock",
    name: "3'lü İletişim & Destek Şeridi (#iletisim)",
    category: "layout",
    description:
      "Sayfa altında veya yapışkan dock olarak çalışan; Dijital Danışman, Çözüm Bulucu ve WhatsApp hattını içeren kurumsal destek bandı.",
    badge: "Destek Bandı",
    previewKind: "columns",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed" },
      style: {
        anchorId: "iletisim",
        paddingTop: "24px",
        paddingRight: "24px",
        paddingBottom: "24px",
        paddingLeft: "24px",
        backgroundColor: "#ffffff",
        borderWidth: "1px",
        borderColor: "#e5e7eb",
      },
      children: [
        {
          id: "erp_dock_cols",
          type: "columns",
          props: { layout: "4+4+4", gap: "24px", verticalAlign: "center" },
          children: [
            {
              id: "dock_c1",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "dock_c1_b",
                  type: "button_element",
                  props: {
                    label: "Dijital Danışman'a Sorun",
                    subtext: "Yapay zeka asistanı 7/24 yanınızda",
                    href: "#teklif-formu",
                    icon: "sparkles",
                    styleVariant: "outline",
                    align: "center",
                  },
                },
              ],
            },
            {
              id: "dock_c2",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "dock_c2_b",
                  type: "button_element",
                  props: {
                    label: "Size En Uygun Çözümü Bulun",
                    subtext: "1 dakikada ihtiyacınızı belirleyin",
                    href: "#karsilastirma",
                    icon: "bar-chart",
                    styleVariant: "outline",
                    align: "center",
                  },
                },
              ],
            },
            {
              id: "dock_c3",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "dock_c3_b",
                  type: "button_element",
                  props: {
                    label: "WhatsApp ile İletişime Geçin",
                    subtext: "Satış uzmanımızla anında görüşün",
                    href: "https://wa.me/908500000000",
                    icon: "send",
                    styleVariant: "primary",
                    align: "center",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // KURUMSAL YAZILIM, KAMPANYA VE BİLGİ BANKASI TASARIMLARI
  // ---------------------------------------------------------------------------
  {
    id: "lib_software_hero_demo",
    name: "Yazılım & ERP Hero + Demo İstek Kartı",
    category: "hero",
    description: "8+4 Bölünmüş ERP yazılım hero başlığı, sürüm rozetleri ve canlı demo istek formu.",
    previewKind: "hero-split",
    badge: "ERP & Yazılım",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed", anchorId: "yazilim-genel" },
      style: { paddingTop: "48px", paddingBottom: "48px" },
      children: [
        {
          id: "sw_hero_cols",
          type: "columns",
          props: { ratio: "8+4", gap: "2.5rem", verticalAlign: "center" },
          children: [
            {
              id: "sw_hero_left",
              type: "column",
              props: { widthPct: 66.66 },
              children: [
                {
                  id: "sw_hero_badge",
                  type: "paragraph",
                  props: { text: "🚀 YENİ NESİL KURUMSAL KAYNAK PLANLAMA (ERP) ÇÖZÜMÜ", html: "<span style='color:#c8102e;font-weight:700;font-size:12px;letter-spacing:1px;'>🚀 YENİ NESİL KURUMSAL KAYNAK PLANLAMA (ERP) ÇÖZÜMÜ</span>" },
                },
                {
                  id: "sw_hero_h1",
                  type: "heading",
                  props: { level: 1, text: "İşletmenizin Tüm Süreçlerini Tek Merkezden Yönetin" },
                },
                {
                  id: "sw_hero_p",
                  type: "paragraph",
                  props: { text: "Ön muhasebe, genel muhasebe, e-Dönüşüm (e-Fatura/e-Arşiv), stok-depo, üretim ve finans süreçlerinizi hatasız, hızlı ve güvenle kontrol altına alın." },
                },
                {
                  id: "sw_hero_btns",
                  type: "button_row",
                  props: {
                    align: "left",
                    buttons: [
                      { label: "Ücretsiz Canlı Demo Talebi →", href: "#demo-formu", variant: "primary" },
                      { label: "Modülleri İncele", href: "#moduller", variant: "outline" },
                    ],
                  },
                },
              ],
            },
            {
              id: "sw_hero_right",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "sw_hero_card",
                  type: "info_box",
                  props: {
                    icon: "sparkles",
                    title: "Hemen Canlı Tanıtım Alın",
                    text: "Sektörünüze özel demo için formu doldurun veya uzmanımızı arayın.",
                    linkText: "0 (232) 555 00 00",
                    linkHref: "tel:02325550000",
                    tone: "primary",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_software_modules_tabs",
    name: "Yazılım Çözüm ve Modül Sekmeleri",
    category: "layout",
    description: "Ön Muhasebe, ERP, e-Dönüşüm, CRM ve Üretim modüllerini içeren zengin sekmeli vitrin.",
    previewKind: "columns",
    badge: "Modül Sekmeleri",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed", anchorId: "moduller" },
      style: { paddingTop: "40px", paddingBottom: "40px" },
      children: [
        {
          id: "mod_head",
          type: "heading",
          props: { level: 2, text: "Geniş Modüler Yapı ile İhtiyacınıza Göre Ölçekleyin", align: "center" },
        },
        {
          id: "mod_desc",
          type: "paragraph",
          props: { text: "Yalnızca ihtiyacınız olan modülleri lisanslayın, işletmeniz büyüdükçe yeni yetenekler ekleyin.", align: "center" },
        },
        {
          id: "mod_tabs",
          type: "tabs",
          props: {
            title: "Yazılım Modülleri",
            tabStyle: "pills",
            tabs: [
              { id: "tab_muhasebe", label: "Ön & Genel Muhasebe", icon: "file-text" },
              { id: "tab_edonusum", label: "e-Dönüşüm Entegrasyonu", icon: "check-circle" },
              { id: "tab_stok", label: "Stok & Çoklu Depo", icon: "layers" },
              { id: "tab_uretim", label: "Üretim & MRP Planlama", icon: "settings" },
              { id: "tab_crm", label: "Müşteri İlişkileri (CRM)", icon: "users" },
            ],
          },
          children: [
            {
              id: "tab_col_1",
              type: "column",
              props: { widthPct: 100 },
              children: [
                {
                  id: "tab_1_row",
                  type: "columns",
                  props: { ratio: "6+6", gap: "2rem", verticalAlign: "center" },
                  children: [
                    {
                      id: "tab_1_c1",
                      type: "column",
                      props: { widthPct: 50 },
                      children: [
                        { id: "t1_h", type: "heading", props: { level: 3, text: "Cari, Kasa, Banka ve Çek/Senet Takibi" } },
                        { id: "t1_p", type: "paragraph", props: { text: "Tüm borç-alacak hesaplarınızı anlık olarak izleyin, vade günlerini otomatik takip edin ve resmi muhasebe standartlarına tam uyum sağlayın." } },
                        { id: "t1_l", type: "icon_list", props: { items: [{ icon: "check", title: "Otomatik Ekstre Gönderimi", text: "Müşterilerinize tek tıkla WhatsApp veya e-posta ile bakiye ekstresi iletin." }, { icon: "check", title: "Çoklu Para Birimi & Döviz Takibi", text: "TCMB kurlarıyla anlık dövizli cari değerleme ve kur farkı hesaplama." }] } },
                      ],
                    },
                    {
                      id: "tab_1_c2",
                      type: "column",
                      props: { widthPct: 50 },
                      children: [
                        { id: "t1_box", type: "info_box", props: { icon: "award", title: "Tam Mevzuat Uyumu", text: "Gelir İdaresi Başkanlığı güncel muhasebe tebliğleri ve tek düzen hesap planı ile %100 entegre.", tone: "primary" } },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_software_specs_grid",
    name: "Yazılım Teknik Özellikler & Donanım Tablosu",
    category: "data",
    description: "İşletim sistemi, veritabanı desteği ve minimum/önerilen donanım gereksinimleri matrisi.",
    previewKind: "columns",
    badge: "Teknik Spek",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed", anchorId: "teknik-ozellikler" },
      style: { paddingTop: "40px", paddingBottom: "40px" },
      children: [
        {
          id: "specs_h",
          type: "heading",
          props: { level: 2, text: "Teknik Altyapı & Sistem Gereksinimleri", align: "center" },
        },
        {
          id: "specs_cols",
          type: "columns",
          props: { ratio: "4+4+4", gap: "1.5rem", verticalAlign: "top" },
          children: [
            {
              id: "spec_c1",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "spec_box1",
                  type: "info_box",
                  props: {
                    icon: "monitor",
                    title: "Desteklenen İşletim Sistemleri",
                    text: "Windows 10, Windows 11 (64-bit), Windows Server 2019/2022. İstemciler için Web Tarayıcı ve Mobil uyumlu.",
                    tone: "primary",
                  },
                },
              ],
            },
            {
              id: "spec_c2",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "spec_box2",
                  type: "info_box",
                  props: {
                    icon: "layers",
                    title: "Güçlü Veritabanı Mimarisi",
                    text: "Yüksek hızlı Firebird SQL ve kurumsal ölçekte Microsoft SQL Server desteğiyle milyonlarca kayıtta sıfır yavaşlama.",
                    tone: "accent",
                  },
                },
              ],
            },
            {
              id: "spec_c3",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "spec_box3",
                  type: "info_box",
                  props: {
                    icon: "shield",
                    title: "Yedekleme & Veri Güvenliği",
                    text: "Günlük yerel ve bulut otomatik yedekleme entegrasyonu. SSL ve rol tabanlı kullanıcı yetkilendirme güvenliği.",
                    tone: "muted",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_campaign_hero_countdown",
    name: "Kampanya Fırsat Şeridi + Geri Sayım ve İndirim",
    category: "commerce",
    description: "Sınırlı süreli kampanya bannerı, indirim rozeti, hediye avantajları ve çağrı butonu.",
    previewKind: "cta-strip",
    badge: "Kampanya",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed", anchorId: "firsat" },
      style: { paddingTop: "32px", paddingBottom: "32px", backgroundColor: "#fffbeb", borderRadius: "16px", borderWidth: "1px", borderColor: "#fde68a" },
      children: [
        {
          id: "camp_cols",
          type: "columns",
          props: { ratio: "8+4", gap: "2rem", verticalAlign: "center" },
          children: [
            {
              id: "camp_left",
              type: "column",
              props: { widthPct: 66.66 },
              children: [
                {
                  id: "camp_badge",
                  type: "paragraph",
                  props: { text: "🔥 SINIRLI SÜRELİ YIL SONU FIRSATI", html: "<span style='background:#c8102e;color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;'>🔥 %30 İNDİRİM FIRSATI</span>" },
                },
                {
                  id: "camp_h2",
                  type: "heading",
                  props: { level: 2, text: "Yeni Lisans Alımlarında 1 Yıl Bulut Yedekleme Hediye!" },
                },
                {
                  id: "camp_p",
                  type: "paragraph",
                  props: { text: "Yıl sonuna kadar geçerli kampanya kapsamında ERP paketlerinde %30 indirim ve 1.000 adet e-Fatura kontörü hediye ediyoruz." },
                },
              ],
            },
            {
              id: "camp_right",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "camp_btn",
                  type: "button_element",
                  props: {
                    label: "Fırsattan Hemen Yararlanın →",
                    href: "#demo-formu",
                    styleVariant: "primary",
                    align: "center",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "lib_qa_featured_answer",
    name: "Öne Çıkan Uzman Kısa Cevabı (Featured Answer)",
    category: "aio_sge",
    description: "Google Featured Snippet ve AI arama motorları için öne çıkan doğrudan cevap ve onay rozeti.",
    previewKind: "prose-section",
    badge: "AI Soru-Cevap",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed", anchorId: "uzman-cevabi" },
      style: { paddingTop: "32px", paddingBottom: "32px" },
      children: [
        {
          id: "qa_head",
          type: "heading",
          props: { level: 2, text: "Uzman Cevabı & Mevzuat Özeti" },
        },
        {
          id: "qa_box_info",
          type: "info_box",
          props: {
            icon: "check-circle",
            title: "Net ve Doğrudan Yanıt",
            text: "Gelir İdaresi Başkanlığı tebliğine göre yıllık brüt satış hasılatı sınırını aşan tüm işletmeler takip eden yılbaşında sisteme geçmekle yükümlüdür. Lisanslı ERP yazılımınız üzerinden tek tıkla e-Dönüşüm aktivasyonu tamamlanabilmektedir.",
            tone: "primary",
          },
        },
      ],
    },
  },
  {
    id: "lib_support_remote_tools",
    name: "Uzak Masaüstü İndirme Çubuğu & Destek Araçları",
    category: "layout",
    description: "AnyDesk, TeamViewer ve Alpemix hızlı indirme butonları ile teknik çağrı merkezi iletişim kartı.",
    previewKind: "cta-strip",
    badge: "Destek Hub",
    block: {
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { containerMode: "boxed", anchorId: "uzak-destek" },
      style: { paddingTop: "32px", paddingBottom: "32px" },
      children: [
        {
          id: "sup_h",
          type: "heading",
          props: { level: 2, text: "Uzak Masaüstü Bağlantı Araçları", align: "center" },
        },
        {
          id: "sup_cols",
          type: "columns",
          props: { ratio: "4+4+4", gap: "1.5rem", verticalAlign: "center" },
          children: [
            {
              id: "sup_c1",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "sup_b1",
                  type: "button_element",
                  props: { label: "AnyDesk İndir (Windows)", href: "https://anydesk.com", styleVariant: "primary", align: "center" },
                },
              ],
            },
            {
              id: "sup_c2",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "sup_b2",
                  type: "button_element",
                  props: { label: "Alpemix Uzak Destek İndir", href: "https://alpemix.com", styleVariant: "outline", align: "center" },
                },
              ],
            },
            {
              id: "sup_c3",
              type: "column",
              props: { widthPct: 33.33 },
              children: [
                {
                  id: "sup_b3",
                  type: "button_element",
                  props: { label: "Çağrı Merkezi: 0 (232) 555 00 00", href: "tel:02325550000", styleVariant: "ghost", align: "center" },
                },
              ],
            },
          ],
        },
      ],
    },
  },
];
