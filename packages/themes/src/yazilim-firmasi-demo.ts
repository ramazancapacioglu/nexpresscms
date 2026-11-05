import type { BlockNode } from "@nexpress/core";
import { YF_THEME_ID } from "./yazilim-firmasi";
import {
  YF_ART, band, button, cards, column, cta, faq, form, heading, hero, iconList, image, posts, row, showcase, stats, steps, table, text, tldr,
  type Card,
} from "./yazilim-firmasi-kit";
import { EDOCS, PRODUCTS, type Group, type Product } from "./yazilim-firmasi-products";
import type { ThemeDemoEntry, ThemeDemoPack } from "./demo-pack";

/** Demo vitrinin adresi. Mevcut `ana-sayfa` kaydının yerine geçmez. */
export const YF_DEMO_HOME_SLUG = "yazilim-vitrin";

const BRAND = "MerkezSoft";
const TRY: [string, string] = ["Ücretsiz tanıtım", "/tr/ucretsiz-tanitim"];

const entry = (type: "page" | "post", slug: string, title: string, tldrText: string, blocks: BlockNode[], schemaType = type === "post" ? "BlogPosting" : "WebPage"): ThemeDemoEntry =>
  ({ type, slug, title, tldr: tldrText, schemaType, blocks });
const page = (slug: string, title: string, summary: string, blocks: BlockNode[], schemaType?: string) => entry("page", slug, title, summary, blocks, schemaType);

/** Başlık, tek cümle ve (varsa) görselle açılan sayfa girişi. */
const intro = (title: string, lead: string, art?: string, secondary?: [string, string], badge?: string): BlockNode[] => [
  hero(title, lead, TRY, secondary, badge),
  ...(art ? [band("dark", [image(art, title, true)], true, 0)] : []),
];
const wrap = (...children: BlockNode[]) => band("", children, false, 40);
const closing = (title = "Size özel çözümü birlikte kuralım", subtitle = "Bilgilerinizi bırakın, uzman ekibimiz sizi arasın.") => wrap(cta(title, subtitle));

const GROUPS: Record<Group, { slug: string; title: string; lead: string; art: string }> = {
  erp: { slug: "erp", title: "Kurumsal Kaynak Planlaması", lead: "Üretim, satış, insan kaynakları ve ofis süreçleri aynı veri üzerinde çalışır.", art: "erp" },
  muhasebe: { slug: "muhasebe", title: "Muhasebe Çözümleri", lead: "Ön muhasebeden genel muhasebeye kadar tüm süreçler tek akışta.", art: "muhasebe" },
  bulut: { slug: "bulut", title: "Bulut Yazılımlar", lead: "İnternet olan her yerden, her cihazdan: ofiste, yolda, tatilde.", art: "bulut" },
  sektorel: { slug: "sektorel", title: "Sektörel Çözümler", lead: "Farklı sektörler, farklı ritim. Tüm operasyonlar tek bir akışta.", art: "sektor" },
  diger: { slug: "diger-cozumler", title: "Diğer Çözümler", lead: "Mesaj, kontör, mobil ve bireysel çözümler.", art: "mobil" },
};


/** Kampanyalar eklentisi kayıtları: `/kampanyalar` arşivini ve `campaign_showcase` bloklarını besler. */
const campaign = (slug: string, title: string, summary: string, art: string, discount: string, endsInDays: number, extra: Partial<NonNullable<ThemeDemoEntry["campaign"]>> = {}): ThemeDemoEntry => ({
  type: "campaign",
  slug,
  title,
  tldr: summary,
  schemaType: "Offer",
  image: `${YF_ART}/${art}.svg`,
  campaign: { discount, endsInDays, ctaText: "Teklif al", ctaUrl: "/tr/ucretsiz-tanitim", ...extra },
  blocks: [text(`${summary} Bu kampanya metni örnektir; koşulları ve süreyi Kampanyalar ekranından düzenleyebilirsiniz.`)],
});

