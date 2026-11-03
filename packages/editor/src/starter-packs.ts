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
  {
    id: "pack_erp_category_landing",
    name: "Ön Muhasebe & ERP Kategori Vitrini (Yapışkan Çapa Menülü)",
    description:
      "Bölünmüş Hero + Hızlı Teklif Formu + Yapışkan HTML Çapa Gezgini + Genel Bakış 3'lü Özellik Matrisi (#genel-bakis) + Çözüm Ailesi Sekmeleri (#urunler) + Paket Karşılaştırma (#karsilastirma) + SSS (#sss) + Referanslar + İletişim Dock.",
    recommendedType: "page",
    schemaType: "ItemPage",
    tldr: "İşletmenizin fatura, cari hesap, gelir-gider ve stok süreçlerini tek merkezden kolayca yönetebileceğiniz bulut ve masaüstü ön muhasebe çözümleri.",
    blocks: [
      pick("lib_erp_split_hero_form"),
      pick("lib_sticky_anchor_bar"),
      pick("lib_erp_overview_3col"),
      pick("lib_erp_solution_tabs"),
      pick("lib_erp_scale_comparison"),
      pick("lib_erp_faq_section"),
      pick("lib_editorial_cta_banner"),
      pick("lib_erp_bottom_dock"),
    ],
  },
  {
    id: "pack_software_erp",
    name: "Kurumsal ERP & Yazılım Ürün Lansman Paketi",
    description:
      "8+4 Hero & Demo İstek Kartı + Modül Sekmeleri + Donanım/Teknik Spek Tablosu + SSS Akordeonu + Destek Araçları.",
    recommendedType: "product",
    schemaType: "SoftwareApplication",
    tldr: "Wolvox ERP; ön muhasebe, genel muhasebe, e-Dönüşüm, stok, üretim ve finans süreçlerini tek merkezden yöneten yeni nesil kurumsal kaynak planlama yazılımıdır.",
    blocks: [
      pick("lib_software_hero_demo"),
      pick("lib_sticky_anchor_bar"),
      pick("lib_software_modules_tabs"),
      pick("lib_software_specs_grid"),
      pick("lib_erp_faq_section"),
      pick("lib_support_remote_tools"),
      pick("lib_erp_bottom_dock"),
    ],
  },
  {
    id: "pack_campaign_single",
    name: "Kampanya & Özel Fırsat Tanıtım Paketi",
    description:
      "Geri Sayım Şeridi + İndirim ve Hediye Kartı + Paket Karşılaştırma + Hızlı Başvuru Çağrısı.",
    recommendedType: "campaign",
    schemaType: "Offer",
    tldr: "Yıl sonu ERP ve e-Dönüşüm kampanyası kapsamında %30 indirim ve 1 yıllık bulut yedekleme hediyesi fırsatını kaçırmayın.",
    blocks: [
      pick("lib_campaign_hero_countdown"),
      pick("lib_erp_overview_3col"),
      pick("lib_erp_scale_comparison"),
      pick("lib_editorial_cta_banner"),
    ],
  },
  {
    id: "pack_qa_knowledge_base",
    name: "Soru-Cevap & AI Prompts Bilgi Bankası Paketi",
    description:
      "Öne Çıkan Uzman Cevabı Kutusu + Mevzuat Detayı + İlgili Alt Sorular Akordeonu + Soru Sorma Formu.",
    recommendedType: "ai_prompt",
    schemaType: "QAPage",
    tldr: "Mevzuat ve teknik süreçler hakkında sıkça sorulan soruların net, doğrudan uzman yanıtları ve adım adım uygulama rehberi.",
    blocks: [
      pick("lib_qa_featured_answer"),
      pick("lib_aio_howto_steps"),
      pick("lib_erp_faq_section"),
      pick("lib_support_remote_tools"),
    ],
  },
  {
    id: "pack_support_center",
    name: "Müşteri Destek ve İndirme Merkezi Paketi",
    description:
      "Uzak Masaüstü İndirme Çubuğu + Lisans Aktivasyon ve Sıkça Sorulan Sorular + 7/24 İletişim Hatları.",
    recommendedType: "page",
    schemaType: "WebPage",
    tldr: "Akınsoft İzmir yetkili destek merkezi: AnyDesk, TeamViewer indirme bağlantıları, lisans sorgulama ve telefonla kesintisiz teknik destek.",
    blocks: [
      pick("lib_support_remote_tools"),
      pick("lib_erp_faq_section"),
      pick("lib_erp_bottom_dock"),
    ],
  },
];
