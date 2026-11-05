import { field, normalizeFormSpec, normalizeNotify, type FormField, type FormNotifySettings, type FormSpec } from "./form-spec";

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: "iletisim" | "satis" | "destek" | "anket" | "etkinlik" | "ik";
  spec: FormSpec;
  notify: FormNotifySettings;
}

const half = { width: "half" as const };
const f = (name: string, label: string, type: FormField["type"], required = false, extra: Partial<FormField> = {}) => field(`f_${name}`, name, label, type, required, extra);

function tpl(id: string, name: string, description: string, category: FormTemplate["category"], fields: FormField[], over: { submitLabel?: string; successMessage?: string; subject?: string; autoReply?: boolean; appearance?: Record<string, unknown> } = {}): FormTemplate {
  const spec = normalizeFormSpec({ fields, submitLabel: over.submitLabel ?? "Gönder", successMessage: over.successMessage ?? "", appearance: over.appearance });
  const notify = normalizeNotify({ enabled: false, subject: over.subject ?? `${name}: {form}`, autoReply: { enabled: over.autoReply === true } }, spec.fields);
  return { id, name, description, category, spec, notify };
}

/** Hazır form şablonları. Kurucuda "Şablondan başla" ile kopyalanır; kopya bağımsızdır. */
export const FORM_TEMPLATES: FormTemplate[] = [
  tpl("contact", "İletişim formu", "Ad, e-posta, konu ve mesaj.", "iletisim", [
    f("ad", "Ad soyad", "text", true, half), f("eposta", "E-posta", "email", true, half),
    f("konu", "Konu", "text"), f("mesaj", "Mesajınız", "textarea", true, { max: 3000 }),
    f("kvkk", "Kişisel verilerimin işlenmesini kabul ediyorum.", "checkbox", true),
  ], { successMessage: "Mesajınız alındı. En kısa sürede dönüş yapacağız.", autoReply: true }),
  tpl("newsletter", "Bülten aboneliği", "Tek alanlı e-posta toplama.", "iletisim", [
    f("eposta", "E-posta adresiniz", "email", true, { placeholder: "ornek@site.com" }),
    f("ilgi", "İlgi alanları", "checkboxes", false, { options: ["Haberler", "Kampanyalar", "Ürün yenilikleri"] }),
  ], { submitLabel: "Abone ol", successMessage: "Aboneliğiniz alındı, teşekkürler." }),
  tpl("quote", "Teklif talebi", "Hizmet, bütçe ve zamanlama ile teklif isteği.", "satis", [
    f("ad", "Ad soyad", "text", true, half), f("firma", "Firma", "text", false, half),
    f("eposta", "E-posta", "email", true, half), f("telefon", "Telefon", "tel", false, half),
    f("hizmet", "İlgilendiğiniz hizmet", "select", true, { options: ["Web sitesi", "E-ticaret", "SEO", "Bakım ve destek", "Diğer"] }),
    f("butce", "Tahmini bütçe", "radio", false, { options: ["10.000 ₺ altı", "10.000 – 50.000 ₺", "50.000 – 150.000 ₺", "150.000 ₺ üzeri"] }),
    f("tarih", "İstenen başlangıç tarihi", "date"), f("detay", "Proje detayları", "textarea", true),
  ], { submitLabel: "Teklif iste", successMessage: "Talebiniz alındı. Size 1 iş günü içinde döneceğiz.", subject: "Yeni teklif talebi: {form}", autoReply: true }),
  tpl("callback", "Geri arama talebi", "Telefon numarası ve uygun saat.", "satis", [
    f("ad", "Ad soyad", "text", true, half), f("telefon", "Telefon", "tel", true, half),
    f("saat", "Uygun zaman", "select", false, { options: ["Sabah (09–12)", "Öğleden sonra (12–17)", "Akşam (17–20)"] }),
  ], { submitLabel: "Beni arayın", successMessage: "Talebiniz alındı, sizi arayacağız." }),
  tpl("appointment", "Randevu talebi", "İki adım: kişi, sonra tarih ve saat. Telefon yalnız seçilince açılır.", "satis", [
    f("ad", "Ad soyad", "text", true, { ...half, step: 1 }), f("eposta", "E-posta", "email", true, { ...half, step: 1 }),
    f("tarih", "Tarih", "date", true, { ...half, step: 2 }), f("saat", "Saat", "time", true, { ...half, step: 2 }),
    f("kanal", "Sizinle nasıl görüşelim?", "radio", true, { options: ["E-posta", "Telefon"], step: 2 }),
    f("telefon", "Telefon", "tel", true, { showWhen: { field: "kanal", equals: "Telefon" }, placeholder: "05xx", step: 2 }),
    f("not", "Not", "textarea", false, { step: 2 }),
  ], { submitLabel: "Randevu iste", successMessage: "Randevu talebiniz alındı.", autoReply: true, appearance: { columns: 2, stepped: true, buttonAlign: "full" } }),
  tpl("support", "Destek talebi", "Öncelik ve kategori ile destek bildirimi.", "destek", [
    f("ad", "Ad soyad", "text", true, half), f("eposta", "E-posta", "email", true, half),
    f("kategori", "Kategori", "select", true, { options: ["Teknik sorun", "Fatura / ödeme", "Hesap", "Öneri"] }),
    f("oncelik", "Öncelik", "radio", false, { options: ["Düşük", "Normal", "Yüksek", "Acil"] }),
    f("konu", "Konu", "text", true), f("aciklama", "Sorunu anlatın", "textarea", true, { max: 4000 }),
  ], { successMessage: "Talebiniz kaydedildi.", subject: "Destek talebi: {form}", autoReply: true }),
  tpl("feedback", "Memnuniyet / NPS", "Puan ve serbest yorum.", "anket", [
    f("nps", "Bizi bir arkadaşınıza önerme olasılığınız nedir?", "scale", true, { help: "0 = hiç önermem, 10 = kesinlikle öneririm" }),
    f("puan", "Genel memnuniyetiniz", "rating", true),
    f("iyi", "En çok neyi beğendiniz?", "textarea"), f("gelistir", "Neyi geliştirmeliyiz?", "textarea"),
    f("eposta", "E-posta (isteğe bağlı)", "email"),
  ], { submitLabel: "Geri bildirimi gönder", successMessage: "Geri bildiriminiz için teşekkürler." }),
  tpl("survey", "Kısa anket", "Seçmeli ve çoklu seçimli sorular.", "anket", [
    f("baslik", "Kısa anket", "heading"), f("aciklama", "Cevaplarınız yalnızca ürünü geliştirmek için kullanılır.", "paragraph"),
    f("kaynak", "Bizi nereden duydunuz?", "radio", true, { options: ["Arama motoru", "Sosyal medya", "Tavsiye", "Reklam", "Diğer"] }),
    f("ozellik", "Hangi özellikler sizin için önemli?", "checkboxes", false, { options: ["Hız", "SEO", "Kolay kullanım", "Fiyat", "Destek"] }),
    f("yorum", "Eklemek istedikleriniz", "textarea"),
  ], { submitLabel: "Anketi gönder" }),
  tpl("event", "Etkinlik kaydı", "Katılımcı sayısı ve notlar.", "etkinlik", [
    f("ad", "Ad soyad", "text", true, half), f("eposta", "E-posta", "email", true, half),
    f("kisi", "Katılımcı sayısı", "number", true, { min: 1, max: 10, placeholder: "1" }),
    f("oturum", "Katılmak istediğiniz oturum", "select", false, { options: ["Açılış", "Atölye", "Panel", "Hepsi"] }),
    f("not", "Diyet / erişilebilirlik notu", "textarea"),
  ], { submitLabel: "Kaydol", successMessage: "Kaydınız alındı.", autoReply: true }),
  tpl("job", "İş başvurusu", "Aday bilgileri ve ön yazı.", "ik", [
    f("ad", "Ad soyad", "text", true, half), f("eposta", "E-posta", "email", true, half),
    f("telefon", "Telefon", "tel", false, half), f("pozisyon", "Pozisyon", "text", true, half),
    f("portfoy", "Portföy / LinkedIn adresi", "url"),
    f("deneyim", "Deneyim yılı", "number", false, { min: 0, max: 50 }),
    f("yazi", "Ön yazı", "textarea", true, { max: 4000 }),
  ], { submitLabel: "Başvur", successMessage: "Başvurunuz alındı.", subject: "Yeni başvuru: {form}" }),
  tpl("demo-request", "Ücretsiz tanıtım talebi", "Program, ad, telefon, e-posta, şehir ve aydınlatma onayı.", "satis", [
    f("program", "Program adı", "text", true, half), f("ad", "Ad soyad", "text", true, half),
    f("telefon", "Telefon", "tel", true, half), f("eposta", "E-posta", "email", true, half),
    f("sehir", "Şehir", "text", true),
    f("onay", "Aydınlatma metnini okudum ve anladım.", "checkbox", true),
  ], { submitLabel: "Formu gönder", successMessage: "Talebiniz alındı. Uzmanımız sizi arayacak.", subject: "Tanıtım talebi: {form}", autoReply: true }),
  tpl("call-me", "Sizi arayalım", "Kısa geri arama formu: ad, telefon ve onay.", "satis", [
    f("ad", "Ad soyad", "text", true), f("telefon", "Telefon", "tel", true),
    f("onay", "Aydınlatma metnini okudum ve anladım.", "checkbox", true),
  ], { submitLabel: "Gönder", successMessage: "Talebiniz alındı.", appearance: { columns: 1, labels: "top", density: "compact", buttonAlign: "full", surface: "inline" } }),
  tpl("partner-application", "Çözüm ortağı başvurusu", "Firma, yetkili, şehir ve kısa tanıtım.", "satis", [
    f("firma", "Firma adı", "text", true, half), f("ad", "Yetkili ad soyad", "text", true, half),
    f("telefon", "Telefon", "tel", true, half), f("eposta", "E-posta", "email", true, half),
    f("sehir", "Şehir", "text", true), f("not", "Kısaca kendinizden bahsedin", "textarea", false, { max: 2000 }),
  ], { submitLabel: "Başvur", successMessage: "Başvurunuz alındı.", subject: "Çözüm ortağı başvurusu: {form}" }),
];

export function getFormTemplate(id: string): FormTemplate | null {
  return FORM_TEMPLATES.find((t) => t.id === id) ?? null;
}
