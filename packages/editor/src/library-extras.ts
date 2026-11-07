import type { DesignLibraryItem } from "./library-types";
import { GRAD, art, avatar, band, box, button, cardStyle, col, cols, heading, image, itemFactory, n, para } from "./library-kit";

/** Yorum, sayaç, logo, liste, galeri, video ve karşılaştırma kategorileri için ek bölümler. */
const item = itemFactory("lib_ex_", "Yeni");
const C = { textAlign: "center" } as const;
const quote = (text: string, name: string, role: string, a: string, b: string) =>
  col([para(`“${text}”`, { style: { fontSize: "18px", lineHeight: "1.6" } }), cols("2+10", [col([image(avatar(a, b), name, { aspectRatio: "1:1", borderRadius: "full" })]), col([heading(name, "h5"), para(role, { style: { opacity: 0.7, fontSize: "13px" } })])], { verticalAlign: "center", stackAt: "mobile" })], cardStyle());
const stat = (value: string, label: string, color: string) =>
  col([heading(value, "h2", { style: { ...C, fontSize: "52px", fontWeight: "800", textColor: color } }), para(label, { style: { ...C, opacity: 0.75 } })]);

export const EXTRA_LIBRARY_ITEMS: DesignLibraryItem[] = [
  item("tst_wall", "Yorum duvarı", "testimonials", "Üç yorum kartı yan yana; avatar, ad ve görev.", "bento-3",
    band({ background: GRAD.soft }, [heading("Müşterilerimiz ne diyor?", "h2", { style: C }), cols("4+4+4", [
      quote("Kurulum bir günde bitti, ekibimiz hemen kullanmaya başladı.", "Ayşe Demir", "Pazarlama müdürü", "#6366f1", "#ec4899"),
      quote("Sayfa hızımız ikiye katlandı, arama sıralamamız yükseldi.", "Mehmet Kaya", "E-ticaret yöneticisi", "#0ea5e9", "#6366f1"),
      quote("Destek ekibi her sorumuza dakikalar içinde döndü.", "Elif Aydın", "Genel müdür", "#f97316", "#ec4899"),
    ])], 72)),
  item("tst_big", "Büyük tek yorum", "testimonials", "Koyu zeminde dev alıntı ve imza.", "prose-section",
    band({ background: GRAD.night, textColor: "#f8fafc" }, [para("“Doğru araç, doğru ekip: üç ayda dönüşüm oranımız %40 arttı.”", { style: { ...C, fontSize: "34px", fontWeight: "700", lineHeight: "1.3", mobile: { fontSize: "24px" } } }), para("Can Yılmaz · Perakende Direktörü", { style: { ...C, opacity: 0.75 } })], 96)),
  item("stat_row", "Renkli sayaç satırı", "stats", "Dört büyük rakam, her biri farklı vurgu renginde.", "stats-4",
    band({ backgroundColor: "#ffffff" }, [cols("3+3+3+3", [stat("12K+", "Aktif kullanıcı", "#6366f1"), stat("98%", "Memnuniyet", "#10b981"), stat("40+", "Ülke", "#f97316"), stat("7/24", "Destek", "#ec4899")])], 64)),
  item("stat_dark", "Koyu sayaç bandı", "stats", "Degrade zeminde üç rakam ve kısa açıklama.", "stats-4",
    band({ background: GRAD.aurora, textColor: "#ffffff" }, [cols("4+4+4", [stat("1M+", "Aylık sayfa görüntüleme", "#ffffff"), stat("%99,9", "Kesintisiz çalışma", "#ffffff"), stat("<1 sn", "Ortalama yükleme", "#ffffff")])], 72)),
  item("logo_grid", "Logo ızgarası", "logos", "Altı marka yer tutucusu; başlıklı, sakin bir ızgara.", "gallery",
    band({ backgroundColor: "#ffffff" }, [heading("Bize güvenen markalar", "h3", { style: C }), n("marquee", { items: ["ACME", "NOVA", "LUMEN", "ORBIT", "VERTEX", "PULSE"], speed: 40, direction: "left" }, { style: { fontSize: "28px", fontWeight: "800", opacity: 0.45 } })], 56)),
  item("list_check", "Onaylı özellik listesi", "list", "İki sütun: başlık solda, onay işaretli maddeler sağda.", "faq-list",
    band({ backgroundColor: "#ffffff" }, [cols("5+7", [col([heading("Neler dahil?", "h2"), para("Tüm planlarda geçerli temel özellikler.")]), col([n("icon_list", { items: [{ icon: "check-circle", title: "Sınırsız sayfa", text: "İstediğiniz kadar içerik ekleyin." }, { icon: "check-circle", title: "Çok dilli içerik", text: "Tek panelden tüm diller." }, { icon: "check-circle", title: "Hızlı ön yüz", text: "Sunucuda hazır, tarayıcıda hafif." }] })])])], 64)),
  item("gal_masonry", "Üç sütunlu galeri", "gallery", "Eşit boyutlu görsel ızgarası ve başlık.", "gallery",
    band({ backgroundColor: "#ffffff" }, [heading("Galeri", "h2", { style: C }), n("gallery", { items: [1, 2, 3, 4, 5, 6].map((i) => ({ url: art("grid", i % 2 ? "#6366f1" : "#f97316", i % 3 ? "#06b6d4" : "#ec4899"), alt: `Görsel ${i}`, caption: `Kare ${i}` })), columns: 3 })], 72)),
  item("vid_side", "Videolu anlatım", "video_text", "Solda metin ve düğme, sağda video kapağı.", "media",
    band({ backgroundColor: "#ffffff" }, [cols("5+7", [col([heading("Ürünü 2 dakikada izleyin", "h2"), para("Kısa tanıtım videosuyla temel özellikleri görün."), button("Demo talep et", "/tr/iletisim")]), col([n("video_popup", { title: "Ürün turu", url: "https://example.com/video" })])], { verticalAlign: "center" })], 72)),
  item("cmp_two", "İki sütunlu karşılaştırma", "comparison", "Biz ve diğerleri: satır satır artılar.", "bento-4",
    band({ backgroundColor: "#f8fafc" }, [n("comparison_table", { title: "Neden bizi seçmelisiniz?", headers: ["Özellik", "Biz", "Diğerleri"], rows: [["Kurulum süresi", "1 gün", "2 hafta"], ["Destek", "7/24", "Mesai saati"], ["Ön yüz yükü", "0 KB", "Yüksek"]] })], 72)),
  item("txt_lead", "Giriş paragrafı", "text", "Geniş satır aralıklı, iri puntolu giriş metni.", "prose-section",
    band({ backgroundColor: "#ffffff" }, [box([heading("Önce kullanıcı", "h2"), para("Her kararı, ziyaretçinin ihtiyacından başlayarak veriyoruz. Sade tasarım, net mesaj ve hızlı sayfalar bu yüzden bizim önceliğimiz.", { style: { fontSize: "22px", lineHeight: "1.7" } })], { maxWidth: "760px", marginLeft: "auto", marginRight: "auto" })], 72)),
];