const CAMPAIGN_ENTRIES: ThemeDemoEntry[] = [
  campaign("bulut-erp-yeni-yil-indirimi", "Bulut ERP'de yeni yıl indirimi", "Yeni lisans alımında dönem sonuna kadar geçerli indirim.", "kampanya-1", "%40", 26, { gift: "300 e-belge kontörü hediye", badge: "Fırsat" }),
  campaign("hizli-satis-paketi", "Hızlı Satış paketi", "Barkodlu satış ve çok şube modülü birlikte.", "kampanya-2", "%35", 18, { gift: "Barkod okuyucu kurulumu", badge: "Paket" }),
  campaign("yeni-surume-gecis", "Yeni sürüme geçiş fırsatı", "Mevcut kullanıcılara özel geçiş avantajı.", "kampanya-3", "%70", 12, { badge: "Sınırlı süre" }),
  campaign("restoran-paketi", "Restoran + QR menü paketi", "Adisyon, mutfak ekranı ve QR menü birlikte.", "kampanya-4", "%30", 30, { gift: "1 yıl QR menü", badge: "Paket" }),
  campaign("e-ticaret-baslangic", "e-Ticaret başlangıç paketi", "Mağaza kurulumu ve pazaryeri bağlantısı tek pakette.", "kampanya-5", "%25", 22, { badge: "Yeni" }),
  campaign("muhasebe-ofis-paketi", "Mali müşavir ofis paketi", "Birden çok firma için ön ve genel muhasebe.", "kampanya-6", "%20", 40, { gift: "Eğitim günü" }),
];

const productCard = (p: Product): Card => ({ title: p.title, text: p.lead, art: p.art, href: `/tr/${p.slug}` });
const inGroup = (g: Group) => PRODUCTS.filter((p) => p.group === g);

/** Ürün ve sektör sayfası: giriş, modüller, hedef kitle, kampanya, sürüm tablosu, sorular. */
function productPage(p: Product): ThemeDemoEntry {
  const g = GROUPS[p.group];
  const modules: Card[] = p.modules.map(([title, t]) => ({ title, text: t }));
  return page(p.slug, p.title, `${p.lead} Modüller ihtiyaca göre seçilir; metinler düzenlenebilir demo içeriğidir.`, [
    ...intro(p.title, p.lead, p.art, [g.title, `/tr/${g.slug}`], g.title),
    wrap(tldr(`${p.title}: ${p.lead} Aşağıdaki modüller örnek anlatımdır; kendi ürün bilginizle değiştirin.`)),
    band("", [heading("Neler sunar?", "center"), ...cards(modules)], true),
    band("soft", [row([
      column([image(p.art, p.title)]),
      column([
        heading("Kimler için uygun?"),
        text(`${p.title}, küçük işletmeden çok şubeli kuruma kadar her ölçekte kullanılabilir. Lisans modüler olduğundan yalnızca ihtiyacınız olan bölüme yatırım yaparsınız.`),
        iconList([["Hızlı kurulum", "Uzman ekip yanınızda."], ["Esnek lisans", "Modül ve kullanıcı sayısını siz seçersiniz."], ["Kesintisiz destek", "Telefon, canlı görüşme ve bilgi bankası."]]),
        button("Ücretsiz tanıtım iste", TRY[1]),
      ]),
    ], "6+6", "center")]),
    band("", [showcase("grid", 3)], true),
    band("soft", [table("Sürüm karşılaştırması", ["Özellik", "Başlangıç", "Profesyonel", "Kurumsal"], [
      ["Temel modüller", "✓", "✓", "✓"], ["Çok şube", "—", "✓", "✓"], ["Gelişmiş raporlama", "—", "✓", "✓"], ["Özel entegrasyon", "—", "—", "✓"],
    ])]),
    wrap(faq(`${p.title} sık sorulanlar`, [
      ["Demo alabilir miyim?", "Evet. Ücretsiz tanıtım formunu doldurun, ekibimiz sizi arayıp demo ortamı açsın."],
      ["Mevcut verilerimi aktarabilir miyim?", "Cari, stok ve hesap kartları tablo dosyasından içe aktarılır."],
      ["Eğitim ve destek var mı?", "Kurulumda eğitim verilir; sonrasında telefon ve bilgi bankası ile destek sürer."],
    ])),
    closing(),
  ]);
}

/** Grup ana sayfası: ürün kartları ve kısa sorular. */
function indexPage(slug: string, title: string, lead: string, art: string, items: Card[], badge: string): ThemeDemoEntry {
  return page(slug, title, `${lead} Her kart ayrı bir ürün sayfasına gider.`, [
    ...intro(title, lead, art, ["Tüm çözümler", "/tr/programlar"], badge),
    band("", [heading(`${title} detayları`, "center"), ...cards(items)], true),
    wrap(faq("Sık sorulanlar", [
      [`${title} kimler için uygundur?`, "Küçük işletmeden büyük kuruma kadar tüm ölçekler için modüler olarak sunulur."],
      ["Programlar birbiriyle çalışır mı?", "Evet. Tüm ürünler aynı veri altyapısını kullanır ve birbirine bağlanır."],
    ])),
    closing(),
  ]);
}

