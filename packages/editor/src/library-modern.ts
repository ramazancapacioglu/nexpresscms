import type { BlockNode } from "@nexpress/core";
import type { DesignLibraryItem } from "./library-types";
import { GRAD, art, avatar, band, box, button, cardStyle, col, cols, heading, image, itemFactory, n, para } from "./library-kit";

/**
 * Modern görsel bölümler: degrade bantlar, cam kartlar, mozaik, kayan şeritler, zaman çizgisi.
 * Hepsi mevcut bloklardan kurulur (0 KB ön yüz), görseller satır içi SVG'dir ve her temada çalışır.
 * Koyu bantlarda metin rengi kapsayıcıdan kalıtılır (`textColor`).
 */
const item = itemFactory("lib_mod_", "Modern");

const WHITE = { textColor: "#f8fafc" } as const;
const pill = (text: string, tone = "rgba(255,255,255,.12)") =>
  para(text, { style: { backgroundColor: tone, borderRadius: "999px", borderWidth: "1px", borderColor: "rgba(255,255,255,.25)", paddingTop: "4px", paddingBottom: "4px", paddingLeft: "14px", paddingRight: "14px", fontSize: "12px", maxWidth: "max-content", letterSpacing: "0.08em", textTransform: "uppercase" } });
const big = (text: string, size = "52px", mobile = "32px", extra: NonNullable<BlockNode["style"]> = {}) =>
  heading(text, "h2", { style: { fontSize: size, fontWeight: "800", lineHeight: "1.08", letterSpacing: "-0.03em", mobile: { fontSize: mobile }, ...extra } });
const person = (name: string, role: string, a: string, b: string) =>
  col([image(avatar(a, b), name, { aspectRatio: "1:1", borderRadius: "full", maxWidth: "88px", align: "center" }), heading(name, "h3", { style: { textAlign: "center" } }), para(role, { style: { textAlign: "center" } })], cardStyle({ textAlign: "center" }));

