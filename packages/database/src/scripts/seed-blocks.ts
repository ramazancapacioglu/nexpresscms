import { type BlockNode } from "@nexpress/core";

export const homeBlocks: BlockNode[] = [
  {
    id: "blk_hero_1",
    type: "hero",
    variant: "aurora-split",
    props: {
      badge: "NEXT.JS 15 • 0-KB RSC • AGENTIC SEO",
      title: "WordPress ve Elementor'u Tarihe Gömen Çift Motorlu CMS",
      subtitle:
        "İnsan ziyaretçiler için 100/100 Lighthouse hızında görsel temalar; yapay zeka ajanları (ChatGPT, Perplexity, Claude) için sıfır maliyetli Markdown, /llms.txt ve bağlantılı @id Bilgi Grafiği.",
      primaryCtaLabel: "Yönetim Paneline Geç (/admin)",
      primaryCtaHref: "/admin",
      secondaryCtaLabel: "Saf Markdown Çıktısını Gör (?format=md)",
      secondaryCtaHref: "/tr?format=md",
    },
  },
  {
    id: "blk_stats_1",
    type: "stats_strip",
    props: {
      stats: [
        { value: "100 / 100", label: "Lighthouse Performans & SEO" },
        { value: "0 KB", label: "Gereksiz İstemci JavaScript'i" },
        { value: "0 ms", label: "Ön-Derlenmiş Markdown (?format=md)" },
        { value: "Çift Motor", label: "LibSQL/SQLite ↔ PostgreSQL/pgvector" },
      ],
    },
  },
  {
    id: "blk_bento_1",
    type: "bento_features",
    props: {
      title: "Neden Yeni Nesil Ekipler NexPress'e Geçiyor?",
      items: [
        {
          title: "Canlı Tema Mağazası (Theme Store)",
          description:
            "İçeriğinizi hiç bozmadan Corporate Aurora, Commerce Velocity ve Editorial Pulse temaları arasında tek tıkla geçiş yapın.",
        },
        {
          title: "Çift Modlu 0-KB RSC Görsel Editör",
          description:
            "Hem Notion akıcılığında doküman yazın hem de 12 sütunlu CSS Grid kanvas ile açılış sayfaları tasarlayın.",
        },
        {
          title: "3 Katmanlı Header, Footer & Mega-Menü",
          description:
            "TopBar, MainBar ve BottomBar şeritlerini sürükle-bırak ile kurgulayın; menü içine canlı ürün ve kampanya kartları gömün.",
        },
        {
          title: "Open-Core + Pro Agentic Fabrika",
          description:
            "Ücretsiz çekirdekte tam teknik SEO ve /llms.txt; Pro eklentilerle WebMCP, Site DNA ve 8 kaynaklı Soru Madenciliği.",
        },
      ],
    },
  },
  {
    id: "blk_product_embed_1",
    type: "product_embed",
    props: {
      contentId: "cnt_product_cloud",
      productName: "NexPress Enterprise Cloud v2026",
      sku: "NXP-CLOUD-ENT",
      price: "4.900 TL / ay",
      summary:
        "Çoklu alt alan adı (Subdomain Tenancy), PostgreSQL pgvector RAG kümesi ve gerçek zamanlı AI Bot Doğrulayıcı dahil kurumsal paket.",
    },
  },
  {
    id: "blk_faq_1",
    type: "faq_accordion",
    props: {
      title: "Sıkça Sorulan Sorular",
      items: [
        {
          question: "Tema değiştirdiğimde sayfa tasarımlarım veya içeriklerim bozulur mu?",
          answer:
            "Hayır. NexPress'te içerik blokları saf JSON AST olarak saklanır. Temalar yalnızca CSS Değişkenlerini (Design Tokens) ve RSC Blok Görünüm Varyantlarını (Block Skins) değiştirir.",
        },
        {
          question: "Docker kurmadan kendi bilgisayarımda çalıştırabilir miyim?",
          answer:
            "Evet! DB_DIALECT=sqlite seçeneğiyle tek dosya LibSQL üzerinde sıfır kurulumla çalışır, dilediğiniz an PostgreSQL 16 + pgvector konteynerine geçebilirsiniz.",
        },
      ],
    },
  },
];

