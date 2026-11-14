import type { BlockNode } from "@nexpress/core";
import type { ThemeDemoEntry } from "./demo-pack";

/** ERP vitrin demosu. Görseller Unsplash lisanslıdır ve yerelde durur. Oran ve müşteri adı yok. */
const ART = "/demo/crimson-erp";

let seq = 0;
const node = (type: string, props: Record<string, unknown>, extra: Partial<BlockNode> = {}): BlockNode =>
  ({ id: `cr_${++seq}`, type, props, ...extra }) as BlockNode;

const h = (text: string, level = "h2", anchorId?: string) =>
  node("heading_element", { text, level }, anchorId ? { style: { anchorId } } : {});
const p = (text: string) => node("paragraph_element", { text });
const html = (value: string) => node("paragraph_element", { html: value });
const tldr = (summary: string) => node("tldr_box", { summary });
const faq = (title: string, items: Array<[string, string]>) =>
  node("faq_accordion", { title, items: items.map(([question, answer]) => ({ question, answer })) });
const hero = (title: string, subtitle: string, primary: [string, string], secondary?: [string, string], band = false) =>
  node(
    "hero",
    {
      badge: "Demo verisi",
      title,
      subtitle,
      primaryCtaLabel: primary[0],
      primaryCtaHref: primary[1],
      ...(secondary ? { secondaryCtaLabel: secondary[0], secondaryCtaHref: secondary[1] } : {}),
    },
    band ? { variant: "band" } : {},
  );
const img = (name: string, alt: string) =>
  node("image_figure", {
    url: `${ART}/${name}.jpg`,
    altText: `${alt}. Örnek görsel, Unsplash lisansı.`,
    borderRadius: "lg",
    aspectRatio: "3:2",
    objectFit: "cover",
  });
const split = (title: string, text: string, name: string, reverse = false) =>
  node("split_content", { title, text, image: `${ART}/${name}.jpg`, alt: `${title}. Örnek görsel.`, reverse });
const steps = (title: string, items: Array<[string, string]>) =>
  node("howto_steps", { title, steps: items.map(([t, description]) => ({ title: t, description })) });
const dialog = (trigger: string, title: string, body: string) => node("modal_panel", { trigger, title, body });
const priceForm = (surface: "inline" | "dialog") =>
  node("form_block", {
    title: "Fiyat notu",
    submitLabel: "Gönder",
    successMessage: "Notunuz alındı. Aynı gün içinde dönüş yapılır.",
    appearance: {
      columns: 1,
      labels: "top",
      density: "comfortable",
      buttonAlign: "left",
      surface,
      triggerLabel: "Fiyat penceresini aç",
    },
    fields: [
      { id: "ad", name: "ad", label: "Ad soyad", type: "text", required: true, width: "full" },
      { id: "tel", name: "telefon", label: "Telefon", type: "tel", required: true, width: "full" },
      { id: "not", name: "not", label: "Kişi, şube, bulut ya da yerinde", type: "textarea", required: true, width: "full" },
      { id: "onay", name: "onay", label: "Yanıt için yazdığım telefona dönülebilir.", type: "checkbox", required: true, width: "full" },
    ],
  });
const showcase = () =>
  node("campaign_showcase", {
    heading: "Örnek kampanyalar",
    subheading: "Oran yok. Paketin içinde ne olduğu yazılır. Demo verisidir.",
    layout: "grid",
    limit: 3,
    columns: 3,
    filter: "active",
    showDiscountBadge: true,
    showCountdown: true,
    showGift: true,
    showCta: true,
    emptyText: "Yayında örnek kampanya yok.",
  });
const col = (children: BlockNode[], cls = ""): BlockNode =>
  node("column", {}, { children, ...(cls ? { style: { cssClass: cls } } : {}) });
const row = (cols: BlockNode[], layout: string): BlockNode =>
  node("columns", { layout, gap: "16px", verticalAlign: "top", stackAt: "tablet" }, { children: cols });
const cta = (title: string, subtitle: string, href = "/tr/crimson-iletisim") =>
  node("cta_banner", { title, subtitle, buttonLabel: "Fiyat alın", buttonHref: href });
