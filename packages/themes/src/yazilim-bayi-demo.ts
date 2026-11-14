import type { BlockNode } from "@nexpress/core";
import { YB_ADDRESS, YB_ART, YB_BRAND, YB_EMAIL, YB_HOME_SLUG, YB_PHONE, YB_THEME_ID } from "./yazilim-bayi";
import {
  band, button, cards as baseCards, column, cta as baseCta, faq, form, heading, image as baseImage, posts, row, showcase, steps, table, text, tldr,
  type Card,
} from "./yazilim-firmasi-kit";
import type { ThemeDemoEntry, ThemeDemoPack } from "./demo-pack";

/**
 * Yazılım Bayi demo vitrini: bir yazılım markasının yetkili bayi sitesi.
 * Kurgu: sol metin + sağ görsel mozaikli vitrin, altı kartlı çözüm ızgarası, mavi "demo / hemen ara" bandı,
 * muhasebe, sektörel ve e-dönüşüm şeritleri, kampanyalar, SSS ve son yazılar.
 * Marka, sayı ve adresler örnektir (panelde "Demo verisi" etiketi taşır); görseller temsili çizimlerdir.
 * Adresler `yb-` önekiyle başlar ve mevcut sayfalarla çakışmaz.
 */
const DEMO: [string, string] = ["Demo Talebi", "/tr/yb-demo-talebi"];

let seq = 0;
const node = (type: string, props: Record<string, unknown>, extra: Partial<BlockNode> = {}): BlockNode =>
  ({ id: `yb_${++seq}`, type, props, ...extra }) as BlockNode;

const image = (name: string, alt: string, wide = false) => baseImage(name, alt, wide, YB_ART);
const cards = (items: Card[], per = 3) => baseCards(items, per, YB_ART);
const cta = (title: string, subtitle: string, label = "Demo Talebi", href = "/tr/yb-demo-talebi") => baseCta(title, subtitle, label, href);
const wrap = (...children: BlockNode[]) => band("", children, false, 36);
const closing = (title = "Size özel çözümü birlikte kuralım", subtitle = "Bilgilerinizi bırakın, uzman ekibimiz sizi arasın.") => wrap(cta(title, subtitle));

/** Bant dışı, kutulu bölüm (köşeleri yuvarlak panel, kart, mavi bant). */
const panel = (cls: string, children: BlockNode[]): BlockNode => node("section", { containerMode: "boxed" }, { children, style: { cssClass: cls } });
const checks = (items: Array<[string, string]>) =>
  node("paragraph_element", { html: items.map(([label, slug]) => `<a href="/tr/${slug}">${label}</a>`).join(" ") }, { style: { cssClass: "yb-checks" } });
const solutionCard = (icon: string, title: string, textValue: string, slug: string) =>
  node("info_box", { icon, title, text: textValue, href: `/tr/${slug}`, linkLabel: "İncele" }, { style: { cssClass: "yb-card" } });

const entry = (type: "page" | "post", slug: string, title: string, tldrText: string, blocks: BlockNode[], schemaType = type === "post" ? "BlogPosting" : "WebPage"): ThemeDemoEntry =>
  ({ type, slug, title, tldr: tldrText, schemaType, blocks });
const page = (slug: string, title: string, summary: string, blocks: BlockNode[], schemaType?: string) => entry("page", slug, title, summary, blocks, schemaType);

/** Tek `hero` (sayfanın h1'i). `mosaic` verilirse vitrin sağında üç görsel çizilir. */
const pageHead = (title: string, lead: string, badge: string, mosaic?: string[], secondary?: [string, string]): BlockNode =>
  node("hero", {
    badge,
    title,
    subtitle: lead,
    primaryCtaLabel: DEMO[0],
    primaryCtaHref: DEMO[1],
    ...(secondary ? { secondaryCtaLabel: secondary[0], secondaryCtaHref: secondary[1] } : {}),
    ...(mosaic ? { mosaic: mosaic.map((name) => `${YB_ART}/${name}.svg`) } : {}),
  }, { style: { fullWidth: true } });

interface Product { slug: string; title: string; group: "muhasebe" | "erp" | "bulut" | "edonusum" | "sektorel"; art: string; lead: string; modules: Array<[string, string]> }
const P = (slug: string, title: string, group: Product["group"], art: string, lead: string, ...modules: Array<[string, string]>): Product => ({ slug: `yb-${slug}`, title, group, art, lead, modules });

