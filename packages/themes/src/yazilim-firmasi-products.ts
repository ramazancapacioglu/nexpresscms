/** Ürün, sektör ve e-dönüşüm sayfalarının verisi. Metinler örnek marka (MerkezSoft) için özgün demo kopyasıdır. */
export type Group = "erp" | "muhasebe" | "bulut" | "sektorel" | "diger";

export interface Product {
  slug: string;
  title: string;
  group: Group;
  art: string;
  lead: string;
  modules: Array<[string, string]>;
}

const P = (slug: string, title: string, group: Group, art: string, lead: string, ...modules: Array<[string, string]>): Product => ({ slug, title, group, art, lead, modules });

export const PRODUCTS: Product[] = [
  P("uretim-mrp", "Üretim Yönetimi (MRP)", "erp", "erp", "Hammaddeden nihai ürüne tüm üretim adımları tek merkezde planlanır.",
    ["Reçete ve iş emri", "Ürün ağacı, iş emri ve fire takibi aynı kayıtta."], ["Kapasite planlama", "Makine ve vardiya yükü ekranda görünür."], ["Maliyet analizi", "Her iş emrinin gerçek maliyeti raporlanır."]),
  P("crm", "CRM Müşteri İlişkileri", "erp", "crm", "Müşteri bilgisi, teklif ve satış takibi tek ekranda toplanır.",
    ["Aday ve fırsat takibi", "Satış hunisi aşamalarıyla izlenir."], ["Teklif ve sipariş", "Tekliften siparişe tek tıkla geçiş."], ["Görüşme geçmişi", "E-posta, SMS ve çağrı notları müşteri kartında."]),
  P("insan-kaynaklari", "İnsan Kaynakları", "erp", "ik", "İşe alımdan bordroya tüm personel süreçleri düzenli ve izlenebilir.",
    ["Özlük ve izin", "Personel dosyası ve izin bakiyeleri."], ["Puantaj ve bordro", "Devam kaydından maaş hesabına otomatik akış."], ["Performans", "Hedef ve değerlendirme formları."]),
  P("ofis-veri", "Ofis ve Veri Yönetimi", "erp", "ofis", "Tedarik, bakım, mesajlaşma ve yedekleme tek akıllı sistemde.",
    ["Tedarik ve bakım", "Talep, onay ve bakım takvimi."], ["Dahili mesajlaşma", "Ekip içi yazışma ve duyuru."], ["Yedekleme", "Zamanlı yedek ve geri yükleme."]),
  P("merkez-erp", "Merkez ERP 26", "erp", "dashboard", "Yapay zekâ destekli yeni nesil ERP: ihtiyacınız kadar modül, ihtiyacınız kadar kullanıcı.",
    ["Esnek modül yapısı", "İstediğiniz modülü seçip kullanıcı sayısını belirleyin."], ["Modern arayüz", "Tüm modüller arasında kesintisiz geçiş."], ["Güncelleme paketi", "Yasal ve yeni sürüm güncellemeleri bir yıl boyunca."]),
  P("genel-muhasebe", "Genel Muhasebe", "muhasebe", "muhasebe", "Hesap durumları, mizan ve bilanço her an hazır.",
    ["Hesap planı ve fiş", "Tek düzen hesap planı ve toplu fiş girişi."], ["Mizan ve bilanço", "Dönem sonu raporları anında."], ["Mevzuat uyumu", "Beyanname ve defter çıktıları güncel."]),
  P("on-muhasebe", "Ön Muhasebe", "muhasebe", "erp", "Cari, stok, çek-senet ve banka kayıtları düzenli ve erişilebilir.",
    ["Cari ve stok", "Müşteri, tedarikçi ve ürün kartları."], ["Çek ve senet", "Vade ve portföy takibi."], ["Banka hesapları", "Hareketler ve mutabakat."]),
  P("mali-musavir", "Mali Müşavir", "muhasebe", "ik", "Birden çok firmanın ön ve genel muhasebe kayıtları bütünlük içinde.",
    ["Çoklu firma", "Tüm müşterileriniz tek çatıda."], ["Toplu işlem", "Dönem kapanışı tek seferde."], ["Müşteri portalı", "Mükellefe özel rapor paylaşımı."]),
  P("bulut-erp", "Bulut ERP", "bulut", "bulut", "Güçlü modüller, gerçek zamanlı veri ve güvenli bulut altyapısı tarayıcıdan açılır.",
    ["Kurulumsuz başlangıç", "Hesabı açın, aynı gün kullanın."], ["Her cihazdan erişim", "Ofiste, yolda, tatilde."], ["Otomatik yedek", "Veriler şifreli ve yedekli saklanır."]),
  P("e-ticaret", "e-Ticaret", "bulut", "eticaret", "Mağazanız 7/24 açık: ürünler saniyeler içinde elektronik ticarette.",
    ["ERP entegrasyonu", "Stok, sipariş ve fiyat anlık eşitlenir."], ["Pazaryeri bağlantıları", "Tek panelden çoklu kanal."], ["Kargo ve ödeme", "Sağlayıcı seçenekleri hazır."]),
  P("gorev-panosu", "Görev Panosu", "bulut", "dashboard", "Ekiplerin iş, görev ve projelerini dijital ajandada yönetmesi için bulut takip sistemi.",
    ["Görev kartları", "Dosya paylaşımı ve kişi ataması."], ["Takvim planı", "Son tarih ve hatırlatmalar."], ["Ekip raporu", "Kim neyi ne zaman bitirdi."]),
  P("qr-menu", "QR Menü", "bulut", "mobil", "Masadaki kare kodla açılan, anında güncellenen dijital menü.",
    ["Kolay menü düzenleme", "Fiyat ve ürün değişikliği saniyeler içinde."], ["Çok dilli menü", "Misafire kendi dilinde."], ["Sipariş bağlantısı", "Restoran programıyla eşleşir."]),
  P("destek-masasi", "Destek Masası", "bulut", "crm", "Destek talebi, canlı görüşme ve müşteri kaydı tek kutuda.",
    ["Talep takibi", "Her talep durum ve sorumluyla izlenir."], ["Canlı mesajlaşma", "Anlık yanıt, kayıtlı geçmiş."], ["Bilgi bankası", "Sık sorulanlar otomatik önerilir."]),
  P("hizli-satis", "Hızlı Satış", "sektorel", "sektor", "Marketten toptancıya satış ve muhasebe süreçleri tek akışta.",
    ["Barkodlu satış", "Terazi, yazarkasa ve barkod okuyucu desteği."], ["Çok şubeli stok", "Şubeler arası transfer ve sayım."], ["Günsonu raporu", "Kasa ve ciro tek raporda."]),
  P("restoran", "Restoran / Cafe", "sektorel", "mobil", "Sade ve kullanışlı arayüzle restoran kontrolü parmaklarınızın ucunda.",
    ["Adisyon ve masa", "El terminalinden sipariş."], ["Mutfak ekranı", "Siparişler hazırlık sırasıyla."], ["Paket servis", "Kurye ve adres takibi."]),
  P("otel", "Otel", "sektorel", "dashboard", "Ön büro, rezervasyon ve ön muhasebe hızlı ve sade.",
    ["Rezervasyon takvimi", "Oda doluluk görünümü."], ["Ön büro", "Giriş-çıkış ve folyo işlemleri."], ["Kanal bağlantısı", "Rezervasyon kanallarıyla eşleşme."]),
  P("servis", "Teknik Servis", "sektorel", "ik", "Tüm servis işlemleri, garanti takibi ve ekip yönetimi pratik ve hızlı.",
    ["Servis kaydı", "Cihaz, arıza ve işlem geçmişi."], ["Garanti takibi", "Süre ve kapsam uyarıları."], ["Saha ekibi", "Görev atama ve konum."]),
  P("kuafor", "Kuaför / Güzellik", "sektorel", "mobil", "Randevuyla çalışan işletmeler için randevular tek ekranda, takvim net.",
    ["Randevu takvimi", "Uzman bazlı doluluk."], ["Müşteri kartı", "Geçmiş işlem ve tercihler."], ["SMS hatırlatma", "Randevu öncesi otomatik mesaj."]),
  P("saha-satis", "Saha Satış", "sektorel", "mobil", "Saha temsilcileri için tablet ve telefondan sipariş, tahsilat ve ziyaret yönetimi.",
    ["Mobil sipariş", "Bağlantısız çalışma, sonra eşitleme."], ["Rota ve ziyaret", "Günlük ziyaret planı."], ["Tahsilat", "Cari bakiye anında güncellenir."]),
  P("akaryakit", "Akaryakıt Otomasyonu", "sektorel", "sektor", "Pompa, tank ve istasyon yönetimi için otomasyon.",
    ["Pompa entegrasyonu", "Satışlar otomatik kaydedilir."], ["Tank takibi", "Stok ve fark raporu."], ["Filo ve cari", "Araç bazlı veresiye."]),
  P("otopark", "Otopark", "sektorel", "sektor", "Giriş-çıkış, ücret ve abonelik yönetimi.",
    ["Plaka tanıma", "Giriş ve çıkış otomatik."], ["Tarife yönetimi", "Saatlik ve abonelik ücretleri."], ["Vardiya raporu", "Kasiyer bazlı tahsilat."]),
  P("emlak", "Emlak", "sektorel", "dashboard", "Portföy, müşteri ve sözleşme takibi.",
    ["Portföy yönetimi", "Fotoğraflı ilan kartları."], ["Müşteri eşleştirme", "Talep ve portföy uyumu."], ["Sözleşme ve tahsilat", "Kira ve komisyon takibi."]),
  P("egitim", "Eğitim / Kurs", "sektorel", "ik", "Kurs, öğrenci ve ödeme planı yönetimi.",
    ["Öğrenci kaydı", "Sınıf ve ders programı."], ["Taksit takibi", "Ödeme planı ve hatırlatma."], ["Devamsızlık", "Veli bilgilendirme."]),
  P("saglik", "Sağlık / Klinik", "sektorel", "ik", "Hasta, randevu ve tedavi takibi.",
    ["Hasta kartı", "Muayene ve işlem geçmişi."], ["Randevu", "Hekim bazlı takvim."], ["Fatura ve sigorta", "Kurum anlaşmaları ve ödeme."]),
  P("sms-kontor", "SMS / Kontör", "diger", "fatura", "Toplu mesaj ve e-belge kontörlerini tek yerden yönetin.",
    ["Toplu SMS", "Kampanya ve bilgilendirme mesajı."], ["Kontör yükleme", "e-Fatura, e-Arşiv ve e-İrsaliye kontörü."], ["Raporlama", "Gönderim ve kalan kontör durumu."]),
];

