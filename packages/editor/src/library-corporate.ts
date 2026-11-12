import type { BlockNode } from "@nexpress/core";
import type { DesignLibraryItem } from "./library-types";
import { art, band, box, button, cardStyle, col, cols, heading, image, itemFactory, n, para } from "./library-kit";

/**
 * Kurumsal bölümler: güven, kanıt, süreç ve dönüşüm odaklı. Renkler temanın değişkenlerinden (`--nx-primary`,
 * `--nx-secondary`) gelir; tema değişince bölümler de yeni temanın rengini alır. Hepsi mevcut bloklardan kurulur (0 KB ön yüz).
 * Rakam, sertifika ve marka adları örnektir; kendi gerçek verilerinizle değiştirin.
 */
const item = itemFactory("lib_corp_", "Kurumsal");

const PRI = "var(--nx-primary)";
const DEEP = "linear-gradient(135deg, var(--nx-secondary) 0%, color-mix(in srgb, var(--nx-secondary) 72%, var(--nx-primary)) 100%)";
const tint = (pct = 7) => `color-mix(in srgb, var(--nx-primary) ${pct}%, #ffffff)`;
const WHITE = { textColor: "#f8fafc" } as const;

const eyebrow = (text: string, dark = false) =>
  para(text, { style: { fontSize: "12px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", textColor: dark ? "color-mix(in srgb, var(--nx-primary) 55%, #ffffff)" : PRI } });
const big = (text: string, size = "46px", mobile = "30px", extra: NonNullable<BlockNode["style"]> = {}) =>
  heading(text, "h2", { style: { fontSize: size, fontWeight: "800", lineHeight: "1.1", letterSpacing: "-0.025em", mobile: { fontSize: mobile }, ...extra } });
const num = (text: string) =>
  para(text, { style: { fontSize: "44px", fontWeight: "800", lineHeight: "1", textColor: PRI, letterSpacing: "-0.03em" } });
const sectionHead = (kicker: string, title: string, lead?: string, dark = false): BlockNode[] => [
  eyebrow(kicker, dark),
  big(title, "38px", "28px"),
  ...(lead ? [para(lead, { style: { maxWidth: "680px", fontSize: "17px" } })] : []),
];