const PRODUCTS: Product[] = [
  P("on-muhasebe", "Ön Muhasebe Programı", "muhasebe", "muhasebe", "Cari, stok, kasa, banka ve fatura işlemleri tek ekranda, düzenli ve izlenebilir.", ["Cari ve stok", "Müşteri, tedarikçi ve ürün kartları."], ["Fatura ve irsaliye", "e-belge uyumlu belge akışı."], ["Kasa ve banka", "Hareketler ve mutabakat."]),
  P("genel-muhasebe", "Genel Muhasebe Programı", "muhasebe", "muhasebe", "Hesap planı, mizan, bilanço ve yasal defterler dönem sonuna kalmadan hazır.", ["Hesap planı ve fiş", "Toplu fiş girişi ve mahsup."], ["Mizan ve bilanço", "Dönem raporları anında."], ["Yasal defterler", "e-Defter hazırlığı otomatik."]),
  P("bulut-muhasebe", "Bulut Muhasebe", "muhasebe", "bulut", "Muhasebe verinize her cihazdan, kurulum gerektirmeden ulaşın.", ["Her yerden erişim", "Tarayıcıdan ve mobilden aynı veri."], ["Mali müşavir paylaşımı", "Müşavirinizle ortak çalışın."], ["Otomatik yedek", "Veriniz düzenli yedeklenir."]),
  P("erp-cozumu", "ERP Çözümü", "erp", "erp", "Satış, stok, üretim ve finans tek veritabanında çalışır.", ["Satış ve satın alma", "Teklif, sipariş ve irsaliye akışı."], ["Stok ve depo", "Çoklu depo, seri/lot takibi."], ["Raporlama", "Yönetim panosu ve özel raporlar."]),
  P("crm", "CRM Müşteri Yönetimi", "erp", "erp", "Müşteri görüşmelerini, teklifleri ve fırsatları tek yerden izleyin.", ["Fırsat takibi", "Satış hunisi aşamaları."], ["Teklif yönetimi", "Tekliften siparişe tek tık."], ["Hatırlatmalar", "Takip tarihleri kaçmaz."]),
  P("uretim-mrp", "Üretim Yönetimi (MRP)", "erp", "sektor-2", "Reçete, iş emri ve kapasite planlamasıyla üretimi kontrol altına alın.", ["Reçete ve iş emri", "Ürün ağacı ve fire takibi."], ["Kapasite planı", "Makine ve vardiya yükü."], ["Maliyet analizi", "Planlanan ve gerçekleşen maliyet."]),
  P("insan-kaynaklari", "İnsan Kaynakları Yönetimi", "erp", "ofis", "Özlük, izin, puantaj ve bordro tek akışta.", ["Özlük ve izin", "Personel dosyası ve bakiyeler."], ["Puantaj", "Devamdan maaşa otomatik akış."], ["Bordro", "Kesinti ve ek ödemeler."]),
  P("restoran", "Restoran Yönetimi Programı", "sektorel", "sektor-1", "Adisyon, mutfak ekranı, paket servis ve stok takibi bir arada.", ["Adisyon ve masa", "Hızlı sipariş ve hesap bölme."], ["Mutfak ekranı", "Siparişler mutfağa anında düşer."], ["Stok ve reçete", "Malzeme tüketimi otomatik."]),
  P("hizli-satis", "Hızlı Satış Programı", "sektorel", "sektor-3", "Barkodlu satış, kasa ve çok şube tek programda.", ["Barkodlu satış", "Hızlı kasa ekranı."], ["Çok şube", "Şube stoğu ve transfer."], ["Kasa raporu", "Gün sonu kapanışı."]),
  P("otel", "Otel Yönetimi Programı", "sektorel", "sektor-1", "Rezervasyon, resepsiyon, oda durumu ve folyo yönetimi.", ["Rezervasyon", "Oda ve doluluk takvimi."], ["Resepsiyon", "Giriş, çıkış ve folyo."], ["Raporlar", "Doluluk ve gelir analizi."]),
  P("servis", "Servis Programı", "sektorel", "sektor-2", "Servis kaydı, parça ve teknisyen takibini düzenleyin.", ["Servis kaydı", "Arıza ve işlem geçmişi."], ["Parça takibi", "Stoktan düşüm otomatik."], ["Teknisyen planı", "Görev ve süre takibi."]),
  P("surucu-kursu", "Sürücü Kursu Otomasyonu", "sektorel", "ofis", "Kursiyer, ders programı ve ödeme takibi tek yerde.", ["Kursiyer kaydı", "Dosya ve evrak takibi."], ["Ders programı", "Araç ve eğitmen planı."], ["Ödeme planı", "Taksit ve tahsilat."]),
  P("e-fatura", "e-Fatura", "edonusum", "edonusum", "e-Fatura gönderimi, alımı ve durum takibi programdan çıkmadan.", ["Gönderim ve alım", "Tek ekrandan yönetim."], ["Durum takibi", "Kabul ve red bilgisi anında."], ["GİB entegrasyonu", "Kurulumda yardım."]),
  P("e-arsiv", "e-Arşiv Fatura", "edonusum", "edonusum", "Bireysel müşterilere dijital fatura, e-posta ile gönderim.", ["Toplu gönderim", "Faturalar tek seferde iletilir."], ["Arşiv", "Yasal saklama otomatik."], ["Rapor", "Günlük özet raporu."]),
  P("e-irsaliye", "e-İrsaliye", "edonusum", "edonusum", "Sevkiyat belgesi dijital olarak üretilir ve iletilir.", ["Anlık belge", "İrsaliye faturaya dönüşür."], ["Alıcı yanıtı", "Teslim onayı izlenir."], ["Entegre akış", "Stok hareketi otomatik."]),
  P("e-defter", "e-Defter", "edonusum", "edonusum", "Yevmiye ve kebir defterleri dönemlik hazırlanır ve onaylanır.", ["Defter üretimi", "Muhasebe kayıtlarından otomatik."], ["Berat", "Dönem sonu onay akışı."], ["Saklama", "Yasal süre boyunca arşiv."]),
  P("e-ticaret", "e-Ticaret Çözümü", "bulut", "sektor-1", "Mağazanız 7/24 açık; stok ve sipariş programla eşitlenir.", ["Mağaza", "Ürün ve kampanya yönetimi."], ["Pazaryeri", "Tek panelden sipariş."], ["Stok eşitleme", "Fiyat ve stok anlık."]),
  P("yedekleme", "Yedekleme Programı", "bulut", "yedek", "Verilerinizi otomatik olarak güvenli şekilde yedekleyin.", ["Zamanlanmış yedek", "Gece otomatik çalışır."], ["Geri yükleme", "Tek adımda eski sürüme dönün."], ["Şifreli saklama", "Veri güvenle tutulur."]),
];

