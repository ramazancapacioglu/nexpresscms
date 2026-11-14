import type { BlockNode } from "@nexpress/core";
import type { ThemeDemoEntry } from "./demo-pack";

/** Demo sayfa kurucuları. Adresler `kuzey-` ile başlar; mevcut site sayfalarıyla çakışmaz. */
let seq = 0;
const node = (type: string, props: Record<string, unknown>, extra: Partial<BlockNode> = {}): BlockNode =>
  ({ id: `ka_${++seq}`, type, props, ...extra }) as BlockNode;

const h = (text: string, level = "h2") => node("heading_element", { text, level });
const p = (text: string) => node("paragraph_element", { text });
const tldr = (summary: string) => node("tldr_box", { summary });
const faq = (title: string, items: Array<[string, string]>) =>
  node("faq_accordion", { title, items: items.map(([question, answer]) => ({ question, answer })) });
const steps = (title: string, items: Array<[string, string]>) =>
  node("howto_steps", { title, steps: items.map(([title, description]) => ({ title, description })) });
const cta = (title: string, subtitle: string, label: string, href: string) =>
  node("cta_banner", { title, subtitle, buttonLabel: label, buttonHref: href });
const hero = (title: string, subtitle: string, primary: [string, string], secondary?: [string, string]) =>
  node("hero", {
    badge: "Demo verisi",
    title,
    subtitle,
    primaryCtaLabel: primary[0],
    primaryCtaHref: primary[1],
    ...(secondary ? { secondaryCtaLabel: secondary[0], secondaryCtaHref: secondary[1] } : {}),
  });

const col = (children: BlockNode[]): BlockNode => node("column", {}, { children });
const row = (cols: BlockNode[], layout: string): BlockNode =>
  node("columns", { layout, gap: "32px", verticalAlign: "top", stackAt: "tablet" }, { children: cols });

function page(slug: string, title: string, tldrText: string, schemaType: string, blocks: BlockNode[]): ThemeDemoEntry {
  return { type: "page", slug, title, tldr: tldrText, schemaType, blocks };
}

function post(slug: string, title: string, tldrText: string, blocks: BlockNode[]): ThemeDemoEntry {
  return { type: "post", slug, title, tldr: tldrText, schemaType: "Article", canvas: false, blocks, categories: ["Atölye notu"] };
}

const HOME_TLDR = "Kuzey Atölye, orta ölçekli işletmenin sipariş, stok ve iş emrini tek ekranda toplayan yazılım yazar. Demo verisidir; müşteri adı ve rakam yoktur.";