export interface EDoc { slug: string; title: string; art: string; lead: string; what: string; benefits: Array<[string, string]> }

export const EDOCS: EDoc[] = [
  { slug: "e-fatura", title: "e-Fatura", art: "fatura", lead: "Resmi faturanın dijital hali: gönderim, alım ve arşiv tek platformda.",
    what: "e-Fatura, kâğıt faturayla aynı hukuki niteliğe sahip, elektronik ortamda oluşturulan, iletilen ve saklanan faturadır. Gelir İdaresi altyapısıyla uyumlu çalışır.",
    benefits: [["Maliyeti düşürür", "Baskı, kargo ve arşiv gideri ortadan kalkar."], ["Hızlı iletim", "Fatura saniyeler içinde karşı tarafta."], ["Yasal uyum", "Mevzuata uygun, güvenli saklama."]] },
  { slug: "e-arsiv", title: "e-Arşiv Fatura", art: "arsiv", lead: "Tüm belgeler dijital ortamda, ihtiyaç anında hazır.",
    what: "e-Arşiv, e-Fatura mükellefi olmayan alıcılara düzenlenen faturanın elektronik ortamda oluşturulup saklanmasıdır; e-Fatura altyapısıyla birlikte çalışır.",
    benefits: [["Tek ekranda", "Düzenleme, iptal ve sorgulama."], ["Güvenli saklama", "Yasal süre boyunca erişilebilir arşiv."], ["E-posta gönderimi", "Faturayı alıcıya otomatik iletin."]] },
  { slug: "e-irsaliye", title: "e-İrsaliye", art: "irsaliye", lead: "İrsaliyenin dijital haliyle kâğıtsız sevkiyat.",
    what: "e-İrsaliye, sevk irsaliyesinin elektronik olarak düzenlenip taraflara iletilmesidir. Kâğıt yok, gecikme yok.",
    benefits: [["Anlık iletim", "Sevkiyat çıkmadan alıcıda."], ["Hatasız kayıt", "Stok hareketi otomatik düşer."], ["Kolay arşiv", "Tüm irsaliyeler aranabilir."]] },
  { slug: "e-defter", title: "e-Defter", art: "defter", lead: "Yevmiye ve büyük defterin dijital hali.",
    what: "e-Defter, yevmiye ve kebir defterlerinin elektronik ortamda tutulması ve onaylı olarak saklanmasıdır.",
    benefits: [["Berat otomasyonu", "Dönem sonu beratları hazır."], ["Muhasebe entegrasyonu", "Kayıtlar programdan aktarılır."], ["Güvenli saklama", "Yasal süre boyunca erişim."]] },
  { slug: "e-mutabakat", title: "e-Mutabakat", art: "mutabakat", lead: "Cari hesaplarınızı dijitale taşıyın, borç ve alacakları hızla karşılaştırın.",
    what: "e-Mutabakat, cari bakiye mutabakat mektuplarının elektronik ortamda gönderilip yanıtlanmasıdır.",
    benefits: [["Toplu gönderim", "Yüzlerce cariye tek seferde."], ["Anında yanıt", "Karşı taraf onay veya itiraz bildirir."], ["Kayıtlı geçmiş", "Tüm mutabakatlar saklanır."]] },
  { slug: "e-mustahsil", title: "e-Müstahsil Makbuzu", art: "fatura", lead: "Resmi makbuz, modern altyapıda: dijital, güvenli ve erişilebilir.",
    what: "e-Müstahsil makbuzu, çiftçiden yapılan alımlarda düzenlenen müstahsil makbuzunun elektronik halidir.",
    benefits: [["Kolay düzenleme", "Makbuz birkaç adımda hazır."], ["Mevzuata uygun", "Resmi format ve onay."], ["Güvenli arşiv", "Belgeler dijital saklanır."]] },
];