function edocPage(d: (typeof EDOCS)[number]): ThemeDemoEntry {
  return page(d.slug, d.title, `${d.lead} Başvuru, kontör ve program bağlantısı bu sayfada anlatılır.`, [
    ...intro(d.title, d.lead, d.art, ["e-Dönüşüm", "/tr/e-donusum"], "e-Dönüşüm"),
    band("soft", [row([
      column([heading(`${d.title} nedir?`), text(d.what)]),
      column([image(d.art, d.title)]),
    ], "6+6", "center")]),
    band("", [heading(`${d.title} avantajları`, "center"), ...cards(d.benefits.map(([t, x]) => ({ title: t, text: x })))], true),
    wrap(steps(`${d.title} için üç adım`, [["Başvuru", "Mükellefiyet başvurusunu tamamlayın."], ["Kontör", "İhtiyacınıza uygun kontör paketini yükleyin."], ["Program bağlantısı", "Belge ayarını programda açın ve göndermeye başlayın."]])),
    closing("e-Dönüşüme birlikte geçelim"),
  ]);
}

const ECO: Card[] = [
  ["Merkez ERP", "Satış, stok, muhasebe ve e-ticaret tek güçlü platformda.", "merkez-erp"],
  ["MRP Üretim", "Hammaddeden nihai ürüne tüm üretim adımları tek merkezde.", "uretim-mrp"],
  ["CRM", "İlişkileri güçlendirir, fırsatları görünür kılar.", "crm"],
  ["İnsan Kaynakları", "İşe alım, puantaj, bordro ve performans tek platformda.", "insan-kaynaklari"],
  ["Muhasebe", "Genel muhasebe, cari ve finans entegre ve düzenli.", "muhasebe"],
  ["e-Dönüşüm", "e-Fatura, e-Arşiv ve e-İrsaliye mevzuata uyumlu.", "e-donusum"],
  ["Sektörel Yazılımlar", "Perakendeden hizmete her sektöre özel akış.", "sektorel"],
  ["Bulut Yazılımlar", "Mekândan bağımsız, her cihazdan güvenle.", "bulut"],
  ["e-Ticaret", "Stok, sipariş ve fiyat ERP ile anlık eşitlenir.", "e-ticaret"],
].map(([title, t, slug]) => ({ title: title!, text: t!, href: `/tr/${slug}` }));

const NEWS: Card[] = [
  { title: "Bölge müdürlüğü çözüm ortağı ziyaretleri", text: "Çözüm ortaklarımızla bölge buluşmaları tamamlandı.", art: "haber-1", href: "/tr/bolge-mudurlugu-cozum-ortagi-ziyaretleri", cta: "Haberi oku" },
  { title: "Bilişim zirvesinde teknoloji ve inovasyon", text: "Zirvede yazılım ve yapay zekâ konuşuldu.", art: "haber-2", href: "/tr/bilisim-zirvesinde-teknoloji-ve-inovasyon", cta: "Haberi oku" },
  { title: "Girişimcilik zirvesi semineri", text: "Katılımcılarla dijital dönüşüm semineri yapıldı.", art: "haber-3", href: "/tr/girisimcilik-zirvesi-semineri", cta: "Haberi oku" },
];