export const productBlocks: BlockNode[] = [
  {
    id: "blk_prod_tldr",
    type: "tldr_box",
    props: {
      summary:
        "NexPress Enterprise Cloud; yüksek trafikli B2B markalar ve e-ticaret katalogları için geliştirilmiş, 100/100 Core Web Vitals garantili ve yerleşik WebMCP / RAG destekli kurumsal içerik platformudur.",
    },
  },
  {
    id: "blk_prod_steps",
    type: "howto_steps",
    props: {
      title: "3 Adımda Kurumsal Kurulum",
      steps: [
        {
          title: "Veritabanı Motorunu Seçin",
          description: "Yerel geliştirme için LibSQL, üretim ortamı için PostgreSQL 16 + pgvector bağlantısını aktif edin.",
        },
        {
          title: "Tema Mağazasından Kimliğinizi Belirleyin",
          description: "Sektörünüze uygun temayı seçip renk ve tipografi tokenlarını özelleştirin.",
        },
        {
          title: "İçeriklerinizi ve Entity Grafiğinizi Yayınlayın",
          description: "Makalelerinizi ve ürünlerinizi birbirine bağlayarak Google ve AI ajanlarında otorite kurun.",
        },
      ],
    },
  },
];

export const kbBlocks: BlockNode[] = [
  {
    id: "blk_kb_tldr",
    type: "tldr_box",
    props: {
      summary:
        "NexPress Görsel Editörü yalnızca /admin altında istemci bileşeni olarak yüklenir; kaydettiğiniz anda çıktıyı saf JSON AST ve Markdown'a derleyerek ön yüzde 0 KB istemci JS ile %100 React Server Components olarak sunar.",
    },
  },
  {
    id: "blk_kb_callout",
    type: "callout",
    props: {
      tone: "TIP",
      title: "Sıfır CPU Maliyetli Markdown",
      text: "Herhangi bir sayfanın sonuna ?format=md eklediğinizde veya Accept: text/markdown başlığı gönderdiğinizde markdownCache sütunu doğrudan döndürülür.",
    },
  },
  {
    id: "blk_kb_code",
    type: "code_block",
    props: {
      language: "bash",
      code: "curl -H 'Accept: text/markdown' http://localhost:3000/tr/0kb-rsc-gorsel-editor-mimarisi",
    },
  },
];

export const promptBlocks: BlockNode[] = [
  {
    id: "blk_prm_tldr",
    type: "tldr_box",
    props: {
      summary:
        "WordPress + Elementor yığını ortalama 800 KB JS ve 40+ SQL sorgusu üretirken, NexPress CMS Next.js 15 RSC mimarisiyle 0 KB gereksiz istemci JS, yerel pgvector RAG indeksi ve otomatik @id Schema.org grafiği sunar.",
    },
  },
  {
    id: "blk_prm_faq",
    type: "faq_accordion",
    props: {
      title: "Karşılaştırma Detayları",
      items: [
        {
          question: "WordPress'ten NexPress'e geçiş ne kadar sürer?",
          answer: "Yerleşik WP-Importer aracıyla yazılar, sayfalar, ürünler ve URL yönlendirmeleri dakikalar içinde aktarılır.",
        },
      ],
    },
  },
];

export const campaignBlocks: BlockNode[] = [
  {
    id: "blk_cmp_hero",
    type: "hero",
    props: {
      badge: "SINIRLI SÜRELİ KURUMSAL TEKLİF",
      title: "Bahar Kurumsal Göç Kampanyası — Yıllık Planlarda %30 İndirim",
      subtitle: "Eski CMS altyapınızdan NexPress Enterprise Cloud'a geçin, ücretsiz teknik SEO ve RAG kurulumu kazanın.",
      primaryCtaLabel: "Hemen Başvur",
      primaryCtaHref: "/admin",
    },
  },
];

