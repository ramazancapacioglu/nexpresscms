import type { GenericDemoCopy } from "./demo-generic";

/** Her resmi temanın sektörüne uygun demo metinleri. Sayı ve fiyatlar örnektir; panelde "Demo verisi" etiketi taşır. */

export const AURORA_DEMO: GenericDemoCopy = {
  themeId: "corporate-aurora",
  homeSlug: "aurora-vitrin",
  brand: "Aurora Bulut",
  summary: "B2B yazılım şirketi için ürün vitrini: ana sayfa, hakkında, hizmetler, fiyatlar, iletişim ve üç blog yazısı.",
  hero: {
    badge: "Kurumsal bulut platformu",
    title: "Ekibinizin işini tek platformda hızlandırın",
    subtitle: "Proje, doküman ve müşteri verisini tek yerde toplayın. Kurulum gerektirmez, ilk gün ekibinizle çalışmaya başlayın.",
    cta: ["Ücretsiz deneyin", "/tr/aurora-iletisim"],
    secondary: ["Fiyatları görün", "/tr/aurora-fiyatlar"],
  },
  tldr: "Aurora Bulut; proje yönetimi, doküman ve müşteri iletişimini tek panelde birleştiren, 15 dakikada kurulan kurumsal bir bulut platformudur.",
  stats: [["15 dk", "Ortalama kurulum süresi"], ["99,9%", "Hedeflenen çalışma süresi"], ["7/24", "Teknik destek"], ["256-bit", "Şifreli veri aktarımı"]],
  features: {
    title: "İşinizi büyüten özellikler",
    subtitle: "Her özellik tek bir iş akışını kolaylaştırmak için tasarlandı.",
    items: [
      { icon: "layers", title: "Tek çalışma alanı", description: "Görev, dosya ve konuşmalar aynı ekranda; sekmeler arasında kaybolmayın." },
      { icon: "shield", title: "Kurumsal güvenlik", description: "Rol bazlı yetki, iki adımlı doğrulama ve ayrıntılı denetim günlüğü." },
      { icon: "zap", title: "Otomasyon", description: "Tekrarlayan işleri kurallara bağlayın, ekibiniz önemli işe odaklansın." },
      { icon: "chart", title: "Canlı raporlar", description: "Ekip ve proje performansını gerçek zamanlı panolarla izleyin." },
      { icon: "cloud", title: "Her yerden erişim", description: "Tarayıcıdan ve mobilden aynı veriyle, kesintisiz çalışın." },
      { icon: "headphones", title: "Yerinde destek", description: "Kurulum ve eğitim sürecinde uzman ekibimiz yanınızda." },
    ],
  },
  steps: {
    title: "Üç adımda başlayın",
    items: [
      ["Hesabınızı açın", "E-posta adresinizle kaydolun, şirket alanınızı oluşturun."],
      ["Ekibinizi davet edin", "Bağlantı paylaşarak veya listeyle yükleyerek çalışma arkadaşlarınızı ekleyin."],
      ["İlk projenizi kurun", "Hazır şablonlardan birini seçin ve görevleri atamaya başlayın."],
    ],
  },
  plans: {
    title: "Ekibinize uygun plan",
    items: [
      { name: "Başlangıç", price: "Ücretsiz", description: "5 kullanıcıya kadar, temel özellikler.", ctaLabel: "Başla" },
      { name: "Takım", price: "399 TL / kullanıcı", description: "Otomasyon, gelişmiş raporlar ve öncelikli destek.", ctaLabel: "Deneyin", featured: true },
      { name: "Kurumsal", price: "Teklif alın", description: "Özel kurulum, SSO ve hizmet seviyesi sözleşmesi.", ctaLabel: "Görüşelim" },
    ],
  },
  faq: [
    ["Deneme süresi var mı?", "Evet. Takım planını 14 gün ücretsiz deneyebilirsiniz; kredi kartı gerekmez."],
    ["Verilerim nerede tutuluyor?", "Veriler Türkiye ve Avrupa'daki veri merkezlerinde şifreli olarak saklanır; bölge seçimini siz yaparsınız."],
    ["Mevcut araçlarımdan veri taşıyabilir miyim?", "CSV ve yaygın proje araçlarından içe aktarma desteklenir. Büyük taşımalarda ekibimiz yardımcı olur."],
  ],
  about: {
    title: "Ekiplerin işini sadeleştiriyoruz",
    lead: "Aurora Bulut, dağınık araçlardan yorulan ekipler için kuruldu.",
    paragraphs: [
      "İş yerinde zamanın büyük kısmı bilgi aramakla geçiyor. Biz, görev, doküman ve konuşmaları tek çatıda toplayarak bu kaybı azaltmak için yola çıktık.",
      "Ürünümüzü müşterilerimizle birlikte geliştiriyoruz. Her sürümde en çok istenen özellikler önceliklendirilir ve yol haritası açıkça paylaşılır.",
    ],
    values: [
      { icon: "handshake", title: "Şeffaflık", text: "Fiyat, yol haritası ve kesintiler konusunda açık iletişim." },
      { icon: "shield", title: "Güven", text: "Verinizi korumak, ürünün temel görevidir." },
      { icon: "lightbulb", title: "Sadelik", text: "Karmaşık işi anlaşılır kılan arayüzler." },
      { icon: "users", title: "Birlikte gelişim", text: "Müşteri geri bildirimiyle şekillenen ürün." },
    ],
  },
  contact: { phone: "+90 212 000 00 00", email: "merhaba@ornek.com", address: "Levent, İstanbul (örnek adres)" },
  closing: { title: "Ekibinizle denemeye hazır mısınız?", subtitle: "14 gün ücretsiz deneyin, beğenmezseniz hiçbir şey ödemeyin.", button: "Hemen başlayın" },
  posts: [
    { slug: "aurora-uzaktan-ekip-yonetimi", title: "Uzaktan ekip yönetiminde 5 pratik alışkanlık", tldr: "Uzaktan çalışan ekiplerde net hedef, ortak doküman ve kısa toplantılar verimi belirgin biçimde artırır.", category: "Verimlilik", sections: [["Net hedefle başlayın", "Her haftanın başında ekibe tek cümlelik bir hedef verin. Hedef ölçülebilir olduğunda toplantı sayısı da azalır."], ["Bilgiyi yazılı paylaşın", "Kararları ve gerekçelerini ortak bir dokümana yazın. Böylece yeni katılan biri de bağlamı hızla kavrar."], ["Toplantıyı kısa tutun", "Gündemi önceden paylaşın, 25 dakikayı aşmayın ve her toplantıdan sonra sorumluları yazın."]] },
    { slug: "aurora-guvenli-dosya-paylasimi", title: "Dosya paylaşırken güvenlikten ödün vermeyin", tldr: "Kurumsal dosya paylaşımında rol bazlı yetki, bağlantı süresi ve erişim günlüğü üç temel önlemdir.", category: "Güvenlik", sections: [["Yetkiyi role bağlayın", "Dosya erişimini kişiye değil rollere verin; ekip değiştiğinde izinleri tek tek düzeltmeniz gerekmez."], ["Bağlantılara süre koyun", "Dışarıyla paylaşılan bağlantılar belirli bir günde kapansın."], ["Erişimi kaydedin", "Kimin neye ne zaman eriştiğini gösteren günlük, olası bir olayda en değerli kaynaktır."]] },
    { slug: "aurora-otomasyonla-zaman-kazanin", title: "Otomasyonla haftada 5 saat kazanın", tldr: "Tekrarlayan görev atamaları ve durum bildirimleri otomatikleştirildiğinde ekipler haftada saatlerce zaman kazanır.", category: "Verimlilik", sections: [["Neyi otomatikleştirmeli?", "Her hafta aynı biçimde yaptığınız işleri listeleyin: atama, hatırlatma, rapor gönderimi."], ["Küçük başlayın", "Önce tek bir kural kurun, sonuçlarını bir hafta izleyin, sonra genişletin."]] },
  ],
  showPosts: true,
};