const GROUPS: Record<Product["group"], { slug: string; title: string; lead: string; art: string }> = {
  muhasebe: { slug: "yb-muhasebe", title: "Muhasebe Programları", lead: "Ön muhasebeden genel muhasebeye, bulut muhasebeye kadar her ölçekte işletme için.", art: "muhasebe" },
  erp: { slug: "yb-erp", title: "ERP Çözümleri", lead: "İşletmeniz için her detay düşünülmüş kurumsal kaynak planlaması.", art: "erp" },
  sektorel: { slug: "yb-sektorel", title: "Sektörel Programlar", lead: "Her sektörün kendi iş akışına uygun, hazır modüller.", art: "sektor-1" },
  edonusum: { slug: "yb-e-donusum", title: "e-Dönüşüm", lead: "e-Fatura, e-Arşiv, e-İrsaliye ve e-Defter tek yazılımda.", art: "edonusum" },
  bulut: { slug: "yb-bulut", title: "Bulut Yazılımlar", lead: "Bulut tabanlı yazılımlarla işinizi her yerden yönetin.", art: "bulut" },
};

const productCard = (p: Product): Card => ({ title: p.title, text: p.lead, art: p.art, href: `/tr/${p.slug}` });

function productPage(p: Product): ThemeDemoEntry {
  const g = GROUPS[p.group];
  return page(p.slug, `${p.title}`, `${p.lead} Modüller örnek anlatımdır; kendi ürün bilginizle değiştirin.`, [
    pageHead(p.title, p.lead, g.title, undefined, [g.title, `/tr/${g.slug}`]),
    wrap(tldr(`${p.title}: ${p.lead}`)),
    band("", [heading("Neler sunar?", "center"), ...cards(p.modules.map(([title, t]) => ({ title, text: t })))], true),
    band("soft", [row([column([image(p.art, p.title)], "yb-panel"), column([
      heading(`${p.title} kimler için uygun?`),
      text("Küçük işletmeden çok şubeli kuruma kadar her ölçekte kullanılabilir. Kurulum, eğitim ve sonrası destek bayi ekibimizle yürütülür."),
      node("icon_list", { items: [{ icon: "check-circle", title: "Ücretsiz demo kurulumu", text: "Önce deneyin, sonra karar verin." }, { icon: "check-circle", title: "Yerinde eğitim", text: "Ekibinize uygulamalı eğitim." }, { icon: "check-circle", title: "Kesintisiz destek", text: "Telefon ve uzaktan bağlantı." }] }),
      button("Demo Talebi", DEMO[1]),
    ])], "6+6", "center")]),
    wrap(faq(`${p.title} sık sorulanlar`, [
      ["Demo kurulumu ücretsiz mi?", "Evet. Demo talep formunu doldurun, ekibimiz sizi arayıp deneme ortamı kursun."],
      ["Mevcut verilerimi aktarabilir miyim?", "Cari, stok ve hesap kartları tablo dosyasından içe aktarılır."],
      ["Eğitim ve destek var mı?", "Kurulumda eğitim verilir; sonrasında telefon ve uzaktan bağlantı ile destek sürer."],
    ])),
    closing(),
  ]);
}

