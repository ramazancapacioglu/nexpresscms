import type { BlockNode } from "@nexpress/core";
import { AKINSOFT_THEME_ID } from "./akinsoft-merkez";
import type { ThemeDemoEntry, ThemeDemoPack } from "./demo-pack";

/** Demo vitrinin adresi. Mevcut `ana-sayfa` kaydının yerine geçmez. */
export const AKINSOFT_DEMO_HOME_SLUG = "akinsoft-vitrin";

const block = (id: string, type: BlockNode["type"], props: Record<string, unknown>): BlockNode => ({ id, type, props });

const hero = (id: string, title: string, subtitle: string, primary: [string, string], secondary?: [string, string]): BlockNode =>
  block(id, "hero", {
    badge: "Demo vitrin",
    title,
    subtitle,
    primaryCtaLabel: primary[0],
    primaryCtaHref: primary[1],
    ...(secondary ? { secondaryCtaLabel: secondary[0], secondaryCtaHref: secondary[1] } : {}),
  });

const cards = (id: string, title: string, subtitle: string, items: Array<[string, string, string]>): BlockNode =>
  block(id, "bento_features", {
    title,
    subtitle,
    items: items.map(([name, description, href]) => ({ title: name, description, href })),
  });

const faq = (id: string, title: string, items: Array<[string, string]>): BlockNode =>
  block(id, "faq_accordion", {
    title,
    items: items.map(([question, answer]) => ({ question, answer })),
  });

const page = (
  slug: string,
  title: string,
  tldr: string,
  blocks: BlockNode[],
  schemaType = "WebPage",
): ThemeDemoEntry => ({ type: "page", slug, title, tldr, schemaType, blocks });

const post = (slug: string, title: string, tldr: string, blocks: BlockNode[]): ThemeDemoEntry => ({
  type: "post",
  slug,
  title,
  tldr,
  schemaType: "BlogPosting",
  blocks,
});

