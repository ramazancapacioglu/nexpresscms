import type { BlockNode } from "@nexpress/core";
import type { ThemeDemoEntry } from "./demo-pack";

/** Demo sayfa kurucuları. Adresler `sera-` ile başlar. */
let seq = 0;
const node = (type: string, props: Record<string, unknown>, extra: Partial<BlockNode> = {}): BlockNode =>
  ({ id: `sa_${++seq}`, type, props, ...extra }) as BlockNode;

const h = (text: string, level = "h2") => node("heading_element", { text, level });
const p = (text: string) => node("paragraph_element", { text });
const html = (value: string) => node("paragraph_element", { html: value });
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
  node("columns", { layout, gap: "28px", verticalAlign: "top", stackAt: "tablet" }, { children: cols });
const band = (cls: string, children: BlockNode[]): BlockNode =>
  node("section", { containerMode: "full" }, { children, style: { cssClass: cls, fullWidth: true } });

function work(kicker: string, title: string, text: string, href: string): BlockNode {
  return band("sa-work", [
    row([
      col([p(kicker), h(title, "h3"), p(text)]),
      col([html(`<a href="${href}">İşi gör</a>`)]),
    ], "8+4"),
  ]);
}

function page(slug: string, title: string, tldrText: string, schemaType: string, blocks: BlockNode[]): ThemeDemoEntry {
  return { type: "page", slug, title, tldr: tldrText, schemaType, blocks };
}
function post(slug: string, title: string, tldrText: string, blocks: BlockNode[]): ThemeDemoEntry {
  return { type: "post", slug, title, tldr: tldrText, schemaType: "Article", canvas: false, blocks, categories: ["Ajans notu"] };
}

const HOME_TLDR = "Sera, marka, site ve ölçümü aynı masada tutan bir dijital ajanstır. Demo verisidir; müşteri adı ve ödül yoktur.";