function groupPage(key: Product["group"]): ThemeDemoEntry {
  const g = GROUPS[key];
  return page(g.slug, g.title, `${g.lead} Her kart ayrı bir ürün sayfasına gider.`, [
    pageHead(g.title, g.lead, "Çözümler", undefined, ["Tüm çözümler", "/tr/yb-cozumler"]),
    band("", [...cards(PRODUCTS.filter((p) => p.group === key).map(productCard))], true),
    band("soft", [table("Paket karşılaştırması", ["Özellik", "Başlangıç", "Profesyonel", "Kurumsal"], [["Temel modüller", "✓", "✓", "✓"], ["Çok şube", "—", "✓", "✓"], ["Gelişmiş raporlama", "—", "✓", "✓"], ["Özel entegrasyon", "—", "—", "✓"]])]),
    closing(),
  ]);
}

const campaign = (slug: string, title: string, summary: string, art: string, discount: string, endsInDays: number, extra: Partial<NonNullable<ThemeDemoEntry["campaign"]>> = {}): ThemeDemoEntry => ({
  type: "campaign",
  slug,
  title,
  tldr: summary,
  schemaType: "Offer",
  image: `${YB_ART}/${art}.svg`,
  campaign: { discount, endsInDays, ctaText: "Teklif alın", ctaUrl: "/tr/yb-demo-talebi", ...extra },
  blocks: [text(`${summary} Bu kampanya metni örnektir; koşulları ve süreyi Kampanyalar ekranından düzenleyebilirsiniz.`)],
});

const CAMPAIGNS: ThemeDemoEntry[] = [
  campaign("yb-yeni-yil-muhasebe", "Muhasebe programında yeni yıl fırsatı", "Yeni lisans alımlarında dönem sonuna kadar geçerli indirim.", "kampanya-1", "%30", 25, { gift: "Kurulum ve eğitim dahil", badge: "Çok satan" }),
  campaign("yb-buluta-gecis", "Buluta geçiş avantajı", "Mevcut kullanıcılara özel bulut yazılım geçiş fırsatı.", "kampanya-2", "%25", 18, { badge: "Sınırlı süre" }),
  campaign("yb-e-donusum-paketi", "e-Dönüşüm paketi", "e-Fatura, e-Arşiv ve e-İrsaliye bir arada.", "kampanya-3", "%20", 35, { gift: "300 e-belge kontörü" }),
];