const home = page(YF_DEMO_HOME_SLUG, "ERP, Muhasebe, CRM ve Bulut Yazılım Çözümleri", `${BRAND}: ERP, muhasebe, CRM, e-dönüşüm ve bulut çözümleri tek vitrinde. Tema demosu; tüm metinler düzenlenebilir.`, [
  hero("ERP, Muhasebe, CRM ve Bulut Yazılım Çözümleri", "31 yıllık deneyim, 190.000'den fazla kullanıcı. İşletmenize özel yazılım çözümleri.", ["Demo Talebi", "/tr/ucretsiz-tanitim"], ["Tüm çözümler", "/tr/programlar"], "31 yıllık deneyim"),
  band("dark", [image("dashboard", "Yönetim paneli örneği", true)], true, 0),
  band("navy", [heading("İşinizi Yöneten Teknoloji", "center"), text("Yapay zekâ destekli ERP. Geleceği bugünden deneyimleyin!"), button("Deneyimi Başlat", "/tr/merkez-erp", "outline", "center")], true, 64),
  band("", [heading("e-Dönüşüm Uygulamaları", "center"), text("İş süreçlerinizi kâğıttan dijitale, güvenle taşıyoruz."), ...cards(EDOCS.slice(0, 4).map((d) => ({ title: d.title, text: d.lead, art: d.art, href: `/tr/${d.slug}` })), 4)], true),
  band("soft", [...cards([
    { title: "Bulut ERP", text: "Bulutta yönetin.", art: "bulut", href: "/tr/bulut-erp", cta: "Ücretsiz dene" },
    { title: "e-Ticaret", text: "Mağazanız 7/24 açık.", art: "eticaret", href: "/tr/e-ticaret", cta: "Paketleri incele" },
    { title: "Mobil çözümler", text: "Teknoloji cebinizde.", art: "mobil", href: "/tr/diger-cozumler", cta: "Detaylı bilgi" },
    { title: "Sektörel", text: "İşinize tam uyum.", art: "sektor", href: "/tr/sektorel", cta: "Programları incele" },
  ], 4)], true),
  band("dark", [heading("Merkez Farkı", "center"),
    stats([["31", "Yıllık deneyim"], ["4", "Yerleşke"], ["52", "Ülkede yapılanma"], ["1.270", "Çözüm ortağı"]]),
    stats([["143", "Farklı sektör"], ["16", "Dil seçeneği"], ["196.000", "Mutlu müşteri"], ["839", "Seminer ve organizasyon"]]),
    stats([["399", "Üretilen robot"], ["112", "Alınan ödül"], ["194", "Kurumsal işbirliği"], ["4.992", "Saha personeli"]]),
  ], true),
  band("", [row([
    column([image("sektor", "Sektörel çözüm örneği")]),
    column([
      heading("Tüm iş süreçleriniz tek bir sistemde."),
      text("Karmaşaya veda edin, kontrole hoş geldiniz. Eğitimden sağlığa, turizmden lojistiğe her sektörün ihtiyacı tek platformda."),
      iconList([["Eğitim", "Kurs, öğrenci ve ödeme planı."], ["Sağlık", "Hasta, randevu ve tedavi."], ["Turizm", "Otel ve rezervasyon."], ["Perakende", "Barkodlu satış ve stok."], ["Üretim", "Reçete, iş emri ve maliyet."]]),
      button("Sektörel çözümler", "/tr/sektorel"),
    ]),
  ], "6+6", "center")]),
  band("soft", [showcase("carousel", 6, "Fırsatları Keşfet"), button("Tüm kampanyalar", "/tr/kampanyalar", "outline", "center")], true),
  band("", [heading("Yarın İçin Tasarlandı", "center"), text(`${BRAND}, 1995'ten bugüne: kurumsal, sektörel ve bulut tabanlı yazılımlar, dijital dönüşümün eşlikçisi.`), ...cards(ECO)], true),
  band("soft", [faq(`${BRAND} hakkında sık sorulanlar`, [
    [`${BRAND} nedir?`, "1995'te kurulan yerli kurumsal yazılım firmasıdır. ERP, muhasebe, e-dönüşüm ve sektörel yazılımlar geliştirir. Bu metin demo içeriğidir."],
    ["Demo veya ücretsiz deneme var mı?", "Evet. Ücretsiz tanıtım sayfasından talep edebilir ya da bizi arayabilirsiniz."],
    ["Hangi entegrasyonlar destekleniyor?", "Gelir idaresi e-belgeleri, kargo firmaları, pazaryerleri ve sanal POS bağlantıları."],
    ["Mobil cihazlarda çalışır mı?", "Bulut ürünleri tarayıcıdan açılır; ERP için mobil uygulama vardır."],
  ])]),
  band("", [heading("Medya merkezinden", "center"), ...cards(NEWS)], true),
  wrap(cta("Sizi arayalım", "Bilgilerinizi bırakın, uzman ekibimiz sizi arasın.", "Ücretsiz tanıtım", "/tr/ucretsiz-tanitim")),
]);

const programs = indexPage("programlar", "Tüm Çözümlerimiz", "ERP, muhasebe, bulut, e-dönüşüm ve sektörel programların tamamı.", "dashboard", [
  ...(Object.values(GROUPS).filter((g) => g.slug !== "diger-cozumler").map((g) => ({ title: g.title, text: g.lead, art: g.art, href: `/tr/${g.slug}` }))),
  { title: "e-Dönüşüm", text: "e-Fatura, e-Arşiv, e-İrsaliye, e-Defter ve e-Mutabakat.", art: "fatura", href: "/tr/e-donusum" },
  { title: "Diğer Çözümler", text: GROUPS.diger.lead, art: "mobil", href: "/tr/diger-cozumler" },
], "Tüm programlar");

