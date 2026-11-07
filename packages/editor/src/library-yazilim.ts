import type { DesignLibraryItem } from "./library-types";
import { SPAN, cols, itemFactory, n, type LibNode } from "./library-kit";

/**
 * Yazılım Firması Teması bölümleri. Bant ve kart sınıfları (`yf-*`) tema etkinken görünür;
 * başka temada düz bloklar olarak kalır. Görseller `/demo/yazilim-firmasi/` altındaki temsili çizimlerdir.
 */
const ART = "/demo/yazilim-firmasi";

const heading = (t: string, level = "h2") => n("heading_element", { text: t, level, align: "center" });
const para = (t: string) => n("paragraph_element", { text: t });
const col = (children: ReturnType<typeof n>[], cls = "yf-card") => n("column", {}, { children, style: { cssClass: cls } });
const card = (art: string, title: string, t: string) => col([
  n("image_figure", { url: `${ART}/${art}.svg`, altText: title, borderRadius: "lg", aspectRatio: "3:2" }),
  n("heading_element", { text: title, level: "h3" }),
  n("paragraph_element", { text: t }),
]);
const band = (tone: string, children: ReturnType<typeof n>[], center = true): LibNode =>
  ({ type: "section", gridSpan: SPAN, props: { containerMode: "boxed" }, children, style: { fullWidth: true, paddingTop: "72px", paddingBottom: "72px", cssClass: `yf-band yf-${tone}${center ? " yf-center" : ""}` } });

const item = itemFactory("lib_yf_", "Yazılım Firması");

