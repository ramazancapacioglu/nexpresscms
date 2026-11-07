import type { BlockNode } from "@nexpress/core";
import type { DesignLibraryItem } from "./library-types";
import { GRAD, art, band, box, button, cardStyle, col, cols, heading, image, itemFactory, n, para } from "./library-kit";

/**
 * Yaratıcı bölümler: cam kartlar, dev tipografi, görsel üstü metin kartları, sohbet balonları, zaman çizelgesi.
 * Hepsi sıradan bloklardır; metin, düğme, görsel ve renkler editörde değiştirilebilir.
 */
const item = itemFactory("lib_cr_", "Yaratıcı");

const WHITE = { textColor: "#f8fafc" } as const;
const MESH = "radial-gradient(60% 80% at 15% 20%,#6366f1 0%,transparent 60%),radial-gradient(50% 70% at 85% 30%,#ec4899 0%,transparent 55%),radial-gradient(60% 80% at 60% 100%,#06b6d4 0%,transparent 60%),#0b1020";
const glassCard = (extra: NonNullable<BlockNode["style"]> = {}): NonNullable<BlockNode["style"]> => ({
  backgroundColor: "rgba(255,255,255,.10)",
  borderWidth: "1px",
  borderColor: "rgba(255,255,255,.22)",
  borderRadius: "28px",
  paddingTop: "32px",
  paddingBottom: "32px",
  paddingLeft: "32px",
  paddingRight: "32px",
  ...extra,
});
const chip = (text: string) =>
  para(text, { style: { backgroundColor: "rgba(255,255,255,.14)", borderRadius: "999px", paddingTop: "6px", paddingBottom: "6px", paddingLeft: "14px", paddingRight: "14px", fontSize: "13px", maxWidth: "max-content" } });
const bubble = (text: string, mine: boolean) =>
  box([para(text)], {
    backgroundColor: mine ? "#4f46e5" : "#f1f5f9",
    textColor: mine ? "#ffffff" : "#0f172a",
    borderRadius: mine ? "22px 22px 4px 22px" : "22px 22px 22px 4px",
    paddingTop: "16px",
    paddingBottom: "16px",
    paddingLeft: "20px",
    paddingRight: "20px",
  });
const story = (title: string, text: string, a: string, b: string) =>
  col([heading(title, "h3"), para(text)], {
    backgroundImage: art("grid", a, b),
    backgroundOverlay: "linear-gradient(180deg,rgba(8,12,32,.05),rgba(8,12,32,.82))",
    textColor: "#ffffff",
    borderRadius: "24px",
    minHeight: "340px",
    paddingTop: "190px",
    paddingBottom: "28px",
    paddingLeft: "28px",
    paddingRight: "28px",
    hover: { translateY: "-6px" },
  });