const groupPages = (["erp", "muhasebe", "bulut", "sektorel", "diger"] as Group[]).map((k) =>
  indexPage(GROUPS[k].slug, GROUPS[k].title, GROUPS[k].lead, GROUPS[k].art, inGroup(k).map(productCard), GROUPS[k].title));

const edonusum = indexPage("e-donusum", "e-Dönüşüm", "e-Dönüşüm artık herkesin hayatında: kâğıt yok, zaman kaybı yok, karmaşa yok.", "fatura",
  EDOCS.map((d) => ({ title: d.title, text: d.lead, art: d.art, href: `/tr/${d.slug}` })), "e-Dönüşüm");

const about = page("kurumsal", "Biz MerkezSoft'uz", "Kuruluş öyküsü, rakamlarla firma ve vizyon. Metinler örnektir; kendi hikâyenizle değiştirin.", [
  ...intro("Biz MerkezSoft'uz", "Yerli yazılım üreticisi: 1995'ten bugüne kendi öz sermayesiyle büyüyen firma. Metin örnektir.", "ofis", ["İletişim", "/tr/iletisim"], "Gelecek seninle"),
  band("", [heading("Rakamlarla firma", "center"), stats([["1995", "Kuruluş"], ["81", "İlde hizmet"], ["52", "Ülkede yapılanma"], ["120+", "Yazılım"]])], true),
  band("soft", [heading("Bir başarı hikâyesi", "center"), steps("Kuruluştan bugüne", [["15 m²'lik ofis", "Küçük bir odada ilk programlar yazıldı."], ["Şirketleşme", "Kurumsal yapı ve ilk bayi ağı kuruldu."], ["Yurt dışına açılma", "Çok dilli ürünler ve yeni ülkeler."]])]),
  band("", [heading("Geniş ürün yelpazesi", "center"), text("Masaüstü, bulut ve mobil ERP, muhasebe, ticari ve sektörel programlardan oluşan yüzden fazla yazılım."), ...cards([
    { title: "Ürünler", text: "Tüm çözümler tek listede.", href: "/tr/programlar" },
    { title: "Çözüm ortakları", text: "Ülke genelinde satış ve destek ağı.", href: "/tr/cozum-ortaklari" },
    { title: "Medya merkezi", text: "Haberler, etkinlikler, basın.", href: "/tr/medya-merkezi" },
  ])], true),
  closing("Bizimle çalışın"),
], "AboutPage");

const partners = page("cozum-ortaklari", "Çözüm Ortaklarımız", "Çözüm ortağı ağı, avantajları ve başvuru formu. Demo içeriktir.", [
  ...intro("Çözüm Ortaklarımız", "Türkiye ve dünya genelinde yaygın satış kanallarımız, eğitim merkezlerimiz ve destek noktalarımızla yanınızdayız.", "harita", ["İletişim", "/tr/iletisim"], "Gelecek seninle"),
  band("", [heading("Neden çözüm ortağı olmalı?", "center"), ...cards([
    { title: "Güçlü marka", text: "Tanınan ürün ailesiyle satış yapın." }, { title: "Eğitim ve destek", text: "Düzenli eğitim ve teknik destek alın." }, { title: "Bonus dönemleri", text: "Başarıyı ödüllendiren dönem programları." },
  ])], true),
  band("soft", [steps("Başvuru adımları", [["Formu doldurun", "Bilgilerinizi iletin."], ["Görüşme", "Bölge ekibi sizi arar."], ["Sözleşme ve eğitim", "Süreç tamamlanınca satışa başlayın."]])]),
  band("", [heading("Çözüm ortağı başvurusu", "center"), form("Başvuru formu", [["ad", "Ad soyad", "text"], ["firma", "Firma", "text"], ["tel", "Telefon", "tel"], ["eposta", "E-posta", "email"], ["sehir", "Şehir", "text"], ["not", "Kısaca kendinizden bahsedin", "textarea", "full"]], "Başvur")], true),
]);

const media = page("medya-merkezi", "Medya Merkezi", "Haber, etkinlik ve basın bültenleri. Haberler örnek içeriktir.", [
  hero("Medya Merkezi", "Etkinlikler, zirveler ve basın bültenleri.", TRY, undefined, "Haberler"),
  band("", [...cards(NEWS), button("Blog yazıları", "/tr/blog", "outline", "center")], true),
]);

const blog = page("blog", "Blog", "Üretim, e-dönüşüm ve yazılım seçimi üzerine örnek blog yazıları.", [
  hero("Blog", "İşletmeler için ERP, muhasebe ve e-dönüşüm rehberleri.", TRY, undefined, "Blog"),
  band("", [posts()], false),
]);