export const YAZILIM_LIBRARY_ITEMS: DesignLibraryItem[] = [
  item("hero", "Siyah vitrin kahramanı", "hero", "Ortalı başlık, iki düğme ve altında ürün görseli olan siyah bant.", "hero-centered",
    band("dark", [
      n("hero", { badge: "31 yıllık deneyim", title: "ERP, Muhasebe, CRM ve Bulut Yazılım Çözümleri", subtitle: "İşletmenize özel yazılım çözümleri.", primaryCtaLabel: "Demo Talebi", primaryCtaHref: "/tr/ucretsiz-tanitim", secondaryCtaLabel: "Tüm çözümler", secondaryCtaHref: "/tr/programlar" }),
      n("image_figure", { url: `${ART}/dashboard.svg`, altText: "Yönetim paneli örneği", borderRadius: "lg", aspectRatio: "3:2", maxWidth: "900px", align: "center" }),
    ])),
  item("navy_band", "Lacivert çağrı bandı", "layout", "Tek cümlelik vurgu ve tek düğme.", "cta-strip",
    band("navy", [heading("İşinizi Yöneten Teknoloji"), para("Yapay zekâ destekli ERP. Geleceği bugünden deneyimleyin!"), n("button_element", { label: "Deneyimi Başlat", href: "/tr/merkez-erp", styleVariant: "outline", align: "center" })])),
  item("product_cards", "Görselli ürün kartları (3'lü)", "cards", "Görsel, başlık ve açıklamadan oluşan üç kart.", "bento-3",
    band("", [heading("Neler sunar?"), cols("4+4+4", [card("erp", "Üretim", "Reçete, iş emri ve maliyet."), card("crm", "CRM", "Aday, teklif ve görüşme."), card("muhasebe", "Muhasebe", "Cari, kasa ve defter.")])])),
  item("edoc_cards", "e-Belge kartları (4'lü)", "cards", "Fatura, arşiv, irsaliye ve defter kartları.", "bento-4",
    band("", [heading("e-Dönüşüm Uygulamaları"), cols("3+3+3+3", [card("fatura", "e-Fatura", "Resmi fatura dijitalde."), card("arsiv", "e-Arşiv", "Güvenli saklama."), card("irsaliye", "e-İrsaliye", "Kâğıtsız sevkiyat."), card("defter", "e-Defter", "Yevmiye ve kebir.")])])),
  item("campaigns", "Kampanya kartları", "cards", "Bitiş etiketli üç kampanya kartı.", "bento-3",
    band("soft", [heading("Fırsatları Keşfet"), cols("4+4+4", [card("kampanya-1", "Yeni yıl indirimi", "Örnek kampanya metni."), card("kampanya-2", "Paket fırsatı", "Örnek kampanya metni."), card("kampanya-3", "Geçiş fırsatı", "Örnek kampanya metni.")])])),
  item("stats", "Rakamlarla firma (siyah)", "data", "Dört sayaçlı siyah bant. Sayıları kendi verinizle değiştirin.", "stats-4",
    band("dark", [heading("Firma Farkı"), cols("3+3+3+3", ["31|Yıllık deneyim", "52|Ülkede yapılanma", "1270|Çözüm ortağı", "196000|Mutlu müşteri"].map((s) => col([n("heading_element", { text: s.split("|")[0], level: "h3", align: "center" }), n("paragraph_element", { text: s.split("|")[1] })], "yf-stat")))])),
  item("split", "Görsel ve metin", "layout", "Solda ürün görseli, sağda başlık, liste ve düğme.", "columns",
    band("soft", [cols("6+6", [col([n("image_figure", { url: `${ART}/sektor.svg`, altText: "Sektör örneği", borderRadius: "lg", aspectRatio: "3:2" })], ""), col([n("heading_element", { text: "Tüm iş süreçleriniz tek sistemde", level: "h2" }), n("paragraph_element", { text: "Karmaşaya veda edin, kontrole hoş geldiniz." }), n("button_element", { label: "Ücretsiz tanıtım iste", href: "/tr/ucretsiz-tanitim", styleVariant: "primary", align: "left" })], "")])], false)),
  item("editions", "Sürüm karşılaştırması", "pricing", "Fiyatsız sürüm tablosu; özellik işaretleri.", "pricing-3",
    band("soft", [n("comparison_table", { title: "Sürüm karşılaştırması", headers: ["Özellik", "Başlangıç", "Profesyonel", "Kurumsal"], rows: [["Temel modüller", "✓", "✓", "✓"], ["Çok şube", "—", "✓", "✓"], ["Özel entegrasyon", "—", "—", "✓"]] })], false)),
  item("steps", "Üç adımlı süreç", "layout", "Başvuru, kontör, bağlantı gibi sıralı adımlar.", "howto-timeline",
    band("", [n("howto_steps", { title: "Üç adımda başlayın", steps: [{ title: "Başvuru", description: "Formu doldurun." }, { title: "Kurulum", description: "Uzman ekip kurar." }, { title: "Kullanım", description: "Eğitimle başlayın." }] })], false)),
  item("faq", "Sık sorulanlar", "aio_sge", "Sorular ve yanıtlar; FAQ şeması üretir.", "faq-list",
    band("soft", [n("faq_accordion", { title: "Sık sorulanlar", items: [{ question: "Demo alabilir miyim?", answer: "Evet. Ücretsiz tanıtım formunu doldurun." }, { question: "Eğitim var mı?", answer: "Kurulumda eğitim verilir." }] })], false)),
  item("offices", "Ofis kartları", "layout", "Merkez ve bölge ofisi adresleri.", "bento-3",
    band("", [heading("Ofislerimiz"), cols("4+4+4", [col([n("heading_element", { text: "Genel merkez", level: "h3" }), n("paragraph_element", { text: "Örnek Mah. Yazılım Cad. No: 1 — Konya" })]), col([n("heading_element", { text: "İstanbul", level: "h3" }), n("paragraph_element", { text: "Örnek Mah. E-5 Yan Yol No: 100" })]), col([n("heading_element", { text: "Ar-Ge", level: "h3" }), n("paragraph_element", { text: "Örnek Mah. Teknoloji Sk. No: 5" })])])])),
  item("demo_form", "Ücretsiz tanıtım formu", "forms", "Program, ad, telefon, e-posta ve onay alanlı talep formu.", "form",
    band("soft", [n("form_block", { title: "Tanıtım talep formu", submitLabel: "Formu gönder", appearance: { columns: 2, labels: "top", density: "comfortable", buttonAlign: "left", surface: "inline" }, fields: [
      { id: "program", name: "program", label: "Program adı", type: "text", required: true, width: "half" },
      { id: "ad", name: "ad", label: "Ad soyad", type: "text", required: true, width: "half" },
      { id: "tel", name: "tel", label: "Telefon", type: "tel", required: true, width: "half" },
      { id: "eposta", name: "eposta", label: "E-posta", type: "email", required: true, width: "half" },
      { id: "onay", name: "onay", label: "Aydınlatma metnini okudum ve anladım.", type: "checkbox", required: true, width: "full" },
    ] })], false)),
];
