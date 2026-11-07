import type { BlockNode } from "@nexpress/core";
import type { DesignLibraryItem } from "./library-types";
import { GRAD, art, avatar, band, box, button, cardStyle, col, cols, heading, image, itemFactory, n, para } from "./library-kit";

/**
 * Yeni nesil, birbirinden farklı bölümler: arama vitrini, tarayıcı çerçeveli ürün, numaralı kartlar, tweet tarzı yorumlar,
 * yol haritası, sürüm notları, artı/eksi, kupon, polaroid galeri, çakışan görsel, 2 sütunlu akordeon ve daha fazlası.
 */
const item = itemFactory("lib_fr_", "Yeni");
const C = { textAlign: "center" } as const;
const H = (t: string, level = "h2", style: NonNullable<BlockNode["style"]> = {}) => heading(t, level, { style });
const big = (t: string, size = 56) => H(t, "h2", { fontSize: `${size}px`, fontWeight: "800", lineHeight: "1.05", letterSpacing: "-0.03em", mobile: { fontSize: `${Math.round(size * 0.6)}px` } });
const soft = (a: string): NonNullable<BlockNode["style"]> => ({ backgroundColor: a, borderRadius: "24px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px" });
const num = (v: string, title: string, text: string) => col([H(v, "h2", { fontSize: "64px", fontWeight: "900", opacity: 0.18, lineHeight: "1" }), H(title, "h3"), para(text)], cardStyle());
const tweet = (name: string, handle: string, text: string, a: string, b: string) =>
  col([cols("2+10", [col([image(avatar(a, b), name, { aspectRatio: "1:1", borderRadius: "full" })]), col([H(name, "h5"), para(handle, { style: { opacity: 0.55, fontSize: "13px" } })])], { verticalAlign: "center", stackAt: "mobile" }), para(text)], cardStyle({ borderRadius: "16px" }));
const milestone = (when: string, title: string, text: string) => col([para(when, { style: { fontWeight: "800", textColor: "#6366f1", fontSize: "13px" } }), H(title, "h4"), para(text, { style: { opacity: 0.75, fontSize: "14px" } })], { borderWidth: "3px 0 0 0", borderColor: "#6366f1", borderStyle: "solid", paddingTop: "16px" });
const log = (v: string, date: string, text: string) => cols("2+10", [col([H(v, "h4"), para(date, { style: { opacity: 0.55, fontSize: "13px" } })]), col([para(text)])], { stackAt: "mobile" });