const faqItems: Array<[string, string]> = [
  [`${YB_BRAND} kimdir?`, "Yetkili çözüm ortağı olarak kurulum, entegrasyon, eğitim ve teknik destek sağlayan yazılım bayisidir. Bu metin demo içeriğidir."],
  ["Hangi hizmetleri sunuyorsunuz?", "Program seçimi, kurulum, veri aktarımı, e-dönüşüm entegrasyonu, eğitim ve sonrasında teknik destek."],
  ["Demo kurulumu ücretsiz mi?", "Evet. Demo talep formunu doldurmanız yeterlidir; ekibimiz sizi arayıp deneme ortamı kurar."],
];

const home = page(YB_HOME_SLUG, `${YB_BRAND} — Muhasebe, ERP ve e-dönüşüm çözümleri`,
  `${YB_BRAND}: muhasebe, ERP, sektörel programlar, e-dönüşüm ve bulut yazılımlar tek vitrinde. Tema demosu; metin ve sayılar örnektir.`, [
    pageHead("Yerli Yazılım Markasının Yetkili Çözüm Ortağı", `${YB_BRAND} olarak yalnızca bulunduğumuz şehirde değil, tüm Türkiye'deki işletmelere uçtan uca kurulum, entegrasyon ve teknik destek sağlıyoruz. Süreçlerinizi tek merkezden yönetmenize yardımcı oluyoruz.`, "Yetkili bayi", ["hero-1", "hero-2", "hero-3"]),
    band("", [row([
      column([heading("Yazılım Çözümleri", undefined, "h2"), text("Küçük ölçekli işletmelerden büyük kuruluşlara kadar geniş bir müşteri kitlesine hitap eden çözümler sunuyoruz. Doğru çözümü belirlemenize yardımcı olmak için buradayız."), button("Sizi Arayalım", "/tr/yb-demo-talebi")], "yb-intro"),
      column([
        row([
          column([solutionCard("file-text", "Muhasebe Programı", "Ön muhasebe ve genel muhasebe çözümleri", "yb-muhasebe")]),
          column([solutionCard("layers", "Sektörel Çözümler", "Her sektöre hitap eden programlar", "yb-sektorel")]),
          column([solutionCard("cloud", "Bulut Çözümler", "Bulut tabanlı yazılımlarla işinizi her yerde yönetin", "yb-bulut")]),
        ], "4+4+4"),
        row([
          column([solutionCard("building", "ERP Çözümleri", "İşletmeniz için her detay düşünüldü", "yb-erp")]),
          column([solutionCard("receipt", "e-Dönüşüm", "e-Dönüşümün bütün süreci tek yazılımda", "yb-e-donusum")]),
          column([solutionCard("refresh", "Entegrasyonlarımız", "Tek noktadan tüm akışı yönetin", "yb-cozumler")]),
        ], "4+4+4"),
      ]),
    ], "4+8")], false, 40),
    wrap(panel("yb-banner", [row([
      column([heading("Sizi geleceğe hazırlayan çözümler!", undefined, "h3"), text("Ücretsiz demo kurulumu için iletişime geçin")]),
      column([row([
        column([node("info_box", { icon: "monitor", kicker: "ÜCRETSİZ", title: "Demo kurulumu", text: "", href: "/tr/yb-demo-talebi" }, { style: { cssClass: "yb-chip" } })]),
        column([node("info_box", { icon: "phone", kicker: "HEMEN ARA", title: YB_PHONE, text: "", href: `tel:${YB_PHONE.replace(/\s/g, "")}` }, { style: { cssClass: "yb-chip" } })]),
      ], "6+6")]),
    ], "6+6", "center")])),
    band("", [row([
      column([image("muhasebe", "Muhasebe programı")], "yb-panel"),
      column([
        heading("Muhasebe Programları"),
        text("Ön muhasebeden genel muhasebeye, bulut tabanlı çözümden mali müşavir entegrasyonuna kadar her ölçekteki işletme için doğru muhasebe yazılımını sunuyoruz. Tüm programlar e-Fatura, e-İrsaliye ve e-Defter ile entegre çalışır."),
        checks([["Ön Muhasebe", "yb-on-muhasebe"], ["Genel Muhasebe", "yb-genel-muhasebe"], ["Bulut Muhasebe", "yb-bulut-muhasebe"]]),
      ]),
    ], "6+6", "center")]),
    band("soft", [row([
      column([
        heading("Sektörünüze Özel Yazılım"),
        text("Her işletme aynı yazılımla yönetilemez. Restoranın masasından otel resepsiyonuna, servisten sürücü kursunun ders takibine kadar her sektörün kendi iş akışı vardır. Hangi sektörde olursanız olun, doğru modülü birlikte belirliyor ve işletmenize özel kuruyoruz."),
        checks([["Servis Yönetimi", "yb-servis"], ["Otel Yönetimi", "yb-otel"], ["Hızlı Satış", "yb-hizli-satis"], ["Restoran Yönetimi", "yb-restoran"], ["Sürücü Kursu", "yb-surucu-kursu"]]),
      ]),
      column([row([column([image("sektor-1", "Perakende")]), column([image("sektor-2", "Üretim"), image("sektor-3", "Depo")])], "6+6")]),
    ], "6+6", "center")]),
    band("", [row([
      column([
        heading("e-Dönüşüm Çözümleri"),
        text("e-Dönüşüm zorunluluklarını karşılamak için ayrı ayrı yazılım kurmak zorunda değilsiniz. ERP içindeki e-Fatura, e-Arşiv, e-İrsaliye, e-Defter ve e-Mutabakat modülleriyle tüm yasal yükümlülüklerinizi tek platformdan karşılarsınız. Yeni mükellefiyet mi başladı? Entegrasyonu biz kuruyoruz, sizi adım adım yönlendiriyoruz."),
        checks([["e-Fatura", "yb-e-fatura"], ["e-Arşiv Fatura", "yb-e-arsiv"], ["e-İrsaliye", "yb-e-irsaliye"], ["e-Defter", "yb-e-defter"]]),
      ]),
      column([image("edonusum", "e-Dönüşüm çözümleri")], "yb-panel"),
    ], "6+6", "center")]),
    band("soft", [showcase("carousel", 3, "Güncel Kampanyalar", "Bayi ayrıcalıklarıyla işletmenizi bir adım öne taşıyın."), button("Tüm kampanyalar", "/tr/kampanyalar", "outline", "center")], true),
    band("", [row([
      column([heading(`${YB_BRAND} ile neden çalışmalı?`), text("Yalnızca yazılım satmıyoruz; doğru ürünü seçmenizden kuruluma, eğitimden yıllara uzanan teknik desteğe kadar tüm süreci birlikte yönetiyoruz. Aynı güçlü altyapıyı işletmenize taşıyoruz."), button("Demo Talebi", DEMO[1])]),
      column([faq("Sık sorulan sorular", faqItems)]),
    ], "6+6", "top")]),
    band("soft", [heading("Güncel içeriklerimiz", "center"), posts(3), button("Tüm yazılar", "/tr/yb-blog", "outline", "center")], true),
  ]);

