import { NEXPRESS_DESIGN_LIBRARY } from "./library";
import type { StarterPagePack } from "./library-types";

const pick = (id: string) =>
  NEXPRESS_DESIGN_LIBRARY.find((item) => item.id === id)?.block ??
  NEXPRESS_DESIGN_LIBRARY[0]!.block;

/**
 * Tek Tıkla Tam Sayfa Başlangıç Paketleri (Starter Page Packs)
 * Kullanıcı bir sayfa oluştururken tek tıkla 5-8 bölümlük tam kurgulanmış sayfa iskeleti yükleyebilir.
 */
export const NEXPRESS_STARTER_PAGE_PACKS: StarterPagePack[] = [
  {
    id: "pack_b2b_saas_landing",
    name: "Kurumsal B2B & SaaS Ana Sayfa Paketi",
    description:
      "Hero + Answer-First TL;DR + 4'lü Metrik Şeridi + Kapsayıcı Sekmeli Çözüm Vitrini + 4'lü Bento + 3 Kademeli Fiyatlandırma + SSS + Dönüşüm Şeridi.",
    recommendedType: "page",
    schemaType: "WebPage",
    tldr: "NexPress Enterprise Cloud; 0-KB RSC hızı, çift veritabanı motoru ve yerleşik Agentic RAG altyapısıyla kurumsal web varlıklarını tek merkezden yönetir.",
    blocks: [
      pick("lib_hero_aurora_split"),
      pick("lib_aio_tldr_box"),
      pick("lib_stats_4col"),
      pick("lib_layout_tabs_showcase"),
      pick("lib_bento_4grid"),
      pick("lib_pricing_3tier"),
      pick("lib_layout_faq_contact_split"),
      pick("lib_editorial_cta_banner"),
    ],
  },
  {
    id: "pack_corporate_services",
    name: "Kurumsal Hizmet & Danışmanlık Sayfası",
    description:
      "2 Sütunlu Kurumsal Vitrin + Asimetrik Özellik & Hikâye Bölümü + 3 Sütunlu Hizmet Kartları + Uygulama Adımları + İki Sütunlu SSS & Uzman Desteği.",
    recommendedType: "page",
    schemaType: "WebPage",
    tldr: "Kurumsal danışmanlık ve dijital dönüşüm hizmetlerimiz; analiz, mimari kurulum ve 7/24 operasyonel destek süreçlerini kapsar.",
    blocks: [
      pick("lib_hero_saas_split_row"),
      pick("lib_layout_asymmetric_feature"),
      pick("lib_studio_row_3col"),
      pick("lib_aio_howto_steps"),
      pick("lib_layout_faq_contact_split"),
      pick("lib_editorial_cta_banner"),
    ],
  },
  {
    id: "pack_tech_kb_guide",
    name: "Teknik Dokümantasyon & Bilgi Bankası Rehberi (kb_tech)",
    description:
      "Answer-First TL;DR + İçindekiler + Adım Adım HowTo Rehberi + Teknik Kod Bloğu + Performans Callout + Karşılaştırma Tablosu + SSS Akordeonu.",
    recommendedType: "kb_tech",
    schemaType: "TechArticle",
    tldr: "Bu teknik rehber; 0-KB RSC blok mimarisinin kurulumunu, MarkdownCache derleme hattını ve canlı ortam doğrulama adımlarını açıklar.",
    blocks: [
      pick("lib_aio_tldr_box"),
      pick("lib_toc"),
      pick("lib_aio_howto_steps"),
      pick("lib_editorial_code"),
      pick("lib_editorial_callout"),
      pick("lib_editorial_comparison_table"),
      pick("lib_aio_faq_accordion"),
    ],
  },
  {
    id: "pack_product_launch_campaign",
    name: "Ürün Lansman & Kampanya Dönüşüm Sayfası",
    description:
      "Kampanya Hero + Geri Sayım + Canlı @id Ürün Gömmesi + 4'lü Metrik Kanıtı + Editoryal İnceleme Kutusu + 3 Kademeli Paket Tablosu + SSS.",
    recommendedType: "campaign",
    schemaType: "Offer",
    tldr: "Sınırlı süreli kurumsal lansman paketiyle mevcut sitenizi 0-KB RSC hızına taşıyın ve yıllık lisanslamada %30 avantaj elde edin.",
    blocks: [
      pick("lib_hero_commerce_offer"),
      pick("lib_countdown"),
      pick("lib_commerce_product_embed"),
      pick("lib_stats_4col"),
      pick("lib_atomic_review_box"),
      pick("lib_pricing_3tier"),
      pick("lib_aio_faq_accordion"),
    ],
  },
  {
    id: "pack_agency_portfolio",
    name: "Dijital Ajans, Portfolyo & Vaka Analizi Paketi",
    description:
      "Aurora Vitrin + Rakamlarla Başarı Şeridi + Seçili İşler Portfolyo Izgarası + Kapsayıcı Sekmeli Hizmetler + Dönüşüm Çağrısı.",
    recommendedType: "page",
    schemaType: "WebPage",
    tldr: "Yüksek performanslı kurumsal web platformları, çok dilli içerik mimarileri ve dönüşüm odaklı dijital ürünler tasarlıyoruz.",
    blocks: [
      pick("lib_hero_aurora_split"),
      pick("lib_stats_4col"),
      pick("lib_portfolio"),
      pick("lib_layout_tabs_showcase"),
      pick("lib_editorial_cta_banner"),
    ],
  },
  {
    id: "pack_about_company",
    name: "Hakkımızda, Kurumsal Kültür & Ekip Sayfası",
    description:
      "Bölünmüş Kurumsal Hikâye + 4 Sütunlu Metrik Şeridi + Asimetrik Değerlerimiz Bölümü + 2 Sütunlu Vizyon/Misyon Satırı + Çağrı Şeridi.",
    recommendedType: "page",
    schemaType: "AboutPage",
    tldr: "Mühendislik disiplini ve sade tasarım ilkeleriyle kurumların dijital yayın altyapısını hızlandırıyoruz.",
    blocks: [
      pick("lib_split_story"),
      pick("lib_stats_4col"),
      pick("lib_layout_asymmetric_feature"),
      pick("lib_studio_row_2col"),
      pick("lib_editorial_cta_banner"),
    ],
  },
  {
    id: "pack_contact_hub",
    name: "İletişim, Merkez Ofis & Teklif Talep Sayfası",
    description:
      "İletişim Formu + Merkez Ofis Konum Kartı + İki Sütunlu SSS & Uzman Destek Kartı.",
    recommendedType: "page",
    schemaType: "ContactPage",
    tldr: "Projeniz için teknik değerlendirme, canlı demo veya kurumsal lisans teklifi almak üzere ekibimizle doğrudan iletişime geçin.",
    blocks: [
      pick("lib_form"),
      pick("lib_map"),
      pick("lib_layout_faq_contact_split"),
    ],
  },
];
