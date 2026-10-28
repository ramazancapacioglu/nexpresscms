/**
 * Türkçe katalog: anahtarların TEK kaynağıdır. Diğer diller bu şekle uymak zorundadır
 * (`Messages` tipi); eksik/fazla anahtar derleme hatasıdır.
 * Değişkenler `{ad}`, çoğul `{n, plural, one {...} other {...}}`.
 */
export const tr = {
  common: {
    backToStore: "Mağazaya dön",
    siteSearch: "Site içi arama",
    notFoundTitle: "Sayfa bulunamadı",
  },
  search: {
    title: "Ara",
    placeholder: "Aramak istediğiniz sözcükler",
    button: "Ara",
    noResults: "“{q}” için sonuç bulunamadı.",
  },
  content: {
    restricted: "Kısıtlı içerik",
    restrictedBody: "Bu içerik kurumsal üyelere veya parola sahiplerine özel olarak işaretlenmiştir.",
    shareHeading: "Bu içeriği paylaşın ve yapay zeka ajanlarına aktarın",
    reviewsHeading: "Değerlendirmeler, incelemeler ve yorumlar ({n})",
    reviewsSubheading: "Doğrulanmış kullanıcı deneyimleri ve Schema.org AggregateRating verileri.",
    approvedCount: "{n, plural, one {# onaylı kayıt} other {# onaylı kayıt}}",
    ratingSummary: "{avg} / 5.0 ({n, plural, one {# değerlendirme} other {# değerlendirme}})",
    verified: "Doğrulanmış deneyim",
    pros: "Artılar",
    noReviews: "Bu içerik için henüz inceleme eklenmemiş.",
  },
  shop: {
    title: "Mağaza",
    subtitle: "Katalog ürünleri",
    empty: "Şu an listelenecek ürün yok.",
    productNotFound: "Ürün bulunamadı",
    back: "← Mağaza",
    cartEmpty: "Sepetiniz boş.",
    update: "Güncelle",
    toCheckout: "Ödemeye geç",
    checkout: "Ödeme",
    orderNote: "Sipariş notu",
    placeOrder: "Siparişi tamamla",
    thanks: "Teşekkürler",
    orderReceived: "Siparişiniz alındı",
    city: "İl",
    cart: "Sepet",
    backToCart: "← Sepet",
    outOfStock: "Stokta yok",
    quantity: "Adet",
    addToCart: "Sepete ekle",
    total: "Toplam",
    paymentNote: "Kapıda ödeme / havale simülasyonu — kart entegrasyonu sonraki fazda eklenecek.",
    referenceNo: "referans",
    fullName: "Ad soyad",
    email: "E-posta",
    phone: "Telefon",
    address: "Adres",
    address2: "Adres 2",
    postalCode: "Posta kodu",
    coupon: "Kupon kodu",
  },
} as const;

type Widen<T> = T extends string ? string : { -readonly [K in keyof T]: Widen<T[K]> };
/** Tüm dillerin uyması gereken şekil (değerler string). */
export type Messages = Widen<typeof tr>;