const solutions = page("yb-cozumler", "Tüm çözümlerimiz", "Muhasebe, ERP, sektörel programlar, e-dönüşüm ve bulut yazılımların tamamı. Her kart ayrı bir çözüm sayfasına gider.", [
  pageHead("Tüm çözümlerimiz", "İşletmenizin ihtiyacına göre program seçin; kurulum ve eğitim bayi ekibimizden.", "Çözümler"),
  band("", [...cards((Object.keys(GROUPS) as Array<Product["group"]>).map((k) => ({ title: GROUPS[k].title, text: GROUPS[k].lead, art: GROUPS[k].art, href: `/tr/${GROUPS[k].slug}` })))], true),
  band("soft", [steps("Uygulama süreci", [["İhtiyaç analizi", "Sürecinizi birlikte inceler, doğru programı belirleriz."], ["Kurulum ve veri aktarımı", "Mevcut cari, stok ve hesap planınızı yeni sisteme aktarırız."], ["Eğitim ve canlıya geçiş", "Ekibinize eğitim verir, ilk haftalarda yanınızda kalırız."]])]),
  closing(),
]);

const about = page("yb-kurumsal", `${YB_BRAND} hakkında`, "Bayi öyküsü, hizmet kapsamı ve değerler. Metinler örnektir; kendi hikâyenizle değiştirin.", [
  pageHead("Yetkili çözüm ortağınız", "Kurulum, entegrasyon, eğitim ve teknik destek: işletmenizin yazılım yolculuğunda yanınızdayız.", "Kurumsal", ["hero-1", "hero-2", "hero-3"], ["İletişim", "/tr/yb-iletisim"]),
  band("", [row([
    column([heading("Neler yapıyoruz?"), text("Program seçiminden canlıya geçişe kadar tüm adımları birlikte yürütürüz. Satış sonrası destek ekibimiz telefon, uzaktan bağlantı ve yerinde hizmetle yanınızdadır."),
      node("icon_list", { items: [{ icon: "handshake", title: "Uzun vadeli ortaklık", text: "Satıştan sonra da yanınızdayız." }, { icon: "shield", title: "Veri güvenliği", text: "Düzenli yedekleme ve yetki yönetimi." }, { icon: "wrench", title: "Yerinde destek", text: "Kurulum ve eğitimde sahada ekip." }] })]),
    column([image("ofis", "Bayi ekibi")], "yb-panel"),
  ], "6+6", "center")]),
  closing("Bizimle çalışın", "Ekibimizle tanışmak ve ihtiyacınızı konuşmak için bize yazın."),
], "AboutPage");

