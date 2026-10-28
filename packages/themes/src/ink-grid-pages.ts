import type { BlockNode } from "@nexpress/core";

export interface InkGridPage {
  id: string;
  type: "page";
  importanceScore: number;
  schemaType: string;
  schemaAttributes: Record<string, unknown>;
  slug: string;
  title: string;
  tldr: string;
  blocks: BlockNode[];
  seoScore: number;
}

function page(
  input: Pick<InkGridPage, "id" | "slug" | "title" | "tldr" | "blocks"> & {
    importanceScore?: number;
  }
): InkGridPage {
  return {
    type: "page",
    importanceScore: input.importanceScore ?? 8,
    schemaType: "WebPage",
    schemaAttributes: {
      canvas: true,
      _publishing: {
        visibility: "public",
        allowComments: false,
        allowReviews: false,
        showShareButtons: false,
        categories: [],
        tags: [],
      },
    },
    seoScore: 92,
    ...input,
  };
}

const names = [
  { value: "Atölye Kuzey", label: "" },
  { value: "Mavi Hat", label: "" },
  { value: "Kıvılcım", label: "" },
  { value: "Saha", label: "" },
  { value: "Çizgi", label: "" },
  { value: "Nora", label: "" },
];

export const INK_GRID_PAGES: InkGridPage[] = [
  page({
    id: "cnt_ink_home",
    slug: "vitrin",
    importanceScore: 10,
    title: "Ajanlara hazır içerik çerçevesi",
    tldr: "Niyeti yayına daha hızlı taşıyan açık çekirdekli içerik çerçevesi. Kodla şema, ekip için tuval, ziyaretçiye sıfır gereksiz istemci kodu.",
    blocks: [
      {
        id: "ink_home_hero",
        type: "hero",
        props: {
          title: "Ajanlara hazır içerik çerçevesi",
          subtitle:
            "Niyeti uygulamaya daha hızlı taşıyın. Açık çekirdekli çerçeve; şema kodda, yayın tuvalde, ön yüz sunucuda.",
          command: "pnpm dev",
          commandHref: "/tr/dokuman",
          primaryCtaLabel: "Demo iste",
          primaryCtaHref: "/tr/kurumsal",
        },
      },
      {
        id: "ink_home_names",
        type: "stats_strip",
        props: {
          stats: names,
        },
      },
      {
        id: "ink_home_split",
        type: "columns",
        props: { layout: "6+6", gap: "0px" },
        children: [
          {
            id: "ink_home_c1",
            type: "column",
            props: { widthPct: 50 },
            children: [
              {
                id: "ink_home_h1",
                type: "heading_element",
                props: { level: "h2", text: "Üreten için kod. Yayınlayan için içerik." },
              },
              {
                id: "ink_home_p1",
                type: "paragraph_element",
                props: {
                  text: "Şemayı kodda tutun, ekip aynı kaydı görsel tuvalde düzenlesin. İkisi de tek içeriğe yazılır.",
                },
              },
            ],
          },
          {
            id: "ink_home_c2",
            type: "column",
            props: { widthPct: 50 },
            children: [
              {
                id: "ink_home_h2",
                type: "heading_element",
                props: { level: "h2", text: "Küçük ekipten kuruma, aynı çerçeve." },
              },
              {
                id: "ink_home_p2",
                type: "paragraph_element",
                props: {
                  text: "Yerel dosya veritabanıyla dakikalar içinde açılır. Kurumsal ölçekte PostgreSQL ve vektör aramasına geçer.",
                },
              },
            ],
          },
        ],
      },
      {
        id: "ink_home_quotes",
        type: "testimonial_grid",
        props: {
          title: "Ekipler bu çerçeveyle ne kuruyor",
          items: [
            {
              quote: "Kartpostal aracını birkaç günde yayına aldık. İçerik ekibi kod beklemeden sayfayı güncelliyor.",
              author: "Deniz A.",
              role: "Ürün, Atölye Kuzey",
            },
            {
              quote: "Şema kodda kalınca panel kendiliğinden geldi. Ayrı bir yönetim arayüzü yazmadık.",
              author: "Ece M.",
              role: "Mühendislik, Mavi Hat",
            },
            {
              quote: "Ön yüz sade kaldı. Düzenleme yalnızca yönetim panelinde. Yayın hızı ölçümde duruyor.",
              author: "Kerem S.",
              role: "Büyüme, Kıvılcım",
            },
          ],
        },
      },
      {
        id: "ink_home_bento",
        type: "bento_features",
        props: {
          title: "Şemayı kodda tanımlayın, arkayı hazır alın.",
          items: [
            {
              title: "Next.js ile aynı uygulamada",
              description: "Yönetim ve yayın aynı projede. Ayrı bir barındırılan panel beklemez.",
            },
            {
              title: "Görsel düzenleme",
              description: "Satır, sütun ve metin tuvalde durur. Ziyaretçi sunucu çıktısı görür.",
            },
            {
              title: "Arama ve vektör",
              description: "Kayıt anında markdown önbelleği ve şema grafiği üretilir.",
            },
            {
              title: "Kodda şema",
              description: "Alanlar sürüm kontrolünde. İçerik ekibi aynı alanları formda görür.",
            },
          ],
        },
      },
      {
        id: "ink_home_faq",
        type: "faq_accordion",
        props: {
          title: "Daha açık bir yol kuruyoruz.",
          items: [
            {
              question: "Bu bir kilitli panel mi?",
              answer:
                "Hayır. Çekirdek açık. İçerik, tema ve şema sizde kalır. İsterseniz kendi sunucunuzda çalışır.",
            },
            {
              question: "Pazarlama ekibi kod yazmak zorunda mı?",
              answer:
                "Hayır. Şemayı geliştirici tanımlar. Sayfa, menü ve metin yönetim tuvalinden düzenlenir.",
            },
            {
              question: "Ön yüze istemci paketi gider mi?",
              answer:
                "Yerleşim sunucu bileşeni olarak basılır. Metin düzenleyici yalnızca yönetim panelindedir.",
            },
            {
              question: "Örnek sayfalar nerede?",
              answer:
                "Ürün, geliştirici, kurumsal, doküman, fiyat ve örnek çalışma sayfaları bu temayla birlikte yayında.",
            },
          ],
        },
      },
      {
        id: "ink_home_cta",
        type: "cta_banner",
        props: {
          title: "Sahip olduğunuz bir şey kurun.",
          subtitle: "Açık çekirdek. Yerel başlangıç. Kurumsal ölçeğe aynı kayıt modeli.",
          buttonLabel: "Dokümana geç",
          buttonHref: "/tr/dokuman",
        },
      },
    ],
  }),
  page({
    id: "cnt_ink_product",
    slug: "urun",
    title: "Şema kodda. Panel hazır.",
    tldr: "Alanları kodda tanımlayın. Liste, form, yayın ve ön yüz aynı kayıttan gelir.",
    blocks: [
      {
        id: "ink_urun_hero",
        type: "hero",
        props: {
          title: "Şema kodda. Panel hazır.",
          subtitle: "Koleksiyonu yazın. Yönetim, doğrulama ve yayın yüzeyi onunla gelsin.",
          command: "pnpm dev",
          commandHref: "/tr/gelistiriciler",
          primaryCtaLabel: "Geliştirici notları",
          primaryCtaHref: "/tr/gelistiriciler",
        },
      },
      {
        id: "ink_urun_bento",
        type: "bento_features",
        props: {
          title: "Tek kayıt, dört yüz.",
          items: [
            { title: "İçerik", description: "Sayfa, yazı, bilgi bankası ve soru aynı çekirdekte." },
            { title: "Yerleşim", description: "Satır ve sütun oranları tuvalde. Ön yüz sunucuda." },
            { title: "Medya", description: "Görsel, alt metin ve odak noktası kayıtla birlikte." },
            { title: "Arama çıktısı", description: "Markdown, şema grafiği ve llms.txt aynı kayıttan." },
          ],
        },
      },
      {
        id: "ink_urun_code",
        type: "code_block",
        props: {
          language: "ts",
          code: `export const pages = {\n  slug: "sayfalar",\n  fields: [\n    { name: "title", type: "text" },\n    { name: "blocks", type: "layout" },\n  ],\n}`,
        },
      },
    ],
  }),
  page({
    id: "cnt_ink_dev",
    slug: "gelistiriciler",
    title: "Geliştirici için kod. Ekip için tuval.",
    tldr: "Yerel veritabanıyla açın, şemayı kodda tutun, ekip yayını panelden yapsın.",
    blocks: [
      {
        id: "ink_dev_hero",
        type: "hero",
        props: {
          title: "Geliştirici için kod. Ekip için tuval.",
          subtitle: "Docker şart değil. Dosya veritabanı yeter. Kurumsalda PostgreSQL aynı şemayı kullanır.",
          command: "pnpm dev",
          commandHref: "/tr/dokuman",
          primaryCtaLabel: "Doküman",
          primaryCtaHref: "/tr/dokuman",
        },
      },
      {
        id: "ink_dev_steps",
        type: "howto_steps",
        props: {
          title: "Üç adım",
          steps: [
            { title: "Çalıştırın", description: "pnpm dev. Yönetim /admin altında açılır." },
            { title: "Şemayı tanımlayın", description: "Alanlar kodda. İçerik kayıtları kiracı kapsamındadır." },
            { title: "Temayı seçin", description: "Ink Grid vitrini tema mağazasından etkinleştirilir." },
          ],
        },
      },
      {
        id: "ink_dev_code",
        type: "code_block",
        props: {
          language: "bash",
          code: "pnpm install\npnpm dev\n# http://localhost:3000/admin",
        },
      },
    ],
  }),
  page({
    id: "cnt_ink_ent",
    slug: "kurumsal",
    title: "Kurumun sahip olduğu çerçeve.",
    tldr: "Çok kiracılı yayın, sürüm kontrollü şema ve ekip tuvali. Demo için bu sayfa yeterli.",
    blocks: [
      {
        id: "ink_ent_hero",
        type: "hero",
        props: {
          title: "Kurumun sahip olduğu çerçeve.",
          subtitle: "İçerik sizde kalır. Barındırma, tema ve şema kilitli bir panele bağlı değildir.",
          command: "Demo planla",
          commandHref: "/admin",
          primaryCtaLabel: "Yönetimi aç",
          primaryCtaHref: "/admin",
        },
      },
      {
        id: "ink_ent_bento",
        type: "bento_features",
        props: {
          title: "Ekip büyüdükçe kırılmayan sınırlar.",
          items: [
            { title: "Kiracı kapsamı", description: "Her sorgu site kapsamından geçer." },
            { title: "Yayın akışı", description: "Taslak, yayında ve zamanlanmış durumlar çekirdekte." },
            { title: "Çift motor", description: "Yerel dosya veya PostgreSQL. Aynı depo arayüzü." },
            { title: "Açık çekirdek", description: "Çekirdek pro paketi içe aktarmaz. Eklenti yuvayla bağlanır." },
          ],
        },
      },
      {
        id: "ink_ent_quotes",
        type: "testimonial_grid",
        props: {
          items: [
            {
              quote: "Pazarlama sayfayı değiştirirken geliştirici şemayı dalda tuttu. İkisi çakışmadı.",
              author: "Selin T.",
              role: "İçerik sistemleri, Saha",
            },
            {
              quote: "Yerelde dosyayla denedik, kurumsalda aynı kayıtlar PostgreSQL'e geçti.",
              author: "Onur B.",
              role: "Platform, Çizgi",
            },
          ],
        },
      },
    ],
  }),
  page({
    id: "cnt_ink_docs",
    slug: "dokuman",
    title: "Bugün kurmaya başlayın.",
    tldr: "Çalıştırma, tema, örnek sayfalar ve yayın adresleri.",
    blocks: [
      {
        id: "ink_docs_hero",
        type: "hero",
        props: {
          title: "Bugün kurmaya başlayın.",
          subtitle: "Örnek sayfalar yayında. Tema mağazasından Ink Grid seçilince vitrin ana sayfa olur.",
          command: "pnpm dev",
          commandHref: "/admin/themes",
          primaryCtaLabel: "Temayı aç",
          primaryCtaHref: "/admin/themes",
        },
      },
      {
        id: "ink_docs_list",
        type: "list_element",
        props: {
          listType: "check",
          items: [
            "Vitrin: /tr — tema etkinse bu yerleşim açılır. Doğrudan adres /tr/vitrin.",
            "Ürün: /tr/urun",
            "Geliştiriciler: /tr/gelistiriciler",
            "Kurumsal: /tr/kurumsal",
            "Fiyat: /tr/fiyatlandirma",
            "Örnek çalışmalar: /tr/ornek-calismalar",
          ],
        },
      },
      {
        id: "ink_docs_code",
        type: "code_block",
        props: {
          language: "bash",
          code: "pnpm install\npnpm db:seed\npnpm dev",
        },
      },
    ],
  }),
  page({
    id: "cnt_ink_price",
    slug: "fiyatlandirma",
    title: "Açık çekirdek. Net sınır.",
    tldr: "Çekirdek yerelde ücretsiz çalışır. Kurumsal ölçek ve ek yuva ayrı plandadır.",
    blocks: [
      {
        id: "ink_price_hero",
        type: "hero",
        props: {
          title: "Açık çekirdek. Net sınır.",
          subtitle: "Yerelde tam çekirdek. Kurumsalda barındırma, destek ve ek yuvalar.",
          primaryCtaLabel: "Kurumsal sayfa",
          primaryCtaHref: "/tr/kurumsal",
          command: "pnpm dev",
          commandHref: "/tr/gelistiriciler",
        },
      },
      {
        id: "ink_price_table",
        type: "pricing_table",
        props: {
          title: "Üç durak",
          plans: [
            {
              name: "Yerel",
              price: "0",
              description: "Dosya veritabanı, tema mağazası, görsel tuval, örnek vitrin.",
              ctaLabel: "Çalıştır",
            },
            {
              name: "Ekip",
              price: "Ekip",
              description: "PostgreSQL, çok kiracı denemesi, markdown ve şema çıktısı.",
              ctaLabel: "Doküman",
              featured: true,
            },
            {
              name: "Kurum",
              price: "Görüşme",
              description: "Destek, yayın akışı ve ek yuva. İçerik sizde kalır.",
              ctaLabel: "Demo",
            },
          ],
        },
      },
    ],
  }),
  page({
    id: "cnt_ink_cases",
    slug: "ornek-calismalar",
    title: "Bu çerçeveyle kurulan işler.",
    tldr: "Ürün sitesi, doküman ve kurumsal vitrin aynı yerleşim dilini kullanır.",
    blocks: [
      {
        id: "ink_case_hero",
        type: "hero",
        props: {
          title: "Bu çerçeveyle kurulan işler.",
          subtitle: "Aşağıdaki sayfalar bu temanın örnek içeriğidir. Kendi metninizle değiştirin.",
          primaryCtaLabel: "Ürün sayfası",
          primaryCtaHref: "/tr/urun",
          command: "Vitrin",
          commandHref: "/tr/vitrin",
        },
      },
      {
        id: "ink_case_bento",
        type: "bento_features",
        props: {
          title: "Üç örnek yerleşim",
          items: [
            { title: "Ürün vitrini", description: "Geniş başlık, komut satırı ve iki çağrı. /tr/urun" },
            { title: "Doküman kapısı", description: "Adımlar, komut ve sayfa listesi. /tr/dokuman" },
            { title: "Kurumsal anlatı", description: "Sınırlar, alıntı ve demo. /tr/kurumsal" },
            { title: "Fiyat ızgarası", description: "Üç plan, ince çerçeve. /tr/fiyatlandirma" },
          ],
        },
      },
      {
        id: "ink_case_quotes",
        type: "testimonial_grid",
        props: {
          items: [
            {
              quote: "Örnek sayfaları kopyalayıp kendi ürün adımızla doldurduk. Izgara aynı kaldı.",
              author: "Nora stüdyo",
              role: "Örnek çalışma",
            },
            {
              quote: "Koyu tuval ve ince çizgi, ekran görüntüsü gerekmeden ürünü anlattı.",
              author: "Çizgi",
              role: "Örnek çalışma",
            },
          ],
        },
      },
    ],
  }),
];
