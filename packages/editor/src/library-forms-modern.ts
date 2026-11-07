import type { BlockNode } from "@nexpress/core";
import type { DesignLibraryItem } from "./library-types";
import { GRAD, art, band, cardStyle, col, cols, heading, image, itemFactory, n, para } from "./library-kit";

/**
 * Form tasarımları: formun kendisi `form_block`, çevresi degrade bant, bölünmüş kart veya sihirbaz düzenidir.
 * Alanlar satır içidir; yayında gönderimler gelen kutusuna düşer. Kurucu formuna bağlamak için bloğa `formId` yazılır.
 */
const item = itemFactory("lib_mod_form_", "Form tasarımı");

type Field = Record<string, unknown>;
const f = (name: string, label: string, type: string, extra: Field = {}): Field => ({ name, label, type, required: type !== "textarea" && type !== "checkbox" ? true : false, width: "full", ...extra });
const consent = f("onay", "Aydınlatma metnini okudum ve anladım.", "checkbox", { required: true });
const form = (title: string, fields: Field[], submitLabel: string, appearance: Field = {}): BlockNode =>
  n("form_block", { title, submitLabel, appearance: { columns: 2, labels: "top", density: "comfortable", buttonAlign: "left", surface: "inline", ...appearance }, fields });
const glass = cardStyle({ backgroundColor: "#ffffff", textColor: "#0f172a", borderRadius: "24px", boxShadow: "xl", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", hover: undefined });

export const MODERN_FORM_ITEMS: DesignLibraryItem[] = [
  item("newsletter_strip", "Bülten şeridi (e-posta + düğme yan yana)", "forms", "Degrade bant; tek alan ve yanında düğme.", "form",
    band({ backgroundGradient: GRAD.ocean, textColor: "#ffffff", textAlign: "center" }, [
      heading("Haberleri kaçırmayın", "h2", { style: { textAlign: "center" } }), para("Ayda bir, yalnızca işinize yarayan içerikler.", { style: { textAlign: "center" } }),
      col([form("Bülten", [f("eposta", "E-posta adresiniz", "email", { placeholder: "ornek@site.com", width: "half" })], "Abone ol", { columns: 2, buttonAlign: "beside" })], { backgroundColor: "#ffffff", textColor: "#0f172a", borderRadius: "20px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" }),
    ], 64)),
  item("split_card", "Görselli bölünmüş form kartı", "forms", "Solda çizim ve güven maddeleri, sağda form; tek yuvarlak kart.", "form",
    band({ backgroundColor: "#f1f5f9" }, [cols("5+7", [
      col([image(art("people", "#6366f1", "#ec4899"), "Ekip", { aspectRatio: "3:2", borderRadius: "none" }), heading("Size nasıl yardımcı olalım?", "h3"), para("Ekibimiz bir iş günü içinde dönüş yapar."), n("icon_list", { items: [{ icon: "check-circle", title: "Ücretsiz keşif", text: "" }, { icon: "check-circle", title: "Taahhütsüz teklif", text: "" }] })], { backgroundColor: "#ffffff" }),
      col([form("Bize yazın", [f("ad", "Ad soyad", "text", { width: "half" }), f("eposta", "E-posta", "email", { width: "half" }), f("telefon", "Telefon", "tel", { width: "half", required: false }), f("konu", "Konu", "select", { width: "half", options: ["Teklif", "Destek", "Diğer"] }), f("mesaj", "Mesajınız", "textarea"), consent], "Gönder")], { backgroundColor: "#ffffff" }),
    ], { gap: "0px", verticalAlign: "stretch" })], 64), "Bölünmüş"),
  item("dark_demo", "Koyu bantta demo talebi (cam kart)", "forms", "Gece mavisi bant; solda vaat, sağda beyaz form kartı.", "form",
    band({ backgroundGradient: GRAD.night, textColor: "#f8fafc" }, [cols("5+7", [
      col([heading("Demoyu ekibinizle birlikte görelim", "h2", { style: { fontSize: "36px", fontWeight: "800", mobile: { fontSize: "28px" } } }), para("30 dakikalık canlı tanıtım. Verilerinizle çalışan bir ortam hazırlarız."), para("✓ 30 dakika   ✓ Tüm ekibe açık   ✓ Ücretsiz")]),
      col([form("Demo talebi", [f("ad", "Ad soyad", "text", { width: "half" }), f("firma", "Firma", "text", { width: "half" }), f("eposta", "E-posta", "email", { width: "half" }), f("telefon", "Telefon", "tel", { width: "half" }), f("ilgi", "İlgilendiğiniz alan", "select", { options: ["Satış", "Muhasebe", "Üretim", "İnsan kaynakları"] }), consent], "Demo talep et", { buttonAlign: "full" })], glass),
    ], { verticalAlign: "center" })], 88), "Koyu"),
  item("quote_wizard", "Üç adımlı teklif sihirbazı", "forms", "Hizmet → proje → iletişim adımları; solda süreç özeti.", "form",
    band({ backgroundColor: "#ffffff" }, [cols("4+8", [
      col([heading("Teklif almak 1 dakika", "h3"), para("Üç kısa adımda ihtiyacınızı anlatın."), n("icon_list", { items: [{ icon: "check", title: "1. Hizmet", text: "" }, { icon: "check", title: "2. Proje", text: "" }, { icon: "check", title: "3. İletişim", text: "" }] })]),
      col([form("Teklif sihirbazı", [
        f("hizmet", "İlgilendiğiniz hizmet", "radio", { step: 1, options: ["Web sitesi", "E-ticaret", "Mobil uygulama", "Diğer"] }),
        f("butce", "Tahmini bütçe", "radio", { step: 2, options: ["Başlangıç", "Orta", "Yüksek"] }), f("tarih", "Başlangıç tarihi", "date", { step: 2, required: false }), f("detay", "Proje özeti", "textarea", { step: 2 }),
        f("ad", "Ad soyad", "text", { step: 3, width: "half" }), f("eposta", "E-posta", "email", { step: 3, width: "half" }), { ...consent, step: 3 },
      ], "Teklif iste", { stepped: true, buttonAlign: "full" })], cardStyle({ hover: undefined })),
    ], { verticalAlign: "center" })], 72), "Adımlı"),
  item("nps_card", "Memnuniyet kartı (puan + yorum)", "forms", "Ortalı dar kart: 0–10 puan, yıldız ve serbest yorum.", "form",
    band({ backgroundGradient: GRAD.soft }, [col([heading("Deneyiminizi puanlayın", "h3", { style: { textAlign: "center" } }), form("Memnuniyet", [f("nps", "Bizi arkadaşınıza önerme olasılığınız?", "scale", { help: "0 = hiç önermem, 10 = kesinlikle öneririm" }), f("puan", "Genel memnuniyet", "rating"), f("yorum", "Eklemek istedikleriniz", "textarea")], "Gönder", { columns: 1, buttonAlign: "full" })], cardStyle({ maxWidth: "640px", marginLeft: "auto", marginRight: "auto", hover: undefined }))], 64), "Anket"),
  item("reservation", "Rezervasyon formu (görsel başlıklı)", "forms", "Üstte kapak çizimi; tarih, saat, kişi sayısı ve not alanları.", "form",
    band({ backgroundColor: "#f8fafc" }, [col([image(art("cloud", "#f97316", "#ec4899"), "Rezervasyon", { aspectRatio: "21:9", borderRadius: "none" }), form("Rezervasyon", [f("ad", "Ad soyad", "text", { width: "half" }), f("telefon", "Telefon", "tel", { width: "half" }), f("tarih", "Tarih", "date", { width: "half" }), f("saat", "Saat", "time", { width: "half" }), f("kisi", "Kişi sayısı", "number", { width: "half", min: 1, max: 20 }), f("alan", "Tercih", "select", { width: "half", options: ["İç mekân", "Bahçe", "Fark etmez"] }), f("not", "Özel istek", "textarea")], "Rezervasyon yap")], cardStyle({ maxWidth: "760px", marginLeft: "auto", marginRight: "auto", paddingTop: "0px", paddingLeft: "0px", paddingRight: "0px", hover: undefined }))], 64), "Rezervasyon"),
  item("career", "Kariyer başvuru formu", "forms", "Solda açık pozisyon bilgisi, sağda başvuru alanları.", "form",
    band({ backgroundColor: "#ffffff" }, [cols("4+8", [
      col([heading("Ekibimize katılın", "h3"), para("Uzaktan ve hibrit çalışma, yıllık eğitim bütçesi, esnek saatler."), n("icon_list", { items: [{ icon: "briefcase", title: "Tam zamanlı", text: "" }, { icon: "map-pin", title: "İstanbul / Uzaktan", text: "" }] })], cardStyle({ backgroundColor: "#eef2ff", borderColor: "#c7d2fe", hover: undefined })),
      col([form("Başvuru", [f("ad", "Ad soyad", "text", { width: "half" }), f("eposta", "E-posta", "email", { width: "half" }), f("pozisyon", "Pozisyon", "select", { width: "half", options: ["Yazılım geliştirici", "Tasarımcı", "Satış", "Destek"] }), f("deneyim", "Deneyim (yıl)", "number", { width: "half", min: 0, max: 40 }), f("portfoy", "Portföy / profil adresi", "url", { required: false }), f("yazi", "Ön yazı", "textarea"), consent], "Başvur")]),
    ])], 72), "Kariyer"),
  item("callback_bar", "Geri arama çubuğu (tek satır)", "forms", "Üç alan ve düğme aynı satırda; sayfa altı ve ürün sayfaları için.", "form",
    band({ backgroundGradient: GRAD.sunset, textColor: "#ffffff" }, [cols("4+8", [col([heading("Sizi arayalım", "h3"), para("Numaranızı bırakın, dakikalar içinde arayalım.")]), col([form("Geri arama", [f("ad", "Ad", "text", { width: "quarter" }), f("telefon", "Telefon", "tel", { width: "quarter" }), f("saat", "Zaman", "select", { width: "quarter", options: ["Şimdi", "Öğleden sonra", "Akşam"] })], "Beni arayın", { columns: 4, density: "compact", buttonAlign: "beside" })], { backgroundColor: "#ffffff", textColor: "#0f172a", borderRadius: "20px", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "16px", paddingRight: "16px" })], { verticalAlign: "center" })], 48), "Kompakt"),
  item("contact_split", "İletişim bilgisi + form", "forms", "Solda üç bilgi kartı (telefon, e-posta, adres), sağda mesaj formu.", "form",
    band({ backgroundColor: "#ffffff" }, [cols("5+7", [
      col([n("info_box", { icon: "phone", kicker: "Telefon", title: "0 (212) 000 00 00", text: "Hafta içi 09:00–18:00" }), n("info_box", { icon: "mail", kicker: "E-posta", title: "bilgi@ornek.com", text: "Bir iş günü içinde yanıt" }), n("info_box", { icon: "map-pin", kicker: "Adres", title: "Örnek Mah. No: 1", text: "İstanbul" })]),
      col([form("Mesaj gönderin", [f("ad", "Ad soyad", "text", { width: "half" }), f("eposta", "E-posta", "email", { width: "half" }), f("mesaj", "Mesajınız", "textarea"), consent], "Gönder")], cardStyle({ hover: undefined })),
    ])], 72), "İletişim"),
];