const contact = page("yb-iletisim", "İletişim", "Bayi ofisinin adresi, telefon ve iletişim formu.", [
  pageHead("Bize ulaşın", "Sorularınızı yanıtlamak için buradayız.", "İletişim"),
  band("", [heading("İletişim bilgileri", "center"), ...cards([
    { title: "Telefon", text: `${YB_PHONE}\nHafta içi 09:00–18:00` },
    { title: "E-posta", text: YB_EMAIL },
    { title: "Adres", text: YB_ADDRESS },
  ])], true),
  band("soft", [heading("İletişim formu", "center"), form("Bize yazın", [["ad", "Ad soyad", "text"], ["tel", "Telefon", "tel"], ["eposta", "E-posta", "email"], ["konu", "Konu", "text"], ["mesaj", "Mesajınız", "textarea", "full"]], "Gönder")]),
], "ContactPage");

const demoRequest = page("yb-demo-talebi", "Demo talebi", "Çözümlerimizi ücretsiz denemek için demo talep formu. Ekibimiz sizi arayıp deneme ortamı kurar.", [
  pageHead("Ücretsiz demo talep edin", "Formu doldurun, uzmanımız sizi arayıp işletmenize uygun çözümü canlı göstersin.", "Demo talebi"),
  band("soft", [form("Demo talep formu", [["ad", "Ad soyad", "text"], ["firma", "Firma", "text"], ["tel", "Telefon", "tel"], ["eposta", "E-posta", "email"], ["cozum", "İlgilendiğiniz çözüm", "text", "full"]], "Demo talep et")]),
]);

const supportRequest = page("yb-destek-talebi", "Destek talebi", "Teknik destek talebi için form. Ekibimiz en kısa sürede dönüş yapar.", [
  pageHead("Destek talebi", "Sorununuzu kısaca yazın; destek ekibimiz sizi arasın.", "Destek"),
  band("soft", [form("Destek formu", [["ad", "Ad soyad", "text"], ["firma", "Firma", "text"], ["tel", "Telefon", "tel"], ["eposta", "E-posta", "email"], ["konu", "Sorun özeti", "textarea", "full"]], "Gönder")]),
]);

const privacy = page("yb-gizlilik-politikasi", "Gizlilik politikası", "Gizlilik politikası örnek metindir; yayına almadan önce kendi hukuki metninizle değiştirin.", [
  pageHead("Gizlilik politikası", "Bu sayfa örnek metindir; yayına almadan önce kendi metninizle değiştirin.", "Hukuki"),
  band("", [text("Bu sayfa tema demosuyla gelir. Veri sorumlusu, işleme amaçları, saklama süreleri ve başvuru yolları burada anlatılır.")]),
]);

const blog = page("yb-blog", "Blog ve rehberler", "Muhasebe, e-dönüşüm ve sektörel yazılımlar üzerine rehberler ve örnek blog yazıları.", [
  pageHead("Blog", "İşletmeler için muhasebe, e-dönüşüm ve sektörel yazılım rehberleri.", "Blog"),
  band("", [posts(9)], false),
]);