export const MODERN_LIBRARY_ITEMS: DesignLibraryItem[] = [
  item("aurora_hero", "Aurora vitrin (degrade + panel görseli)", "hero", "Gece mavisi degrade, rozet, iri başlık, iki düğme ve sağda yüzen panel görseli.", "hero-split",
    band({ backgroundGradient: GRAD.night, ...WHITE }, [cols("6+6", [
      col([pill("Yeni nesil platform"), big("İşinizi tek ekrandan, hızla yönetin"), para("Satıştan stoğa, raporlamadan müşteri ilişkilerine tüm süreçler aynı panelde. Kurulum yok, karmaşa yok."),
        n("button_row", { align: "left", buttons: [{ label: "Ücretsiz deneyin", href: "/tr/iletisim", variant: "primary" }, { label: "Demoyu izleyin", href: "/tr/demo", variant: "outline" }] })]),
      col([image(art("dashboard", "#6366f1", "#22d3ee"), "Yönetim paneli", { aspectRatio: "3:2", shadow: "xl" }, { animation: "fade-left", translateY: "-6px" })]),
    ], { verticalAlign: "center" })], 96)),
  item("mesh_hero", "Ortalı mesh vitrin", "hero", "Ortalı başlık, rozet, düğmeler ve altında büyük ürün görseli. Açılış sayfaları için.", "hero-centered",
    band({ backgroundGradient: GRAD.sunset, ...WHITE, textAlign: "center" }, [
      pill("Haziran sürümü yayında"), big("Fikrinizi canlı ürüne dönüştürün", "56px", "34px", { textAlign: "center", marginLeft: "auto", marginRight: "auto" }),
      para("Hazır bileşenler, güçlü altyapı ve yalın arayüz. İlk sürümünüzü bir günde yayınlayın.", { style: { maxWidth: "640px", marginLeft: "auto", marginRight: "auto", textAlign: "center" } }),
      n("button_row", { align: "center", buttons: [{ label: "Hemen başlayın", href: "/tr/iletisim", variant: "primary" }, { label: "Fiyatları gör", href: "/tr/fiyatlandirma", variant: "outline" }] }),
      image(art("chart", "#7c3aed", "#f97316"), "Analitik paneli", { aspectRatio: "3:2", shadow: "xl", maxWidth: "860px", align: "center" }, { marginTop: "32px", animation: "fade-up" }),
    ], 104)),
  item("cover_overlay", "Görsel kapaklı çağrı", "hero", "Tam genişlik görsel zemin, karartma katmanı ve ortalı metin.", "hero-centered",
    band({ backgroundImage: art("globe", "#0ea5e9", "#6366f1"), backgroundOverlay: "rgba(8,12,32,.62)", ...WHITE, textAlign: "center" }, [
      big("Dünyanın her yerinden erişin", "46px", "30px", { textAlign: "center" }), para("Bulut altyapısı ve yedekli veri merkezleri ile kesintisiz hizmet.", { style: { textAlign: "center" } }), button("Detaylı bilgi", "/tr/iletisim", "primary", "center"),
    ], 120), "Görselli"),
  item("announce_pill", "Duyuru kapsülü", "layout", "Sayfa üstünde tek satırlık yeni özellik duyurusu.", "cta-strip",
    band({ backgroundColor: "#eef2ff", textAlign: "center", textColor: "#3730a3" }, [para("Yeni: Çoklu şube raporları yayında →", { style: { fontWeight: "600", textAlign: "center" } })], 14)),
  item("logo_cloud", "Güvenen markalar (kayan logo şeridi)", "social", "Marka adlarının sonsuz kayan şeridi. Adları kendi müşterilerinizle değiştirin.", "stats-4",
    band({ backgroundColor: "#ffffff" }, [para("Binlerce ekibin tercihi", { style: { textAlign: "center", fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase" } }),
      n("marquee", { items: ["ACME", "NORDIC", "BLUEWAVE", "PIXELFORM", "ORBIT", "LUMEN", "KARDELEN", "ATLAS"], speed: 40, direction: "left" }, { style: { fontSize: "28px", fontWeight: "800", textColor: "#94a3b8" } })], 48), "Sosyal kanıt"),
  item("testimonials", "Müşteri yorumları (3 kart)", "social", "Alıntı, ad ve unvan içeren üç kart. Metinler örnektir; gerçek yorumlarla değiştirin.", "bento-3",
    band({ backgroundGradient: GRAD.soft }, [heading("Müşterilerimiz ne diyor?", "h2", { style: { textAlign: "center" } }),
      cols("4+4+4", ["Kurulum bir günde bitti, ekip hemen alıştı.|Aylin K.|Operasyon Müdürü", "Raporlar artık dakikalar içinde hazır.|Mert D.|Finans Direktörü", "Destek ekibi her seferinde çok hızlı döndü.|Selin T.|Kurucu"].map((s, i) => {
        const [q, name, role] = s.split("|") as [string, string, string];
        return col([para("★★★★★", { style: { textColor: "#f59e0b", letterSpacing: "0.2em" } }), n("quote", { text: q, author: name, role })], cardStyle({ animation: "fade-up", transitionMs: 200 + i * 120 }));
      }))])),
  item("quote_spotlight", "Öne çıkan alıntı", "social", "Solda avatar, sağda büyük alıntı ve imza.", "prose-section",
    band({ backgroundColor: "#0f172a", ...WHITE }, [cols("3+6+3", [col([]), col([para("“", { style: { fontSize: "72px", lineHeight: "1", textColor: "#818cf8" } }), heading("Geçişten sonra raporlama süremiz yarıya indi. Ekibimiz artık veriye değil karara odaklanıyor.", "h3", { style: { fontSize: "28px", lineHeight: "1.35", mobile: { fontSize: "22px" } } }), para("Deniz A. — Genel Müdür")]), col([image(avatar("#818cf8", "#f472b6"), "Müşteri", { aspectRatio: "1:1", borderRadius: "full", maxWidth: "140px" })])], { verticalAlign: "center" })], 80)),
  item("team_grid", "Ekip kartları (4'lü)", "social", "Avatar, ad ve unvan; ortalı dört kart.", "bento-4",
    band({ backgroundColor: "#ffffff" }, [heading("Ekibimiz", "h2", { style: { textAlign: "center" } }), cols("3+3+3+3", [person("Ad Soyad", "Kurucu", "#6366f1", "#ec4899"), person("Ad Soyad", "Teknoloji", "#0ea5e9", "#22c55e"), person("Ad Soyad", "Tasarım", "#f97316", "#eab308"), person("Ad Soyad", "Müşteri başarısı", "#14b8a6", "#6366f1")])])),
  item("bento_visual", "Görselli bento ızgara", "bento", "Büyük ana kart ve yanında iki küçük kart; altında üç özellik kartı. Degrade ve görsel karışık.", "bento-4",
    band({ backgroundColor: "#f8fafc" }, [
      cols("8+4", [
        col([para("Öne çıkan", { style: { fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase" } }), heading("Tek panelde tüm operasyon", "h3", { style: { fontSize: "30px" } }), image(art("dashboard", "#4f46e5", "#06b6d4"), "Panel", { aspectRatio: "3:2" })], { backgroundGradient: GRAD.night, textColor: "#f8fafc", borderRadius: "28px", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px" }),
        col([box([heading("Mobil uyumlu", "h3"), image(art("phone", "#ec4899", "#8b5cf6"), "Mobil", { aspectRatio: "3:2" })], cardStyle()), box([heading("Bulut yedek", "h3"), para("Verileriniz her gün şifreli yedeklenir.")], cardStyle({ backgroundGradient: GRAD.ocean, textColor: "#fff", borderWidth: "0px" }))]),
      ], { verticalAlign: "stretch" }),
      cols("4+4+4", [["Hızlı kurulum", "Dakikalar içinde hazır."], ["Güvenli", "Rol bazlı yetki ve kayıt."], ["Entegre", "Mevcut araçlarla bağlanır."]].map(([t, s]) => col([heading(t!, "h3"), para(s!)], cardStyle()))),
    ], 72), "Bento"),
  item("gradient_icons", "Degrade ikonlu özellik kartları (3×2)", "cards", "Renkli ikon rozetli altı kart; hover'da yükselir.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [heading("Neden bizi seçmelisiniz?", "h2", { style: { textAlign: "center" } }),
      cols("4+4+4", [["zap", "Hızlı", "Sayfalar anında açılır.", "#6366f1"], ["shield", "Güvenli", "Verileriniz şifreli.", "#10b981"], ["chart", "Ölçülebilir", "Her adım raporlanır.", "#f59e0b"]].map(([ic, t, s, c]) => col([n("single_icon", { icon: ic, size: 28, color: "#ffffff", background: c, align: "left" }), heading(t!, "h3"), para(s!)], cardStyle()))),
      cols("4+4+4", [["users", "İş birliği", "Ekip içi paylaşım.", "#ec4899"], ["cloud", "Bulut", "Her yerden erişim.", "#0ea5e9"], ["headphones", "Destek", "Hızlı yanıt.", "#8b5cf6"]].map(([ic, t, s, c]) => col([n("single_icon", { icon: ic, size: 28, color: "#ffffff", background: c, align: "left" }), heading(t!, "h3"), para(s!)], cardStyle()))),
    ], 80)),
  item("alt_rows", "Dönüşümlü görsel-metin satırları", "layout", "İki satır: görsel solda/sağda dönüşümlü. Telefonda görsel üstte.", "columns",
    band({ backgroundColor: "#ffffff" }, [
      cols("6+6", [col([image(art("chart", "#4f46e5", "#22d3ee"), "Raporlama", { aspectRatio: "3:2" })]), col([heading("Anlık raporlama"), para("Satış, stok ve finans verileri tek ekranda. Filtreleyin, paylaşın, dışa aktarın."), button("Özelliği keşfet", "/tr/ozellikler", "outline")])], { verticalAlign: "center" }),
      cols("6+6", [col([heading("Her cihazda çalışır"), para("Telefon, tablet ve bilgisayarda aynı deneyim. Saha ekibiniz de bağlı kalır."), button("Mobil uygulama", "/tr/mobil", "outline")]), col([image(art("phone", "#f97316", "#ec4899"), "Mobil uygulama", { aspectRatio: "3:2" })])], { verticalAlign: "center", mobileReverse: true }),
    ], 72)),
  item("device_showcase", "Telefon vitrini", "media", "Solda madde işaretli liste, sağda telefon çizimi.", "columns",
    band({ backgroundGradient: GRAD.soft }, [cols("6+6", [
      col([heading("Cebinizdeki tüm iş"), para("Onayları, siparişleri ve raporları hareket halindeyken yönetin."), n("icon_list", { items: [{ icon: "check-circle", title: "Anlık bildirim", text: "Onay bekleyen işler cebinize düşer." }, { icon: "check-circle", title: "Çevrimdışı mod", text: "Bağlantı gelince eşitlenir." }, { icon: "check-circle", title: "Parmak izi girişi", text: "Güvenli ve hızlı." }] })]),
      col([image(art("phone", "#6366f1", "#06b6d4"), "Telefon uygulaması", { aspectRatio: "3:2" })]),
    ], { verticalAlign: "center" })])),
  item("process_steps", "Numaralı süreç (4 adım)", "layout", "Büyük rakamlı dört adım kartı; yatay akış.", "howto-timeline",
    band({ backgroundColor: "#0f172a", ...WHITE }, [heading("Dört adımda başlayın", "h2", { style: { textAlign: "center" } }),
      cols("3+3+3+3", [["01", "Kayıt olun", "Formu doldurun."], ["02", "Verileri aktarın", "Tablodan içe aktarın."], ["03", "Ekibi davet edin", "Rolleri atayın."], ["04", "Yayına alın", "Kullanmaya başlayın."]].map(([no, t, s]) => col([heading(no!, "h3", { style: { fontSize: "44px", fontWeight: "800", textColor: "#818cf8" } }), heading(t!, "h3"), para(s!)], { borderWidth: "1px", borderColor: "rgba(255,255,255,.14)", borderRadius: "20px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", backgroundColor: "rgba(255,255,255,.04)", hover: { translateY: "-4px", borderColor: "#818cf8" } }))),
    ], 80)),
  item("before_after", "Önce / Sonra karşılaştırması", "data", "İki sütun: eski düzenin sorunları ve yeni düzenin kazanımları.", "columns",
    band({ backgroundColor: "#ffffff" }, [heading("Farkı görün", "h2", { style: { textAlign: "center" } }), cols("6+6", [
      col([heading("Önce", "h3"), n("icon_list", { items: [{ icon: "alert-triangle", title: "Dağınık tablolar", text: "Her ekip kendi dosyasında." }, { icon: "clock", title: "Geç raporlar", text: "Günler süren derleme." }] })], cardStyle({ backgroundColor: "#fef2f2", borderColor: "#fecaca" })),
      col([heading("Sonra", "h3"), n("icon_list", { items: [{ icon: "check-circle", title: "Tek kaynak", text: "Herkes aynı veriyle çalışır." }, { icon: "zap", title: "Anlık raporlar", text: "Saniyeler içinde hazır." }] })], cardStyle({ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" })),
    ])], 72)),
  item("stat_cards", "Degrade sayaç kartları", "data", "Dört büyük sayı; degrade yazı. Sayıları kendi verinizle değiştirin.", "stats-4",
    band({ backgroundColor: "#f8fafc" }, [cols("3+3+3+3", [["120+", "Ülke"], ["4,9/5", "Memnuniyet"], ["99,9%", "Çalışma süresi"], ["24/7", "Destek"]].map(([v, l]) => col([heading(v!, "h3", { style: { fontSize: "44px", fontWeight: "800", textColor: "#4f46e5", textAlign: "center" } }), para(l!, { style: { textAlign: "center" } })], cardStyle({ textAlign: "center" }))))], 64), "Veri"),
  item("faq_split", "Sabit başlıklı SSS (4+8)", "text", "Solda başlık ve iletişim düğmesi, sağda akordeon.", "faq-list",
    band({ backgroundColor: "#ffffff" }, [cols("4+8", [col([heading("Sık sorulan sorular"), para("Aradığınızı bulamadınız mı? Ekibimiz yardımcı olur."), button("Bize yazın", "/tr/iletisim", "primary")]), col([n("accordion", { title: "", items: [{ question: "Deneme süresi var mı?", answer: "Evet, 14 gün ücretsiz deneyebilirsiniz." }, { question: "Verilerimi taşıyabilir miyim?", answer: "Tablo dosyalarından içe aktarma desteklenir." }, { question: "Destek nasıl işliyor?", answer: "Telefon ve canlı görüşme ile hafta içi her gün." }] })])])], 72)),
  item("pricing_cards", "Öne çıkan planlı fiyat kartları", "commerce", "Orta kart degradeli ve 'Popüler' etiketli. Fiyatlar yer tutucudur.", "pricing-3",
    band({ backgroundGradient: GRAD.soft }, [heading("Size uygun planı seçin", "h2", { style: { textAlign: "center" } }), cols("4+4+4", [
      col([heading("Başlangıç", "h3"), heading("₺ —", "h3", { style: { fontSize: "36px", fontWeight: "800" } }), n("icon_list", { items: [{ icon: "check", title: "1 kullanıcı", text: "" }, { icon: "check", title: "Temel raporlar", text: "" }] }), button("Seç", "/tr/iletisim", "outline")], cardStyle()),
      col([para("Popüler", { style: { backgroundColor: "#fde68a", textColor: "#78350f", borderRadius: "999px", maxWidth: "max-content", paddingLeft: "12px", paddingRight: "12px", fontSize: "12px", fontWeight: "700" } }), heading("Profesyonel", "h3"), heading("₺ —", "h3", { style: { fontSize: "36px", fontWeight: "800" } }), para("✓ 10 kullanıcı"), para("✓ Gelişmiş raporlar"), button("Seç", "/tr/iletisim", "primary")], cardStyle({ backgroundGradient: GRAD.night, textColor: "#f8fafc", borderWidth: "0px", scale: 1.03, boxShadow: "xl" })),
      col([heading("Kurumsal", "h3"), heading("Teklif alın", "h3", { style: { fontSize: "28px", fontWeight: "800" } }), n("icon_list", { items: [{ icon: "check", title: "Sınırsız kullanıcı", text: "" }, { icon: "check", title: "Özel entegrasyon", text: "" }] }), button("İletişime geç", "/tr/iletisim", "outline")], cardStyle()),
    ], { verticalAlign: "stretch" })], 80)),
  item("mosaic", "Mozaik görsel galeri", "media", "Farklı oranlı üç sütunlu görsel mozaiği; hover'da yakınlaşır.", "gallery",
    band({ backgroundColor: "#ffffff" }, [cols("4+4+4", [
      col([image(art("grid", "#6366f1", "#ec4899"), "Çalışma 1", { aspectRatio: "4:3" }, { hover: { scale: 1.03 } }), image(art("globe", "#0ea5e9", "#22c55e"), "Çalışma 2", { aspectRatio: "1:1" })]),
      col([image(art("people", "#f97316", "#ec4899"), "Çalışma 3", { aspectRatio: "1:1" }), image(art("chart", "#7c3aed", "#06b6d4"), "Çalışma 4", { aspectRatio: "4:3" }, { hover: { scale: 1.03 } })]),
      col([image(art("cloud", "#0ea5e9", "#6366f1"), "Çalışma 5", { aspectRatio: "3:2" }), image(art("doc", "#10b981", "#0ea5e9"), "Çalışma 6", { aspectRatio: "3:2" })]),
    ])], 64), "Medya"),
  item("cta_gradient", "Degrade çağrı bandı (görselli)", "hero", "Solda başlık ve düğme, sağda çizim; sayfa sonu için.", "cta-strip",
    band({ backgroundGradient: GRAD.ocean, ...WHITE }, [cols("7+5", [col([big("Hazırsanız başlayalım", "40px", "28px"), para("Bilgilerinizi bırakın, size özel demo hazırlayalım."), n("button_row", { align: "left", buttons: [{ label: "Demo talep edin", href: "/tr/iletisim", variant: "primary" }, { label: "Satışla görüşün", href: "/tr/iletisim", variant: "outline" }] })]), col([image(art("people", "#38bdf8", "#6366f1"), "Ekip", { aspectRatio: "3:2" })])], { verticalAlign: "center" })], 72), "Dönüşüm"),
];