export const KA_ENTRIES: ThemeDemoEntry[] = [
  page("kuzey-vitrin", "Sipariş, stok ve iş emri için yazılan programlar", HOME_TLDR, "WebPage", [
    hero(
      "Sipariş, stok ve iş emri için yazılan programlar",
      "Kâğıt fiş, dağınık tablo ve telefondaki not aynı kayda iner. Demo verisidir; müşteri adı ve rakam yoktur.",
      ["Nasıl çalışırız", "/tr/kuzey-yaklasim"],
      ["Bir iş anlatın", "/tr/kuzey-iletisim"],
    ),
    tldr(HOME_TLDR),
    row([
      col([
        h("Ne yazıyoruz"),
        p("Hazır paket satmıyoruz. İşin bugün nasıl yürüdüğünü masada dinler, eksik kalan yeri programa bağlarız. İlk parça, herkesin kullandığı tek ekrandır."),
      ]),
      col([
        h("İş yazılımı", "h3"),
        p("Sipariş, stok, üretim emri ve sevkiyat. Kasiyerin ve ustanın aynı kaydı görmesi."),
        h("Köprü", "h3"),
        p("Durumdaki muhasebe ya da depo programı durur. Aralarındaki fiş elle taşınmaz."),
        h("Bakım", "h3"),
        p("Yayından sonra kırılan iş, yeni alan ve küçük rapor. Aylık liste yazılıdır."),
      ]),
    ], "6+6"),
    steps("Bir iş nasıl yürür", [
      ["Kapsam", "Hangi fiş, kim girer, ne zaman biter. Ekran bundan önce çizilmez."],
      ["İlk parça", "Üç ile altı hafta. Herkesin açtığı tek liste çalışır hale gelir."],
      ["Kabul", "Yayından önce kontrol listesi kapanır. Açık madde varsa tarih kaymaz."],
      ["Bakım", "Aylık iş yazılıdır. Liste dışı istek ayrı iş olarak yazılır."],
    ]),
    h("Seçilmiş işler"),
    p("Üç örnek kayıt. İsim ve sonuç uydurulmadı; işin şekli yazıldı."),
    row([
      col([h("Tekstil fişi", "h3"), p("Sipariş kâğıdı tezgahta kalıyordu. Aynı sipariş tezgâh, kesim ve sevkiyatta tek kayıt oldu."), node("paragraph_element", { html: '<a href="/tr/kuzey-isler">Kaydın tamamı</a>' })]),
      col([h("Servis emri", "h3"), p("Ustanın iş emri ile faturanın ayrı dosyada durması bitirildi. Kapanan emir fatura taslağını açar."), node("paragraph_element", { html: '<a href="/tr/kuzey-isler">Kaydın tamamı</a>' })]),
      col([h("Depo sayımı", "h3"), p("Sayım farkı ay sonunda ortaya çıkıyordu. Fark, sayıldığı gün listeye düşer."), node("paragraph_element", { html: '<a href="/tr/kuzey-isler">Kaydın tamamı</a>' })]),
    ], "4+4+4"),
    node("paragraph_element", { html: '<a href="/tr/kuzey-isler">Üç kaydın tamamı</a>' }),
    faq("Başlamadan önce", [
      ["Mevcut program değişir mi?", "Hayır. Köprü, duran programın verdiği fişi alır. Değişim ancak siz isteyince ayrı iş olur."],
      ["Kaynak kod kime kalır?", "Sözleşmede yazar. Bakım bizde kalsa da depo sizindir."],
      ["Uzaktan mı çalışırsınız?", "İlk gün yerinde geçer. Sonrası yazışma ve kısa görüşmedir."],
    ]),
    cta("Bir fişi anlatın", "Hangi kâğıt hâlâ elde dolaşıyor, onu yazmanız yeter.", "İletişim sayfası", "/tr/kuzey-iletisim"),
  ]),
  page(
    "kuzey-hizmetler",
    "Üç iş: yazılım, köprü, bakım",
    "Atölye üç iş alır: günlük operasyon yazılımı, duran programa köprü ve yayından sonraki bakım. Demo verisidir.",
    "WebPage",
    [
      hero("Üç iş alırız", "Dördüncü bir paket yok. Kapsam bu üçünden biri değilse işi geri çeviririz.", ["Yaklaşım", "/tr/kuzey-yaklasim"]),
      tldr("Atölye üç iş alır: günlük operasyon yazılımı, duran programa köprü ve yayından sonraki bakım. Demo verisidir."),
      h("İş yazılımı"),
      p("Sipariş girişi, stok hareketi, iş emri ve sevkiyat. Ekran, tezgahta duran fişin sırasını bozmaz. Yeni bir kavram eklenmez; duran kelime durur."),
      h("Köprü"),
      p("Muhasebe, e-belge ya da depo programı yerinde kalır. Aradaki kopyala-yapıştır biter. Köprünün ne zaman yetmeyeceği yazıda anlatılır."),
      node("paragraph_element", { html: '<a href="/tr/kuzey-yazi-kopru">Köprü ne zaman yeter</a>' }),
      h("Bakım"),
      p("Üç kalem: kırılan iş, istenen yeni alan, küçük rapor. Liste dışı istek ayrı teklif olur. Süre ve yanıt saati sözleşmededir."),
      node("paragraph_element", { html: '<a href="/tr/kuzey-yazi-bakim">Bakımda üç kalem</a>' }),
      faq("Hizmet sınırı", [
        ["E-ticaret sitesi yazar mısınız?", "Hayır. Vitrin ve ödeme sayfası bu atölyenin işi değil."],
        ["Hazır muhasebe paketi var mı?", "Yok. Muhasebe programınız durur; fiş ona gider."],
        ["Kaç kişiyle çalışırsınız?", "Bir işte en fazla üç kişi. Toplantı kalabalık olmaz."],
      ]),
    ],
  ),
  page(
    "kuzey-yaklasim",
    "Ekran, kapsam yazılmadan çizilmez",
    "İş dört adımda yürür: kapsam, ilk parça, kabul listesi, bakım. Tarih kapsama bağlanır. Demo verisidir.",
    "WebPage",
    [
      hero("Ekran, kapsam yazılmadan çizilmez", "İlk toplantıda slayt yok. Masadaki fişler ve o fişi giren kişi vardır.", ["Hizmetler", "/tr/kuzey-hizmetler"], ["Yazın", "/tr/kuzey-iletisim"]),
      tldr("İş dört adımda yürür: kapsam, ilk parça, kabul listesi, bakım. Tarih kapsama bağlanır. Demo verisidir."),
      steps("Dört adım", [
        ["Dinleme", "Bir gün yerinde. Kim neyi, hangi sırayla yazıyor."],
        ["Kapsam kâğıdı", "Ekran listesi, dışarıda kalanlar ve tarih. İmzalanmadan çizim yok."],
        ["İlk parça", "Herkesin açtığı tek liste. Geri kalanı bu liste oturunca yazılır."],
        ["Kabul ve yayın", "Liste kapanmadan adres açılmaz. Açık madde varsa tarih kaymaz."],
      ]),
      h("Toplantı"),
      p("Haftada bir, kırk dakika. Gündem üç maddedir: biten, takılan, sıradaki. Tutanağı aynı gün yazılır."),
      node("paragraph_element", { html: '<a href="/tr/kuzey-yazi-kapsam">Kapsamı yazmadan ekran çizilmez</a>' }),
      faq("Süre", [
        ["İlk parça ne kadar sürer?", "Üç ile altı hafta. Kapsam bunu aşarsa iş bölünür, tarih uzatılmaz."],
        ["Beğenmezsek?", "Kabul listesindeki madde kapanmazsa yayın olmaz. Liste dışı beğeni ayrı iştir."],
      ]),
    ],
  ),
  page(
    "kuzey-isler",
    "Üç örnek kayıt",
    "Tekstil fişi, servis emri ve depo sayımı. İsim ve sonuç rakamı yok; işin şekli yazıldı. Demo verisidir.",
    "WebPage",
    [
      hero("Üç örnek kayıt", "Müşteri adı ve yüzde yok. Yazılan, fişin eskiden nerede durduğu ve şimdi nerede durduğudur.", ["Bir fiş anlatın", "/tr/kuzey-iletisim"]),
      tldr("Tekstil fişi, servis emri ve depo sayımı. İsim ve sonuç rakamı yok; işin şekli yazıldı. Demo verisidir."),
      h("Tekstil fişi"),
      p("Sipariş, tezgahta kâğıda yazılıyor, kesime fotoğrafla gidiyor, sevkiyatta yeniden giriliyordu. Aynı sipariş numarası üç yerde açılır oldu. Kâğıt yedek olarak duruyor."),
      h("Servis emri"),
      p("Usta işi deftere, muhasebe faturayı başka dosyaya yazıyordu. Kapanan emir fatura taslağını açar. Tutar, emirdeki parça listesinden gelir."),
      h("Depo sayımı"),
      p("Fark ay sonunda, sayım bitince ortaya çıkıyordu. Sayılan raf aynı gün listeye düşer. Liste, ertesi sabah depo sorumlusunun açtığı ilk ekrandır."),
      p("Bu üçü örnek kayıttır. Sitede gerçek müşteri adı yoktur."),
    ],
  ),
  page(
    "kuzey-hakkinda",
    "Atölye, üç kişilik bir yazılım masası",
    "Kuzey Atölye üç kişilik bir masadır. İş yazılımı, köprü ve bakım dışında iş almaz. Demo verisidir; adres örnektir.",
    "AboutPage",
    [
      hero("Üç kişilik bir masa", "İzmir'de, randevuyla. İlk gün yerinde, sonrası yazışmayla.", ["İletişim", "/tr/kuzey-iletisim"]),
      tldr("Kuzey Atölye üç kişilik bir masadır. İş yazılımı, köprü ve bakım dışında iş almaz. Demo verisidir; adres örnektir."),
      h("Kim var"),
      p("Biri kapsamı yazar, biri programı yazar, biri yayını ve bakımı tutar. Aynı işte üçünden fazlası oturmaz."),
      h("Ne yapmayız"),
      p("Reklam sitesi, hazır muhasebe paketi ve personel ilanı yok. Bunlar gelince işi geri çeviririz."),
      h("Adres"),
      p("Demo verisi. Örnek adres: Alsancak, İzmir. Telefon 0232 000 00 00. E-posta bilgi@kuzeyatolye.example."),
    ],
  ),
  page(
    "kuzey-yazilar",
    "Atölye notları",
    "Kapsam, bakım ve köprü üzerine üç not. Hepsi demo verisidir ve düzenlenebilir.",
    "WebPage",
    [
      hero("Atölye notları", "Üç yazı. Yeni not eklenince bu liste kendisi güncellenir.", ["Kapsam notu", "/tr/kuzey-yazi-kapsam"]),
      tldr("Kapsam, bakım ve köprü üzerine üç not. Hepsi demo verisidir ve düzenlenebilir."),
      node("dynamic_list", {
        source: "posts",
        limit: 9,
        orderBy: "newest",
        layout: "list",
        cardStyle: "default",
        columns: 1,
        showImage: false,
        showExcerpt: true,
        showDate: true,
        showSearch: true,
        showFilters: false,
        paginate: true,
      }),
    ],
  ),
  page(
    "kuzey-sss",
    "Sık sorulan sorular",
    "Program değişir mi, kod kime kalır, bakım neyi kapsar, ilk parça ne kadar sürer. Yanıtlar kısadır. Demo verisidir.",
    "FAQPage",
    [
      hero("Sık sorulan sorular", "Dört yanıt. Listede olmayanı iletişim sayfasına yazın.", ["Yazın", "/tr/kuzey-iletisim"]),
      tldr("Program değişir mi, kod kime kalır, bakım neyi kapsar, ilk parça ne kadar sürer. Yanıtlar kısadır. Demo verisidir."),
      faq("Yanıtlar", [
        ["Mevcut program değişir mi?", "Hayır. Köprü duran programın fişini alır. Programı değiştirmek ayrı iştir ve siz istemeden açılmaz."],
        ["Kaynak kod kime kalır?", "Sözleşmede yazar. Bakım bizde kalsa da depo sizindir. Yayındaki adres de sizindir."],
        ["Bakım neyi kapsar?", "Kırılan iş, yeni alan ve küçük rapor. Üçü sözleşmede sayılır. Liste dışı istek ayrı teklif olur."],
        ["İlk parça ne kadar sürer?", "Üç ile altı hafta. Kapsam bunu aşarsa iş bölünür. Tarih, kapsamdaki listeye bağlıdır."],
        ["Yerinde mi çalışırsınız?", "İlk gün yerinde geçer. Sonraki haftalar yazışma ve kırk dakikalık görüşmedir."],
      ]),
    ],
  ),
  page(
    "kuzey-iletisim",
    "Bir fişi yazın",
    "Hangi kâğıt hâlâ elde dolaşıyor, onu yazın. Aynı gün dönüş yapılır. Demo verisidir; telefon örnektir.",
    "WebPage",
    [
      hero("Bir fişi yazın", "Form, gelen kutusuna düşer. Telefon 0232 000 00 00, e-posta bilgi@kuzeyatolye.example.", ["Sorular", "/tr/kuzey-sss"]),
      tldr("Hangi kâğıt hâlâ elde dolaşıyor, onu yazın. Aynı gün dönüş yapılır. Demo verisidir; telefon örnektir."),
      row([
        col([
          h("Yazışma"),
          p("Hafta içi 09:00–18:00. İlk yanıt aynı gün. Randevu, form geldikten sonra kurulur."),
          p("Demo verisi. Örnek adres: Alsancak, İzmir."),
        ]),
        col([
          node("form_block", {
            title: "Not",
            submitLabel: "Gönder",
            successMessage: "Notunuz alındı. Aynı gün içinde dönüş yapılır.",
            appearance: { columns: 1, labels: "top", density: "comfortable", buttonAlign: "left", surface: "inline" },
            fields: [
              { id: "ad", name: "ad", label: "Ad soyad", type: "text", required: true, width: "full" },
              { id: "eposta", name: "eposta", label: "E-posta", type: "email", required: true, width: "full" },
              { id: "not", name: "not", label: "Hangi fiş elde dolaşıyor", type: "textarea", required: true, width: "full" },
              { id: "onay", name: "onay", label: "Yanıt için yazdığım adrese dönülebilir.", type: "checkbox", required: true, width: "full" },
            ],
          }),
        ]),
      ], "6+6"),
    ],
  ),
  page(
    "kuzey-gizlilik",
    "Gizlilik notu",
    "Formdaki ad ve e-posta yalnızca size dönüş için tutulur. Demo verisidir; başka amaç yazılmamıştır.",
    "WebPage",
    [
      hero("Gizlilik notu", "Kısa tutuldu. Form, bülten listesine yazılmaz.", ["İletişim", "/tr/kuzey-iletisim"]),
      tldr("Formdaki ad ve e-posta yalnızca size dönüş için tutulur. Demo verisidir; başka amaç yazılmamıştır."),
      h("Form"),
      p("Ad, e-posta ve not, gelen kutusunda durur. Yanıt yazıldıktan sonra kayıt silinir. Başka bir listeye aktarılmaz."),
      h("Adres"),
      p("Sayfa adresi bu sitenindir. Eski bir alan adına işaret edilmez."),
      h("Çerez"),
      p("Ziyaret ölçümü kapalıyken üçüncü parti betik yüklenmez. Açmak site sahibinin işidir."),
    ],
  ),
  post(
    "kuzey-yazi-kapsam",
    "Kapsamı yazmadan ekran çizilmez",
    "Ekran listesi, dışarıda kalanlar ve tarih aynı kâğıtta durur. İmzalanmadan çizim başlamaz. Demo verisidir.",
    [
      h("Kâğıtta üç şey durur"),
      p("Bir: ekranda görünecek liste. İki: bu işte olmayacaklar. Üç: ilk parçanın tarihi. Üçü yoksa toplantı bitmemiştir."),
      p("Tarih, listenin uzunluğuna bağlanır. Liste uzarsa tarih kaymaz; iş bölünür."),
      h("Kim yazar"),
      p("Kapsamı, fişi giren kişiyle birlikte atölye yazar. Yalnızca atölyenin yazdığı kapsam kabul sayılmaz."),
    ],
  ),
  post(
    "kuzey-yazi-bakim",
    "Bakım sözleşmesinde üç kalem",
    "Kırılan iş, yeni alan ve küçük rapor. Üçü sözleşmede sayılır. Liste dışı istek ayrı teklif olur. Demo verisidir.",
    [
      h("Üç kalem"),
      p("Kırılan iş, aynı gün bakılır. Yeni alan, sıradaki aya yazılır. Küçük rapor, var olan kayıttan çıkar; yeni ekran açmaz."),
      p("Liste dışı istek gelince teklif yazılır. Bakımın içine gizlenmez."),
      h("Saat"),
      p("Yanıt saati sözleşmededir. Hafta sonu acil hattı yoktur."),
    ],
  ),
  post(
    "kuzey-yazi-kopru",
    "Eski programa köprü ne zaman yeter",
    "Fiş tek yönde gidiyor ve günde bir kez yetiyorsa köprü yeter. İki taraf aynı anda yazılıyorsa yetmez. Demo verisidir.",
    [
      h("Yeter"),
      p("Sipariş sizde açılıyor, muhasebe fişi günde bir kez gidiyor. Muhasebe programı yerinde kalır."),
      h("Yetmez"),
      p("İki program aynı kaydı aynı anda değiştiriyorsa köprü yetişmez. O zaman kaydın sahibi tek programa alınır. Bu ayrı iştir."),
      p("Karar, kapsam kâğıdında yazılır. Toplantıda sözlü kalmaz."),
    ],
  ),
];
