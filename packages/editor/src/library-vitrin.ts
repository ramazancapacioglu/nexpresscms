import type { DesignLibraryItem } from "./library-types";
import { art, band, button, cardStyle, col, cols, heading, itemFactory, n, para } from "./library-kit";

/** Yazılım vitrini yerleşimleri. Marka adı ve ürün kataloğu yok; her temada aynı bloklarla durur. */
const item = itemFactory("lib_vit_", "Vitrin");
const NAVY = "#0b4f8a";
const GREEN = "#0c644e";
const INK = "#042646";
const shot = (kind: "dashboard" | "chart" | "people" | "doc" | "grid" | "phone", alt: string) =>
  n("image_figure", { url: art(kind, NAVY, GREEN), altText: alt, borderRadius: "lg" });

const card = (title: string, text: string, kind: "dashboard" | "chart" | "people" | "doc" | "grid" | "phone") =>
  col([shot(kind, title), heading(title, "h3"), para(text)], cardStyle());

const checklist = (rows: Array<[string, string]>) =>
  n("icon_list", { items: rows.map(([title, text]) => ({ mark: "✓", title, text })) });

const callbackFields = [
  { id: "ad", name: "ad", label: "Ad soyad", type: "text", required: true, width: "full" },
  { id: "firma", name: "firma", label: "Firma ünvanı", type: "text", required: false, width: "full" },
  { id: "telefon", name: "telefon", label: "Telefon", type: "tel", required: true, width: "full" },
  { id: "islem", name: "islem", label: "İşlem türü", type: "select", required: true, width: "full", options: ["Fiyat bilgisi", "Demo kurulumu", "Destek", "Sürüm yükseltme", "Genel bilgilendirme"] },
];

const setupFields = [
  { id: "ad", name: "ad", label: "Ad", type: "text", required: true, width: "half" },
  { id: "soyad", name: "soyad", label: "Soyad", type: "text", required: true, width: "half" },
  { id: "firma", name: "firma", label: "Firma ünvanı", type: "text", required: true, width: "full" },
  { id: "telefon", name: "telefon", label: "Telefon", type: "tel", required: true, width: "half" },
  { id: "eposta", name: "eposta", label: "E-posta", type: "email", required: true, width: "half" },
  { id: "yazilim", name: "yazilim", label: "Kullandığınız yazılım", type: "select", required: true, width: "full", options: ["ERP", "Üretim", "Satış", "Muhasebe", "Hızlı satış", "Restoran", "Otel", "Diğer"] },
];

