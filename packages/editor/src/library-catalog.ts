import type { DesignLibraryItem } from "./library-types";

const span = { desktop: 12, tablet: 12, mobile: 12 };

function entry(
  id: string,
  name: string,
  category: DesignLibraryItem["category"],
  description: string,
  previewKind: DesignLibraryItem["previewKind"],
  type: DesignLibraryItem["block"]["type"],
  props: Record<string, unknown>,
  badge?: string
): DesignLibraryItem {
  return {
    id,
    name,
    category,
    description,
    badge,
    previewKind,
    block: { type, gridSpan: span, props },
  };
}

const photo =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='520'><rect width='800' height='520' fill='%230f172a'/><rect x='40' y='40' width='280' height='180' rx='12' fill='%231e3a8a'/><rect x='360' y='40' width='400' height='440' rx='16' fill='%231e293b'/></svg>";

export const CATALOG_LIBRARY_ITEMS: DesignLibraryItem[] = [
  entry("lib_split_story", "Metin ve görsel", "layout", "Bir yanda başlık ve açıklama, diğer yanda görsel.", "columns", "split_content", {
    title: "Operasyonu tek ekrandan yönetin",
    text: "Şubeler, stok ve raporlar aynı yerleşimde, ek istemci yükü olmadan durur.",
    image: photo,
    alt: "Yerleşim örneği",
  }),
  entry("lib_icon_list", "İkonlu liste", "text", "Onay işaretli, kısa maddeler. Özellik ve kapsam listeleri için.", "faq-list", "icon_list", {
    items: [
      { mark: "✓", title: "Şube bazlı rapor", text: "Satış ve stok aynı listede." },
      { mark: "✓", title: "Anlık görünüm", text: "Masaüstü ve mobil aynı içeriği okur." },
      { mark: "✓", title: "0 KB ön yüz", text: "Liste sunucuda basılır." },
    ],
  }),
  entry("lib_toc", "İçindekiler", "text", "Yazı içi başlıklara giden sade bir dizin.", "faq-list", "toc", {
    items: [
      { label: "Neden bu yapı", href: "#neden" },
      { label: "Sütun oranları", href: "#oranlar" },
      { label: "Sık sorulanlar", href: "#sss" },
    ],
  }, "Yazı"),
  entry("lib_show_more", "Devamını göster", "text", "Uzun metni kapalı tutar, okur açınca tamamını görür.", "prose-section", "show_more", {
    summary: "Teknik notu aç",
    body: "Ayrıntı, sayfa ilk bakışta kısa kalsın diye kapalı durur. Açıklama ön yüzde ek betik gerektirmez.",
  }),
  entry("lib_tabs", "Kapsayıcı Sekmeler", "data", "Her sekmenin içine satır, sütun, görsel veya metin eklenebilir; ön yüzde 0 KB betik.", "bento-3", "tabs", {
    title: "Çözüm Detayları",
    tabStyle: "pills",
    align: "left",
    items: [
      { label: "Genel Bakış", icon: "sparkles", body: "Ürünün kimlere uygun olduğu ve temel faydaları." },
      { label: "Kurulum Süreci", icon: "rocket", body: "İlk gün nelerin hazır olduğu ve geçiş adımları." },
      { label: "Kurumsal Destek", icon: "headphones", body: "7/24 uzman destek ve SLA kapsamı." },
    ],
  }, "Kapsayıcı"),
  entry("lib_accordion", "Akordeon", "data", "Soruları alt alta toplar. Her panel kendi içinde açılır.", "faq-list", "accordion", {
    title: "Sık sorulanlar",
    items: [
      { question: "İçerik tema değişince bozulur mu?", answer: "Hayır. Bloklar veridir, tema yalnızca görünümü değiştirir." },
      { question: "Ön yüze editör kodu gider mi?", answer: "Hayır. Metin editörü yalnızca yönetim panelindedir." },
    ],
  }),
  entry("lib_button_row", "Buton grubu", "text", "Yan yana birincil ve ikincil eylem.", "cta-strip", "button_row", {
    align: "left",
    buttons: [
      { label: "Teklif al", href: "/tr/iletisim", variant: "primary" },
      { label: "Örnekleri gör", href: "/tr", variant: "ghost" },
    ],
  }),
  entry("lib_gallery", "Galeri", "media", "Alt metinli görsel ızgarası.", "gallery", "gallery", {
    items: [
      { url: photo, alt: "Vitrin görseli", caption: "Vitrin" },
      { url: photo, alt: "Ekip görseli", caption: "Ekip" },
      { url: photo, alt: "Ürün görseli", caption: "Ürün" },
    ],
  }),
  entry("lib_overlay", "Görsel kapak", "media", "Fotoğrafın üzerinde başlık ve kısa satır.", "media", "image_overlay", {
    url: photo,
    alt: "Kapak görseli",
    title: "Sahada aynı ekran",
    subtitle: "Şube ekibi ve merkez aynı kaydı görür.",
    href: "/tr",
  }),
  entry("lib_slider", "Slayt şeridi", "media", "Yan yana kayan kısa hikâyeler. Kaydırma tarayıcının kendi davranışıdır.", "hero-split", "slider", {
    slides: [
      { title: "Merkez", text: "Fiyat, stok ve rapor tek yerde." },
      { title: "Şube", text: "Satış anında görünür." },
      { title: "Saha", text: "Mobil cihazdan aynı içerik." },
    ],
  }),
  entry("lib_video", "Video bağlantısı", "media", "Kapak metni ve video adresi. Oynatıcı ön yüze gömülmez.", "media", "video_popup", {
    title: "Ürün turu",
    url: "https://example.com/video",
  }),
  entry("lib_vector", "Vektör işaret", "media", "Küçük bir işaret ve yanında kısa etiket.", "callout-box", "vector_mark", {
    title: "Doğrulandı",
    text: "Yerel işaret, dış ikon kütüphanesi yok.",
  }),
  entry("lib_info_box", "Bilgi kutusu", "cards", "Rozet, başlık, açıklama ve bağlantı.", "callout-box", "info_box", {
    kicker: "Hizmet",
    title: "Şube koordinasyonu",
    text: "Merkez fiyatı, şube stoğu ve saha notu aynı kutuda anlatılır.",
    linkLabel: "Nasıl çalışır",
    href: "/tr",
  }, "Kart"),
  entry("lib_portfolio", "Çalışma ızgarası", "cards", "Görsel ağırlıklı iş veya proje kartları.", "gallery", "portfolio_grid", {
    title: "Seçili işler",
    items: [
      { title: "Perakende ağı", excerpt: "40 şube, tek içerik modeli.", image: photo, href: "/tr" },
      { title: "Saha ekibi", excerpt: "Mobil sipariş ve stok.", image: photo, href: "/tr" },
      { title: "Merkez rapor", excerpt: "Günlük özet, aynı sayfada.", image: photo, href: "/tr" },
    ],
  }),
  entry("lib_posts", "Yazı ızgarası", "cards", "Başlık, özet ve bağlantıdan oluşan yazı kartları.", "bento-3", "post_grid", {
    title: "Son yazılar",
    items: [
      { title: "Hız ve yerleşim", excerpt: "Görsel düzen ile ön yüz yükü ayrı durur.", href: "/tr" },
      { title: "Şube raporu", excerpt: "Aynı içeriğin sade özeti.", href: "/tr" },
      { title: "Form ve talep", excerpt: "Ziyaretçi notu yerinde kalır.", href: "/tr" },
    ],
  }),
  entry("lib_user", "Kişi kartı", "social", "Ad, görev ve katılım bilgisi.", "product-card", "user_card", {
    name: "Ayşe Demir",
    role: "Operasyon",
    since: "2024",
  }),
  entry("lib_countdown", "Geri sayım", "commerce", "Hedef tarihe kalan gün. Sayaç sayfa yenilenince hesaplanır.", "stats-4", "countdown", {
    kicker: "Lansman",
    targetDate: "2026-12-31",
    label: "gün kaldı",
  }),
  entry("lib_product_row", "Ürün şeridi", "commerce", "Üç ürün kartı: ad, özet, fiyat.", "pricing-3", "product_row", {
    title: "Öne çıkan paketler",
    items: [
      { title: "Başlangıç", excerpt: "Tek site, temel bloklar.", price: "Ücretsiz" },
      { title: "Ekip", excerpt: "Çok yazar, medya ve form.", price: "Aylık" },
      { title: "Kurumsal", excerpt: "Çok kiracı ve öncelikli destek.", price: "Teklif" },
    ],
  }),
  entry("lib_form", "Dikey iletişim", "forms", "Tek sütun: ad, e-posta ve mesaj alt alta.", "form", "form_block", {
    title: "Bize yazın",
    submitLabel: "Gönder",
    appearance: { columns: 1, labels: "top", buttonAlign: "left" },
    fields: [
      { label: "Ad", name: "ad", type: "text", required: true, width: "full" },
      { label: "E-posta", name: "eposta", type: "email", required: true, width: "full" },
      { label: "Mesaj", name: "mesaj", type: "textarea", required: true, width: "full" },
    ],
  }, "Dikey"),
  entry("lib_form_row", "Yatay iletişim", "forms", "Ad ve e-posta yan yana, düğme son alanın yanında.", "form", "form_block", {
    title: "Kısa not",
    submitLabel: "Gönder",
    appearance: { columns: 2, labels: "top", density: "compact", buttonAlign: "beside" },
    fields: [
      { label: "Ad", name: "ad", type: "text", required: true, width: "half" },
      { label: "E-posta", name: "eposta", type: "email", required: true, width: "half" },
      { label: "Konu", name: "konu", type: "text", width: "half" },
      { label: "Telefon", name: "telefon", type: "tel", width: "half" },
    ],
  }, "Yatay"),
  entry("lib_form_grid", "Dörtlü kayıt", "forms", "Dört kısa alan tek satırda. Dar ekranda alt alta iner.", "form", "form_block", {
    title: "Hızlı kayıt",
    submitLabel: "Kaydol",
    appearance: { columns: 4, density: "compact", buttonAlign: "full" },
    fields: [
      { label: "Ad", name: "ad", type: "text", required: true, width: "quarter" },
      { label: "Soyad", name: "soyad", type: "text", width: "quarter" },
      { label: "E-posta", name: "eposta", type: "email", required: true, width: "quarter" },
      { label: "Telefon", name: "telefon", type: "tel", width: "quarter" },
    ],
  }, "4'lü"),
  entry("lib_form_steps", "Randevu adımları", "forms", "Önce kişi, sonra tarih ve saat. Gönder son adımdadır.", "form", "form_block", {
    title: "Randevu",
    submitLabel: "Randevu iste",
    appearance: { columns: 2, stepped: true, buttonAlign: "full" },
    fields: [
      { label: "Ad soyad", name: "ad", type: "text", required: true, width: "half", step: 1 },
      { label: "E-posta", name: "eposta", type: "email", required: true, width: "half", step: 1 },
      { label: "Tarih", name: "tarih", type: "date", required: true, width: "half", step: 2 },
      { label: "Saat", name: "saat", type: "time", required: true, width: "half", step: 2 },
    ],
  }, "Adım"),
  entry("lib_form_dialog", "Hızlı iletişim penceresi", "forms", "Sayfada bir bağlantı. Form açılır pencerede durur.", "form", "form_block", {
    title: "Hızlı iletişim",
    submitLabel: "Gönder",
    appearance: { columns: 1, surface: "dialog", triggerLabel: "Hızlı iletişim", buttonAlign: "full" },
    fields: [
      { label: "Ad", name: "ad", type: "text", required: true },
      { label: "Telefon", name: "telefon", type: "tel", required: true },
      { label: "Not", name: "not", type: "textarea" },
    ],
  }, "Pencere"),
  entry("lib_search", "Arama kutusu", "forms", "Tek alanlı site içi arama.", "form", "search_box", {
    placeholder: "Yazı veya sayfa ara",
    action: "/tr",
  }),
  entry("lib_modal", "Açılır not", "forms", "Tetik metni ve arkasındaki kısa açıklama.", "callout-box", "modal_panel", {
    trigger: "Kurulum notunu aç",
    title: "İlk gün",
    body: "Alan adı, ilk sayfa ve iletişim formu aynı turda hazırlanır.",
  }),
  entry("lib_progress", "İlerleme çubuğu", "data", "Yüzde ile dolan yatay çubuk.", "stats-4", "progress_bar", {
    label: "Kurulum",
    value: 72,
  }),
  entry("lib_table", "Veri tablosu", "data", "Başlık satırı ve karşılaştırma hücreleri.", "bento-4", "data_table", {
    title: "Karşılaştırma",
    headers: ["Başlık", "NexPress", "Klasik yığın"],
    rows: [
      ["Ön yüz yükü", "0 KB", "Yüksek"],
      ["Yerleşim", "Satır ve sütun", "Kısa kod"],
    ],
  }),
  entry("lib_map", "Konum kartı", "data", "Adres adı ve harita araması. Gömülü harita betiği yok.", "media", "map_embed", {
    title: "Merkez ofis",
    query: "İstanbul",
  }),
  entry("lib_repeater", "Tekrarlayan kayıt", "data", "Aynı kalıbın alt alta kopyaları: başlık ve metin.", "bento-3", "repeater", {
    items: [
      { title: "Sabah devri", text: "Açılış stoğu ve kasa." },
      { title: "Öğlen", text: "Kritik ürün uyarısı." },
      { title: "Kapanış", text: "Günlük ciro özeti." },
    ],
  }),
];