export const VELOCITY_DEMO: GenericDemoCopy = {
  themeId: "commerce-velocity",
  homeSlug: "velocity-magaza",
  brand: "Velocity Market",
  summary: "Online mağaza vitrini: ana sayfa, kategoriler, kargo ve iade bilgileri, iletişim ve üç alışveriş rehberi.",
  hero: {
    badge: "Yeni sezon",
    title: "İhtiyacınız olan her şey, ertesi gün kapınızda",
    subtitle: "Binlerce üründe güvenli ödeme, ücretsiz kargo ve 14 gün koşulsuz iade.",
    cta: ["Alışverişe başla", "/tr/magaza"],
    secondary: ["Kampanyalar", "/tr/kampanyalar"],
  },
  tldr: "Velocity Market; hızlı kargo, güvenli ödeme ve kolay iade ile online alışverişi sadeleştiren bir e-ticaret vitrinidir.",
  stats: [["24 saat", "İçinde kargoya teslim"], ["14 gün", "Koşulsuz iade"], ["3 taksit", "Vade farksız"], ["7/24", "Müşteri desteği"]],
  features: {
    title: "Neden Velocity Market?",
    subtitle: "Alışverişin her adımını kolaylaştıran avantajlar.",
    items: [
      { icon: "truck", title: "Hızlı kargo", description: "Hafta içi 16:00'ya kadar verilen siparişler aynı gün kargoya çıkar." },
      { icon: "credit-card", title: "Güvenli ödeme", description: "3D Secure destekli ödeme; kart bilgileriniz bizde saklanmaz." },
      { icon: "package", title: "Kolay iade", description: "Memnun kalmazsanız 14 gün içinde ücretsiz iade edin." },
      { icon: "tag", title: "Fırsat ürünleri", description: "Her hafta güncellenen indirimli ürünleri kaçırmayın." },
      { icon: "gift", title: "Hediye paketi", description: "Siparişinize tek tıkla hediye paketi ve not ekleyin." },
      { icon: "headphones", title: "Canlı destek", description: "Sipariş sürecinde sorularınızı anında yanıtlıyoruz." },
    ],
  },
  steps: {
    title: "Sipariş süreci",
    items: [
      ["Ürünü seçin", "Kategorilere göz atın, ürünü sepetinize ekleyin."],
      ["Ödemeyi tamamlayın", "Adres ve ödeme bilgilerinizi girin; sipariş onayını e-postanızda görün."],
      ["Takip edin", "Kargo çıkışında takip bağlantısı otomatik olarak gönderilir."],
    ],
  },
  plans: {
    title: "Kargo seçenekleri",
    items: [
      { name: "Standart", price: "Ücretsiz", description: "500 TL üzeri siparişlerde, 2-3 iş günü.", ctaLabel: "Detay" },
      { name: "Hızlı", price: "39 TL", description: "Ertesi iş günü teslimat.", ctaLabel: "Detay", featured: true },
      { name: "Mağazadan teslim", price: "Ücretsiz", description: "Sipariş hazır olduğunda mağazamızdan alın.", ctaLabel: "Detay" },
    ],
  },
  faq: [
    ["Siparişim ne zaman gelir?", "Standart gönderiler 2-3 iş gününde, hızlı gönderiler ertesi iş günü teslim edilir."],
    ["İade nasıl yapılır?", "Hesabınızdan iade talebi oluşturun, kargo kodunuzu e-postayla alın; ürün depoya ulaşınca ücret iade edilir."],
    ["Taksit yapabilir miyim?", "Anlaşmalı bankaların kredi kartlarına vade farksız taksit imkânı sunuyoruz."],
  ],
  about: {
    title: "Alışverişi kolaylaştırıyoruz",
    lead: "Velocity Market, müşterisinin zamanına saygı duyan bir online mağazadır.",
    paragraphs: [
      "Ürün seçiminden kapınıza teslimata kadar her adımı sade tutmaya çalışıyoruz. Stok bilgisi anlık gösterilir, kargo süreci şeffaf izlenir.",
      "Tedarikçilerimizi kaliteye göre seçer, ürünleri sevkiyattan önce kontrol ederiz.",
    ],
    values: [
      { icon: "truck", title: "Hız", text: "Aynı gün kargo hedefi." },
      { icon: "shield", title: "Güven", text: "Orijinal ürün ve güvenli ödeme." },
      { icon: "heart", title: "Müşteri odağı", text: "Sorunlarda hızlı çözüm." },
      { icon: "leaf", title: "Sorumluluk", text: "Geri dönüştürülebilir ambalaj." },
    ],
  },
  contact: { phone: "+90 850 000 00 00", email: "destek@ornek.com", address: "Ataşehir, İstanbul (örnek adres)" },
  closing: { title: "İlk siparişinizde %10 indirim", subtitle: "Bültene katılın, indirim kodunuz e-postanıza gelsin.", button: "Alışverişe başla" },
  posts: [
    { slug: "velocity-dogru-urun-secimi", title: "Online alışverişte doğru ürünü seçmenin 4 yolu", tldr: "Yorumları, iade koşullarını, teknik özellikleri ve fiyat geçmişini kontrol etmek hatalı alışverişi azaltır.", category: "Alışveriş rehberi", sections: [["Yorumları okuyun", "Puandan çok yorumların içeriğine bakın; sık tekrarlanan şikâyetler önemli bir işarettir."], ["İade koşullarını kontrol edin", "Satıcının iade süresi ve kargo ücreti politikası karar vermenizi kolaylaştırır."], ["Teknik özellikleri karşılaştırın", "Benzer ürünleri yan yana koyun, size gerçekten gerekmeyen özelliklere ödeme yapmayın."]] },
    { slug: "velocity-guvenli-odeme", title: "İnternette güvenli ödeme için kontrol listesi", tldr: "Adres çubuğunda kilit simgesi, 3D Secure ve tanıdık bir mağaza güvenli ödemenin üç temel işaretidir.", category: "Güvenlik", sections: [["Adresi kontrol edin", "Ödeme sayfası https ile başlamalı ve alan adı mağazaya ait olmalı."], ["3D Secure kullanın", "Bankanızdan gelen tek kullanımlık kod, kart bilgisi çalınsa bile ödemeyi engeller."]] },
    { slug: "velocity-hediye-rehberi", title: "Hediye seçerken sık yapılan hatalar", tldr: "Kişinin ilgi alanını, bütçeyi ve teslim tarihini önceden belirlemek hediye alışverişini hızlandırır.", category: "Alışveriş rehberi", sections: [["Bütçeyi belirleyin", "Üst sınırı baştan koyun; seçenekler hızla daralır."], ["Teslim tarihini hesaba katın", "Özel günlerde kargo yoğunluğu olur; siparişi birkaç gün önce verin."]] },
  ],
};