const faqPage = page("sikca-sorulan-sorular", "Sıkça Sorulan Sorular", "Destek, demo, entegrasyon, sektör ve mobil kullanım üzerine sık sorulanlar.", [
  hero("Sıkça Sorulan Sorular", "Destek, demo ve ürünler hakkında en çok sorulanlar.", TRY, undefined, "Destek"),
  wrap(faq("Genel sorular", [
    ["Müşteri desteği nasıl alınır?", `Telefon: 444 00 00 · Müşteri portalı · Bilgi bankası · Canlı destek · E-posta: bilgi@merkezsoft.example (örnek).`],
    ["Demo veya ücretsiz deneme sunuyor musunuz?", "Evet. Ücretsiz tanıtım sayfasından talep edebilirsiniz."],
    ["Hangi entegrasyonları destekliyorsunuz?", "e-Dönüşüm, kargo, pazaryeri ve sanal POS bağlantıları."],
    ["Hangi sektörlere yazılım üretiyorsunuz?", "Perakende, üretim, restoran, otel, sağlık, eğitim, akaryakıt, otopark, emlak ve daha fazlası."],
    ["Mobil cihazlarda çalışır mı?", "Bulut ürünleri tarayıcıdan açılır; ERP için mobil uygulama vardır."],
    ["Şirket ne zaman kuruldu?", "1995 (demo bilgisi)."],
  ])),
  closing(),
]);

const support = page("destek-asistani", "Destek Asistanınız", "Bilgi bankası, SSS, lisans sistemi ve iletişim kanalları tek sayfada.", [
  ...intro("Destek Asistanınız", "Sorununuza en hızlı çözüm: bilgi bankası, video yardım ve uzman destek.", "crm", ["İletişim", "/tr/iletisim"], "Destek"),
  band("", [...cards([
    { title: "Bilgi bankası", text: "Adım adım çözüm makaleleri.", href: "/tr/blog" }, { title: "Sıkça sorulan sorular", text: "En çok sorulanlar.", href: "/tr/sikca-sorulan-sorular" },
    { title: "Destek talebi", text: "Uzmana ulaşın.", href: "/tr/iletisim" }, { title: "İstek ve öneri", text: "Fikrinizi iletin.", href: "/tr/istek-oneri" },
    { title: "Ücretsiz tanıtım", text: "Programı birlikte inceleyelim.", href: "/tr/ucretsiz-tanitim" }, { title: "Destek masası", text: "Canlı destek yazılımı.", href: "/tr/destek-masasi" },
  ])], true),
]);

const perks = page("avantajlar-dunyasi", "Avantajlar Dünyası", "Kullanıcılara özel anlaşmalı kurum indirimleri. Örnek içeriktir.", [
  hero("Avantajlar Dünyası", "Müşterilerimize özel anlaşmalı marka avantajları. Örnek içeriktir.", TRY, undefined, "Ayrıcalıklar"),
  band("", [...cards([
    { title: "Donanım avantajı", text: "Anlaşmalı donanım markalarında özel fiyat." }, { title: "Eğitim avantajı", text: "Sertifika programlarında indirim." }, { title: "Seyahat avantajı", text: "Konaklamada kurumsal oranlar." },
  ])], true),
]);

const contact = page("iletisim", "İletişim", "Merkez ve bölge ofislerinin örnek adresleri ve iletişim formu.", [
  ...intro("İletişim", `Bağlantıda kalın: ${BRAND} uzmanları size yardımcı olsun. Adresler örnektir.`, "harita", undefined, "Bize ulaşın"),
  band("", [heading("Ofislerimiz", "center"), ...cards([
    { title: "Genel merkez", text: "Örnek Mahallesi, Yazılım Caddesi No: 1 — Konya\nTel: 0332 000 00 00 · 444 00 00" },
    { title: "İstanbul bölge müdürlüğü", text: "Örnek Mahallesi, E-5 Yan Yol No: 100 — İstanbul\nTel: 0212 000 00 00 · 444 00 00" },
    { title: "Ar-Ge merkezi", text: "Örnek Mahallesi, Teknoloji Sokağı No: 5 — Konya\nTel: 0332 000 00 01 · 444 00 00" },
  ])], true),
  band("soft", [heading("Bize ulaşın", "center"), form("İletişim formu", [["ad", "Ad soyad", "text"], ["tel", "Telefon", "tel"], ["eposta", "E-posta", "email"], ["konu", "Konu", "text"], ["mesaj", "Mesajınız", "textarea", "full"]], "Gönder")], true),
], "ContactPage");