export const SA_ENTRIES: ThemeDemoEntry[] = [
  page("sera-vitrin", "Keskin markalar kurarız", HOME_TLDR, "WebPage", [
    hero(
      "Keskin markalar kurarız. Yeni işe açığız.",
      "Site, kimlik ve ölçüm aynı masada biter. Demo verisidir; müşteri adı yoktur.",
      ["Son işler", "/tr/sera-isler"],
      ["Teklif al", "/tr/sera-iletisim"],
    ),
    tldr(HOME_TLDR),
    band("sa-ink", [
      h("Görsel işi kendi yöntemimizle çözeriz."),
      p("Önce kim kullanacak, sonra ekran. Slayt, kapsam yazılmadan açılmaz."),
    ]),
    row([
      col([h("Son işler", "h3")]),
      col([html('<a href="/tr/sera-isler">Tüm işler</a>')]),
    ], "8+4"),
    work("Marka sitesi", "Pazar vitrini", "Semt pazarının haftalık liste sayfası. Örnek kayıt.", "/tr/sera-is-pazar"),
    work("Randevu", "Klinik sayfası", "Üç hekim, tek randevu sırası. Örnek kayıt.", "/tr/sera-is-klinik"),
    work("Kimlik", "Atölye yüzü", "Tabela, kart ve site aynı sözcükleri kullanır. Örnek kayıt.", "/tr/sera-is-atolye"),
    h("Ne yaparız"),
    row([
      col([h("Marka", "h3"), p("Ad, renk ve cümle. Tabelada ve sitede aynı kalır.")]),
      col([h("Site", "h3"), p("Hızlı, okunur, tek dilde düz adres.")]),
      col([h("Arayüz", "h3"), p("Sipariş, randevu ya da panel. Gereksiz ekran yok.")]),
      col([h("Ölçüm", "h3"), p("Hangi sayfa iş getiriyor, ayda bir yazılır.")]),
    ], "3+3+3+3"),
    steps("Dört adım", [
      ["Dinleme", "Kim arar, neyi sorar, nerede bırakır."],
      ["Yön", "Tek cümle ve üç sayfa. Fazlası sonraki iş."],
      ["Yayın", "Adres açılmadan kontrol listesi kapanır."],
      ["Ay", "İlk ay ölçüm notu yazılır. Beğeni değil, gelen iş sayılır."],
    ]),
    faq("Başlamadan", [
      ["Hazır şablon satıyor musunuz?", "Hayır. Her iş kendi kapsamıyla yazılır."],
      ["Mevcut site durur mu?", "İçerik durur. Adres ve hız ayrıca bakılır."],
      ["Süre?", "Küçük vitrin üç ile altı hafta. Kapsam bunu aşarsa iş bölünür."],
    ]),
    cta("Yazın, aynı gün döneriz.", "Hangi sayfa işi kaçırıyor, onu yazmanız yeter.", "İletişim", "/tr/sera-iletisim"),
  ]),
  page("sera-isler", "Son işler", "Üç örnek kayıt: pazar vitrini, klinik randevusu, atölye kimliği. İsim ve sonuç rakamı yok. Demo verisidir.", "WebPage", [
    hero("Son işler", "Üç örnek. Müşteri adı yazılmadı.", ["Teklif al", "/tr/sera-iletisim"]),
    tldr("Üç örnek kayıt: pazar vitrini, klinik randevusu, atölye kimliği. İsim ve sonuç rakamı yok. Demo verisidir."),
    work("Marka sitesi", "Pazar vitrini", "Haftalık liste, tezgâh sırası bozulmadan ekrana indi.", "/tr/sera-is-pazar"),
    work("Randevu", "Klinik sayfası", "Üç hekim aynı sırayı görür.", "/tr/sera-is-klinik"),
    work("Kimlik", "Atölye yüzü", "Tabela ile site aynı cümleyi söyler.", "/tr/sera-is-atolye"),
  ]),
  page("sera-is-pazar", "Pazar vitrini", "Semt pazarının haftalık liste sayfası. Tezgâh sırası ekranda da aynı kaldı. Örnek kayıttır.", "WebPage", [
    hero("Pazar vitrini", "Haftalık liste. Örnek kayıt, müşteri adı yok.", ["Tüm işler", "/tr/sera-isler"]),
    tldr("Semt pazarının haftalık liste sayfası. Tezgâh sırası ekranda da aynı kaldı. Örnek kayıttır."),
    h("Ne değişti"),
    p("Liste kâğıtta asılıyordu, telefonda fotoğraf olarak dolaşıyordu. Aynı liste tek adreste durur. Tezgâh sırası bozulmadı."),
    h("Ne yazılmadı"),
    p("Sonuç yüzdesi ve ziyaretçi sayısı yok. Ölçüm, yayın ayında ayrıca yazılır."),
  ]),
  page("sera-is-klinik", "Klinik sayfası", "Üç hekim, tek randevu sırası. Sekreter ile hekim aynı listeyi açar. Örnek kayıttır.", "WebPage", [
    hero("Klinik sayfası", "Randevu sırası tek listede. Örnek kayıt.", ["Tüm işler", "/tr/sera-isler"]),
    tldr("Üç hekim, tek randevu sırası. Sekreter ile hekim aynı listeyi açar. Örnek kayıttır."),
    h("Ne değişti"),
    p("Randevu defteri ve mesaj aynı kayda indi. Hasta, boş saati sayfada görür. Saat uydurulmadı; sıra yapısı yazıldı."),
  ]),
  page("sera-is-atolye", "Atölye yüzü", "Tabela, kart ve site aynı sözcükleri kullanır. Örnek kayıttır.", "WebPage", [
    hero("Atölye yüzü", "Tabela ile site aynı cümle. Örnek kayıt.", ["Tüm işler", "/tr/sera-isler"]),
    tldr("Tabela, kart ve site aynı sözcükleri kullanır. Örnek kayıttır."),
    h("Ne değişti"),
    p("Kartvizitte bir cümle, sitede başka bir cümle vardı. İkisi tek cümlede birleşti. Renk tabeladaki boyadan alındı."),
  ]),
  page("sera-hizmetler", "Dört iş: marka, site, arayüz, ölçüm", "Ajans dört iş alır. Reklam bütçesi ve hazır paket yoktur. Demo verisidir.", "WebPage", [
    hero("Dört iş alırız", "Beşinci paket yok. Kapsam bunlardan biri değilse işi geri çeviririz.", ["Yaklaşım", "/tr/sera-yaklasim"]),
    tldr("Ajans dört iş alır: marka, site, arayüz, ölçüm. Reklam bütçesi ve hazır paket yoktur. Demo verisidir."),
    h("Marka"),
    p("Ad, kısa cümle, renk. Tabelada, kartta ve sitede aynı."),
    h("Site"),
    p("Düz adres, tek başlık, hızlı açılış. Dil ön eki yalnızca ikinci dil gelince çıkar."),
    h("Arayüz"),
    p("Sipariş, randevu veya iç panel. Ekran, bugünkü fişin sırasını bozmaz."),
    h("Ölçüm"),
    p("Ayda bir not: hangi sayfa yazışma getirdi. Puan uydurulmaz."),
    html('<a href="/tr/sera-yazi-olcum">Ölçüm notu</a>'),
    faq("Sınır", [
      ["Reklam yönetimi var mı?", "Hayır. Sayfa ve ölçüm notu var. Bütçe yönetimi yok."],
      ["Hazır tema kurar mısınız?", "Hayır. Yerleşim bu işin kapsamından yazılır."],
    ]),
  ]),
  page("sera-yaklasim", "Önce kim kullanacak", "İş dört adımda yürür: dinleme, yön, yayın, ay. Tarih kapsama bağlanır. Demo verisidir.", "WebPage", [
    hero("Önce kim kullanacak", "Ekran, bu soru yazılmadan çizilmez.", ["Hizmetler", "/tr/sera-hizmetler"], ["Yazın", "/tr/sera-iletisim"]),
    tldr("İş dört adımda yürür: dinleme, yön, yayın, ay. Tarih kapsama bağlanır. Demo verisidir."),
    steps("Dört adım", [
      ["Dinleme", "Bir gün. Arayan ne sorar, nerede bırakır."],
      ["Yön", "Tek cümle, üç sayfa, tarih. İmzalanmadan çizim yok."],
      ["Yayın", "Liste kapanmadan adres açılmaz."],
      ["Ay", "İlk ayın notu gelen işi sayar."],
    ]),
    html('<a href="/tr/sera-yazi-marka">Marka cümlesi nasıl seçilir</a>'),
  ]),
  page("sera-ajans", "Küçük bir ajans masası", "Sera dört kişilik bir masadır. Marka, site, arayüz ve ölçüm dışında iş almaz. Demo verisidir.", "AboutPage", [
    hero("Dört kişilik bir masa", "İzmir, randevuyla. İlk gün yerinde.", ["İletişim", "/tr/sera-iletisim"]),
    tldr("Sera dört kişilik bir masadır. Marka, site, arayüz ve ölçüm dışında iş almaz. Demo verisidir."),
    h("Kim var"),
    p("Biri cümleyi yazar, biri yerleşimi çizer, biri sayfayı yayınlar, biri ay notunu tutar."),
    h("Adres"),
    p("Demo verisi. Örnek adres: Alsancak, İzmir. Telefon 0232 000 00 00. E-posta merhaba@seraajans.example."),
  ]),
  page("sera-yazilar", "Ajans notları", "Marka, site ve ölçüm üzerine üç not. Demo verisidir.", "WebPage", [
    hero("Ajans notları", "Üç yazı. Yeni not eklenince liste güncellenir.", ["Marka notu", "/tr/sera-yazi-marka"]),
    tldr("Marka, site ve ölçüm üzerine üç not. Demo verisidir."),
    node("dynamic_list", { source: "posts", limit: 9, orderBy: "newest", layout: "list", columns: 1, showImage: false, showExcerpt: true, showDate: true, showSearch: true, showFilters: false, paginate: true }),
  ]),
  page("sera-sss", "Sık sorulan sorular", "Şablon, süre, mevcut site ve ölçüm. Yanıtlar kısadır. Demo verisidir.", "FAQPage", [
    hero("Sık sorulan sorular", "Dört yanıt. Listede yoksa iletişim sayfasına yazın.", ["Yazın", "/tr/sera-iletisim"]),
    tldr("Şablon, süre, mevcut site ve ölçüm. Yanıtlar kısadır. Demo verisidir."),
    faq("Yanıtlar", [
      ["Hazır şablon var mı?", "Yok. Yerleşim kapsamdan yazılır."],
      ["Küçük vitrin ne kadar sürer?", "Üç ile altı hafta. Liste uzarsa iş bölünür, tarih kaymaz."],
      ["Eski site silinir mi?", "İçerik durur. Adres değişecekse yönlendirme ayrıca yazılır."],
      ["Ölçüm ne sayar?", "Gelen yazışma ve hangi sayfadan geldiği. Uydurma puan yok."],
    ]),
  ]),
  page("sera-iletisim", "Teklif için yazın", "Hangi sayfa işi kaçırıyor, onu yazın. Aynı gün dönüş yapılır. Demo verisidir.", "WebPage", [
    hero("Teklif için yazın", "Telefon 0232 000 00 00. E-posta merhaba@seraajans.example.", ["Sorular", "/tr/sera-sss"]),
    tldr("Hangi sayfa işi kaçırıyor, onu yazın. Aynı gün dönüş yapılır. Demo verisidir."),
    row([
      col([
        h("Yazışma"),
        p("Hafta içi 09:00–18:00. Demo verisi. Örnek adres: Alsancak, İzmir."),
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
            { id: "not", name: "not", label: "Hangi sayfa işi kaçırıyor", type: "textarea", required: true, width: "full" },
            { id: "onay", name: "onay", label: "Yanıt için yazdığım adrese dönülebilir.", type: "checkbox", required: true, width: "full" },
          ],
        }),
      ]),
    ], "6+6"),
  ]),
  page("sera-gizlilik", "Gizlilik notu", "Formdaki ad ve e-posta yalnızca dönüş için tutulur. Demo verisidir.", "WebPage", [
    hero("Gizlilik notu", "Form bülten listesine yazılmaz.", ["İletişim", "/tr/sera-iletisim"]),
    tldr("Formdaki ad ve e-posta yalnızca dönüş için tutulur. Demo verisidir."),
    h("Form"),
    p("Ad, e-posta ve not gelen kutusunda durur. Yanıttan sonra silinir."),
    h("Çerez"),
    p("Ziyaret ölçümü kapalıyken üçüncü parti betik yüklenmez."),
  ]),
  post("sera-yazi-marka", "Marka cümlesi nasıl seçilir", "Tabela, kart ve site aynı cümleyi söyler. Cümle, arayanın sorduğu sorudan çıkar. Demo verisidir.", [
    h("Tek cümle"),
    p("Arayan ilk soruyu sorar. Cümle o sorunun yanıtıdır. İkinci cümle sitede başka bir sayfaya kalır."),
    p("Tabelaya sığmayan cümle yanlıştır. Kısaltılır, yeni sözcük eklenmez."),
  ]),
  post("sera-yazi-site", "Site üç sayfayı geçince bölünür", "İlk yayın üç sayfadır. Dördüncü sayfa, bu üçü oturunca yazılır. Demo verisidir.", [
    h("Üç sayfa"),
    p("Ne iş, nasıl yürür, nasıl yazılır. Başka sayfa ilk tarihe girmez."),
    p("Liste uzarsa tarih kaymaz. İş bölünür."),
  ]),
  post("sera-yazi-olcum", "Ay notu puan yazmaz", "Not, hangi sayfanın yazışma getirdiğini sayar. Ziyaretçi puanı ve uydurma derece yoktur. Demo verisidir.", [
    h("Ne sayılır"),
    p("Form ve arama. Hangi sayfadan geldiği. Ayda bir, bir sayfa."),
    h("Ne sayılmaz"),
    p("Beğeni, derece ve karşılaştırmalı skor. Bunlar notta yer almaz."),
  ]),
];