export const CREATIVE_LIBRARY_ITEMS: DesignLibraryItem[] = [
  item("glass_hero", "Cam kartlı vitrin", "hero", "Mesh degrade zemin, solda iri başlık, sağda yarı saydam cam kart ve rozetler.", "hero-split",
    band({ background: MESH, ...WHITE }, [cols("7+5", [
      col([chip("Yeni • 2026"), heading("Geleceğin ürününü bugün kurun", "h2", { style: { fontSize: "58px", fontWeight: "800", lineHeight: "1.05", letterSpacing: "-0.03em", mobile: { fontSize: "34px" } } }), para("Hızlı, sade ve çarpıcı. Hazır bileşenleri istediğiniz gibi değiştirin."), n("button_row", { align: "left", buttons: [{ label: "Hemen başlayın", href: "/tr/iletisim", variant: "primary" }, { label: "Nasıl çalışır?", href: "/tr/ozellikler", variant: "outline" }] })]),
      col([heading("98%", "h3", { style: { fontSize: "64px", fontWeight: "800" } }), para("Müşteri memnuniyeti"), chip("★ 4,9 / 5 puan"), chip("24 saat içinde kurulum")], glassCard({ boxShadow: "xl", animation: "fade-up" })),
    ], { verticalAlign: "center" })], 104)),
  item("ticker", "Kayan slogan şeridi", "layout", "Devasa harflerle sonsuz kayan slogan; vurgu ve ritim katar.", "cta-strip",
    band({ backgroundColor: "#0b1020", ...WHITE }, [n("marquee", { items: ["HIZLI", "GÜVENLİ", "SADE", "ÖLÇEKLENEBİLİR", "TÜRKÇE"], speed: 30, direction: "left" }, { style: { fontSize: "56px", fontWeight: "900", letterSpacing: "-0.02em" } })], 28)),
  item("poster", "Poster başlık", "text", "Ekranı dolduran dev tipografi ve tek düğme; manifesto ve açılış cümlesi için.", "prose-section",
    band({ backgroundColor: "#fafafa", textAlign: "center" }, [heading("Az yap. Doğru yap. Hızlı yap.", "h2", { style: { fontSize: "92px", fontWeight: "900", lineHeight: "0.98", letterSpacing: "-0.04em", textAlign: "center", mobile: { fontSize: "42px" } } }), para("Kısa bir alt cümle düşüncenizi tamamlar.", { style: { textAlign: "center", fontSize: "18px" } }), button("Devamını oku", "/tr/kurumsal", "primary", "center")], 120)),
  item("story_cards", "Görsel üstü kartlar", "cards", "Tam görselli üç kart; başlık ve metin görselin üstünde, hover'da yükselir.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [heading("Hikâyelerimiz", "h2", { style: { textAlign: "center" } }), cols("4+4+4", [story("Kurulum günü", "İlk gün canlıya aldık.", "#6366f1", "#ec4899"), story("Büyüme", "İkinci ayda iki katına çıktık.", "#0ea5e9", "#22c55e"), story("Yeni pazar", "Yurt dışına açıldık.", "#f97316", "#8b5cf6")])], 72), "Görsel"),
  item("metric_hero", "Sayaç vitrini", "hero", "Solda iddialı başlık, sağda iki kat iki sayaç kartı (koyu zemin).", "stats-4",
    band({ backgroundGradient: GRAD.night, ...WHITE }, [cols("5+7", [
      col([heading("Rakamlar konuşsun", "h2", { style: { fontSize: "46px", fontWeight: "800", mobile: { fontSize: "30px" } } }), para("Gerçek verilerinizi buraya yazın; sayılar sayfa açılınca saymaya başlar."), button("Raporu inceleyin", "/tr/iletisim", "outline")]),
      col([cols("6+6", [col([n("countup", { value: 120, suffix: "+", label: "Ülke", duration: 2 })], glassCard()), col([n("countup", { value: 98, suffix: "%", label: "Memnuniyet", duration: 2 })], glassCard())]), cols("6+6", [col([n("countup", { value: 24, suffix: "/7", label: "Destek", duration: 2 })], glassCard()), col([n("countup", { value: 15, suffix: " yıl", label: "Deneyim", duration: 2 })], glassCard())])]),
    ], { verticalAlign: "center" })], 88)),
  item("timeline", "Dikey zaman çizelgesi", "layout", "Yıl rozetli satırlarla firma yolculuğu; sade ve okunaklı.", "howto-timeline",
    band({ backgroundColor: "#ffffff" }, [heading("Yolculuğumuz", "h2", { style: { textAlign: "center" } }),
      ...[["2019", "Kuruluş", "İlk ürünü üç kişilik ekiple yayınladık."], ["2021", "Büyüme", "Yüzüncü müşteriye ulaştık, ekibi büyüttük."], ["2023", "Yeni pazar", "Yurt dışı ofisimizi açtık."], ["2026", "Bugün", "Tüm süreçleri tek platformda topladık."]].map(([y, t, x]) =>
        cols("3+6+3", [col([heading(y!, "h3", { style: { fontSize: "36px", fontWeight: "800", textColor: "#4f46e5", textAlign: "right" } })]), col([heading(t!, "h3"), para(x!)], { borderWidth: "0px", paddingLeft: "20px" }), col([])], { verticalAlign: "center" })),
    ], 72)),
  item("chat_faq", "Sohbet tarzı SSS", "text", "Soru sağda, yanıt solda balonlar; sıcak ve okunaklı bir SSS.", "faq-list",
    band({ backgroundColor: "#ffffff" }, [heading("Sık sorulanlar", "h2", { style: { textAlign: "center" } }),
      cols("3+6+3", [col([]), col([bubble("Deneme süresi var mı?", true), bubble("Evet, 14 gün boyunca tüm özellikleri ücretsiz deneyebilirsiniz.", false), bubble("Verilerimi taşıyabilir miyim?", true), bubble("Tablo dosyalarından tek adımda aktarabilirsiniz.", false)]), col([])]),
    ], 72)),
  item("awards", "Ödül ve sertifika şeridi", "social", "Dört rozet: ödül, sertifika, ortaklık; ikon ve kısa metin.", "stats-4",
    band({ backgroundColor: "#f8fafc" }, [cols("3+3+3+3", [["award", "Yılın markası", "2025 sektör ödülü"], ["shield", "ISO 27001", "Bilgi güvenliği"], ["badge-check", "Resmî ortak", "Onaylı entegratör"], ["trophy", "İlk 500", "Teknoloji firmaları"]].map(([ic, t, s]) => col([n("single_icon", { icon: ic, size: 36, color: "#4f46e5", align: "center" }), heading(t!, "h3", { style: { textAlign: "center" } }), para(s!, { style: { textAlign: "center" } })], { hover: { translateY: "-4px" } })))], 56)),
  item("app_download", "Uygulama indirme bandı", "media", "Solda telefon çizimi, sağda mağaza düğmeleri ve kısa tanıtım.", "columns",
    band({ backgroundGradient: GRAD.ocean, ...WHITE }, [cols("5+7", [col([image(art("phone", "#ffffff", "#38bdf8"), "Mobil uygulama", { aspectRatio: "3:2", maxWidth: "380px", align: "center" })]), col([heading("Cebinizde, her an", "h2", { style: { fontSize: "42px", fontWeight: "800", mobile: { fontSize: "30px" } } }), para("Uygulamayı indirin; siparişleri, raporları ve onayları yolda yönetin."), n("button_row", { align: "left", buttons: [{ label: "App Store", href: "#", variant: "primary" }, { label: "Google Play", href: "#", variant: "outline" }] })])], { verticalAlign: "center" })], 80)),
  item("dual_cta", "İkili çağrı kartları", "cards", "İki büyük degrade kart yan yana: bireysel ve kurumsal gibi iki yol.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [cols("6+6", [
      col([heading("Bireysel", "h3", { style: { fontSize: "32px", fontWeight: "800" } }), para("Tek kişilik ekipler için hafif başlangıç."), button("Ücretsiz başla", "/tr/iletisim", "outline")], { backgroundGradient: GRAD.sunset, textColor: "#ffffff", borderRadius: "28px", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "40px", paddingRight: "40px", hover: { translateY: "-6px", boxShadow: "xl" } }),
      col([heading("Kurumsal", "h3", { style: { fontSize: "32px", fontWeight: "800" } }), para("Çok kullanıcılı, özel entegrasyonlu çözüm."), button("Teklif alın", "/tr/iletisim", "outline")], { backgroundGradient: GRAD.night, textColor: "#ffffff", borderRadius: "28px", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "40px", paddingRight: "40px", hover: { translateY: "-6px", boxShadow: "xl" } }),
    ])], 64)),
  item("resource_cards", "Kaynak kartları", "cards", "İkonlu üç kaynak kartı: rehber, video, indirme. Bağlantıları değiştirin.", "bento-3",
    band({ backgroundColor: "#f8fafc" }, [heading("Öğrenin ve indirin", "h2", { style: { textAlign: "center" } }), cols("4+4+4", [["book", "Başlangıç rehberi", "Adım adım kurulum kılavuzu.", "Rehberi aç"], ["video", "Eğitim videosu", "15 dakikada tüm temel özellikler.", "İzle"], ["download", "Ürün kataloğu", "Tüm paketler tek PDF'te.", "İndir"]].map(([ic, t, s, l]) => col([n("single_icon", { icon: ic, size: 28, color: "#ffffff", background: "#4f46e5", align: "left" }), heading(t!, "h3"), para(s!), button(l!, "#", "outline")], cardStyle())))], 72)),
  item("event", "Etkinlik duyurusu", "layout", "Büyük tarih rozeti, etkinlik bilgisi ve kayıt düğmesi.", "cta-strip",
    band({ backgroundColor: "#0f172a", ...WHITE }, [cols("3+6+3", [
      col([heading("12", "h3", { style: { fontSize: "88px", fontWeight: "900", lineHeight: "1", textColor: "#818cf8", textAlign: "center" } }), para("HAZİRAN 2026", { style: { textAlign: "center", letterSpacing: "0.2em", fontSize: "13px" } })]),
      col([heading("Yıllık Teknoloji Zirvesi", "h2"), para("İstanbul • 09:30 – 17:00 • Canlı yayın seçeneğiyle")]),
      col([button("Kayıt ol", "/tr/iletisim", "primary", "center")]),
    ], { verticalAlign: "center" })], 64), "Etkinlik"),
  item("video_hero", "Video vitrini", "media", "Büyük kapak görseli ve oynat düğmesi; video bağlantısını düğmeden verin.", "media",
    band({ backgroundImage: art("globe", "#6366f1", "#0ea5e9"), backgroundOverlay: "rgba(8,12,32,.55)", ...WHITE, textAlign: "center" }, [heading("Ürünü 90 saniyede izleyin", "h2", { style: { fontSize: "46px", fontWeight: "800", textAlign: "center", mobile: { fontSize: "30px" } } }), para("Kısa tanıtım videosu; kurulum, panel ve raporlar.", { style: { textAlign: "center" } }), button("▶  Videoyu oynat", "#", "primary", "center")], 140), "Video"),
];