const article = (slug: string, title: string, summary: string, intro: string, points: string[], tip: string, art: string, category: string): ThemeDemoEntry => {
  const e = entry("post", slug, title, summary, [
    tldr(summary),
    text(intro),
    heading("Akılda tutulacaklar"),
    node("list_element", { listType: "check", items: points }),
    node("callout", { tone: "TIP", title: "Pratik ipucu", text: tip }),
    wrap(cta("Size özel çözümü birlikte kuralım", "Bilgilerinizi bırakın, uzman ekibimiz sizi arasın.")),
  ]);
  e.canvas = false;
  e.image = `${YB_ART}/${art}.svg`;
  e.categories = [category];
  return e;
};

const POSTS: ThemeDemoEntry[] = [
  article("yb-e-fatura-gecis-hazirlik", "e-Fatura'ya geçiş için hazırlık listesi", "Mali mühür, entegratör seçimi ve program ayarı e-Fatura geçişinin üç temel adımıdır.", "e-Fatura geçişinde gecikme çoğu zaman hazırlığın sıraya konmamasından kaynaklanır. Başvuru, entegratör ve program ayarı birbirini bekler.", ["Mali mühür başvurusunu erken yapın.", "Entegratörleri hizmet ve destek açısından karşılaştırın.", "Cari kartlarındaki vergi bilgilerini kontrol edin.", "Belge numara serilerini planlayın."], "İlk gönderimi gerçek müşteriye değil, deneme firmasına yapın.", "haber-1", "e-Dönüşüm"),
  article("yb-restoran-stok-recete", "Restoranlar için stok ve reçete takibi", "Adisyonu stokla bağlamak, malzeme maliyetini ve fireyi görünür kılar.", "Restoranlarda kâr, mutfaktaki fireyle erir. Adisyon ile stoğu bağlayan reçete takibi, hangi ürünün gerçekte ne kadar kazandırdığını gösterir.", ["Her menü ürünü için reçete tanımlayın.", "Satışla birlikte malzeme stoktan düşsün.", "Haftalık sayım farkını inceleyin.", "Fire nedenlerini kaydedin."], "En çok satan beş ürünün reçetesini ilk haftada girin.", "haber-2", "Sektörel"),
  article("yb-ay-sonu-kapanis", "Ay sonu kapanışını hızlandıran öneriler", "Düzenli mutabakat, açık hesap takibi ve otomatik mizan kontrolü kapanışı kısaltır.", "Ay sonu kapanışı genellikle son güne yığılan işler yüzünden uzar. İşi ay içine yaymak kapanışı günlere değil saatlere indirir.", ["Cari mutabakatı ay içinde yapın.", "Açık hesapları haftalık izleyin.", "Mizanı otomatik kontrol edin.", "Dönem sonu kontrol listesi kullanın."], "Kapanış kontrol listesini her ay aynı sırayla uygulayın.", "haber-3", "Muhasebe"),
  article("yb-buluta-gecis-rehberi", "Buluta geçiş rehberi: veriniz nasıl taşınır?", "Yedekleme, aktarım ve deneme dönemiyle buluta geçişin adımları.", "Buluta geçiş, verinin güvenle taşınması ve ekibin yeni ekrana alışması demektir. Planlı bir geçiş kesinti riskini en aza indirir.", ["Geçişten önce tam yedek alın.", "Deneme ortamında birkaç gün çalışın.", "Kullanıcı yetkilerini yeniden gözden geçirin.", "Eski sistemi bir süre salt okunur tutun."], "Geçişi ay sonuna değil ay başına planlayın.", "haber-4", "Bulut"),
];

export const YB_DEMO_PACK: ThemeDemoPack = {
  themeId: YB_THEME_ID,
  homeSlug: YB_HOME_SLUG,
  title: "Yazılım Bayi vitrin demosu",
  summary: `Ana sayfa, ${PRODUCTS.length} ürün ve ${Object.keys(GROUPS).length} çözüm ailesi sayfası, kampanyalar, kurumsal sayfalar, formlar ve ${POSTS.length} blog yazısı. Görseller temsilidir; metin ve sayılar örnektir.`,
  entries: [home, solutions, ...(Object.keys(GROUPS) as Array<Product["group"]>).map(groupPage), ...PRODUCTS.map(productPage), ...CAMPAIGNS, about, contact, demoRequest, supportRequest, privacy, blog, ...POSTS],
};