const card = (title: string, text: string, href: string, name: string) =>
  col([img(name, title), h(title, "h3"), p(text), html(`<a href="${href}">İncele</a>`)], "cr-card");

function page(slug: string, title: string, tldrText: string, schemaType: string, blocks: BlockNode[], image?: string): ThemeDemoEntry {
  return { type: "page", slug, title, tldr: tldrText, schemaType, blocks, ...(image ? { image: `${ART}/${image}.jpg` } : {}) };
}
function post(slug: string, title: string, tldrText: string, name: string, blocks: BlockNode[]): ThemeDemoEntry {
  return { type: "post", slug, title, tldr: tldrText, schemaType: "Article", canvas: false, image: `${ART}/${name}.jpg`, blocks, categories: ["ERP notu"] };
}
function campaign(slug: string, title: string, tldrText: string, name: string, gift: string): ThemeDemoEntry {
  return {
    type: "campaign",
    slug,
    title,
    tldr: tldrText,
    schemaType: "Offer",
    canvas: false,
    image: `${ART}/${name}.jpg`,
    campaign: { discount: "", badge: "Demo verisi", gift, endsInDays: 45, ctaText: "Koşullar", ctaUrl: "/tr/crimson-kampanyalar" },
    blocks: [p(`${tldrText} Oran yazılmaz.`)],
  };
}

/** Ürün ve hizmet sayfası: görsel, adımlar, soru, kapsam penceresi ve fiyat diyaloğu. */
function sheet(
  slug: string,
  title: string,
  summary: string,
  name: string,
  lead: string,
  points: Array<[string, string]>,
  questions: Array<[string, string]>,
  primary: [string, string],
): ThemeDemoEntry {
  return page(slug, title, summary, "WebPage", [
    hero(title, lead, primary, ["Ürünler", "/tr/crimson-urunler"]),
    tldr(summary),
    split(title, lead, name),
    steps("Nasıl yürür", points),
    dialog("Kapsamı aç", `${title} kapsamı`, "Demo verisidir. Modül listesi görüşmede netleşir; burada örnek sıra yazılır."),
    faq("Kısa yanıt", questions),
    priceForm("dialog"),
    cta("Fiyat için yazın", "Kişi, şube ve kurulum biçimi yeter."),
  ], name);
}

const HOME = "Fatura, stok ve muhasebe tek kayıtta durur. e-Fatura aynı ekrandan gider. Demo verisidir; indirim oranı ve müşteri adı yoktur.";