export const PULSE_DEMO: GenericDemoCopy = {
  themeId: "editorial-pulse",
  homeSlug: "pulse-dergi",
  brand: "Pulse Dergi",
  summary: "Teknoloji ve iş dünyası yayını: ana sayfa, hakkında, hizmetler, iletişim ve beş okumalık yazı.",
  hero: {
    badge: "Bağımsız analiz",
    title: "Gürültüsüz teknoloji ve iş haberciliği",
    subtitle: "Haftanın önemli gelişmelerini kısa, kaynaklı ve anlaşılır biçimde sunuyoruz.",
    cta: ["Yayın ilkelerimiz", "/tr/pulse-hizmetler"],
    secondary: ["Bültene katılın", "/tr/pulse-iletisim"],
  },
  tldr: "Pulse Dergi; teknoloji, iş dünyası ve dijital kültür üzerine kaynaklı, kısa ve bağımsız analizler yayımlayan çevrim içi bir dergidir.",
  stats: [["Haftalık", "Yeni analiz"], ["5 dk", "Ortalama okuma süresi"], ["Kaynaklı", "Her haber doğrulanır"], ["Reklamsız", "Okuma deneyimi"]],
  features: {
    title: "Yayın ilkelerimiz",
    subtitle: "Okuyucuya saygı duyan bir yayıncılık anlayışı.",
    items: [
      { icon: "newspaper", title: "Kaynaklı haber", description: "Her iddia, birincil kaynağa bağlantıyla sunulur." },
      { icon: "scale", title: "Tarafsızlık", description: "Sponsorlu içerik açıkça işaretlenir, editoryal içerikten ayrı tutulur." },
      { icon: "clock", title: "Kısa ve net", description: "Uzun yazılar bile bir özetle başlar; zamanınıza saygı duyarız." },
      { icon: "pen", title: "Deneyimli yazarlar", description: "Konusunda uzman gazeteci ve araştırmacılar." },
      { icon: "check-circle", title: "Düzeltme politikası", description: "Hatalar fark edildiğinde yazının altında açıkça belirtilir." },
      { icon: "bell", title: "Bülten", description: "Haftanın en önemli beş yazısı Cuma sabahı e-postanızda." },
    ],
  },
  steps: {
    title: "Bir yazı nasıl yayına girer?",
    items: [
      ["Konu seçimi", "Editör ekibi haftalık toplantıda okuyucu için önemli konuları belirler."],
      ["Araştırma ve doğrulama", "Yazar kaynakları toplar, her iddia ikinci bir editör tarafından kontrol edilir."],
      ["Yayın ve düzeltme", "Yayından sonra okuyucu geri bildirimi izlenir, gerekirse yazı düzeltilir."],
    ],
  },
  faq: [
    ["Yazı önerisinde bulunabilir miyim?", "Evet. İletişim sayfasındaki e-posta adresine konu önerinizi ve varsa kaynaklarınızı gönderin."],
    ["Yazıları paylaşabilir miyim?", "Bağlantı vererek dilediğiniz gibi paylaşabilirsiniz. Tam metin kopyalamak için izin gerekir."],
    ["Bülten ücretli mi?", "Hayır, bülten ücretsizdir ve istediğiniz zaman tek tıkla ayrılabilirsiniz."],
  ],
  about: {
    title: "Okuyucuya saygılı yayıncılık",
    lead: "Pulse Dergi, haber gürültüsünden yorulan okuyucular için kuruldu.",
    paragraphs: [
      "Teknoloji ve iş dünyasında her gün yüzlerce haber çıkıyor; çoğu aynı şeyi tekrar ediyor. Biz yalnızca anlamlı olanı, bağlamıyla birlikte anlatmayı seçtik.",
      "Küçük bir editör ekibiyiz ve bağımsızız. Gelirimiz okuyucu desteğinden ve açıkça işaretlenmiş sponsorluklardan gelir.",
    ],
    values: [
      { icon: "check-circle", title: "Doğruluk", text: "Doğrulanmamış bilgiyi yayımlamayız." },
      { icon: "scale", title: "Bağımsızlık", text: "Editoryal kararlar reklamdan bağımsızdır." },
      { icon: "clock", title: "Zaman saygısı", text: "Kısa özet, net başlık." },
      { icon: "users", title: "Okuyucu katılımı", text: "Geri bildirimler yazıları şekillendirir." },
    ],
  },
  contact: { phone: "+90 212 000 00 01", email: "editor@ornek.com", address: "Beşiktaş, İstanbul (örnek adres)" },
  closing: { title: "Haftanın en önemli beş yazısı", subtitle: "Her Cuma sabahı e-postanızda. Reklamsız, ücretsiz.", button: "Bültene katıl" },
  posts: [
    { slug: "pulse-yapay-zeka-ve-is-dunyasi", title: "Yapay zeka iş dünyasını nasıl değiştiriyor?", tldr: "Şirketler yapay zekayı önce tekrarlayan işlerde kullanıyor; asıl dönüşüm karar süreçlerinde yaşanıyor.", category: "Teknoloji", sections: [["Tekrarlayan işlerden başlıyor", "Özetleme, sınıflandırma ve ilk taslak yazımı gibi işlerde zaman kazancı en hızlı görülen alan."], ["Karar süreçleri değişiyor", "Veriyi hızlı yorumlayabilen ekipler, daha kısa sürede daha iyi karar alabiliyor."], ["Dikkat edilmesi gerekenler", "Doğruluk kontrolü ve veri gizliliği, hâlâ insan sorumluluğunda."]] },
    { slug: "pulse-uzaktan-calisma-guncel", title: "Uzaktan çalışma kalıcı mı?", tldr: "Hibrit modeller yaygınlaştı; şirketler artık yer yerine sonuçlara odaklanıyor.", category: "İş dünyası", sections: [["Hibrit model öne çıkıyor", "Birçok şirket haftada birkaç gün ofis, kalan günler esnek çalışmayı benimsiyor."], ["Yönetim biçimi değişiyor", "Saat yerine çıktıyı ölçen yönetim anlayışı yaygınlaşıyor."]] },
    { slug: "pulse-veri-gizliligi", title: "Kişisel veri gizliliği için 5 temel adım", tldr: "Güçlü parola, iki adımlı doğrulama ve izin yönetimi bireysel veri güvenliğinin temelidir.", category: "Güvenlik", sections: [["Parola yöneticisi kullanın", "Her hesap için farklı ve uzun bir parola kullanmanın en pratik yolu."], ["İki adımlı doğrulamayı açın", "Önemli hesaplarınızda ek bir doğrulama adımı, çalınan parolayı işe yaramaz kılar."]] },
    { slug: "pulse-dijital-medya-okuryazarligi", title: "Dijital medya okuryazarlığı neden önemli?", tldr: "Kaynağı sorgulamak ve haberi doğrulamak, yanlış bilginin yayılmasını belirgin biçimde azaltır.", category: "Kültür", sections: [["Kaynağı kontrol edin", "Haberi ilk kimin yayımladığına bakın; belirsizse paylaşmayın."], ["Başlığın ötesine geçin", "Başlık çoğu zaman içeriği doğru yansıtmaz."]] },
    { slug: "pulse-startup-ekosistemi", title: "Türkiye girişim ekosisteminde bu yıl neler oldu?", tldr: "Yatırım turları azaldı ancak erken aşama girişimlerde nitelik arayışı güçlendi.", category: "İş dünyası", sections: [["Yatırım ortamı", "Yatırımcılar daha seçici; gelir modeli net olan girişimler öne çıkıyor."], ["Beklentiler", "Önümüzdeki dönemde kârlılığa odaklanan girişimlerin daha şanslı olması bekleniyor."]] },
  ],
  showPosts: true,
};

