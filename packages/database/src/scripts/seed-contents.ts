import { type BlockNode } from "@nexpress/core";
import { INK_GRID_PAGES } from "@nexpress/themes/starter";
import { homeBlocks, productBlocks, kbBlocks, promptBlocks, campaignBlocks, onMuhasebeBlocks } from "./seed-blocks";

export const seedContents = [
  {
    id: "cnt_home",
    type: "page" as const,
    importanceScore: 10,
    schemaType: "WebPage",
    schemaAttributes: {
      isHomePage: true,
      _publishing: {
        visibility: "public",
        categories: ["kurumsal-mimari"],
        tags: ["nextjs-15-rsc", "llms-txt"],
        focusKeyword: "NexPress CMS",
        featuredImageUrl:
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'><rect width='1200' height='630' fill='%230F172A'/><circle cx='980' cy='140' r='260' fill='%231E3A8A' opacity='0.45'/><text x='80' y='230' fill='%23FFFFFF' font-family='sans-serif' font-size='52' font-weight='bold'>100/100 Lighthouse Hızı &amp;</text><text x='80' y='300' fill='%2393C5FD' font-family='sans-serif' font-size='52' font-weight='bold'>Agentic SEO Mimarisi</text></svg>",
        featuredImageAlt: "NexPress CMS 100/100 Lighthouse RSC Mimari Kapak Görseli",
      },
    },
    slug: "ana-sayfa",
    title: "NexPress CMS — 100/100 Lighthouse RSC & Agentic SEO Platformu",
    tldr: "NexPress CMS; Next.js 15 RSC, Çift Veritabanı (LibSQL & PostgreSQL/pgvector), Tema Mağazası ve Agentic SEO yeteneklerini tek çekirdekte birleştiren yeni nesil açık çekirdekli içerik yönetim sistemidir.",
    blocks: homeBlocks,
    seoScore: 98,
  },
  {
    id: "cnt_page_about",
    type: "page" as const,
    importanceScore: 9,
    schemaType: "AboutPage",
    schemaAttributes: {
      _publishing: {
        visibility: "public",
        categories: ["kurumsal-mimari"],
        tags: ["nextjs-15-rsc"],
        focusKeyword: "Açık Çekirdekli Kurumsal CMS",
      },
    },
    slug: "hakkimizda-ve-mimari-manifesto",
    title: "Hakkımızda & Açık Çekirdekli 0-KB RSC Mimari Manifestomuz",
    tldr: "Geleneksel CMS'lerin eklenti şişkinliğini ve JavaScript yükünü ortadan kaldırmak için tasarlanan NexPress, hem insan ziyaretçiler hem de AI ajanları için sıfır tavizli bir yayın motorudur.",
    blocks: [
      {
        id: "blk_about_hero",
        type: "hero",
        props: {
          badge: "KURUMSAL MANİFESTO",
          title: "Web'i Yeniden 100/100 Hıza ve Anlamsal Netliğe Kavuşturuyoruz",
          subtitle:
            "Eski nesil sayfa oluşturucuların ürettiği yüzlerce kilobaytlık gereksiz JavaScript yerine, saf React Server Components ve yerleşik SEO Motoru.",
          primaryCtaLabel: "Mimarimizi İnceleyin",
          primaryCtaHref: "/tr/0kb-rsc-gorsel-editor-mimarisi",
        },
      },
      {
        id: "blk_about_cols",
        type: "columns",
        props: {
          layout: "6+6",
          gap: "24px",
          verticalAlign: "stretch",
        },
        style: {
          paddingTop: "24px",
          paddingBottom: "24px",
        },
        children: [
          {
            id: "blk_about_col_1",
            type: "column",
            props: { widthPct: 50 },
            style: {
              paddingTop: "24px",
              paddingRight: "24px",
              paddingBottom: "24px",
              paddingLeft: "24px",
              backgroundColor: "#f8fafc",
              borderRadius: "16px",
              borderWidth: "1px",
              borderColor: "#e2e8f0",
            },
            children: [
              {
                id: "blk_about_c1_h",
                type: "heading_element",
                props: { level: "h3", text: "İnsan Web'i İçin 0-KB RSC", align: "left" },
              },
              {
                id: "blk_about_c1_p",
                type: "paragraph_element",
                props: {
                  text: "Görsel editörde kurguladığınız tüm satır, sütun ve bileşenler kayıt anında saf sunucu bileşenlerine derlenir. Tarayıcıya sıfır gereksiz JS gönderilir.",
                },
              },
            ],
          },
          {
            id: "blk_about_col_2",
            type: "column",
            props: { widthPct: 50 },
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
                id: "blk_about_c2_h",
                type: "heading_element",
                props: { level: "h3", text: "Ajan Web'i İçin Otomatik SEO & GEO", align: "left" },
              },
              {
                id: "blk_about_c2_p",
                type: "paragraph_element",
                props: {
                  text: "SEO bir eklenti değil çekirdek motordur. Her kayıtta Markdown önbelleği, JSON-LD @id grafiği ve 301 yönlendirme kuralları otomatik üretilir.",
                },
              },
            ],
          },
        ],
      },
    ] as BlockNode[],
    seoScore: 95,
  },
  {
    id: "cnt_post_rsc_speed",
    type: "post" as const,
    importanceScore: 9,
    schemaType: "BlogPosting",
    schemaAttributes: {
      _publishing: {
        visibility: "public",
        authorName: "Baş Mimari Ekibi",
        categories: ["performans-rsc", "nextjs-rsc-derleyici"],
        tags: ["nextjs-15-rsc", "llms-txt"],
        focusKeyword: "0-KB React Server Components",
        featuredImageUrl:
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'><rect width='1200' height='630' fill='%23111827'/><text x='110' y='210' fill='%2334D399' font-family='monospace' font-size='42' font-weight='bold'>0-KB RSC vs Klasik Page Builder</text></svg>",
        featuredImageAlt: "0-KB React Server Components ve Klasik Page Builder Karşılaştırması",
      },
    },
    slug: "neden-0kb-react-server-components-gelecegin-cms-standardidir",
    title: "Neden 0-KB React Server Components Geleceğin CMS Standardıdır?",
    tldr: "Klasik sayfa oluşturucuların her blok için istemciye yüklediği JavaScript yığınları Core Web Vitals skorlarını düşürürken, NexPress Studio kurumsal görsel esnekliği 0 KB istemci JS ile sunar.",
    blocks: [
      {
        id: "blk_post1_tldr",
        type: "tldr_box",
        props: {
          summary:
            "Klasik sayfa oluşturucuların her blok için istemciye yüklediği JavaScript yığınları Core Web Vitals skorlarını düşürürken, NexPress Studio kurumsal görsel esnekliği 0 KB istemci JS ile sunar.",
        },
      },
      {
        id: "blk_post1_h2",
        type: "heading_element",
        props: {
          level: "h2",
          text: "Görsel Esneklik ile 100/100 Hız Arasında Seçim Yapmak Zorunda Değilsiniz",
          align: "left",
        },
      },
      {
        id: "blk_post1_p1",
        type: "paragraph_element",
        props: {
          text: "Yıllarca içerik ekipleri zor bir ikilemle karşılaştı: Ya zengin satır/sütun kontrolü sunan ancak sayfayı 800 KB JavaScript ile yavaşlatan görsel eklentiler kullanacaklardı ya da geliştirici bağımlı statik şablonlara hapsolacaklardı. NexPress bu ikilemi derleme zamanlı AST mimarisiyle çözer.",
        },
      },
      {
        id: "blk_post1_quote",
        type: "quote",
        props: {
          quote:
            "En hızlı JavaScript, tarayıcıya hiç gönderilmeyen JavaScript'tir. Görsel editör yalnızca yönetim panelinde çalışmalı, ziyaretçi ise saf HTML ve CSS almalıdır.",
          author: "NexPress Çekirdek Mimari Ekibi",
          role: "Performans Mühendisliği Raporu",
        },
      },
      {
        id: "blk_post1_table",
        type: "comparison_table",
        props: {
          title: "Mimari Karşılaştırma Tablosu",
          headers: ["Kriter", "NexPress 0-KB RSC", "Klasik WP + Page Builder"],
          rows: [
            ["İstemci JS Yükü", "0 KB (Saf RSC)", "650 KB - 1.2 MB"],
            ["Ortalama TTFB / LCP", "45ms / 0.6s", "480ms / 2.9s"],
            ["Markdown & /llms.txt", "Kayıt Anında Otomatik (0ms)", "Yok / Ek Eklenti Gerekir"],
          ],
        },
      },
    ] as BlockNode[],
    seoScore: 96,
  },
  {
    id: "cnt_post_agentic_seo",
    type: "post" as const,
    importanceScore: 9,
    schemaType: "BlogPosting",
    schemaAttributes: {
      _publishing: {
        visibility: "public",
        authorName: "SEO & GEO Araştırma Ekibi",
        categories: ["agentic-seo-ve-geo", "llms-txt-ve-rag"],
        tags: ["llms-txt", "pgvector-rag"],
        focusKeyword: "Agentic SEO ve GEO",
      },
    },
    slug: "agentic-seo-ve-geo-rehberi-yapay-zeka-arama-motorlarinda-kaynak-olmak",
    title: "Agentic SEO ve GEO Rehberi: Yapay Zeka Arama Motorlarında Kaynak Olmak",
    tldr: "ChatGPT, Perplexity, Claude ve Google AI Overviews çağında yalnızca mavi link sıralaması yetmez; içeriğinizin birbirine bağlı @id JSON-LD grafiği ve temiz Markdown ile sunulması gerekir.",
    blocks: [
      {
        id: "blk_post2_tldr",
        type: "tldr_box",
        props: {
          summary:
            "ChatGPT, Perplexity, Claude ve Google AI Overviews çağında yalnızca mavi link sıralaması yetmez; içeriğinizin birbirine bağlı @id JSON-LD grafiği ve temiz Markdown ile sunulması gerekir.",
        },
      },
      {
        id: "blk_post2_list",
        type: "list_element",
        props: {
          listType: "check",
          items: [
            "Her sayfada 40-60 kelimelik net TL;DR özeti bulundurun.",
            "SSS (FAQPage) ve Adım Adım (HowTo) bloklarıyla otomatik Schema.org düğümleri üretin.",
            "URL değişimlerinde otomatik 301 yönlendirme geçmişini (slugHistory) koruyun.",
            "AI botlarına ?format=md ve /llms.txt üzerinden sıfır gürültülü Markdown sunun.",
          ],
        },
      },
    ] as BlockNode[],
    seoScore: 94,
  },
  {
    id: "cnt_product_cloud",
    type: "product" as const,
    importanceScore: 10,
    schemaType: "SoftwareApplication",
    schemaAttributes: {
      sku: "NXP-CLOUD-ENT",
      gtin13: "8690000123456",
      mpn: "NXP-2026-ENT",
      brand: "NexPress",
      price: "4900",
      priceCurrency: "TRY",
      operatingSystem: "Linux, Docker, Edge, Cloud",
      applicationCategory: "BusinessApplication",
    },
    slug: "nexpress-enterprise-cloud",
    title: "NexPress Enterprise Cloud v2026",
    tldr: "NexPress Enterprise Cloud; yüksek trafikli B2B markalar ve e-ticaret katalogları için geliştirilmiş, 100/100 Core Web Vitals garantili ve yerleşik WebMCP / RAG destekli kurumsal içerik platformudur.",
    blocks: productBlocks,
    seoScore: 96,
  },
  {
    id: "cnt_kb_rsc",
    type: "kb_tech" as const,
    importanceScore: 9,
    schemaType: "TechArticle",
    schemaAttributes: {
      proficiencyLevel: "Expert",
      dependencies: "Next.js 15, React 19 RSC, Drizzle ORM",
    },
    slug: "0kb-rsc-gorsel-editor-mimarisi",
    title: "0-KB RSC Görsel Editör ve Çift Derleme (AST + Markdown) Mimarisi",
    tldr: "NexPress Görsel Editörü yalnızca /admin altında istemci bileşeni olarak yüklenir; kaydettiğiniz anda çıktıyı saf JSON AST ve Markdown'a derleyerek ön yüzde 0 KB istemci JS ile %100 React Server Components olarak sunar.",
    blocks: kbBlocks,
    seoScore: 95,
  },
  {
    id: "cnt_prompt_wp",
    type: "ai_prompt" as const,
    importanceScore: 8,
    schemaType: "FAQPage",
    schemaAttributes: {
      sourceChannel: "gsc_paa",
      monthlySearchVolume: 2400,
    },
    slug: "neden-wordpress-yerine-nexpress-cms",
    title: "Neden WordPress Yerine NexPress CMS Tercih Edilmeli?",
    tldr: "WordPress + Elementor yığını ortalama 800 KB JS ve 40+ SQL sorgusu üretirken, NexPress CMS Next.js 15 RSC mimarisiyle 0 KB gereksiz istemci JS, yerel pgvector RAG indeksi ve otomatik @id Schema.org grafiği sunar.",
    blocks: promptBlocks,
    seoScore: 94,
  },
  {
    id: "cnt_campaign_spring",
    type: "campaign" as const,
    importanceScore: 9,
    schemaType: "Offer",
    schemaAttributes: {
      discountPercent: 30,
      validThrough: "2026-12-31",
      targetProductId: "cnt_product_cloud",
    },
    slug: "bahar-kurumsal-goc-kampanyasi",
    title: "Bahar Kurumsal Göç Kampanyası (%30 İndirim)",
    tldr: "WordPress veya eski CMS altyapısından NexPress Enterprise Cloud'a geçen kurumsal ekiplere yıllık planda %30 indirim ve ücretsiz teknik SEO göç desteği.",
    blocks: campaignBlocks,
    seoScore: 92,
  },
  {
    id: "cnt_on_muhasebe",
    type: "page" as const,
    importanceScore: 10,
    schemaType: "ItemPage",
    schemaAttributes: {
      _publishing: {
        visibility: "public",
        categories: ["muhasebe-yazilimlari"],
        tags: ["on-muhasebe", "e-fatura", "stok-takibi", "bulut-muhasebe"],
        focusKeyword: "Ön Muhasebe Programı",
      },
    },
    slug: "on-muhasebe-programi",
    title: "Ön Muhasebe Programı — Bulut & Web Tabanlı Finansal Yönetim",
    tldr: "Fatura, e-Fatura, stok, cari hesap ve banka hareketlerinizi tek merkezden kolayca yönetebileceğiniz 0-KB RSC hızında yeni nesil bulut ön muhasebe platformu.",
    blocks: onMuhasebeBlocks,
    seoScore: 99,
  },
  ...INK_GRID_PAGES,
];