export const onMuhasebeBlocks: BlockNode[] = [
  {
    id: "om_hero",
    type: "section",
    gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
    props: { containerMode: "boxed" },
    style: {
      paddingTop: "48px",
      paddingRight: "24px",
      paddingBottom: "48px",
      paddingLeft: "24px",
      backgroundColor: "#f7f8fa",
      borderRadius: "20px",
      borderWidth: "1px",
      borderColor: "#e5e7eb",
    },
    children: [
      {
        id: "om_hero_cols",
        type: "columns",
        props: { layout: "8+4", gap: "36px", verticalAlign: "center" },
        children: [
          {
            id: "om_hero_left",
            type: "column",
            props: { widthPct: 65 },
            children: [
              {
                id: "om_badge",
                type: "callout",
                props: {
                  tone: "NOTE",
                  title: "BULUT & WEB TABANLI ÖN MUHASEBE PROGRAMI",
                  text: "14 gün ücretsiz deneyin • Kredi kartı gerekmez • 0-KB RSC hızı",
                },
              },
              {
                id: "om_h1",
                type: "heading",
                props: {
                  level: 1,
                  text: "İşletmenizin Tüm Ön Muhasebe Süreçlerini Tek Merkezden Kolayca Yönetin",
                },
                style: { marginTop: "16px", marginBottom: "16px" },
              },
              {
                id: "om_p",
                type: "paragraph",
                props: {
                  text: "Fatura ve e-Fatura kesme, gelir-gider takibi, stok yönetimi, cari hesap ve banka entegrasyonlarını saniyeler içinde yapın. Masaüstünden veya mobilden 7/24 finansal kontrol parmaklarınızın ucunda.",
                },
                style: { textColor: "#4b5563", marginBottom: "24px" },
              },
              {
                id: "om_stats",
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
            id: "om_hero_right",
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
                id: "om_lead_h",
                type: "heading",
                props: { level: 3, text: "Sizi Arayalım" },
              },
              {
                id: "om_lead_p",
                type: "paragraph",
                props: {
                  text: "Uzman danışmanlarımız işletmenize en uygun ön muhasebe çözümünü sunmak için hemen arasın.",
                },
                style: { textColor: "#64748b", marginBottom: "16px" },
              },
              {
                id: "om_lead_btn",
                type: "button_element",
                props: {
                  label: "Ücretsiz Demo Talep Edin",
                  href: "#teklif-formu",
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
  {
    id: "om_sticky_anchor_bar",
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
  {
    id: "om_sec_genel_bakis",
    type: "section",
    gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
    props: { containerMode: "boxed" },
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
        id: "om_gb_h",
        type: "heading",
        props: {
          level: 2,
          text: "Genel Bakış",
          align: "center",
        },
      },
      {
        id: "om_gb_sub",
        type: "paragraph",
        props: {
          text: "Ön Muhasebe Programı'nın temel özelliklerini keşfedin.",
          align: "center",
        },
        style: {
          textAlign: "center",
          textColor: "#64748b",
          marginBottom: "40px",
        },
      },
      {
        id: "om_gb_cols",
        type: "columns",
        props: {
          layout: "4+4+4",
          gap: "28px",
          verticalAlign: "stretch",
        },
        children: [
          {
            id: "om_gb_col1",
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
                id: "om_gb_c1_icon",
                type: "single_icon",
                props: {
                  icon: "help-circle",
                  size: 36,
                  color: "#c8102e",
                  align: "left",
                },
              },
              {
                id: "om_gb_c1_h",
                type: "heading",
                props: {
                  level: 3,
                  text: "Ön Muhasebe Programı nedir?",
                },
                style: { marginTop: "16px", marginBottom: "12px" },
              },
              {
                id: "om_gb_c1_p",
                type: "paragraph",
                props: {
                  text: "Ön muhasebe programı işletmelerin günlük finansal işlemlerini takip etmelerini sağlayan bir yazılımdır. Ön muhasebe programları karmaşık muhasebe süreçlerine girmeden temel finansal kayıtların tutulmasını sağlar. Bu sayede işletmeler faturalarını düzenleyebilir, ödemelerini planlayabilir, tahsilatlarını takip edebilir ve müşterileriyle olan finansal ilişkilerini yönetebilir.",
                },
                style: { textColor: "#4b5563" },
              },
            ],
          },
          {
            id: "om_gb_col2",
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
                id: "om_gb_c2_icon",
                type: "single_icon",
                props: {
                  icon: "bar-chart",
                  size: 36,
                  color: "#c8102e",
                  align: "left",
                },
              },
              {
                id: "om_gb_c2_h",
                type: "heading",
                props: {
                  level: 3,
                  text: "Ön Muhasebe Programı'nın özellikleri",
                },
                style: { marginTop: "16px", marginBottom: "12px" },
              },
              {
                id: "om_gb_c2_l",
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
            id: "om_gb_col3",
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
                id: "om_gb_c3_icon",
                type: "single_icon",
                props: {
                  icon: "check-circle",
                  size: 36,
                  color: "#c8102e",
                  align: "left",
                },
              },
              {
                id: "om_gb_c3_h",
                type: "heading",
                props: {
                  level: 3,
                  text: "Ön Muhasebe ile neler yapabilirsiniz?",
                },
                style: { marginTop: "16px", marginBottom: "12px" },
              },
              {
                id: "om_gb_c3_l",
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
  {
    id: "om_sec_urunler",
    type: "section",
    gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
    props: { containerMode: "boxed" },
    style: {
      anchorId: "urunler",
      paddingTop: "64px",
      paddingRight: "24px",
      paddingBottom: "64px",
      paddingLeft: "24px",
      backgroundColor: "#f7f8fa",
    },
    children: [
      {
        id: "om_u_h",
        type: "heading",
        props: { level: 2, text: "Ön Muhasebe Çözüm Ailesi", align: "center" },
      },
      {
        id: "om_u_p",
        type: "paragraph",
        props: {
          text: "İşletmenizin ölçeğine ve çalışma şekline göre uyarlanmış esnek çözümler.",
          align: "center",
        },
        style: { textAlign: "center", textColor: "#64748b", marginBottom: "32px" },
      },
      {
        id: "om_u_tabs",
        type: "tabs",
        props: {
          tabStyle: "pills",
          align: "center",
          items: [
            {
              label: "Bulut Ön Muhasebe",
              icon: "sparkles",
              title: "Bulut Ön Muhasebe Çözümü",
              body: "Web tarayıcısından ve mobilden her an erişilebilir. Sunucu yatırımı olmadan hemen kullanmaya başlayın.",
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
              body: "GİB mevzuatına %100 uyumlu, kontör maliyetlerini düşüren entegre e-dönüşüm modülü.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "om_sec_detayli_incele",
    type: "section",
    gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
    props: { containerMode: "boxed" },
    style: {
      anchorId: "detayli-incele",
      paddingTop: "64px",
      paddingRight: "24px",
      paddingBottom: "64px",
      paddingLeft: "24px",
      backgroundColor: "#ffffff",
    },
    children: [
      {
        id: "om_det_h",
        type: "heading",
        props: { level: 2, text: "Detaylı İncele: Güçlü Finansal Yetenekler", align: "center" },
      },
      {
        id: "om_det_p",
        type: "paragraph",
        props: {
          text: "Karmaşık hesap defterlerini geride bırakın, işletmenizi tek ekrandan yönetin.",
          align: "center",
        },
        style: { textAlign: "center", textColor: "#64748b", marginBottom: "36px" },
      },
      {
        id: "om_det_bento",
        type: "bento_features",
        props: {
          title: "Öne Çıkan Modüller",
          items: [
            {
              title: "e-Fatura & e-Arşiv Kesimi",
              description: "Faturalarınızı saniyeler içinde oluşturun, müşterinize SMS ve e-posta ile otomatik iletin.",
            },
            {
              title: "Akıllı Stok & Kritik Seviye Uyarısı",
              description: "Tükenen ürünler için otomatik sipariş uyarısı alın, barkodlu sayım ile depo kayıplarını sıfırlayın.",
            },
            {
              title: "Banka & Kasa Entegrasyonu",
              description: "Tüm banka hesap hareketlerinizi tek tıkla çekin, cari hesaplarla otomatik mutabakat yapın.",
            },
            {
              title: "Otomatik Raporlama & Kâr Analizi",
              description: "Hangi ürün veya müşteriden ne kadar kâr ettiğinizi tek bakışta grafiklerle görün.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "om_sec_karsilastirma",
    type: "section",
    gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
    props: { containerMode: "boxed" },
    style: {
      anchorId: "karsilastirma",
      paddingTop: "64px",
      paddingRight: "24px",
      paddingBottom: "64px",
      paddingLeft: "24px",
      backgroundColor: "#f7f8fa",
    },
    children: [
      {
        id: "om_kc_h",
        type: "heading",
        props: {
          level: 2,
          text: "İşletme Büyüklüğünüze En Uygun Paketi Seçin",
          align: "center",
        },
      },
      {
        id: "om_kc_p",
        type: "paragraph",
        props: {
          text: "İhtiyacınız olan özellikleri şeffafça karşılaştırın, bütçenize göre en doğru kararı verin.",
          align: "center",
        },
        style: { textAlign: "center", textColor: "#64748b", marginBottom: "32px" },
      },
      {
        id: "om_kc_tab",
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
  {
    id: "om_sec_sss",
    type: "section",
    gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
    props: { containerMode: "boxed" },
    style: {
      anchorId: "sss",
      paddingTop: "64px",
      paddingRight: "24px",
      paddingBottom: "64px",
      paddingLeft: "24px",
      backgroundColor: "#ffffff",
    },
    children: [
      {
        id: "om_sss_h",
        type: "heading",
        props: {
          level: 2,
          text: "Sıkça Sorulan Sorular",
          align: "center",
        },
      },
      {
        id: "om_sss_p",
        type: "paragraph",
        props: {
          text: "Ön muhasebe programları ve geçiş süreci hakkında en çok merak edilen sorular.",
          align: "center",
        },
        style: { textAlign: "center", textColor: "#64748b", marginBottom: "32px" },
      },
      {
        id: "om_sss_acc",
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
  {
    id: "om_sec_basari",
    type: "section",
    gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
    props: { containerMode: "boxed" },
    style: {
      anchorId: "basari-hikayeleri",
      paddingTop: "64px",
      paddingRight: "24px",
      paddingBottom: "64px",
      paddingLeft: "24px",
      backgroundColor: "#f7f8fa",
    },
    children: [
      {
        id: "om_bh_h",
        type: "heading",
        props: { level: 2, text: "Başarı Hikayeleri & Kanıtlanmış Verimlilik", align: "center" },
      },
      {
        id: "om_bh_p",
        type: "paragraph",
        props: {
          text: "Ön muhasebe süreçlerini dijitalleştiren işletmelerin elde ettiği somut kazanımlar.",
          align: "center",
        },
        style: { textAlign: "center", textColor: "#64748b", marginBottom: "32px" },
      },
      {
        id: "om_bh_stats",
        type: "stats_strip",
        props: {
          stats: [
            { value: "%65", label: "Fatura Kesim Süresinde Azalma" },
            { value: "%90", label: "Tahsilat Takip Hızı Artışı" },
            { value: "0", label: "Stok Kaybı & Hatalı Giriş" },
            { value: "4.9 / 5", label: "Müşteri Memnuniyeti" },
          ],
        },
      },
    ],
  },
  {
    id: "om_sec_referanslar",
    type: "section",
    gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
    props: { containerMode: "boxed" },
    style: {
      anchorId: "referanslar",
      paddingTop: "64px",
      paddingRight: "24px",
      paddingBottom: "64px",
      paddingLeft: "24px",
      backgroundColor: "#ffffff",
    },
    children: [
      {
        id: "om_ref_h",
        type: "heading",
        props: { level: 2, text: "Mutlu İşletmeler Ne Diyor?", align: "center" },
      },
      {
        id: "om_ref_grid",
        type: "testimonial_grid",
        props: {
          title: "Müşteri Deneyimleri",
          items: [
            {
              quote:
                "Eski hantal programlardan sonra bulut ön muhasebeye geçmek şirketimize çağ atlattı. Cep telefonumdan tüm banka ve fatura durumumu görebiliyorum.",
              name: "Ahmet Yılmaz",
              role: "Genel Müdür, Nova Lojistik",
            },
            {
              quote:
                "e-Fatura ve e-İrsaliye kesmek eskiden saatlerimizi alıyordu. Şimdi 10 saniyede müşterinin telefonuna fatura gidiyor.",
              name: "Elif Demir",
              role: "Finans Direktörü, Artı Teknoloji",
            },
            {
              quote:
                "Stok takibi ve kritik stok uyarıları sayesinde tedarik süreçlerimizde hiç aksama yaşamadık. Kesinlikle tavsiye ederim.",
              name: "Murat Kaya",
              role: "Kurucu Ortak, Kaya Endüstri",
            },
          ],
        },
      },
    ],
  },
  {
    id: "om_sec_teklif_formu",
    type: "section",
    gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
    props: { containerMode: "boxed" },
    style: {
      anchorId: "teklif-formu",
      paddingTop: "64px",
      paddingRight: "24px",
      paddingBottom: "64px",
      paddingLeft: "24px",
      backgroundColor: "#f7f8fa",
      borderRadius: "20px",
      borderWidth: "1px",
      borderColor: "#e5e7eb",
    },
    children: [
      {
        id: "om_tf_h",
        type: "heading",
        props: { level: 2, text: "Sizi Arayalım — Ücretsiz 14 Gün Deneyin", align: "center" },
      },
      {
        id: "om_tf_p",
        type: "paragraph",
        props: {
          text: "Bilgilerinizi bırakın, uzmanımız aynı gün içinde arayarak işletmenize özel demoyu başlatsın.",
          align: "center",
        },
        style: { textAlign: "center", textColor: "#64748b", marginBottom: "32px" },
      },
      {
        id: "om_tf_callout",
        type: "callout",
        props: {
          tone: "TIP",
          title: "Ücretsiz Geçiş & Eğitim Desteği",
          text: "Eski programınızdaki cari ve stok verilerinizi uzman ekibimiz ücretsiz olarak aktarır ve ekibinize 1 saatlik canlı eğitim verir.",
        },
      },
      {
        id: "om_tf_cta",
        type: "cta_banner",
        props: {
          title: "Hemen Ücretsiz Denemeye Başlayın",
          subtitle: "14 gün boyunca tüm modülleri sınırsız ve taahhütsüz test edin.",
          buttonLabel: "Hemen Başlayın (0 TL)",
          buttonHref: "tel:08500000000",
        },
      },
    ],
  },
  {
    id: "om_bottom_dock",
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
        id: "om_dock_cols",
        type: "columns",
        props: { layout: "4+4+4", gap: "24px", verticalAlign: "center" },
        children: [
          {
            id: "om_d_c1",
            type: "column",
            props: { widthPct: 33.33 },
            children: [
              {
                id: "om_d_c1_b",
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
            id: "om_d_c2",
            type: "column",
            props: { widthPct: 33.33 },
            children: [
              {
                id: "om_d_c2_b",
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
            id: "om_d_c3",
            type: "column",
            props: { widthPct: 33.33 },
            children: [
              {
                id: "om_d_c3_b",
                type: "button_element",
                props: {
                  label: "WhatsApp'ta Görüşün",
                  subtext: "Satış uzmanımızla anında mesajlaşın",
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
];