export const FRESH_LIBRARY_ITEMS: DesignLibraryItem[] = [
  item("search_hero", "Arama vitrini", "hero", "Dev başlık, ortada arama kutusu ve popüler konu çipleri; yardım merkezi ve katalog için.", "hero-centered",
    band({ background: GRAD.soft }, [big("Ne arıyorsunuz?", 60), para("Yüzlerce rehber ve yanıt tek aramada.", { style: { ...C, fontSize: "18px" } }), box([n("search_box", { placeholder: "Konu, ürün veya soru yazın", action: "/tr" })], { maxWidth: "620px", marginLeft: "auto", marginRight: "auto" }), para("Popüler: kurulum · fatura · entegrasyon · iade", { style: { ...C, opacity: 0.6, fontSize: "14px" } })], 104)),
  item("browser_hero", "Tarayıcı çerçeveli vitrin", "hero", "Solda mesaj, sağda tarayıcı penceresi içinde ürün ekranı.", "hero-split",
    band({ backgroundColor: "#0f172a", textColor: "#f8fafc" }, [cols("5+7", [col([big("Panelinizi dakikalar içinde kurun", 48), para("Kod yazmadan, sürükle-bırak."), button("Ücretsiz deneyin", "/tr/iletisim")]), col([image(art("dashboard", "#6366f1", "#22d3ee"), "Panel", { aspectRatio: "3:2", borderRadius: "xl" })], { boxShadow: "xl", rotate: "-2deg" })], { verticalAlign: "center" })], 96)),
  item("split_color", "İkiye bölünmüş vitrin", "hero", "Yarısı koyu, yarısı açık iki zıt panel; iki hedef kitle için.", "hero-split",
    band({ backgroundColor: "#ffffff" }, [cols("6+6", [
      col([H("Bireyseler için", "h2"), para("Hızlı kurulum, sade fiyat."), button("Başlayın", "/tr/iletisim")], { background: GRAD.sunset, textColor: "#ffffff", ...soft("#7c3aed"), paddingTop: "72px", paddingBottom: "72px" }),
      col([H("Kurumlar için", "h2"), para("Özel kurulum, 7/24 destek."), button("Teklif alın", "/tr/iletisim", "outline")], { ...soft("#f1f5f9"), paddingTop: "72px", paddingBottom: "72px" }),
    ])], 56)),
  item("numbered_cards", "Numaralı büyük kartlar", "cards", "Soluk dev numaralı üç kart; adım ve ilke anlatımı.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [H("Üç ilkemiz", "h2", C), cols("4+4+4", [num("01", "Sadelik", "Gereksiz her şeyi çıkarırız."), num("02", "Hız", "Her sayfa saniyeden hızlı açılır."), num("03", "Güven", "Verileriniz sizde kalır.")])], 72)),
  item("pastel_cards", "Pastel özellik kartları", "cards", "Kenarlıksız, yumuşak renkli dört kart; her biri ayrı ton.", "bento-4",
    band({ backgroundColor: "#ffffff" }, [cols("3+3+3+3", [
      col([H("Hızlı", "h4"), para("Anında yüklenir.")], soft("#e0e7ff")), col([H("Güvenli", "h4"), para("Şifreli saklama.")], soft("#dcfce7")),
      col([H("Esnek", "h4"), para("Her akışa uyar.")], soft("#fef3c7")), col([H("Açık", "h4"), para("API ve webhook.")], soft("#fce7f3")),
    ])], 64)),
  item("stagger_cards", "Kademeli kartlar", "cards", "Üç kart farklı yüksekliklerde, merdiven görünümünde.", "bento-3",
    band({ background: GRAD.soft }, [cols("4+4+4", [
      col([H("Planla", "h3"), para("Hedefi belirle.")], { ...cardStyle(), marginTop: "0px" }),
      col([H("Üret", "h3"), para("İçeriği hazırla.")], { ...cardStyle(), marginTop: "40px" }),
      col([H("Yayınla", "h3"), para("Tek tıkla canlıya.")], { ...cardStyle(), marginTop: "80px" }),
    ], { verticalAlign: "top" })], 72)),
  item("tweet_wall", "Kısa yorum kartları", "testimonials", "Sosyal medya gönderisi tarzı küçük yorumlar; avatar, kullanıcı adı ve metin.", "bento-3",
    band({ backgroundColor: "#f8fafc" }, [H("Sevgi dolu geri bildirimler", "h2", C), cols("4+4+4", [
      tweet("Deniz A.", "@denizadam", "Kurulum 10 dakika sürdü. İnanılmaz.", "#0ea5e9", "#6366f1"),
      tweet("Kerem T.", "@keremt", "Sonunda hızlı bir sitem var.", "#f97316", "#ec4899"),
      tweet("Ece S.", "@eceyazar", "Destek ekibi harika, tavsiye ederim.", "#10b981", "#0ea5e9"),
    ])], 72)),
  item("rating_banner", "Puan bandı", "testimonials", "Büyük 4,9 puan, yıldızlar ve değerlendirme sayısı.", "stats-4",
    band({ backgroundColor: "#fffbeb" }, [cols("4+8", [col([H("4,9", "h2", { fontSize: "88px", fontWeight: "900", lineHeight: "1", textColor: "#b45309" }), para("★★★★★", { style: { fontSize: "28px", textColor: "#f59e0b" } })], { textAlign: "center" }), col([H("12.480 değerlendirmeden", "h3"), para("Kullanıcılarımızın %96'sı bizi arkadaşına önerir.")])], { verticalAlign: "center" })], 64)),
  item("ring_stat", "Tek büyük rakam", "stats", "Ekranı dolduran tek sayaç ve yanında üç destekleyici madde.", "stats-4",
    band({ background: GRAD.night, textColor: "#f8fafc" }, [cols("5+7", [col([n("countup", { value: 99, suffix: "%", label: "Memnuniyet", duration: 2, align: "center" })]), col([H("Neden bu kadar yüksek?", "h3"), n("icon_list", { items: [{ icon: "check-circle", title: "Hızlı yanıt", text: "" }, { icon: "check-circle", title: "Kolay kullanım", text: "" }, { icon: "check-circle", title: "Şeffaf fiyat", text: "" }] })])], { verticalAlign: "center" })], 80)),
  item("roadmap", "Yol haritası", "timeline", "Dört çeyrek, üstte renkli çizgi; hedefleri yan yana gösterir.", "howto-timeline",
    band({ backgroundColor: "#ffffff" }, [H("2026 yol haritası", "h2", C), cols("3+3+3+3", [milestone("1. ÇEYREK", "Temel", "Altyapı yenilenir."), milestone("2. ÇEYREK", "Mobil", "Mobil uygulama çıkar."), milestone("3. ÇEYREK", "Entegrasyon", "Yeni bağlantılar."), milestone("4. ÇEYREK", "Yapay zekâ", "Akıllı öneriler.")])], 72)),
  item("changelog", "Sürüm notları", "timeline", "Sürüm numarası ve tarih solda, değişiklik özeti sağda.", "faq-list",
    band({ backgroundColor: "#ffffff" }, [H("Neler yeni?", "h2"), log("v2.4", "12 Kas 2026", "Yeni rapor ekranı ve hızlı arama."), log("v2.3", "20 Eki 2026", "Çoklu dil desteği ve hata düzeltmeleri."), log("v2.2", "02 Eki 2026", "Form şablonları ve e-posta bildirimleri.")], 64)),
  item("coupon_cta", "Kupon çağrısı", "cta", "Kesikli çerçeveli kupon kodu ve düğme; kampanya duyurusu.", "cta-strip",
    band({ backgroundColor: "#fff7ed" }, [box([H("İlk siparişte %20 indirim", "h2", C), para("Kodu sepette girin:", { style: C }), H("HOSGELDIN20", "h3", { ...C, letterSpacing: "0.15em", borderStyle: "dashed", borderWidth: "2px", borderColor: "#f97316", borderRadius: "12px", paddingTop: "12px", paddingBottom: "12px", maxWidth: "340px", marginLeft: "auto", marginRight: "auto" }), button("Alışverişe başla", "/tr/urunler", "primary", "center")], { maxWidth: "640px", marginLeft: "auto", marginRight: "auto" })], 64)),
  item("question_cta", "Soru + telefon çağrısı", "cta", "Solda kısa soru, sağda telefon numarası ve geri arama düğmesi.", "cta-strip",
    band({ background: GRAD.ocean, textColor: "#ffffff" }, [cols("7+5", [col([H("Karar vermekte mi zorlanıyorsunuz?", "h2"), para("Uzmanlarımız ücretsiz yönlendirsin.")]), col([H("0850 000 00 00", "h3"), button("Sizi arayalım", "/tr/iletisim", "outline")])], { verticalAlign: "center" })], 56)),
  item("join_team", "Ekibe katıl bandı", "people", "Açık pozisyonlar ve ‘Başvur’ düğmesi; avatarlı yığın görünümü.", "cta-strip",
    band({ backgroundColor: "#f8fafc" }, [cols("7+5", [col([H("Ekibimize katılın", "h2"), para("3 açık pozisyon: yazılım, tasarım, müşteri başarısı.")]), col([button("Pozisyonlara bak", "/tr/kariyer")])], { verticalAlign: "center" })], 56)),
  item("social_people", "Sosyal bağlantılı kişiler", "people", "Avatar, görev ve bağlantı düğmeleri; iki sütun.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [H("Bizimle tanışın", "h2", C), cols("6+6", [
      col([cols("3+9", [col([image(avatar("#6366f1", "#ec4899"), "Ayşe", { aspectRatio: "1:1", borderRadius: "full" })]), col([H("Ayşe Demir", "h4"), para("Ürün lideri"), button("LinkedIn", "https://linkedin.com", "outline")])], { stackAt: "mobile" })], cardStyle()),
      col([cols("3+9", [col([image(avatar("#0ea5e9", "#10b981"), "Mehmet", { aspectRatio: "1:1", borderRadius: "full" })]), col([H("Mehmet Kaya", "h4"), para("Teknik lider"), button("LinkedIn", "https://linkedin.com", "outline")])], { stackAt: "mobile" })], cardStyle()),
    ])], 72)),
  item("sale_product", "İndirimli ürün", "product", "Rozetli ürün: eski fiyat üstü çizili, yeni fiyat iri, kalan adet notu.", "product-card",
    band({ backgroundColor: "#ffffff" }, [cols("5+7", [col([image(art("phone", "#ef4444", "#f97316"), "Ürün", { aspectRatio: "4:3" })]), col([para("%30 İNDİRİM", { style: { fontWeight: "800", textColor: "#ef4444", fontSize: "13px" } }), H("Akıllı Saat X2", "h2"), para("₺4.990  →  ₺3.490", { style: { fontSize: "22px", fontWeight: "700" } }), para("Son 12 adet kaldı."), button("Hemen al", "/tr/sepet")])], { verticalAlign: "center" })], 64)),
  item("box_contents", "Kutuda neler var?", "product", "Ürün görseli ortada, çevresinde içerik maddeleri.", "product-card",
    band({ background: GRAD.soft }, [H("Kutuda neler var?", "h2", C), cols("4+4+4", [col([H("Cihaz", "h4", C), para("Ana ünite", { style: C })], cardStyle()), col([image(art("phone", "#6366f1", "#06b6d4"), "Ürün", { aspectRatio: "1:1" })]), col([H("Aksesuarlar", "h4", C), para("Kablo ve şarj aleti", { style: C })], cardStyle())], { verticalAlign: "center" })], 72)),
  item("single_plan", "Tek plan, her şey dahil", "pricing", "Geniş tek fiyat kartı; sağda özellik ızgarası.", "pricing-3",
    band({ backgroundColor: "#ffffff" }, [box([cols("5+7", [col([H("Her şey dahil", "h3"), H("₺790", "h2", { fontSize: "56px", fontWeight: "900" }), para("aylık, sınırsız kullanıcı"), button("Hemen başlayın", "/tr/iletisim")]), col([n("icon_list", { items: [{ icon: "check-circle", title: "Sınırsız sayfa", text: "" }, { icon: "check-circle", title: "Tüm entegrasyonlar", text: "" }, { icon: "check-circle", title: "Öncelikli destek", text: "" }, { icon: "check-circle", title: "Günlük yedek", text: "" }] })])], { verticalAlign: "center" })], cardStyle({ maxWidth: "900px", marginLeft: "auto", marginRight: "auto", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", boxShadow: "lg" }))], 72)),
  item("pros_cons", "Artılar ve eksiler", "comparison", "Yeşil ve kırmızı iki kolon; dürüst değerlendirme.", "bento-4",
    band({ backgroundColor: "#ffffff" }, [cols("6+6", [
      col([H("Artıları", "h3"), para("✓ Hızlı kurulum\n✓ Sade arayüz\n✓ Uygun fiyat")], soft("#dcfce7")),
      col([H("Eksileri", "h3"), para("✗ Sınırlı şablon\n✗ Çevrimdışı mod yok")], soft("#fee2e2")),
    ])], 64)),
  item("vs_cards", "Biz ve diğerleri", "comparison", "İki kart yan yana: ‘Biz’ vurgulu, ‘Diğerleri’ sönük.", "bento-4",
    band({ backgroundColor: "#f8fafc" }, [cols("6+6", [
      col([H("Biz", "h3"), para("✓ Sabit fiyat\n✓ 7/24 destek\n✓ Ücretsiz taşıma")], cardStyle({ borderColor: "#6366f1", borderWidth: "2px", boxShadow: "lg" })),
      col([H("Diğerleri", "h3"), para("✗ Gizli ücret\n✗ Mesai saati destek\n✗ Taşıma ücretli")], cardStyle({ opacity: 0.7 })),
    ])], 64)),
  item("polaroid", "Polaroid galeri", "gallery", "Beyaz çerçeveli, hafif eğik üç fotoğraf; anı ve etkinlik sayfası için.", "gallery",
    band({ backgroundColor: "#fef3c7" }, [H("Anılarımız", "h2", C), cols("4+4+4", [1, 2, 3].map((i) => col([image(art("people", i === 2 ? "#f97316" : "#6366f1", "#ec4899"), `Fotoğraf ${i}`, { aspectRatio: "1:1", borderRadius: "none" }), para(`Etkinlik ${i}`, { style: C })], { backgroundColor: "#ffffff", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "14px", paddingRight: "14px", boxShadow: "lg", rotate: `${(i - 2) * 3}deg` })))], 72)),
  item("overlap_media", "Çakışan görsel ve kart", "image_text", "Büyük görselin üstüne taşan beyaz metin kartı.", "hero-split",
    band({ backgroundColor: "#ffffff" }, [cols("7+5", [col([image(art("globe", "#0ea5e9", "#6366f1"), "Görsel", { aspectRatio: "4:3", borderRadius: "xl" })]), col([H("Dünyayla bağlanın", "h2"), para("Her şubenizi aynı ekrandan yönetin."), button("Daha fazla", "/tr/hizmetler")], cardStyle({ marginLeft: "-80px", boxShadow: "xl", mobile: { marginLeft: "0px" } }))], { verticalAlign: "center" })], 72)),
  item("video_chapters", "Bölümlü video", "video_text", "Video kapağı ve yanında bölüm listesi (süreleriyle).", "media",
    band({ backgroundColor: "#0f172a", textColor: "#f8fafc" }, [cols("7+5", [col([n("video_popup", { title: "Eğitim serisi", url: "https://example.com/video" })]), col([H("Bu videoda", "h3"), para("00:00  Giriş\n02:10  Kurulum\n06:45  İlk sayfa\n11:30  Yayınlama")])], { verticalAlign: "center" })], 72)),
  item("acc_two_col", "İki sütunlu akordeon", "accordion", "Sorular iki sütuna bölünür; kısa SSS’lerde yer kazandırır.", "faq-list",
    band({ backgroundColor: "#ffffff" }, [H("Sık sorulanlar", "h2", C), cols("6+6", [
      col([n("accordion", { accordionStyle: "flush", icon: "plus", items: [{ title: "Ücretsiz deneme var mı?", body: "Evet, 14 gün." }, { title: "İptal edebilir miyim?", body: "İstediğiniz an." }] })]),
      col([n("accordion", { accordionStyle: "flush", icon: "plus", openMode: "none", items: [{ title: "Fatura kesiliyor mu?", body: "Evet, e-fatura." }, { title: "Veriler nerede?", body: "Türkiye veri merkezinde." }] })]),
    ])], 64)),
  item("contact_trio", "Üçlü iletişim kartı", "location", "Adres, telefon ve e-posta için üç küçük kart.", "bento-3",
    band({ backgroundColor: "#f8fafc" }, [cols("4+4+4", [col([H("Adres", "h4"), para("Kadıköy, İstanbul")], cardStyle({ textAlign: "center" })), col([H("Telefon", "h4"), para("0850 000 00 00")], cardStyle({ textAlign: "center" })), col([H("E-posta", "h4"), para("merhaba@ornek.com")], cardStyle({ textAlign: "center" }))])], 56)),
  item("coupon_sub", "Hediyeli abonelik", "subscribe", "‘Abone ol, %10 indirim kazan’ vurgusu ve tek alan.", "form",
    band({ background: GRAD.sunset, textColor: "#ffffff" }, [H("Abone ol, %10 indirim kazan", "h2", C), para("İlk siparişinizde geçerli kod e-postanıza gelir.", { style: C }), box([n("form_block", { title: "", submitLabel: "Kodumu gönder", appearance: { columns: 2, labels: "top", density: "comfortable", buttonAlign: "beside", surface: "inline" }, fields: [{ name: "eposta", label: "E-posta adresiniz", type: "email", required: true, width: "half" }] })], { backgroundColor: "#ffffff", textColor: "#0f172a", borderRadius: "20px", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "16px", paddingRight: "16px", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" })], 72)),
  item("pullquote", "Kenar notlu alıntı", "text", "Solda iri alıntı, sağda kısa not; makale arasında vurgu.", "prose-section",
    band({ backgroundColor: "#ffffff" }, [cols("8+4", [col([H("“İyi tasarım göze görünmez; işi kolaylaştırır.”", "h2", { fontSize: "36px", fontWeight: "800", lineHeight: "1.2", mobile: { fontSize: "26px" } })]), col([para("— Tasarım ekibimizin ilkesi", { style: { opacity: 0.65 } })], { borderWidth: "0 0 0 3px", borderColor: "#6366f1", borderStyle: "solid", paddingLeft: "20px" })], { verticalAlign: "center" })], 64)),
];
