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
];
