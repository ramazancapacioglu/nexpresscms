import type { DesignLibraryItem } from "./library-types";
import type { BlockNode } from "@nexpress/core";
import { GRAD, art, band, button, cols, col, heading, image, itemFactory, n, para, type LibNode } from "./library-kit";

/**
 * Akordeon ve sekme tasarımları: aynı bloklar, farklı görünümler (`accordionStyle`, `tabStyle`).
 * Başlıklar, maddeler ve sekme içerikleri editörde değiştirilir; sekme içine satır, sütun ve görsel eklenebilir.
 */
const item = itemFactory("lib_dc_", "Akordeon / Sekme");

const QA = [
  { title: "Kurulum ne kadar sürer?", body: "Hazır şablonla aynı gün; özel tasarımla genellikle 2–3 hafta içinde yayına çıkarız." },
  { title: "Mevcut sitemi taşıyabilir miyim?", body: "Evet. İçerik, görsel ve adresler yönlendirmeleriyle birlikte kayıpsız aktarılır." },
  { title: "Destek nasıl çalışıyor?", body: "Hafta içi canlı destek, kritik durumlarda 7/24 telefon hattı sunuyoruz." },
  { title: "Fiyatlara KDV dahil mi?", body: "Listelenen fiyatlara KDV dahil değildir; fatura aşamasında eklenir." },
];

const faq = (id: string, name: string, desc: string, accordionStyle: string, title: string, style: NonNullable<LibNode["style"]>, extra: Record<string, unknown> = {}) =>
  item(id, name, "accordion", desc, "faq-list",
    band({ ...style }, [n("accordion", { title, accordionStyle, items: QA, ...extra })], 72));

const pane = (label: string, icon: string, children: BlockNode[]): BlockNode => n("column", { label, icon }, { children });

const tabPanes = (style: string, title: string, extra: Record<string, unknown> = {}): BlockNode =>
  n("tabs", {
    title,
    tabStyle: style,
    align: "left",
    items: [{ label: "Genel bakış", icon: "sparkles" }, { label: "Özellikler", icon: "check" }, { label: "Fiyatlandırma", icon: "cart" }],
    ...extra,
  }, { children: [
    pane("Genel bakış", "sparkles", [cols("6+6", [
      col([heading("Her şey tek yerde", "h3"), para("Sayfalarınızı, formlarınızı ve raporlarınızı aynı panelden yönetin."), button("Demoyu görün", "/tr/iletisim")]),
      col([image(art("dashboard", "#6366f1", "#06b6d4"), "Panel görseli")]),
    ], { verticalAlign: "center" })]),
    pane("Özellikler", "check", [heading("Öne çıkan özellikler", "h3"), para("Görsel editör, çok dilli içerik, hızlı ön yüz ve güvenli yönetim paneli.")]),
    pane("Fiyatlandırma", "cart", [heading("Sade fiyatlandırma", "h3"), para("Başlangıç planı ücretsiz; büyüdükçe ihtiyacınıza göre yükseltin."), button("Planları incele", "/tr/fiyatlar", "outline")]),
  ] });

export const DISCLOSURE_LIBRARY_ITEMS: DesignLibraryItem[] = [
  faq("acc_classic", "Klasik akordeon", "Kenarlıklı, sade kutular; ok simgesi.", "classic", "Sıkça sorulan sorular", { backgroundColor: "#ffffff" }),
  faq("acc_cards", "Gölgeli kart akordeon", "Yuvarlak, gölgeli kartlar; hover'da yükselir.", "cards", "Merak edilenler", { background: GRAD.soft }, { icon: "plus" }),
  faq("acc_flush", "Çizgili akordeon", "Sadece ince ayırıcı çizgiler; editoryal ve hafif görünüm.", "flush", "Sorular ve yanıtlar", { backgroundColor: "#ffffff" }, { icon: "plus" }),
  faq("acc_filled", "Dolgulu akordeon", "Açık gri dolgu; açılan madde vurgu rengine döner.", "filled", "Bilmeniz gerekenler", { backgroundColor: "#ffffff" }),
  faq("acc_accent", "Sol vurgulu akordeon", "Açık maddede sol kenar renklenir; sade ve okunaklı.", "accent", "Destek merkezi", { backgroundColor: "#f8fafc" }),
  faq("acc_numbered", "Numaralı akordeon", "Yuvarlak numara rozetli maddeler; sıralı adımlar için.", "numbered", "Nasıl çalışıyoruz?", { backgroundColor: "#ffffff" }, { icon: "none" }),
  faq("acc_pills", "Kapsül akordeon", "Yuvarlak kapsül başlıklar; açılınca renklenir.", "pills", "Sık sorulanlar", { background: GRAD.soft }),
  faq("acc_bold", "Büyük başlıklı akordeon", "İri tipografi ve yuvarlak artı düğmeleri; manifesto tarzı.", "bold", "Sorularınız", { backgroundColor: "#0b1020", textColor: "#f8fafc" }, { icon: "plus" }),
  item("tabs_pills", "Kapsül sekmeler", "tabs", "Yuvarlak kapsül sekme düğmeleri; içlerinde görsel ve metin.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [tabPanes("pills", "Ürünü yakından tanıyın")], 72)),
  item("tabs_underline", "Çizgili sekmeler", "tabs", "Alt çizgili klasik sekme çubuğu.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [tabPanes("underline", "Bilgi merkezi")], 72)),
  item("tabs_segmented", "Segment sekmeler", "tabs", "iOS tarzı segment kontrol; ortalı ve kompakt.", "bento-3",
    band({ background: GRAD.soft }, [tabPanes("segmented", "Aylık ya da yıllık", { align: "center" })], 72)),
  item("tabs_vertical", "Dikey sekmeler", "tabs", "Solda dikey menü, sağda içerik; masaüstünde yan yana, telefonda üst üste.", "bento-3",
    band({ backgroundColor: "#ffffff" }, [tabPanes("vertical", "Çözümler")], 72)),
  item("tabs_cards", "Kart sekmeler", "tabs", "Büyük, simgeli kart düğmeler; seçili olan vurgulanır.", "bento-3",
    band({ backgroundColor: "#f8fafc" }, [tabPanes("cards", "İhtiyacınıza göre seçin")], 72)),
  item("tabs_steps", "Numaralı adım sekmeleri", "tabs", "Her sekme numaralı adım; süreç anlatımı için.", "howto-timeline",
    band({ backgroundColor: "#ffffff" }, [tabPanes("steps", "Üç adımda başlayın")], 72)),
  item("tabs_dark", "Koyu zeminde sekmeler", "tabs", "Koyu bantta kutulu sekme çubuğu.", "bento-3",
    band({ background: GRAD.night, textColor: "#f8fafc" }, [tabPanes("boxed", "Platform özellikleri")], 72)),
];