export const CORPORATE_LIBRARY_ITEMS: DesignLibraryItem[] = [
  item("trust_hero", "Güven vitrini", "hero", "Koyu zeminde sol metin, sağ panel görseli ve altında güven satırı.", "hero-split",
    band({ backgroundGradient: DEEP, ...WHITE }, [cols("6+6", [
      col([
        eyebrow("Kurumsal çözüm ortağınız", true),
        big("Büyüyen işletmeler için güvenilir altyapı", "54px", "32px"),
        para("Süreçlerinizi tek yerde toplayın, ekibinizin verimini artırın. Kurulumdan eğitime uzman ekibimiz yanınızda.", { style: { fontSize: "18px", maxWidth: "520px" } }),
        n("button_row", { align: "left", buttons: [{ label: "Teklif alın", href: "/tr/iletisim", variant: "primary" }, { label: "Çözümleri inceleyin", href: "/tr/hizmetler", variant: "outline" }] }),
        para("✓ KVKK uyumlu   ✓ 7/24 destek   ✓ Yerinde kurulum", { style: { fontSize: "13px", marginTop: "18px", opacity: 0.8 } }),
      ]),
      col([image(art("dashboard", "#2563eb", "#22d3ee"), "Yönetim paneli ekranı", { aspectRatio: "3:2", shadow: "xl" }, { animation: "fade-left" })]),
    ], { verticalAlign: "center" })], 96)),

  item("hero_light", "Aydınlık vitrin", "hero", "Açık zeminde ortalı başlık, tek eylem ve altında geniş ürün görseli.", "hero-centered",
    band({ backgroundGradient: `linear-gradient(180deg, ${tint(10)} 0%, #ffffff 100%)`, textAlign: "center" }, [
      eyebrow("Yeni sürüm yayında"),
      big("İş süreçlerinizi sadeleştirin", "56px", "34px", { textAlign: "center", marginLeft: "auto", marginRight: "auto", maxWidth: "820px" }),
      para("Tek platformda satış, stok ve raporlama. Karmaşık yazılım değil, işe yarayan çözüm.", { style: { textAlign: "center", maxWidth: "640px", marginLeft: "auto", marginRight: "auto", fontSize: "18px" } }),
      n("button_row", { align: "center", buttons: [{ label: "Ücretsiz deneyin", href: "/tr/iletisim", variant: "primary" }, { label: "Fiyatları görün", href: "/tr/fiyatlar", variant: "outline" }] }),
      image(art("chart", "#2563eb", "#0ea5e9"), "Raporlama ekranı", { aspectRatio: "3:2", shadow: "xl", maxWidth: "900px", align: "center" }, { marginTop: "36px", animation: "fade-up" }),
    ], 96)),

  item("numbers_band", "Rakamlarla biz", "stats", "Koyu bantta dört büyük rakam. Rakamları kendi verilerinizle değiştirin.", "stats-4",
    band({ backgroundColor: "var(--nx-secondary)", ...WHITE }, [
      cols("3+3+3+3", [["20+", "Yıllık deneyim"], ["1.500+", "Mutlu müşteri"], ["%98", "Müşteri memnuniyeti"], ["7/24", "Teknik destek"]].map(([v, l]) =>
        col([para(v!, { style: { fontSize: "48px", fontWeight: "800", lineHeight: "1", textColor: "color-mix(in srgb, var(--nx-primary) 60%, #ffffff)", textAlign: "center" } }), para(l!, { style: { textAlign: "center", opacity: 0.85 } })]))),
    ], 64)),

  item("problem_solution", "Sorun, çözüm, sonuç", "cards", "Üç adımlı numaralı kartlarla değer önerisi.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [
      ...sectionHead("Nasıl çalışır", "Sorunu anlıyor, çözümü kuruyor, sonucu ölçüyoruz"),
      cols("4+4+4", [["01", "Sorun", "Dağınık araçlar ve elle takip zaman kaybettiriyor."], ["02", "Çözüm", "Tek platformda otomatik akışlar ve ortak veri."], ["03", "Sonuç", "Daha az hata, daha hızlı karar, ölçülebilir verim."]].map(([k, t, s], i) =>
        col([num(k!), heading(t!, "h3"), para(s!)], cardStyle({ backgroundColor: i === 1 ? tint(8) : "#ffffff", animation: "fade-up", transitionMs: 200 + i * 120 })))),
    ], 80)),

  item("service_icons", "Hizmet kartları (simgeli)", "cards", "Altı hizmeti simge, başlık ve kısa metinle gösteren ızgara.", "bento-4",
    band({ backgroundColor: tint(5) }, [
      n("bento_features", {
        title: "Hizmetlerimiz",
        subtitle: "İşletmenizin ihtiyacına göre bir araya getirilebilen çözümler.",
        columns: 3,
        items: [
          { icon: "shield", title: "Güvenlik", description: "Rol bazlı yetki, düzenli yedek ve erişim kaydı." },
          { icon: "chart", title: "Raporlama", description: "Canlı panolar ve zamanlanmış raporlar." },
          { icon: "users", title: "Ekip yönetimi", description: "Görev, yetki ve performans tek yerde." },
          { icon: "cloud", title: "Bulut erişim", description: "Her yerden, her cihazdan güvenle çalışın." },
          { icon: "headphones", title: "Destek", description: "Telefon, uzaktan bağlantı ve yerinde hizmet." },
          { icon: "target", title: "Danışmanlık", description: "Süreç analizi ve doğru modül seçimi." },
        ],
      }),
    ], 80)),

  item("case_study", "Vaka çalışması", "image_text", "Solda görsel, sağda hedef, çözüm ve sonuç rakamları.", "hero-split",
    band({ backgroundColor: "#ffffff" }, [cols("6+6", [
      col([image(art("chart", "#2563eb", "#10b981"), "Vaka çalışması görseli", { aspectRatio: "3:2", shadow: "lg" })]),
      col([
        eyebrow("Vaka çalışması"),
        big("Stok sayım süresi üçte bire indi", "34px", "26px"),
        para("Çok depolu bir distribütör, barkodlu sayım ve ortak stok verisine geçerek aylık kapanışını günler öncesine çekti."),
        cols("4+4+4", [["-%68", "Sayım süresi"], ["%99,6", "Stok doğruluğu"], ["3 gün", "Daha erken kapanış"]].map(([v, l]) => col([para(v!, { style: { fontSize: "30px", fontWeight: "800", textColor: PRI } }), para(l!, { style: { fontSize: "13px" } })]))),
        button("Vakanın tamamını okuyun", "/tr/vakalar", "outline"),
      ]),
    ], { verticalAlign: "center" })], 80)),

  item("process_horizontal", "Süreç adımları (yatay)", "timeline", "Dört numaralı adım; her biri başlık ve kısa açıklama.", "howto-timeline",
    band({ backgroundColor: tint(5) }, [
      ...sectionHead("Süreç", "Dört adımda canlıya geçiş"),
      cols("3+3+3+3", [["1", "Keşif", "İhtiyacınızı ve mevcut süreci birlikte inceleriz."], ["2", "Kurulum", "Sistemi kurar, verilerinizi aktarırız."], ["3", "Eğitim", "Ekibinize uygulamalı eğitim veririz."], ["4", "Destek", "Canlıya geçişte ve sonrasında yanınızdayız."]].map(([k, t, s]) =>
        col([para(k!, { style: { borderRadius: "999px", backgroundColor: PRI, textColor: "#ffffff", fontWeight: "800", textAlign: "center", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "18px", paddingRight: "18px", maxWidth: "max-content", marginBottom: "12px" } }), heading(t!, "h3"), para(s!)]))),
    ], 72)),

  item("cert_row", "Güvence rozetleri", "logos", "Sertifika ve uyumluluk rozetleri. Adları kendi belgelerinizle değiştirin.", "stats-4",
    band({ backgroundColor: "#ffffff" }, [
      ...sectionHead("Güvence", "Verileriniz güvende, süreçleriniz uyumlu"),
      cols("3+3+3+3", [["shield", "ISO 27001", "Bilgi güvenliği yönetimi"], ["lock", "KVKK", "Kişisel veri uyumu"], ["badge-check", "e-Dönüşüm", "Özel entegratör uyumu"], ["award", "ISO 9001", "Kalite yönetimi"]].map(([icon, t, s]) =>
        col([n("single_icon", { icon, size: 36, color: "var(--nx-primary)", align: "center" }), heading(t!, "h3", { style: { textAlign: "center" } }), para(s!, { style: { textAlign: "center", fontSize: "13px" } })], cardStyle({ textAlign: "center" })))),
    ], 64)),

  item("sector_grid", "Sektör kartları", "cards", "Altı sektör için bilgi kartı; her biri ilgili sayfaya bağlanır.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [
      ...sectionHead("Sektörler", "Sektörünüze özel çözümler"),
      cols("4+4+4", [["store", "Perakende", "Mağaza ve e-ticaret satışını tek stokta birleştirin."], ["truck", "Dağıtım", "Depo, sevkiyat ve araç takibini yönetin."], ["building", "İnşaat", "Proje maliyeti ve hakedişi izleyin."]].map(([icon, t, s]) =>
        col([n("info_box", { icon, title: t, text: s, linkLabel: "Detayı gör", href: "/tr/hizmetler" })], cardStyle()))),
      cols("4+4+4", [["stethoscope", "Sağlık", "Hasta, randevu ve stok süreçleri tek ekranda."], ["coffee", "Restoran", "Adisyon, mutfak ve stok yönetimi."], ["wrench", "Üretim", "Reçete, iş emri ve planlama."]].map(([icon, t, s]) =>
        col([n("info_box", { icon, title: t, text: s, linkLabel: "Detayı gör", href: "/tr/hizmetler" })], cardStyle())), { gap: "24px" }),
    ], 72)),

  item("cta_contact", "İletişim çağrısı", "cta", "Koyu bantta sol çağrı, sağda telefon ve e-posta kartları.", "cta-strip",
    band({ backgroundGradient: DEEP, ...WHITE }, [cols("7+5", [
      col([big("Size özel bir çözüm planlayalım", "36px", "28px"), para("Bilgilerinizi bırakın, uzman ekibimiz aynı gün sizi arasın.", { style: { fontSize: "17px" } }), n("button_row", { align: "left", buttons: [{ label: "Tanıtım isteyin", href: "/tr/iletisim", variant: "primary" }] })]),
      col([
        box([n("info_box", { icon: "phone", title: "Telefon", text: "+90 212 000 00 00", href: "tel:+902120000000", linkLabel: "Hemen arayın" })], cardStyle({ backgroundColor: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.18)", textColor: "#f8fafc" })),
        box([n("info_box", { icon: "mail", title: "E-posta", text: "merhaba@ornek.com", href: "mailto:merhaba@ornek.com", linkLabel: "E-posta gönderin" })], cardStyle({ backgroundColor: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.18)", textColor: "#f8fafc", marginTop: "12px" })),
      ]),
    ], { verticalAlign: "center" })], 72)),

  item("news_band", "Haberler ve duyurular", "posts", "Son üç yazıyı kartlarla listeler; yeni yazı eklendikçe kendiliğinden güncellenir.", "bento-3",
    band({ backgroundColor: tint(5) }, [
      ...sectionHead("Haberler", "Güncel haberler ve duyurular"),
      n("dynamic_list", { source: "posts", limit: 3, orderBy: "newest", layout: "cards", columns: 3, showImage: true, showExcerpt: true, showDate: true }),
    ], 72)),

  item("values_dark", "Değerlerimiz (koyu)", "list", "Koyu zeminde dört değer; her biri simge, başlık ve kısa metin.", "bento-4",
    band({ backgroundColor: "var(--nx-secondary)", ...WHITE }, [
      ...sectionHead("Değerlerimiz", "Nasıl çalışıyoruz", undefined, true),
      n("icon_list", {
        columns: 2,
        items: [
          { icon: "handshake", title: "Dürüstlük", text: "Söz verdiğimizi, söylediğimiz sürede yaparız." },
          { icon: "shield", title: "Güven", text: "Verinizi kendi verimiz gibi koruruz." },
          { icon: "lightbulb", title: "Sadelik", text: "Karmaşık işi anlaşılır hale getiririz." },
          { icon: "users", title: "Ortaklık", text: "Satıştan sonra da yanınızdayız." },
        ],
      }),
    ], 72)),
];