const demoRequest = page("ucretsiz-tanitim", "Ücretsiz Tanıtım", "Program tanıtımı için talep formu. İşletmenize özel çözümler.", [
  hero("Ücretsiz Tanıtım", "İşletmenize özel çözümler burada. Formu doldurun, uzmanımız sizi arasın.", ["Sorulara git", "/tr/sikca-sorulan-sorular"], undefined, "Demo talebi"),
  band("soft", [form("Tanıtım talep formu", [["program", "Program adı", "text"], ["ad", "Ad soyad", "text"], ["tel", "Telefon", "tel"], ["eposta", "E-posta", "email"], ["sehir", "Şehir", "text"], ["onay", "Aydınlatma metnini okudum ve anladım.", "checkbox", "full"]], "Formu gönder")]),
]);

const legal = (slug: string, title: string) => page(slug, title, `${title}: örnek metin. Kendi hukuki metninizle değiştirin.`, [
  hero(title, "Bu sayfa örnek metindir; yayına almadan önce kendi metninizle değiştirin.", TRY, undefined, "Hukuki"),
  band("", [text("Bu sayfa tema demosuyla gelir. Veri sorumlusu, işleme amaçları, saklama süreleri ve başvuru yolları burada anlatılır."), heading("Kapsam"), text("Metin yalnızca yerleşimi göstermek içindir; hukuki geçerliliği yoktur."), heading("İletişim"), text("Sorularınız için iletişim sayfasındaki formu kullanabilirsiniz.")], false, 40),
]);

const suggestion = page("istek-oneri", "İstek ve Öneri", "Görüş, istek ve önerilerinizi ileten form.", [
  hero("İstek ve Öneri", "Fikirleriniz ürünlerimizi şekillendirir.", TRY, undefined, "Geri bildirim"),
  band("soft", [form("İstek ve öneri formu", [["ad", "Ad soyad", "text"], ["eposta", "E-posta", "email"], ["konu", "Konu", "text", "full"], ["mesaj", "Mesajınız", "textarea", "full"]], "Gönder")]),
]);

/** Yazı: yerleşik makale düzeni (başlık, tarih, kenar çubuğu). Öne çıkan görsel ve kategori `POST_META` ile eklenir. */
const article = (slug: string, title: string, summary: string, paragraphs: [string, string, string]) =>
  entry("post", slug, title, summary, [
    text(paragraphs[0]), heading("Neden önemli?"), text(paragraphs[1]), heading("Ne yapmalı?"), text(paragraphs[2]),
    wrap(cta("Size özel çözümü birlikte kuralım", "Bilgilerinizi bırakın, uzman ekibimiz sizi arasın.")),
  ]);

