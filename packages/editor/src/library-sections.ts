import type { BlockNode } from "@nexpress/core";
import type { DesignLibraryItem } from "./library-types";
import { GRAD, art, avatar, band, box, button, cardStyle, col, cols, heading, image, itemFactory, n, para } from "./library-kit";

/** Kategori başına ek bölümler: sayfa başlığı, konum, abonelik, kişiler, ürün, yazılar, fiyat, tablo, menü. */
const item = itemFactory("lib_sx_", "Yeni");

const C = { textAlign: "center" } as const;
const crumb = (text: string) => para(text, { style: { fontSize: "13px", opacity: 0.75, ...C } });
const person = (name: string, role: string, a: string, b: string) =>
  col([image(avatar(a, b), name, { aspectRatio: "1:1", borderRadius: "full" }), heading(name, "h4", { style: C }), para(role, { style: { ...C, opacity: 0.7 } })], cardStyle({ textAlign: "center" }));
const dish = (name: string, desc: string, price: string) =>
  cols("9+3", [col([heading(name, "h4"), para(desc, { style: { opacity: 0.7, fontSize: "14px" } })]), col([heading(price, "h4", { style: { textAlign: "right", textColor: "#b45309" } })])], { verticalAlign: "center" });
const nl = (title: string, text: string): BlockNode[] => [heading(title, "h2", { style: C }), para(text, { style: C })];
const emailForm = (label: string, button2: string) =>
  n("form_block", { title: "", submitLabel: button2, appearance: { columns: 2, labels: "top", density: "comfortable", buttonAlign: "beside", surface: "inline" }, fields: [{ name: "eposta", label, type: "email", required: true, width: "half", placeholder: "ornek@site.com" }] });