export const VITRIN_LIBRARY_ITEMS: DesignLibraryItem[] = [
  item(
    "solutions",
    "Çözüm kartları",
    "cards",
    "Üstte başlık ve kısa tanıtım, altında iki sıra çözüm kartı.",
    "columns",
    band({ backgroundColor: "#f7fafc", blockWidth: "full" }, [
      heading("Yazılım çözümleri", "h2", { style: { textColor: INK } }),
      para("Küçük işletmeden büyük kuruluşa, sektörün günlük işine uyan yazılım ve teknoloji."),
      cols("4+4+4", [
        card("Ön muhasebe", "Cari, kasa ve stok aynı ekranda.", "dashboard"),
        card("Genel muhasebe", "Dönem ve beyanname akışı düzenli.", "doc"),
        card("Bulut kasa", "Şubeden aynı kaydı açın.", "phone"),
      ]),
      cols("4+4+4", [
        card("Sektörel paket", "İş koluna göre hazır kurulum.", "grid"),
        card("E-dönüşüm", "Belge ve arşiv tek yerde.", "chart"),
        card("Kurumsal ağ", "Merkez ve şube aynı veriyi görür.", "people"),
      ]),
    ], 64),
  ),
  item(
    "demo_cta",
    "Demo çağrı bandı",
    "cta",
    "Tam genişlik koyu bant: kısa vaat, demo düğmesi ve ara bağlantısı.",
    "cta-strip",
    band({ backgroundColor: NAVY, textColor: "#ffffff", blockWidth: "full" }, [
      cols("8+4", [
        col([
          heading("Sizi geleceğe hazırlayan çözümler", "h2", { style: { textColor: "#ffffff" } }),
          para("Ücretsiz demo kurulumu için iletişime geçin."),
        ]),
        col([
          button("Ücretsiz demo", "/iletisim", "primary"),
          button("Hemen ara", "tel:4440000", "outline"),
        ]),
      ], { verticalAlign: "center" }),
    ], 36),
  ),
  item(
    "split_list",
    "Görsel ve liste",
    "image_text",
    "Solda görsel, sağda başlık, açıklama ve onay listesi.",
    "columns",
    band({ backgroundColor: "#ffffff", blockWidth: "full" }, [
      cols("5+7", [
        col([shot("dashboard", "Program ekranı")]),
        col([
          heading("Muhasebe programları", "h2", { style: { textColor: INK } }),
          para("Ön muhasebeden genel muhasebeye, bulut kasadan mali müşavir aktarımına kadar ölçeğe göre doğru yazılım."),
          checklist([
            ["Cari takip", "Hesaplar ve hareketler tek listede."],
            ["E-belge", "Fatura ve arşiv aynı akışta."],
            ["Rapor", "Dönem özeti dışa aktarılır."],
          ]),
        ]),
      ], { verticalAlign: "center" }),
    ], 56),
  ),
  item(
    "mint_band",
    "Mint görsel bant",
    "image_text",
    "Açık mint zemin, solda metin, sağda görsel.",
    "columns",
    band({ backgroundColor: "#f4fbf8", blockWidth: "full" }, [
      cols("6+6", [
        col([
          heading("Sektörel çözümler", "h2", { style: { textColor: INK } }),
          para("Otel, restoran, market ve saha ekipleri için hazır kurulum. Aynı veri, işin kendi ekranında."),
          button("Çözümleri inceleyin", "/iletisim", "primary"),
        ]),
        col([shot("people", "Sektör ekipleri")]),
      ], { verticalAlign: "center" }),
    ], 56),
  ),
  item(
    "callback",
    "Sizi arayalım",
    "contact",
    "Solda kısa davet, sağda ad, firma, telefon ve işlem türü.",
    "form",
    band({ backgroundColor: "#f7fafc", blockWidth: "full" }, [
      cols("6+6", [
        col([
          heading("Detaylı bilgi için", "h2", { style: { textColor: INK } }),
          para("Formu bırakın, sizi arayalım. Fiyat, demo, destek ya da sürüm için aynı kutu yeter."),
        ]),
        col([
          n("form_block", {
            title: "Sizi arayalım",
            submitLabel: "Gönder",
            successMessage: "Talebiniz alındı.",
            appearance: { columns: 1, card: true },
            fields: callbackFields,
          }),
        ]),
      ], { verticalAlign: "center" }),
    ], 48),
  ),
  item(
    "modules",
    "Modül kartları",
    "cards",
    "Ürün tanıtımının altında dört modül kartı.",
    "columns",
    band({ backgroundColor: "#ffffff", blockWidth: "full" }, [
      heading("Modüler yapı", "h2", { style: { textColor: INK } }),
      para("İşletmenin departmanları aynı veriyi paylaşır. İhtiyacınız olan modülü açın, gerisi yerinde kalsın."),
      cols("3+3+3+3", [
        card("Stok", "Depo ve şube aynı sayımı görür.", "grid"),
        card("Satış", "Siparişten tahsilata tek akış.", "chart"),
        card("Üretim", "Reçete ve iş emri bağlı.", "dashboard"),
        card("Finans", "Cari ve kasa dönemle kapanır.", "doc"),
      ]),
    ], 56),
  ),
  item(
    "overlay",
    "Örtülü görsel",
    "image_text",
    "Üst üste iki kapak: görselin üzerinde başlık ve kısa satır.",
    "gallery",
    band({ backgroundColor: "#ffffff", blockWidth: "full" }, [
      n("image_overlay", { url: art("phone", NAVY, GREEN), alt: "E-belge", title: "E-belge çözümü", subtitle: "Adisyon ve e-belge aynı kasada." }),
      n("image_overlay", { url: art("people", GREEN, NAVY), alt: "Bayi ağı", title: "Bayi ağı", subtitle: "Şube ve franchise aynı raporu okur." }),
    ], 28),
  ),
  item(
    "channels",
    "Kanal şeridi",
    "logos",
    "Renkli bantta dört sipariş kanalı kartı.",
    "columns",
    band({ backgroundColor: "#e7f6ef", blockWidth: "full" }, [
      cols("3+3+3+3", [
        card("Paket servis", "Online sipariş aynı adisyona düşer.", "phone"),
        card("Market", "Kapıdan teslim stoktan düşer.", "grid"),
        card("Masa", "Salon hesabı açık kalır.", "dashboard"),
        card("Kurye", "Teslim durumu anlık.", "chart"),
      ]),
    ], 36),
  ),
  item(
    "setup_form",
    "Kurulum formu",
    "contact",
    "Solda görsel, sağda ad, firma, telefon, e-posta ve yazılım seçimi.",
    "form",
    band({ backgroundColor: "#f7fafc", blockWidth: "full" }, [
      cols("5+7", [
        col([shot("doc", "Kurulum")]),
        col([
          heading("Kurulum talebi", "h2", { style: { textColor: INK } }),
          para("Kullandığınız yazılımı seçin, ekibimiz dönüş yapsın."),
          n("form_block", {
            title: "Kurulum formu",
            submitLabel: "Talep gönder",
            successMessage: "Kurulum talebiniz alındı.",
            appearance: { columns: 2, card: true },
            fields: setupFields,
          }),
        ]),
      ], { verticalAlign: "center" }),
    ], 48),
  ),
  item(
    "cover",
    "Kapak başlık",
    "page_title",
    "Sayfanın başlığını, kısa açıklamasını ve öne çıkan görselini çeker.",
    "hero-split",
    band({ backgroundColor: "#e7f6ef", blockWidth: "full" }, [
      cols("7+5", [
        col([n("tpl_post_title", { level: "h1", align: "left", showTldr: true })]),
        col([n("tpl_featured_image", {})]),
      ], { verticalAlign: "center" }),
    ], 48),
  ),
];