const POSTS: ThemeDemoEntry[] = [
  article("uretim-isletmelerinde-kapasite-planlamasi", "Üretim işletmelerinde kapasite planlaması nasıl yapılır?", "Makine, vardiya ve sipariş yükünü dengeleyen kapasite planlamasının üç temel adımı.",
    ["Kapasite planı, siparişlerin hangi makinede, hangi vardiyada üretileceğini önceden gösterir. Plan yoksa gecikme sonradan fark edilir.", "Planlı üretim, fazla mesaiyi ve bekleyen siparişi azaltır; stok maliyetini düşürür.", "Önce makine saatlerini girin, ardından ürün reçetelerini bağlayın ve haftalık yük raporunu inceleyin."]),
  article("dijital-fatura-arsivi-neden-onemli", "Dijital fatura arşivi neden önemli?", "Yasal saklama süresi boyunca faturaya anında erişmenin işletmeye kazandırdıkları.",
    ["Dijital arşiv, faturaların aranabilir ve güvenli biçimde saklanmasıdır.", "Denetimde belgeye dakikalar içinde ulaşır, kâğıt arşiv maliyetinden kurtulursunuz.", "Faturaları program üzerinden gönderin; arşivleme otomatik yapılır."]),
  article("yazilim-secerken-hangi-kriterlere-bakilmali", "Yazılım seçerken hangi kriterlere bakılmalı?", "ERP seçerken esneklik, destek, entegrasyon ve toplam maliyet kriterleri.",
    ["Yazılım seçimi, işletmenin birkaç yıllık iş akışını belirler.", "Yanlış seçim, geçiş maliyeti ve veri kaybı riski doğurur.", "Demo isteyin, referans sorun, lisans modelini ve destek kanallarını karşılaştırın."]),
  article("e-donusume-gecis-rehberi", "e-Dönüşüme geçiş rehberi", "Başvuru, kontör ve program bağlantısını sıraya koyan kısa rehber.",
    ["e-Dönüşüm; e-Fatura, e-Arşiv, e-İrsaliye ve e-Defteri kapsar.", "Sıra bozulursa belgeler taslakta kalır.", "Önce mükellefiyet, sonra kontör, en son programdaki belge ayarı."]),
  article("bulut-erp-mi-masaustu-erp-mi", "Bulut ERP mi, masaüstü ERP mi?", "Kurulum, maliyet ve erişim açısından iki modelin karşılaştırması.",
    ["Bulut ERP tarayıcıdan açılır; masaüstü ERP işletmenin sunucusunda çalışır.", "Küçük işletmeler kurulumsuz başlangıçtan, büyük işletmeler özel yapılandırmadan fayda görür.", "Ekip sayısı, şube durumu ve bütçeyi yazın, iki seçeneği demoyla deneyin."]),
  article("kobi-icin-on-muhasebe", "KOBİ için ön muhasebe nasıl kurulur?", "Cari, stok ve kasa kayıtlarını düzenli tutmanın pratik yolu.",
    ["Ön muhasebe, günlük fiş ve hareketlerin tutulduğu yerdir.", "Düzenli kayıt, dönem sonunda muhasebeciye giden işi azaltır.", "Cari ve stok kartlarını önce açın; banka ve kasa hareketlerini her gün girin."]),
  article("bolge-mudurlugu-cozum-ortagi-ziyaretleri", "Bölge müdürlüğü çözüm ortağı ziyaretleri", "Çözüm ortaklarıyla yapılan bölge buluşmalarının özeti (örnek haber).",
    ["Bölge ekibi çözüm ortaklarını ziyaret ederek yeni sürümleri tanıttı.", "Ziyaretler, sahadaki ihtiyaçları doğrudan dinlemek içindir.", "Bir sonraki dönemde eğitim takvimi paylaşılacaktır. Bu haber örnektir."]),
  article("bilisim-zirvesinde-teknoloji-ve-inovasyon", "Bilişim zirvesinde teknoloji ve inovasyon", "Zirvede yazılım ve yapay zekâ üzerine yapılan konuşmanın özeti (örnek haber).",
    ["Zirvede yerli yazılımın geleceği ve yapay zekâ destekli ERP konuşuldu.", "Katılımcılar uygulamalı örnekleri yerinde inceledi.", "Sunum notları blogda paylaşılacaktır. Bu haber örnektir."]),
  article("girisimcilik-zirvesi-semineri", "Girişimcilik zirvesi semineri", "Girişimcilerle yapılan dijital dönüşüm semineri (örnek haber).",
    ["Seminerde küçük işletmelerin dijital dönüşüm adımları anlatıldı.", "Katılımcılar bulut yazılımların maliyet avantajını tartıştı.", "Bir sonraki seminer duyurulacaktır. Bu haber örnektir."]),
];

const POST_META: Array<[string, string]> = [
  ["erp", "Üretim"], ["fatura", "e-Dönüşüm"], ["dashboard", "Rehber"], ["arsiv", "e-Dönüşüm"], ["bulut", "Bulut"], ["muhasebe", "Muhasebe"],
  ["haber-1", "Haberler"], ["haber-2", "Haberler"], ["haber-3", "Haberler"],
];
POSTS.forEach((entry, i) => {
  const [art, category] = POST_META[i]!;
  entry.canvas = false;
  entry.image = `${YF_ART}/${art}.svg`;
  entry.categories = [category];
});

/** Referans sitenin yapısı: ana sayfa, grup ve ürün sayfaları, e-dönüşüm, kampanya, kurumsal, iletişim ve yazılar. */
export const YF_DEMO: ThemeDemoPack = {
  themeId: YF_THEME_ID,
  homeSlug: YF_DEMO_HOME_SLUG,
  title: "Yazılım Firması vitrin demosu",
  summary: `Ana sayfa, ${PRODUCTS.length} ürün ve sektör sayfası, e-dönüşüm, kampanya, kurumsal, iletişim, formlar ve ${POSTS.length} yazı. Görseller temsilidir.`,
  entries: [home, programs, ...groupPages, edonusum, ...PRODUCTS.map(productPage), ...EDOCS.map(edocPage), ...CAMPAIGN_ENTRIES, about, partners, media, blog, faqPage, support, perks, contact, demoRequest, suggestion, legal("gizlilik-politikasi", "Gizlilik Politikası"), legal("kullanim-kosullari", "Kullanım Koşulları"), ...POSTS],
};
