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