export const SECTION_LIBRARY_ITEMS: DesignLibraryItem[] = [
  // Sayfa başlığı
  item("title_plain", "Sade sayfa başlığı", "page_title", "Yol, iri başlık ve tek cümle açıklama.", "prose-section",
    band({ backgroundColor: "#ffffff" }, [crumb("Ana sayfa / Kurumsal"), heading("Hakkımızda", "h1", { style: { ...C, fontSize: "52px", fontWeight: "800", mobile: { fontSize: "34px" } } }), para("Yirmi yıldır işletmelerin dijital dönüşümüne eşlik ediyoruz.", { style: { ...C, fontSize: "18px" } })], 64)),
  item("title_gradient", "Degrade sayfa başlığı", "page_title", "Koyu degrade zeminde ortalı başlık ve alt yazı.", "hero-centered",
    band({ background: GRAD.night, textColor: "#f8fafc" }, [crumb("Ana sayfa / Hizmetler"), heading("Hizmetlerimiz", "h1", { style: { ...C, fontSize: "56px", fontWeight: "800", mobile: { fontSize: "36px" } } }), para("İhtiyacınıza uygun çözümleri tek çatı altında topladık.", { style: C })], 80)),
  item("title_image", "Görselli sayfa başlığı", "page_title", "Görsel zemin üzerinde karartma ve sol hizalı başlık.", "hero-split",
    band({ backgroundImage: art("globe", "#0ea5e9", "#6366f1"), backgroundOverlay: "linear-gradient(90deg,rgba(8,12,32,.85),rgba(8,12,32,.25))", textColor: "#ffffff" }, [crumb("Ana sayfa / Portfolyo"), heading("Çalışmalarımız", "h1", { style: { fontSize: "54px", fontWeight: "800", mobile: { fontSize: "34px" } } }), para("Seçili projelerimizden kısa bir derleme.")], 110)),
  item("title_split", "Bölünmüş sayfa başlığı", "page_title", "Solda başlık ve metin, sağda destekleyici görsel.", "hero-split",
    band({ background: GRAD.soft }, [cols("7+5", [col([crumb("Ana sayfa / İletişim"), heading("Bizimle iletişime geçin", "h1", { style: { fontSize: "46px", fontWeight: "800", mobile: { fontSize: "32px" } } }), para("Sorularınız için ekibimiz hafta içi her gün yanınızda.")]), col([image(art("people", "#6366f1", "#ec4899"), "Ekip", { aspectRatio: "3:2" })])], { verticalAlign: "center" })], 64)),
  // Konum
  item("loc_card", "Harita ve iletişim kartı", "location", "Solda adres ve saatler, sağda harita bağlantısı.", "media",
    band({ backgroundColor: "#ffffff" }, [cols("5+7", [col([heading("Merkez ofis", "h3"), para("Atatürk Cad. No: 24, Kadıköy / İstanbul"), para("Hafta içi 09:00 – 18:00"), para("+90 212 000 00 00"), button("Yol tarifi al", "https://maps.google.com", "outline")], cardStyle()), col([n("map_embed", { title: "Merkez ofis", query: "Kadıköy İstanbul" })])], { verticalAlign: "center" })], 72)),
  item("loc_branches", "Şubeler", "location", "Üç şube kartı: şehir, adres ve telefon.", "bento-3",
    band({ backgroundColor: "#f8fafc" }, [...nl("Şubelerimiz", "Size en yakın noktada karşılıyoruz."), cols("4+4+4", [
      col([heading("İstanbul", "h3"), para("Kadıköy, Atatürk Cad. 24"), para("0212 000 00 01")], cardStyle()),
      col([heading("Ankara", "h3"), para("Çankaya, Tunalı Hilmi 12"), para("0312 000 00 02")], cardStyle()),
      col([heading("İzmir", "h3"), para("Alsancak, Kıbrıs Şehitleri 8"), para("0232 000 00 03")], cardStyle()),
    ])], 72)),
  item("loc_dark", "Koyu konum bandı", "location", "Koyu zeminde adres, saat ve harita düğmesi.", "cta-strip",
    band({ background: GRAD.night, textColor: "#f8fafc" }, [cols("8+4", [col([heading("Bizi ziyaret edin", "h2"), para("Atatürk Cad. No: 24, Kadıköy / İstanbul · Hafta içi 09:00 – 18:00")]), col([button("Haritada aç", "https://maps.google.com", "primary")])], { verticalAlign: "center" })], 56)),
  // Abonelik
  item("sub_card", "Ortalı abonelik kartı", "subscribe", "Beyaz kart içinde başlık, e-posta alanı ve abone ol düğmesi.", "form",
    band({ background: GRAD.soft }, [box([...nl("Bültene katılın", "Ayda bir, yalnızca işinize yarayan içerikler."), emailForm("E-posta adresiniz", "Abone ol")], cardStyle({ maxWidth: "620px", marginLeft: "auto", marginRight: "auto", boxShadow: "lg" }))], 72)),
  item("sub_split", "Görselli abonelik", "subscribe", "Solda görsel, sağda başlık ve form.", "form",
    band({ backgroundColor: "#ffffff" }, [cols("5+7", [col([image(art("doc", "#f97316", "#ec4899"), "Bülten", { aspectRatio: "3:2" })]), col([heading("Her hafta yeni fikirler", "h2"), para("Topluluğa katılın, haftalık özetimizi e-postanıza gönderelim."), emailForm("E-posta adresiniz", "Katıl")])], { verticalAlign: "center" })], 72)),
  item("sub_dark", "Koyu abonelik şeridi", "subscribe", "Koyu bant, yanında tek satırlık form.", "form",
    band({ background: GRAD.night, textColor: "#f8fafc" }, [cols("6+6", [col([heading("Güncellemeleri kaçırmayın", "h3"), para("Yeni sürümler ve ipuçları e-postanızda.")]), col([emailForm("E-posta adresiniz", "Abone ol")], { backgroundColor: "#ffffff", textColor: "#0f172a", borderRadius: "20px", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "16px", paddingRight: "16px" })], { verticalAlign: "center" })], 56)),
  // Kişiler
  item("ppl_cards", "Ekip kartları (4'lü)", "people", "Dört kişi: avatar, ad ve görev.", "bento-4",
    band({ backgroundColor: "#ffffff" }, [...nl("Ekibimiz", "Alanında uzman, işine tutkulu insanlar."), cols("3+3+3+3", [person("Ayşe Demir", "Genel müdür", "#6366f1", "#ec4899"), person("Mehmet Kaya", "Teknik direktör", "#0ea5e9", "#6366f1"), person("Elif Aydın", "Tasarım lideri", "#f97316", "#ec4899"), person("Can Yılmaz", "Satış müdürü", "#10b981", "#0ea5e9")])], 72)),
  item("ppl_founders", "Kurucu tanıtımı", "people", "Büyük avatar ve kısa biyografi, iki kişi yan yana.", "bento-3",
    band({ background: GRAD.soft }, [...nl("Kurucularımız", "Hikâyemizi başlatanlar."), cols("6+6", [
      col([image(avatar("#6366f1", "#06b6d4"), "Ayşe Demir", { aspectRatio: "1:1" }), heading("Ayşe Demir", "h3"), para("Yirmi yıllık yazılım deneyimiyle ekibi kurdu ve ürün vizyonunu belirler.")], cardStyle()),
      col([image(avatar("#f97316", "#ec4899"), "Mehmet Kaya", { aspectRatio: "1:1" }), heading("Mehmet Kaya", "h3"), para("Altyapı ve güvenlikten sorumlu; ölçeklenebilir mimarinin mimarı.")], cardStyle()),
    ])], 72)),
  item("ppl_compact", "Kompakt ekip listesi", "people", "Avatar solda, ad ve görev sağda; 3 sütunlu sade liste.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [heading("Tanışın", "h2"), cols("4+4+4", [person("Zeynep Arslan", "Müşteri başarısı", "#8b5cf6", "#ec4899"), person("Burak Çelik", "Yazılım mühendisi", "#0ea5e9", "#10b981"), person("Selin Öz", "İçerik editörü", "#f59e0b", "#ef4444")])], 64)),
  // Ürün
  item("prd_trio", "Ürün vitrini (3'lü)", "product", "Görselli üç ürün kartı: ad, fiyat ve düğme.", "product-card",
    band({ backgroundColor: "#ffffff" }, [...nl("Öne çıkan ürünler", "Bu haftanın en çok tercih edilenleri."), cols("4+4+4", [
      col([image(art("phone", "#6366f1", "#06b6d4"), "Ürün", { aspectRatio: "4:3" }), heading("Akıllı Panel", "h4"), para("₺1.490"), button("Sepete ekle", "/tr/sepet", "primary")], cardStyle()),
      col([image(art("dashboard", "#f97316", "#ec4899"), "Ürün", { aspectRatio: "4:3" }), heading("Raporlama Paketi", "h4"), para("₺2.290"), button("Sepete ekle", "/tr/sepet", "primary")], cardStyle()),
      col([image(art("cloud", "#10b981", "#0ea5e9"), "Ürün", { aspectRatio: "4:3" }), heading("Bulut Depolama", "h4"), para("₺790"), button("Sepete ekle", "/tr/sepet", "primary")], cardStyle()),
    ])], 72)),
  item("prd_feature", "Tek ürün vitrini", "product", "Büyük görsel solda; ad, özellikler ve satın alma sağda.", "product-card",
    band({ background: GRAD.soft }, [cols("6+6", [col([image(art("phone", "#7c3aed", "#db2777"), "Ürün", { aspectRatio: "4:3" })]), col([heading("Akıllı Panel Pro", "h2"), para("Tüm verileriniz tek ekranda; mobil ve masaüstü uyumlu."), n("icon_list", { items: [{ icon: "check-circle", title: "2 yıl garanti", text: "" }, { icon: "check-circle", title: "Ücretsiz kargo", text: "" }] }), heading("₺3.490", "h3"), button("Hemen satın al", "/tr/sepet", "primary")])], { verticalAlign: "center" })], 72)),
  // Yazılar
  item("pst_cards", "Görselli yazı kartları", "posts", "Son yazılar: görsel, başlık ve özet.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [n("dynamic_list", { source: "posts", limit: 3, orderBy: "newest", layout: "cards", columns: 3, showImage: true, showExcerpt: true, showDate: true, heading: "Son yazılar" })], 72)),
  item("pst_list", "Yazı listesi", "posts", "Görselsiz, tarihli ve özetli sade yazı listesi.", "faq-list",
    band({ backgroundColor: "#f8fafc" }, [n("dynamic_list", { source: "posts", limit: 5, orderBy: "newest", layout: "list", columns: 1, showImage: false, showExcerpt: true, showDate: true, heading: "Blogdan" })], 72)),
  // Fiyat
  item("prc_toggle", "Üç planlı fiyat bandı", "pricing", "Koyu zeminde öne çıkan orta plan.", "pricing-3",
    band({ background: GRAD.night, textColor: "#f8fafc" }, [n("pricing_table", { title: "Size uygun planı seçin", plans: [
      { name: "Başlangıç", price: "₺0", period: "/ay", features: ["1 site", "Temel destek"], ctaLabel: "Ücretsiz başla", ctaHref: "/tr/iletisim" },
      { name: "Profesyonel", price: "₺990", period: "/ay", features: ["5 site", "Öncelikli destek", "Gelişmiş SEO"], ctaLabel: "Satın al", ctaHref: "/tr/iletisim", highlighted: true },
      { name: "Kurumsal", price: "Teklif alın", period: "", features: ["Sınırsız site", "Özel destek"], ctaLabel: "Bize ulaşın", ctaHref: "/tr/iletisim" },
    ] })], 80)),
  item("prc_two", "İki planlı fiyat kartı", "pricing", "Aylık ve yıllık seçenek yan yana.", "pricing-3",
    band({ background: GRAD.soft }, [n("pricing_table", { title: "Aylık ya da yıllık", plans: [
      { name: "Aylık", price: "₺490", period: "/ay", features: ["Tüm özellikler", "İstediğiniz zaman iptal"], ctaLabel: "Başla", ctaHref: "/tr/iletisim" },
      { name: "Yıllık", price: "₺390", period: "/ay", features: ["Tüm özellikler", "2 ay hediye"], ctaLabel: "Başla", ctaHref: "/tr/iletisim", highlighted: true },
    ] })], 72)),
  // Veri tablosu
  item("tbl_striped", "Çizgili veri tablosu", "data_table", "Şeritli satırlar ve sabit başlık.", "bento-4",
    band({ backgroundColor: "#ffffff" }, [n("data_table", { title: "Teknik özellikler", headers: ["Özellik", "Standart", "Pro"], rows: [["Depolama", "10 GB", "100 GB"], ["Kullanıcı", "3", "Sınırsız"], ["Destek", "E-posta", "7/24 telefon"], ["Yedekleme", "Haftalık", "Günlük"]], striped: true, firstColumnHeader: true })], 72)),
  item("tbl_compact", "Kompakt sayı tablosu", "data_table", "Sayıları sağa hizalı, sıkı satır aralıklı tablo.", "bento-4",
    band({ backgroundColor: "#f8fafc" }, [n("data_table", { title: "Aylık rapor", headers: ["Ay", "Ziyaret", "Dönüşüm"], rows: [["Ocak", "12.400", "%3,1"], ["Şubat", "14.900", "%3,4"], ["Mart", "18.250", "%3,9"]], compact: true, alignNumbers: true, firstColumnHeader: true })], 72)),
  // Restoran menüsü
  item("menu_classic", "Klasik menü", "menu", "Yemek adı, açıklama ve fiyat; iki sütun.", "faq-list",
    band({ backgroundColor: "#fffbeb" }, [...nl("Menümüz", "Günlük taze hazırlanır."), cols("6+6", [
      col([heading("Başlangıçlar", "h3"), dish("Mercimek çorbası", "Limon ve tereyağı ile", "₺120"), dish("Humus", "Zeytinyağı, pul biber", "₺140")]),
      col([heading("Ana yemekler", "h3"), dish("Izgara köfte", "Pilav ve közlenmiş sebze", "₺320"), dish("Fırın levrek", "Roka salatası ile", "₺420")]),
    ])], 72)),
  item("menu_dark", "Koyu menü", "menu", "Koyu zeminde altın fiyatlı şık menü.", "faq-list",
    band({ backgroundColor: "#1c1917", textColor: "#fafaf9" }, [...nl("Akşam menüsü", "Şefin önerileri."), cols("6+6", [
      col([dish("Kuzu tandır", "Közlenmiş patlıcan", "₺560"), dish("Mantı", "Yoğurt, sumaklı tereyağı", "₺260")]),
      col([dish("Künefe", "Antep fıstığı ile", "₺190"), dish("Sütlaç", "Fırında", "₺150")]),
    ])], 72)),
  item("menu_cards", "Görselli menü kartları", "menu", "Yemek görselli üç kart, fiyat rozetiyle.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [...nl("Şefin seçkisi", "Bu haftanın öne çıkanları."), cols("4+4+4", [
      col([image(art("grid", "#f59e0b", "#ef4444"), "Yemek", { aspectRatio: "4:3" }), dish("Izgara köfte", "Pilav ile", "₺320")], cardStyle()),
      col([image(art("grid", "#10b981", "#0ea5e9"), "Yemek", { aspectRatio: "4:3" }), dish("Akdeniz salata", "Zeytinyağlı", "₺180")], cardStyle()),
      col([image(art("grid", "#ec4899", "#8b5cf6"), "Yemek", { aspectRatio: "4:3" }), dish("Tiramisu", "Ev yapımı", "₺160")], cardStyle()),
    ])], 72)),
];
