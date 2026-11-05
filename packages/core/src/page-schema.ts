/**
 * Sayfa şeması verisi (tek doğruluk kaynağı): SEO sekmesindeki "Gelişmiş şema" alanları (`schemaAttributes.richSchema`).
 * Şema kartı blokları (`schema_card`) aynı veriyi gösterir ve düzenler: bir yerde girilen bilgi hem sayfa tasarımında
 * hem JSON-LD şemasında görünür. Burada yalnızca okuma/doğrulama (saf) vardır; şemaya çevirme Pro eklentidedir.
 */
export type SchemaCardKind = "software" | "offer" | "qa" | "tech";
export const SCHEMA_CARD_KINDS: SchemaCardKind[] = ["software", "offer", "qa", "tech"];

export interface PageSchemaData {
  title: string;
  tldr: string;
  rich: {
    qa?: {
      enabled?: boolean;
      shortAnswer?: string;
      detail?: string;
      category?: string;
      author?: string;
      upvotes?: number;
      faqList?: Array<{ question: string; answer: string }>;
    };
    offer?: {
      price?: string;
      currency?: string;
      validThrough?: string;
      validStart?: string;
      availability?: string;
      name?: string;
      url?: string;
      discount?: string;
      gift?: string;
      terms?: string;
      couponCode?: string;
      targetProduct?: string;
      targetProductUrl?: string;
      badge?: string;
    };
    tech?: {
      level?: string;
      dependencies?: string;
      prerequisites?: string;
      architecture?: string;
      systemRequirements?: string;
      stepsCount?: number;
    };
    software?: {
      name?: string;
      alternateName?: string;
      url?: string;
      category?: string;
      subCategory?: string;
      os?: string;
      version?: string;
      price?: string;
      currency?: string;
      license?: string;
      ratingValue?: number;
      ratingCount?: number;
      devices?: string;
      features?: string;
      modules?: string;
      requirements?: string;
      demoUrl?: string;
      screenshotUrl?: string;
    };
  };
}

const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Özelliklerin satır listesi (her satır bir madde; en çok 20). */
export const featureLines = (v: unknown): string[] => s(v, 1200).split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 20);

/** Kartın gösterebileceği veri var mı (yoksa blok ziyaretçiye görünmez; stüdyoda yönlendirme gösterilir). */
export function schemaCardReady(kind: SchemaCardKind, d: PageSchemaData, now: Date = new Date()): boolean {
  const r = d.rich ?? {};
  switch (kind) {
    case "software":
      return Boolean(s(r.software?.os, 80) && (s(r.software?.category, 60) || s(r.software?.price, 14) || s(r.software?.name, 80)));
    case "offer": {
      const o = r.offer;
      if (!o || !s(o.price, 14) || !s(o.validThrough, 30)) return false;
      const until = new Date(s(o.validThrough, 30));
      if (Number.isNaN(until.getTime())) return false;
      return until.getTime() + 86_400_000 > now.getTime();
    }
    case "qa":
      return Boolean(r.qa?.enabled && (s(r.qa?.shortAnswer, 400).length >= 10 || s(d.tldr, 400).length >= 10));
    case "tech":
      return Boolean(s(r.tech?.level, 20));
  }
}

/** Kartı oluşturan ilk veri (kütüphaneden eklenince boşsa doldurulur; kullanıcı yalnızca düzenler). */
export const SCHEMA_STARTERS: Record<SchemaCardKind, { schemaType: string; rich: PageSchemaData["rich"] }> = {
  software: {
    schemaType: "SoftwareApplication",
    rich: {
      software: {
        name: "Wolvox ERP & Kurumsal Kaynak Planlama",
        alternateName: "Akınsoft ERP",
        category: "BusinessApplication",
        subCategory: "ERP / Muhasebe / Finans",
        os: "Windows 10, 11, Windows Server (SQL / Firebird)",
        version: "9.0",
        price: "0",
        currency: "TRY",
        license: "Tek Seferlik & Yıllık Lisans",
        ratingValue: 4.9,
        ratingCount: 142,
        devices: "Desktop, Web Tarayıcı, Android, iOS",
        url: "/tr/wolvox-erp",
        demoUrl: "/tr/ucretsiz-tanitim",
        features: "Stok ve Çoklu Depo Yönetimi\nFinans, Kasa ve Cari Hesap Takibi\ne-Fatura, e-Arşiv, e-İrsaliye Entegrasyonu\nÜretim Planlama ve Reçete Yönetimi\nSipariş, İrsaliye ve Teklif Takibi\nGelişmiş Yönetimsel Raporlama",
        modules: "Ön Muhasebe\nGenel Muhasebe\ne-Dönüşüm\nİnsan Kaynakları\nCRM & Satış\nRestoran & Hızlı Satış",
        requirements: "En az 8 GB RAM, Intel Core i5 veya üzeri işlemci, SSD depolama, 64-bit OS",
      },
    },
  },
  offer: {
    schemaType: "Offer",
    rich: {
      offer: {
        name: "Yıl Sonu e-Dönüşüm & ERP Fırsatı",
        discount: "%30 İndirim",
        gift: "1 Yıl Bulut Yedekleme + 1.000 e-Kontör Hediye",
        price: "18500",
        currency: "TRY",
        validThrough: "",
        availability: "InStock",
        badge: "Sınırlı Süre Fırsatı",
        targetProduct: "Wolvox 9 ERP Paketi",
        targetProductUrl: "/tr/wolvox-erp",
        terms: "Kampanya yeni lisans ve modül alımlarında geçerlidir. Diğer kampanyalarla birleştirilemez.",
        couponCode: "YILSONU30",
        url: "/tr/kampanyalar",
      },
    },
  },
  qa: {
    schemaType: "QAPage",
    rich: {
      qa: {
        enabled: true,
        shortAnswer: "Gelir İdaresi Başkanlığı tebliğine göre yıllık brüt satış hasılatı şartını sağlayan mükellefler için zorunluluk takvim yılı başında başlar; lisanslı yazılım ve özel entegratör üzerinden 5 dakikada aktivasyon yapılabilir.",
        category: "e-Dönüşüm & Mevzuat",
        author: "Mevzuat ve Teknik Destek Masası",
        upvotes: 48,
        faqList: [
          { question: "Mevcut adisyon cihazım ile uyumlu mu?", answer: "Evet, entegrasyon API ve masaüstü köprü yazılımı ile tüm POS yazıcılar desteklenmektedir." },
          { question: "İnternet kesildiğinde ne olur?", answer: "Yerel kuyruklama sayesinde satışlar durmaz, internet bağlantısı sağlandığında otomatik GİB'e iletilir." },
        ],
      },
    },
  },
  tech: {
    schemaType: "TechArticle",
    rich: {
      tech: {
        level: "Intermediate",
        prerequisites: "Yönetici (Admin) yetkileri, SQL Server / Firebird istemci kütüphaneleri, port 3050/1433 erişimi.",
        dependencies: "Windows Server 2019+, .NET Framework 4.8+, GİB İmza Kütüphanesi",
        architecture: "İstemci-Sunucu (Client-Server) ve REST API Köprüsü",
        stepsCount: 5,
      },
    },
  },
};