export const CRIMSON_DEMO: GenericDemoCopy = {
  themeId: "crimson-erp",
  homeSlug: "crimson-vitrin",
  brand: "Crimson ERP",
  summary: "ERP ve muhasebe yazılımı firması vitrini: ürün sayfaları, uygulama adımları, iletişim ve üç rehber yazı.",
  hero: {
    badge: "ERP · Muhasebe · e-Dönüşüm",
    title: "İşletmenizin tüm süreçleri tek yazılımda",
    subtitle: "Stok, satış, üretim ve muhasebeyi aynı veri üzerinde yönetin. e-Fatura ve e-Arşiv hazır gelir.",
    cta: ["Ücretsiz tanıtım isteyin", "/tr/crimson-iletisim"],
    secondary: ["Çözümleri inceleyin", "/tr/crimson-hizmetler"],
  },
  tldr: "Crimson ERP; stok, satış, üretim ve muhasebeyi tek veritabanında birleştiren, e-Fatura ve e-Arşiv entegrasyonlu işletme yazılımıdır.",
  stats: [["20+", "Yıllık sektör deneyimi"], ["e-Fatura", "Entegrasyon hazır"], ["Yerinde", "Kurulum ve eğitim"], ["Bulut / Yerel", "Çalışma seçeneği"]],
  features: {
    title: "Çözümlerimiz",
    subtitle: "İşletme ölçeğinize göre modüller seçin, ihtiyaç duydukça ekleyin.",
    items: [
      { icon: "calculator", title: "Muhasebe", description: "Ön muhasebeden genel muhasebeye, mizan ve bilanço raporlarıyla." },
      { icon: "package", title: "Stok ve depo", description: "Çoklu depo, seri/lot takibi ve barkodlu sayım." },
      { icon: "receipt", title: "e-Dönüşüm", description: "e-Fatura, e-Arşiv ve e-İrsaliye gönderimi tek ekrandan." },
      { icon: "cpu", title: "Üretim (MRP)", description: "Reçete, iş emri ve ihtiyaç planlaması." },
      { icon: "users", title: "CRM", description: "Müşteri görüşmeleri, teklifler ve takip hatırlatmaları." },
      { icon: "cloud", title: "Bulut erişim", description: "Her yerden güvenle erişin, yedekleme bizde." },
    ],
  },
  steps: {
    title: "Uygulama süreci",
    items: [
      ["İhtiyaç analizi", "Sürecinizi birlikte inceler, doğru modülleri belirleriz."],
      ["Kurulum ve veri aktarımı", "Mevcut cari, stok ve hesap planınızı yeni sisteme aktarırız."],
      ["Eğitim ve canlıya geçiş", "Ekibinize eğitim verir, ilk haftalarda yanınızda kalırız."],
    ],
  },
  plans: {
    title: "İşletme ölçeğine göre",
    items: [
      { name: "Başlangıç", price: "Teklif alın", description: "Tek şubeli işletmeler için temel muhasebe ve stok.", ctaLabel: "Teklif iste" },
      { name: "Profesyonel", price: "Teklif alın", description: "Çok depolu, e-dönüşümlü kapsamlı çözüm.", ctaLabel: "Teklif iste", featured: true },
      { name: "Kurumsal", price: "Teklif alın", description: "Üretim, çoklu şube ve özel entegrasyonlar.", ctaLabel: "Görüşelim" },
    ],
  },
  faq: [
    ["Mevcut verilerimi aktarabilir miyim?", "Evet. Cari, stok ve hesap planı verilerinizi Excel veya mevcut programınızdan aktarıyoruz."],
    ["e-Fatura için ek bir şey gerekir mi?", "Mali mühür ve özel entegratör ya da GİB portal başvurusu gerekir; kurulum adımlarında yardımcı oluruz."],
    ["Bulut mu yerel kurulum mu?", "İkisi de mümkün. Bulutta kurulum gerekmez; yerel kurulumda verileriniz kendi sunucunuzda kalır."],
  ],
  about: {
    title: "İşletmelerin yazılım ortağı",
    lead: "Crimson ERP, yirmi yılı aşkın süredir işletmelere yazılım ve destek sağlıyor.",
    paragraphs: [
      "Küçük atölyelerden çok şubeli firmalara kadar farklı ölçeklerde işletmeyle çalıştık. Yazılımı değil, işleyişi anlayarak başlarız.",
      "Satış sonrası destek ekibimiz telefon, uzaktan bağlantı ve yerinde hizmetle yanınızdadır.",
    ],
    values: [
      { icon: "handshake", title: "Uzun vadeli ortaklık", text: "Satıştan sonra da yanınızdayız." },
      { icon: "shield", title: "Veri güvenliği", text: "Düzenli yedekleme ve yetki yönetimi." },
      { icon: "wrench", title: "Yerinde destek", text: "Kurulum ve eğitimde sahada ekip." },
      { icon: "check-circle", title: "Mevzuata uyum", text: "Yasal değişiklikler zamanında yansıtılır." },
    ],
  },
  contact: { phone: "+90 232 000 00 00", email: "satis@ornek.com", address: "Konak, İzmir (örnek adres)" },
  closing: { title: "Size özel tanıtım yapalım", subtitle: "Bilgilerinizi bırakın, uzman ekibimiz sizi arasın.", button: "Tanıtım isteyin" },
  posts: [
    { slug: "crimson-e-fatura-gecis", title: "e-Fatura'ya geçiş için hazırlık listesi", tldr: "Mali mühür, entegratör seçimi ve program ayarı e-Fatura geçişinin üç temel adımıdır.", category: "e-Dönüşüm", sections: [["Mali mührü edinin", "Mali mühür başvurusunu erken yapın; teslim süresi birkaç gün sürebilir."], ["Entegratörü seçin", "Hizmet kalitesi, destek ve fiyatı karşılaştırın."], ["Programı ayarlayın", "Cari kartlarındaki vergi bilgilerini ve belge numaralandırmayı kontrol edin."]] },
    { slug: "crimson-stok-sayimi", title: "Barkodlu stok sayımıyla hata payını azaltın", tldr: "Barkodlu sayım, elle girişe kıyasla hem süreyi kısaltır hem hata payını azaltır.", category: "Stok", sections: [["Sayım öncesi hazırlık", "Depoyu bölgelere ayırın ve sayım sırasında hareketi durdurun."], ["Farkları analiz edin", "Sayım farklarını fiş bazında inceleyerek kaynağını bulun."]] },
    { slug: "crimson-ay-sonu-kapanis", title: "Ay sonu kapanışını hızlandıran 4 öneri", tldr: "Düzenli mutabakat, açık hesap takibi ve otomatik mizan kontrolü ay sonu kapanışını kısaltır.", category: "Muhasebe", sections: [["Mutabakatı ay içinde yapın", "Cari mutabakatları ay sonuna bırakmayın."], ["Mizanı kontrol edin", "Borç ve alacak toplamlarının eşitliğini ve beklenmeyen bakiyeleri inceleyin."]] },
  ],
};