export const CR_ENTRIES: ThemeDemoEntry[] = [
  page("crimson-vitrin", "Fatura, stok ve muhasebe tek kayıtta", HOME, "WebPage", [
    hero("Fatura, stok ve muhasebe tek kayıtta", "e-Fatura, e-Arşiv ve e-İrsaliye aynı ekrandan gider. Demo verisidir.", ["e-Dönüşümü inceleyin", "/tr/crimson-e-donusum"], ["Kampanyalar", "/tr/crimson-kampanyalar"], true),
    tldr(HOME),
    h("Ürün aileleri"),
    row([
      card("ERP", "Finans, stok ve satış aynı kayıtta.", "/tr/crimson-erp", "ekran"),
      card("Ön muhasebe", "Fatura, cari ve kasa.", "/tr/crimson-on-muhasebe", "evrak"),
      card("e-Dönüşüm", "e-Fatura, e-Arşiv ve e-İrsaliye.", "/tr/crimson-e-donusum", "masa"),
    ], "4+4+4"),
    row([
      card("Perakende", "Kasa, mağaza ve depo.", "/tr/crimson-perakende", "magaza"),
      card("Bulut", "Tarayıcıdan açılır.", "/tr/crimson-bulut", "sunucu"),
      card("Yerinde", "Üretim ve çok şube.", "/tr/crimson-yerinde", "uretim"),
    ], "4+4+4"),
    split("Bulutta tek şube", "Muhasebe, fatura ve bayi siparişi tarayıcıda durur. Yedek kurulumun parçasıdır.", "sunucu"),
    split("Yerinde üretim", "Reçete, iş emri ve depo aynı sunucuda kalır. Özel bağlantı buraya yazılır.", "uretim", true),
    h("İşletme ölçeği"),
    row([
      card("Mikro", "1–10 kişi. Ön muhasebe ve fatura.", "/tr/crimson-olcek#mikro", "masa"),
      card("Küçük", "11–50 kişi. Stok ve e-belge.", "/tr/crimson-olcek#kucuk", "evrak"),
      card("Orta", "50–250 kişi. ERP ve şube.", "/tr/crimson-olcek#orta", "ofis"),
      card("Büyük", "250 ve üstü. Üretim ve yerinde kurulum.", "/tr/crimson-olcek#buyuk", "depo"),
    ], "3+3+3+3"),
    h("Depo, mağaza, ofis"),
    node("gallery", {
      items: [
        { url: `${ART}/depo.jpg`, alt: "Depo koridoru. Örnek görsel, Unsplash lisansı." },
        { url: `${ART}/magaza.jpg`, alt: "Mağaza içi. Örnek görsel, Unsplash lisansı." },
        { url: `${ART}/ofis.jpg`, alt: "Açık ofis. Örnek görsel, Unsplash lisansı." },
      ],
    }),
    showcase(),
    steps("Kurulum sırası", [
      ["Analiz", "Hangi fiş kalır, hangisi kapanır. Liste sözleşmeye yazılır."],
      ["Aktarım", "Cari, stok ve hesap planı liste olarak alınır."],
      ["Eğitim", "Kasayı ve faturayı kullanacak kişiyle yapılır."],
      ["İlk ay", "Açık maddeler kapanır. Yeni alan sıradaki aya yazılır."],
    ]),
    faq("Kısa yanıt", [
      ["Bulut mu, yerinde mi?", "Tek şube ve uzak erişim bulutta kalır. Üretim ve özel entegrasyon yerinde kurulur."],
      ["İndirim oranı var mı?", "Demo kaydında oran yoktur. Fiyat, görüşmeden sonra yazılır."],
      ["Mevcut cari aktarılır mı?", "Cari, stok ve hesap planı liste halinde alınır. Aktarım ayrı iş adımıdır."],
      ["Kampanya kartı ne işe yarar?", "Paketin içinde ne olduğunu gösterir. Yüzde yazılmaz."],
    ]),
    h("Yazılar"),
    node("dynamic_list", { source: "posts", limit: 3, orderBy: "newest", layout: "cards", columns: 3, showImage: true, showExcerpt: true, showDate: true, showSearch: false, showFilters: false, paginate: false }),
    h("Fiyat penceresi"),
    p("Sayfadan çıkmadan not bırakılır. Pencere kapanınca aynı sayfaya dönülür."),
    priceForm("dialog"),
    cta("Fiyat için yazın", "Kaç kişi, kaç şube, bulut mu yerinde mi. Üçü yeter."),
  ], "ofis"),
  page("crimson-urunler", "Ürün aileleri", "ERP, ön muhasebe, e-dönüşüm, perakende, bulut ve yerinde kurulum. Her ailede görsel ve kısa kapsam vardır. Demo verisidir.", "WebPage", [
    hero("Ürün aileleri", "Altı aile. Ölçeğe göre biri seçilir.", ["Ölçeğe bakın", "/tr/crimson-olcek"]),
    tldr("ERP, ön muhasebe, e-dönüşüm, perakende, bulut ve yerinde kurulum. Her ailede görsel ve kısa kapsam vardır. Demo verisidir."),
    row([
      card("ERP", "Finans, stok, satış.", "/tr/crimson-erp", "ekran"),
      card("Ön muhasebe", "Fatura, cari, kasa.", "/tr/crimson-on-muhasebe", "evrak"),
      card("e-Dönüşüm", "e-Fatura ve e-İrsaliye.", "/tr/crimson-e-donusum", "masa"),
    ], "4+4+4"),
    row([
      card("Perakende", "Kasa ve depo.", "/tr/crimson-perakende", "magaza"),
      card("Bulut", "Tarayıcıdan.", "/tr/crimson-bulut", "sunucu"),
      card("Yerinde", "Üretim.", "/tr/crimson-yerinde", "uretim"),
    ], "4+4+4"),
    showcase(),
  ], "ekran"),
  sheet("crimson-erp", "ERP çekirdeği", "Finans, stok ve satış aynı kayıtta. Rapor bu kayıttan çıkar. Demo verisidir.", "ekran", "Şube ve depo eklenince kayıt bölünmez.", [
    ["Cari ve stok", "Tek numara siparişte, irsaliyede ve faturada durur."],
    ["Rapor", "Mizan bu kayıttan çıkar. İkinci liste tutulmaz."],
    ["Şube", "Yeni depo aynı plana bağlanır."],
  ], [
    ["Üretim burada mı?", "Reçete yerinde kurulum sayfasındadır."],
    ["Buluta alınır mı?", "Tek şube buluta taşınabilir. Üretim yerinde kalır."],
  ], ["Yerinde kurulum", "/tr/crimson-yerinde"]),
  sheet("crimson-on-muhasebe", "Ön muhasebe", "Fatura, cari ve kasa. Genel muhasebe fişi bu kayıttan doğar. Demo verisidir.", "evrak", "Tek şubeli işletme buradan başlar.", [
    ["Fatura", "Taslak ve gönderim aynı listededir."],
    ["Cari", "Tahsilat faturayla eşleşir."],
    ["Fiş", "Kabul edilen e-belge fiş açar."],
  ], [
    ["e-Fatura ayrı mı?", "Belge e-dönüşüm ailesindedir. Fiş buraya düşer."],
  ], ["e-Dönüşüm", "/tr/crimson-e-donusum"]),
  sheet("crimson-e-donusum", "e-Dönüşüm", "e-Fatura, e-Arşiv, e-İrsaliye ve e-Defter aynı sözleşmede durabilir. Demo verisidir.", "masa", "Belge, muhasebe fişine bağlanır. Elle aktarım kalmaz.", [
    ["Seçim", "Hangisi zorunluysa o açılır. Hepsi birden satılmaz."],
    ["Kabul", "Kabul edilen belge cari ve stok satırını aynı fişte toplar."],
    ["Ret", "Ret fiş açmaz. Gerekçe belge listesinde kalır."],
  ], [
    ["Kontör hediyesi var mı?", "Demo kaydında hediye kontör yazılmaz."],
  ], ["e-Fatura", "/tr/crimson-e-fatura"]),
  sheet("crimson-e-fatura", "e-Fatura", "Kabul edilen e-fatura muhasebe fişini açar. Reddedilen belge fiş doğurmaz. Demo verisidir.", "evrak", "Belge numarası faturada ve fişte aynı kalır.", [
    ["Gönderim", "Taslak listeden çıkar, durum aynı satırda durur."],
    ["Eşleşme", "Cari vergi numarası kartla karşılaştırılır."],
  ], [
    ["e-Arşiv ayrı mı?", "Evet. e-Arşiv kendi sayfasındadır."],
  ], ["e-Arşiv", "/tr/crimson-e-arsiv"]),
  sheet("crimson-e-arsiv", "e-Arşiv", "e-Arşiv belgesi e-fatura mükellefi olmayana gider. Fiş aynı kayıttan açılır. Demo verisidir.", "masa", "Alıcı e-fatura kullanmıyorsa belge arşive düşer.", [
    ["Ayrım", "Mükellef sorgusu gönderimden önce yapılır."],
    ["Saklama", "Belge listesi ve fiş aynı numarayı taşır."],
  ], [
    ["e-İrsaliye nerede?", "Sevk belgesi kendi sayfasındadır."],
  ], ["e-İrsaliye", "/tr/crimson-e-irsaliye"]),
  sheet("crimson-e-irsaliye", "e-İrsaliye", "Sevk belgesi fatura ile aynı stok satırını kullanır. İkinci sayım açılmaz. Demo verisidir.", "depo", "Depodan çıkan mal, irsaliye ve faturada aynı satırdadır.", [
    ["Sevk", "İrsaliye depo hareketini düşer."],
    ["Fatura", "Aynı satır faturalaşınca yeniden düşülmez."],
  ], [
    ["Perakende kasa da düşer mi?", "Kasa kapanışı depo sayfasında anlatılır."],
  ], ["Perakende", "/tr/crimson-perakende"]),
  sheet("crimson-perakende", "Perakende satış", "Kasa, mağaza ve depo aynı stoktan düşer. Örnek kayıttır. Firma adı yoktur.", "magaza", "Kasa kapanışı depoyu da kapatır.", [
    ["Kasa", "Gün sonu fişi depo hareketiyle aynı listededir."],
    ["Sayım", "Ayrı sayım yalnızca fark gününde açılır."],
    ["Şube", "Her mağaza aynı stok planına bakar."],
  ], [
    ["Örnek firma var mı?", "Yok. Kayıt işin şeklini anlatır."],
  ], ["Kampanyalar", "/tr/crimson-kampanyalar"]),
  sheet("crimson-bulut", "Bulut çözümler", "Tarayıcıdan açılır. Yedek ve erişim kurulumun parçasıdır. Demo verisidir.", "sunucu", "Tek şube ve uzak ekip için. Üretim yerinde kalır.", [
    ["Erişim", "Tarayıcı yeter. Ayrı kurulum dosyası yok."],
    ["Yedek", "Günlük kopya sözleşmede yazılır."],
    ["Sınır", "Üretim reçetesi yerinde kuruluma gider."],
  ], [
    ["Yerinde ile farkı ne?", "Sunucu sizde kalmaz. Üretim yerinde kalır."],
  ], ["Yerinde", "/tr/crimson-yerinde"]),
  sheet("crimson-yerinde", "Yerinde kurulum", "Üretim, çok şube ve özel bağlantı yerinde kurulur. Demo verisidir.", "uretim", "Sunucu sizde kalır. Erişim kuralları sözleşmededir.", [
    ["Reçete", "İş emri malzemeyi stoktan düşer."],
    ["Bağlantı", "Özel hat ayrıca satırdır."],
    ["Erişim", "Kim hangi depoyu görür, listede durur."],
  ], [
    ["Bulut seçeneği durur mu?", "Tek şube buluta alınabilir."],
  ], ["Bulut", "/tr/crimson-bulut"]),
  page("crimson-olcek", "Ölçeğe göre seçim", "Mikro, küçük, orta ve büyük. Kişi aralığı örnektir. Demo verisidir.", "WebPage", [
    hero("Ölçeğe göre", "Dört bant. Geçiş, kişi sayısı değişince ayrıca yazılır.", ["Fiyat alın", "/tr/crimson-iletisim"]),
    tldr("Mikro, küçük, orta ve büyük. Kişi aralığı örnektir. Demo verisidir."),
    row([
      col([img("masa", "Mikro ofis"), h("Mikro", "h2", "mikro"), p("1–10 kişi. Ön muhasebe ve e-fatura.")], "cr-card"),
      col([img("evrak", "Evrak"), h("Küçük", "h2", "kucuk"), p("11–50 kişi. Stok ve e-belge eklenir.")], "cr-card"),
      col([img("ofis", "Ofis"), h("Orta", "h2", "orta"), p("50–250 kişi. ERP ve şube.")], "cr-card"),
      col([img("depo", "Depo"), h("Büyük", "h2", "buyuk"), p("250 ve üstü. Üretim ve yerinde kurulum.")], "cr-card"),
    ], "3+3+3+3"),
    faq("Geçiş", [
      ["Bant değişince kayıt silinir mi?", "Hayır. Kurulu kayıt durur. Yeni modül ayrı satırdır."],
      ["Aralık kesin mi?", "Örnektir. Sözleşmede yazılır."],
    ]),
  ], "ofis"),
  sheet("crimson-hizmetler", "Kurulum ve eğitim", "Analiz, aktarım, eğitim ve ilk ay. Dördü sözleşmede sayılır. Demo verisidir.", "ofis", "Yazılım tek başına açılmaz. Dört hizmet birlikte yürür.", [
    ["Analiz", "Hangi fişin kalacağı yazılır."],
    ["Aktarım", "Cari ve stok listesi alınır."],
    ["Eğitim", "Kasayı kullanacak kişiyle yapılır."],
    ["İlk ay", "Açık maddeler kapanır."],
  ], [
    ["Eğitim ayrı sayfada mı?", "Evet. Eğitim sayfası gün sayısını yazar."],
  ], ["Eğitim", "/tr/crimson-egitim"]),
  sheet("crimson-aktarim", "Veri aktarımı", "Cari, stok ve hesap planı liste olarak alınır. Canlı fiş aktarılmaz. Demo verisidir.", "evrak", "Eski programdaki liste yeni kayda bağlanır.", [
    ["Liste", "Cari, stok, hesap planı."],
    ["Hariç", "Açık sipariş ayrıca kararlaştırılır."],
    ["Kontrol", "Aktarım günü mizan karşılaştırılır."],
  ], [
    ["Ne kadar sürer?", "Ön muhasebe üç ile altı haftanın içindedir."],
  ], ["Kurulum", "/tr/crimson-hizmetler"]),
  sheet("crimson-egitim", "Eğitim", "Kasayı, faturayı ve raporu kullanacak kişiyle yapılır. Gün sayısı sözleşmede yazılır. Demo verisidir.", "masa", "Eğitim, kurulumu kullanan kişiyle yapılır.", [
    ["Kasa", "Gün sonu kapanışı birlikte yapılır."],
    ["Fatura", "e-belge gönderimi aynı oturumdadır."],
    ["Rapor", "Mizan ekranı açılır, ikinci liste yazılmaz."],
  ], [
    ["Uzaktan olur mu?", "Evet. Ekran paylaşımı yeter."],
  ], ["Destek", "/tr/crimson-destek"]),
  page("crimson-kampanyalar", "Örnek kampanyalar", "Üç paket kaydı. İndirim oranı yoktur. Koşul, kimin başvurabileceğini söyler. Demo verisidir.", "WebPage", [
    hero("Örnek kampanyalar", "Oran yazılmaz. Fiyat görüşmede çıkar.", ["Fiyat alın", "/tr/crimson-iletisim"]),
    tldr("Üç paket kaydı. İndirim oranı yoktur. Koşul, kimin başvurabileceğini söyler. Demo verisidir."),
    showcase(),
    row([
      col([img("evrak", "Yeni müşteri paketi"), h("Yeni müşteri paketi", "h3"), p("İlk kez kuran işletme. Ön muhasebe ve e-belge. Bitiş tarihi örnektir.")], "cr-card"),
      col([img("masa", "e-Dönüşüm paketi"), h("e-Dönüşüm paketi", "h3"), p("e-Fatura, e-Arşiv ve e-İrsaliye birlikte. Kontör hediyesi yazılmaz.")], "cr-card"),
      col([img("magaza", "Perakende paketi"), h("Perakende paketi", "h3"), p("Kasa ve depo birlikte kurulur. Okuyucu hediyesi yazılmaz.")], "cr-card"),
    ], "4+4+4"),
    dialog("Koşulu aç", "Kim başvurabilir", "Demo verisidir. Yeni kurulum, e-belge ya da perakende. Oran ve hediye kontör yoktur."),
    priceForm("dialog"),
  ], "magaza"),
  campaign("crimson-kampanya-yeni", "Yeni müşteri paketi", "Ön muhasebe ve e-belge birlikte kurulur. Örnek kayıttır. Oran yoktur.", "evrak", "Kurulum günü örnektir. Kontör hediyesi yazılmaz."),
  campaign("crimson-kampanya-ebelge", "e-Dönüşüm paketi", "e-Fatura, e-Arşiv ve e-İrsaliye aynı sözleşmede. Örnek kayıttır. Oran yoktur.", "masa", "Belge ailesi birlikte açılır. Hediye kontör yoktur."),
  campaign("crimson-kampanya-perakende", "Perakende paketi", "Kasa ve depo aynı stoktan düşer. Örnek kayıttır. Oran yoktur.", "magaza", "Kasa eğitimi kurulumun içindedir. Cihaz hediyesi yazılmaz."),
  page("crimson-kurumsal", "Kurum sayfası", "Crimson, ERP ve e-belge yazan örnek bir firmadır. Adres örnektir. Demo verisidir.", "AboutPage", [
    hero("Kurum", "Ürün, kurulum ve destek aynı masadadır.", ["İletişim", "/tr/crimson-iletisim"]),
    tldr("Crimson, ERP ve e-belge yazan örnek bir firmadır. Adres örnektir. Demo verisidir."),
    split("Aynı masa", "Analiz, kurulum ve ilk ay aynı ekipte kalır. Demo verisidir.", "ofis"),
    p("Demo verisi. Örnek adres: İstanbul. Telefon 0850 000 00 00. E-posta satis@crimson-erp.example."),
    row([
      card("Yazılar", "Altı not.", "/tr/crimson-yazilar", "ekran"),
      card("Sorular", "Kısa yanıtlar.", "/tr/crimson-sss", "evrak"),
      card("İş ortağı", "Bölge ve ekip.", "/tr/crimson-is-ortagi", "depo"),
    ], "4+4+4"),
  ], "ofis"),
  sheet("crimson-is-ortagi", "İş ortaklığı", "Kurulum ortağı, kendi bölgesinde eğitim ve ilk kurulumu yapar. Başvuru formdadır. Demo verisidir.", "depo", "Ortak, satışı ve ilk eğitimi üstlenir. Ürün çekirdeği bizde kalır.", [
    ["Başvuru", "Bölge, ekip sayısı ve ürün ailesi yazılır."],
    ["Onay", "Ayrı mektuptur. Form onayı mektup değildir."],
    ["İş", "İlk eğitim ortaktadır. Çekirdek ürün bizde kalır."],
  ], [
    ["Hemen ortak olunur mu?", "Hayır. Başvuru notu alınır, onay ayrıdır."],
  ], ["Başvur", "/tr/crimson-iletisim"]),
  sheet("crimson-destek", "Destek", "Kırılan iş, yeni alan ve sürüm notu. Üçü destek sözleşmesinde sayılır. Demo verisidir.", "masa", "Hafta içi 09:00–18:00. Aynı gün ilk yanıt.", [
    ["Kırık", "Kırılan fatura aynı gün bakılır."],
    ["Yeni alan", "Sıradaki aya yazılır."],
    ["Sürüm", "Ayda bir not çıkar."],
  ], [
    ["Soru listesi nerede?", "Sık sorulan sorular ayrı sayfadadır."],
  ], ["Sorular", "/tr/crimson-sss"]),
  page("crimson-yazilar", "Yazılar", "ERP, e-fatura, ölçek, stok, bulut ve kasa üzerine altı not. Demo verisidir.", "WebPage", [
    hero("Yazılar", "Altı not. Yeni yazı eklenince liste güncellenir.", ["ERP notu", "/tr/crimson-yazi-erp"]),
    tldr("ERP, e-fatura, ölçek, stok, bulut ve kasa üzerine altı not. Demo verisidir."),
    node("dynamic_list", { source: "posts", limit: 9, orderBy: "newest", layout: "cards", columns: 3, showImage: true, showExcerpt: true, showDate: true, showSearch: true, showFilters: false, paginate: true }),
  ], "ekran"),
  page("crimson-sss", "Sık sorulan sorular", "Bulut, aktarım, süre, kampanya ve fiyat. Yanıtlar kısadır. Demo verisidir.", "FAQPage", [
    hero("Sık sorulan sorular", "Beş yanıt. Listede yoksa iletişime yazın.", ["Yazın", "/tr/crimson-iletisim"]),
    tldr("Bulut, aktarım, süre, kampanya ve fiyat. Yanıtlar kısadır. Demo verisidir."),
    faq("Yanıtlar", [
      ["Bulut mu yerinde mi?", "Tek şube bulutta kalır. Üretim ve özel bağlantı yerinde kurulur."],
      ["Eski cari gelir mi?", "Cari, stok ve hesap planı liste olarak alınır."],
      ["Kurulum ne kadar sürer?", "Ön muhasebe üç ile altı hafta. ERP kapsamı bunu aşarsa iş bölünür."],
      ["İndirim var mı?", "Demo kaydında oran yoktur. Kampanya kartı paketi anlatır."],
      ["Pencere neden açılır?", "Fiyat notu sayfadan çıkmadan yazılır."],
    ]),
    priceForm("dialog"),
  ], "evrak"),
  page("crimson-iletisim", "Fiyat için yazın", "Kişi, şube ve bulut ya da yerinde. Üçü yazılınca dönüş yapılır. Demo verisidir.", "WebPage", [
    hero("Fiyat için yazın", "Telefon 0850 000 00 00. E-posta satis@crimson-erp.example.", ["Destek", "/tr/crimson-destek"]),
    tldr("Kişi, şube ve bulut ya da yerinde. Üçü yazılınca dönüş yapılır. Demo verisidir."),
    split("Yazışma", "Hafta içi 09:00–18:00. Demo verisi. Örnek adres: İstanbul.", "ofis"),
    row([
      col([h("Pencere"), p("Kısa not için pencere açılır."), priceForm("dialog")]),
      col([h("Sayfadaki form"), priceForm("inline")]),
    ], "6+6"),
  ], "ofis"),
  page("crimson-gizlilik", "Gizlilik notu", "Formdaki ad ve telefon yalnızca fiyat dönüşü için tutulur. Demo verisidir.", "WebPage", [
    hero("Gizlilik notu", "Form bülten listesine yazılmaz.", ["İletişim", "/tr/crimson-iletisim"]),
    tldr("Formdaki ad ve telefon yalnızca fiyat dönüşü için tutulur. Demo verisidir."),
    p("Yanıttan sonra kayıt silinir. Ziyaret ölçümü kapalıyken üçüncü parti betik yüklenmez. Görseller Unsplash lisanslı örnek fotoğraflardır."),
  ], "ofis"),
  post("crimson-yazi-erp", "ERP kaydı neden bölünmez", "Fatura, stok ve tahsilat aynı numarayı taşır. Bölününce rapor iki kez sayar. Demo verisidir.", "ekran", [
    img("ekran", "Ekran"),
    h("Tek numara"),
    p("Sipariş numarası irsaliyede ve faturada durur. Yeni numara açılmaz."),
    p("Rapor bu numaradan çıkar. İkinci liste tutulmaz."),
  ]),
  post("crimson-yazi-efatura", "e-Fatura fişe ne zaman düşer", "Belge kabul edilince muhasebe fişi açılır. Reddedilen belge fiş doğurmaz. Demo verisidir.", "evrak", [
    img("evrak", "Evrak"),
    h("Kabul"),
    p("Kabul edilen e-fatura, cari ve stok satırını aynı fişte toplar."),
    h("Ret"),
    p("Ret, fiş açmaz. Gerekçe belge listesinde kalır."),
  ]),
  post("crimson-yazi-olcek", "Ölçek değişince paket bölünür", "Kişi aralığı aşılınca tarih kaymaz. Eksik modül ayrı iş olur. Demo verisidir.", "ofis", [
    img("ofis", "Ofis"),
    h("Bant"),
    p("Mikro, küçük, orta, büyük. Aralık örnektir, sözleşmede yazılır."),
    p("Bant değişince kurulu kayıt durur. Yeni modül ayrı satırdır."),
  ]),
  post("crimson-yazi-stok", "Depo sayımı ne zaman açılır", "Gün sonu kasa depoyu kapatır. Ayrı sayım yalnızca fark gününde açılır. Demo verisidir.", "depo", [
    img("depo", "Depo"),
    h("Kapanış"),
    p("Kasa fişi ile depo hareketi aynı listededir."),
    p("Fark varsa sayım o güne yazılır. Her akşam sayım açılmaz."),
  ]),
  post("crimson-yazi-bulut", "Bulut yedeği sözleşmede durur", "Tarayıcıdan açılan kayıtta yedek, kurulumun parçasıdır. Üretim yerinde kalır. Demo verisidir.", "sunucu", [
    img("sunucu", "Sunucu"),
    h("Yedek"),
    p("Günlük kopya sözleşmede yazılır. Ayrı ürün diye satılmaz."),
    p("Reçete ve iş emri yerinde kurulumdadır."),
  ]),
  post("crimson-yazi-kasa", "Mağaza kasası depoyu da kapatır", "Gün sonu kasa, depo hareketiyle aynı listededir. Örnek kayıttır. Firma adı yoktur.", "magaza", [
    img("magaza", "Mağaza"),
    h("Tek stok"),
    p("Kasa, mağaza ve depo aynı stoktan düşer."),
    p("İkinci sayım yalnızca fark gününde açılır."),
  ]),
];