/** Referans sitenin iskeleti. Metinler özgün demo kopyasıdır; sayfa kurulunca normal içerik olur. */
export const AKINSOFT_DEMO: ThemeDemoPack = {
  themeId: AKINSOFT_THEME_ID,
  homeSlug: AKINSOFT_DEMO_HOME_SLUG,
  title: "AKINSOFT vitrin demosu",
  summary: "Vitrin, ERP, muhasebe, bulut, e-ticaret, e-dönüşüm, sektör, kampanya, kurumsal, iletişim ve üç yazı.",
  entries: [
    page(
      AKINSOFT_DEMO_HOME_SLUG,
      "İşletmenize özel yazılım çözümleri",
      "ERP, muhasebe, bulut ve e-dönüşüm ürünlerini tek vitrinde toplayan demo ana sayfa.",
      [
        hero(
          "as_home_hero",
          "İşletmenize özel yazılım çözümleri",
          "Üretimden perakendeye, muhasebeden e-belgeye kadar aynı ailede çalışan programlar. Bu sayfa temanın demo vitrinidir; metinleri dilediğiniz gibi değiştirirsiniz.",
          ["Demo talebi", "/tr/iletisim"],
          ["Çözümleri incele", "/tr/programlar"],
        ),
        block("as_home_stats", "stats_strip", {
          stats: [
            { value: "ERP", label: "Üretim ve ticaret" },
            { value: "Bulut", label: "Ofis ve satış" },
            { value: "e-Belge", label: "Fatura ve defter" },
            { value: "Sektör", label: "Dikey programlar" },
          ],
        }),
        cards("as_home_cards", "Bir bakışta ürün ailesi", "Kartlar demo sayfalara gider. Aktarımdan sonra başlık ve metin düzenlenebilir.", [
          ["WOLVOX ERP", "Stok, üretim, sipariş ve cari tek program ailesinde.", "/tr/programlar"],
          ["Muhasebe", "Ön muhasebe, genel muhasebe ve mali müşavir düzeni.", "/tr/muhasebe"],
          ["Bulut", "Ofis, görev, e-ticaret ve masaüstü programların bulut karşılığı.", "/tr/bulut"],
          ["e-Dönüşüm", "e-Fatura, e-Arşiv, e-İrsaliye, e-Defter ve e-Mutabakat.", "/tr/e-donusum"],
          ["Sektörel", "Restoran, otel, servis, saha ve akaryakıt gibi dikey çözümler.", "/tr/sektorel"],
          ["Kampanyalar", "Dönemsel paketler bu sayfada toplanır. Fiyat uydurulmaz.", "/tr/kampanyalar"],
        ]),
      ],
    ),
    page(
      "programlar",
      "Kurumsal kaynak planlaması",
      "WOLVOX ailesindeki ERP, CRM, insan kaynakları ve ofis programlarının demo sayfası.",
      [
        hero("as_erp_hero", "Kurumsal kaynak planlaması", "Stok, üretim, sipariş, cari ve ekip aynı veri üzerinde çalışsın diye kurulmuş demo ürün sayfası.", ["Tanıtım iste", "/tr/iletisim"], ["Muhasebeye geç", "/tr/muhasebe"]),
        block("as_erp_tldr", "tldr_box", { summary: "ERP sayfası; MRP, CRM, insan kaynakları ve ofis programlarını yan yana anlatır. Kurulumdan sonra bloklar stüdyoda düzenlenir." }),
        cards("as_erp_cards", "Modüller", "Her kart aynı sayfada kalır; ayrı ürün sayfası açmak isterseniz bağlantıyı değiştirin.", [
          ["WOLVOX MRP", "Üretim emri, reçete, depo ve sevkiyat akışı.", "/tr/programlar"],
          ["WOLVOX CRM", "Aday, teklif ve satış sonrası görüşme kaydı.", "/tr/programlar"],
          ["İnsan kaynakları", "Özlük, izin ve puantaj başlıkları.", "/tr/programlar"],
          ["Ofis ve veri", "Masaüstü ofis işleri ve ortak veri düzeni.", "/tr/programlar"],
        ]),
        faq("as_erp_faq", "Sık sorulanlar", [
          ["Bu sayfa gerçek bir teklif midir?", "Hayır. Tema demosudur. Metni, başlığı ve bağlantıları içerik ekranından değiştirirsiniz."],
          ["Modüller ayrı sayfa olabilir mi?", "Evet. Yeni sayfa açıp kartın bağlantısını o adrese çevirmeniz yeterli."],
        ]),
      ],
    ),
    page(
      "muhasebe",
      "Muhasebe programları",
      "Genel muhasebe, ön muhasebe ve mali müşavir düzenini anlatan demo sayfa.",
      [
        hero("as_muh_hero", "Muhasebe programları", "Fatura, cari, kasa ve resmi defter aynı ailede. Bu metin demo kopyasıdır.", ["e-Dönüşüm", "/tr/e-donusum"], ["İletişim", "/tr/iletisim"]),
        block("as_muh_p", "paragraph", { text: "Ön muhasebe günlük fişi tutar. Genel muhasebe dönemsel kapanışı taşır. Mali müşavir düzeni birden çok firmayı aynı çatıda izlemek içindir. Rakam ve fiyat bu demoda yoktur." }),
        cards("as_muh_cards", "Üç düzen", "Kartları kendi hizmet adlarınıza göre yeniden adlandırın.", [
          ["Genel muhasebe", "Hesap planı, fiş ve dönem kapanışı.", "/tr/muhasebe"],
          ["Ön muhasebe", "Stok, cari, kasa ve çek senet.", "/tr/muhasebe"],
          ["Mali müşavir", "Birden çok firma için ortak çalışma düzeni.", "/tr/muhasebe"],
        ]),
      ],
    ),
    page(
      "bulut",
      "Bulut çözümler",
      "WolvoxCloud, görev panosu, QR menü ve destek masasından oluşan demo bulut sayfası.",
      [
        hero("as_cloud_hero", "Bulut çözümler", "Ofis dışından da açılan programlar. Kurulum, yedek ve erişim bu sayfada anlatılır.", ["e-Ticaret", "/tr/e-ticaret"], ["ERP", "/tr/programlar"]),
        cards("as_cloud_cards", "Bulut ailesi", "Ürün adları referans vitrinden gelir. Açıklamalar özgün demo metnidir.", [
          ["WolvoxCloud", "Masaüstü programın buluttan açılan karşılığı.", "/tr/bulut"],
          ["TaskPano", "Ekip görevi ve iş takibi.", "/tr/bulut"],
          ["OctoCloud", "Ortak dosya ve ofis düzeni.", "/tr/bulut"],
          ["QR Menü", "Masadaki kare kodla açılan menü.", "/tr/bulut"],
          ["LimonDesk", "Destek talebi ve görüşme kaydı.", "/tr/bulut"],
        ]),
      ],
    ),
    page(
      "e-ticaret",
      "e-Ticaret",
      "Sanal mağaza, pazaryeri ve stok bağlantısını anlatan demo sayfa.",
      [
        hero("as_shop_hero", "e-Ticaret", "Mağaza vitrini ile depo aynı stoktan beslensin. Ödeme ve kargo sağlayıcısı bu demoda bağlı değildir.", ["Buluta dön", "/tr/bulut"]),
        block("as_shop_p", "paragraph", { text: "Ürün kartı, kategori, sepet ve sipariş durumu demo anlatımıdır. Canlı ödeme eklemek için ticaret modülünü ayrıca kurarsınız. Bu sayfa yalnızca vitrin metnidir." }),
        cards("as_shop_cards", "Vitrin parçaları", "Üç başlık, mağaza sayfasını bölmek için yeterli bir iskelet.", [
          ["Katalog", "Ürün, varyant ve stok eşiği.", "/tr/e-ticaret"],
          ["Sipariş", "Sepet, durum ve sevkiyat notu.", "/tr/e-ticaret"],
          ["Pazaryeri", "Dış kanala aktarım başlığı. Bağlantı kurulu değildir.", "/tr/e-ticaret"],
        ]),
      ],
    ),
    page(
      "e-donusum",
      "e-Dönüşüm",
      "e-Fatura, e-Arşiv, e-İrsaliye, e-Defter ve e-Mutabakat için demo sayfa.",
      [
        hero("as_edon_hero", "e-Dönüşüm", "Resmi belge akışı ERP ve muhasebe ile aynı ailede dursun diye yazılmış demo sayfa.", ["Muhasebe", "/tr/muhasebe"], ["Demo talebi", "/tr/iletisim"]),
        cards("as_edon_cards", "Belge türleri", "Her kart bir belge türünü adlandırır. Entegrasyon kimliği bu demoda yoktur.", [
          ["e-Fatura", "Ticari fatura gönderimi ve gelen kutu.", "/tr/e-donusum"],
          ["e-Arşiv", "Nihai tüketiciye kesilen elektronik arşiv.", "/tr/e-donusum"],
          ["e-İrsaliye", "Sevkiyat belgesi.", "/tr/e-donusum"],
          ["e-Defter", "Yevmiye ve kebir beratı.", "/tr/e-donusum"],
          ["e-Mutabakat", "Cari bakiye mutabakat mektubu.", "/tr/e-donusum"],
        ]),
        faq("as_edon_faq", "Başlamadan", [
          ["Belge gönderimi açık mı?", "Hayır. Bu sayfa anlatımdır. Canlı gönderim için entegrasyon ayrıca tanımlanır."],
          ["Kontör nerede?", "Ek hizmetler menüsündeki SMS ve kontör satırı bu sayfaya gelir. Fiyat yazılmaz."],
        ]),
      ],
    ),
    page(
      "sektorel",
      "Sektörel programlar",
      "Satış noktası, hizmet ve tesis için dikey programların demo sayfası.",
      [
        hero("as_sec_hero", "Sektörel programlar", "Aynı ERP ailesinin sektöre göre incelmiş halleri. Menüdeki üç sütun bu sayfayla aynı başlıklara gider.", ["ERP", "/tr/programlar"]),
        cards("as_sec_cards", "Üç grup", "Satış, hizmet ve tesis. Alt programlar menüde durur; sayfada grup özeti vardır.", [
          ["Satış noktası", "Hızlı satış, restoran, kafe ve saha satış.", "/tr/sektorel"],
          ["Hizmet", "Otel, teknik servis, kuaför ve sağlık.", "/tr/sektorel"],
          ["Tesis", "Akaryakıt, otopark, emlak ve eğitim.", "/tr/sektorel"],
        ]),
      ],
    ),
    page(
      "kampanyalar",
      "Kampanyalar",
      "Dönemsel paketlerin listeleneceği demo sayfa. Fiyat ve indirim oranı yazılmaz.",
      [
        hero("as_camp_hero", "Kampanyalar", "Dönem açılınca bu sayfaya gerçek paketleri eklersiniz. Demoda tutar, yüzde ve bitiş tarihi yoktur.", ["İletişim", "/tr/iletisim"]),
        block("as_camp_p", "paragraph", { text: "Kampanya kartı eklemek için bu sayfayı açıp bir kart bloğu koyun. Tutar yazacaksanız kendi fiyat listenizden yazın. Demo aktarımı fiyat uydurmaz." }),
        block("as_camp_note", "callout", { tone: "NOT", title: "Boş vitrin", text: "Şu an listelenecek gerçek bir paket yok. Sayfa, kampanya duyurusu için ayrılmış düzenlenebilir bir iskelettir." }),
      ],
    ),
    page(
      "kurumsal",
      "Kurumsal",
      "Firma tanımı, çözüm ortaklığı ve iletişim bağlantılarını taşıyan demo sayfa.",
      [
        hero("as_co_hero", "Kurumsal", "Yerli yazılım ailesini anlatan kısa kurumsal sayfa. Adres ve ticaret sicili siz doldurursunuz.", ["İletişim", "/tr/iletisim"], ["Blog", "/tr/blog"]),
        block("as_co_p", "paragraph", { text: "Şirket öyküsü, çözüm ortağı koşulları ve basın notu bu sayfada toplanır. Demo metni kısa tutuldu; kendi hikayenizle değiştirin. Akınrobotics bağlantısı menüde bu sayfaya gelir." }),
        faq("as_co_faq", "Kurumsal notlar", [
          ["Çözüm ortağı başvurusu nerede?", "İletişim sayfasındaki form ve sağ kenardaki demo formu aynı kutuya düşer."],
          ["Blog ayrı mı?", "Evet. Demo üç yazı ekler. Yeni yazı normal içerik ekranından açılır."],
        ]),
      ],
      "AboutPage",
    ),
    page(
      "iletisim",
      "İletişim",
      "Demo talebi ve destek için iletişim sayfası. Sağ kenardaki form aynı kayda gider.",
      [
        hero("as_ct_hero", "İletişim", "Telefon 444 40 80 ve info@akinsoft.com.tr şeritte durur. Formu dolduran ziyaretçi gelen kutusuna yazılır.", ["Kampanyalar", "/tr/kampanyalar"]),
        block("as_ct_p", "paragraph", { text: "Sayfanın sağındaki Bize ulaşın sekmesi ad, telefon, e-posta ve mesaj ister. Bu sayfayı açan ziyaretçi aynı formu kullanabilir. Adres satırını kendi ofisinizle değiştirin." }),
        block("as_ct_note", "callout", { tone: "İLETİŞİM", title: "Demo talebi", text: "Şeritteki Demo Talebi düğmesi bu sayfaya gelir. Form kimliği frm_akinsoft_reach kaydıdır; alanları form ekranından değiştirirsiniz." }),
      ],
      "ContactPage",
    ),
    post(
      "wolvox-erp-nedir",
      "WOLVOX ERP ne işe yarar?",
      "Stok, üretim ve cariyi aynı program ailesinde tutmanın kısa demo yazısı.",
      [
        hero("as_post_erp_h", "WOLVOX ERP ne işe yarar?", "Ayrı ayrı tablo tutmak yerine sipariş, depo ve cari aynı kayıtta kalsın diye yazılmış demo yazı.", ["Programlar", "/tr/programlar"]),
        block("as_post_erp_p", "paragraph", { text: "Sipariş düşünce stok düşer, üretim emri açılır, cari hareket aynı anda görünür. Demo yazısı bu akışı anlatır; ekran görüntüsü ve sürüm numarası eklemedik. Kendi kurulum notunuzu buraya yazın." }),
      ],
    ),
    post(
      "e-faturaya-gecis",
      "e-Faturaya geçişte ilk üç adım",
      "Başvuru, kontör ve program bağlantısını sıraya koyan demo yazı. Canlı gönderim adımı yoktur.",
      [
        hero("as_post_ef_h", "e-Faturaya geçişte ilk üç adım", "Başvuru, kontör ve program eşlemesi. Gönderim bu demoda kapalıdır.", ["e-Dönüşüm", "/tr/e-donusum"]),
        block("as_post_ef_p", "paragraph", { text: "Önce mükellefiyet, sonra kontör, en son programdaki belge ayarı. Sıra bozulursa fatura taslakta kalır. Bu yazı o sırayı hatırlatmak için durur. Entegrasyon şifresi burada yoktur." }),
      ],
    ),
    post(
      "bulutta-on-muhasebe",
      "Ön muhasebeyi bulutta açmak",
      "Ofis dışından cari ve kasa görmek için bulut düzenini anlatan demo yazı.",
      [
        hero("as_post_cloud_h", "Ön muhasebeyi bulutta açmak", "Aynı veri, ofiste masaüstü, dışarıda tarayıcı. Kurulum adımları siz tamamlar.", ["Bulut", "/tr/bulut"]),
        block("as_post_cloud_p", "paragraph", { text: "Yedek ofiste kalır, kullanıcı ofis dışından açar. Demo yazısı bu ayrımı anlatır. Sunucu adresi ve parola eklemeyin; onları ayarlar ekranında tutun." }),
      ],
    ),
  ],
};
