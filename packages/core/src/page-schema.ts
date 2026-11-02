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
    qa?: { enabled?: boolean };
    offer?: { price?: string; currency?: string; validThrough?: string; availability?: string; name?: string; url?: string };
    tech?: { level?: string; dependencies?: string };
    software?: { name?: string; url?: string; category?: string; os?: string; version?: string; price?: string; currency?: string; features?: string };
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
      return Boolean(s(r.software?.category, 60) && s(r.software?.os, 80));
    case "offer": {
      const o = r.offer;
      const until = o?.validThrough ? new Date(s(o.validThrough, 30)) : null;
      // Bitiş günü geçince kart da şemadaki Offer gibi kendiliğinden kalkar
      return Boolean(o && s(o.price, 14) && until && !Number.isNaN(until.getTime()) && until.getTime() + 86_400_000 > now.getTime());
    }
    case "qa":
      return Boolean(r.qa?.enabled && s(d.tldr, 400).length >= 20);
    case "tech":
      return Boolean(s(r.tech?.level, 20) || s(r.tech?.dependencies, 300));
  }
}

/** Kartı oluşturan ilk veri (kütüphaneden eklenince boşsa doldurulur; kullanıcı yalnızca düzenler). */
export const SCHEMA_STARTERS: Record<SchemaCardKind, { schemaType: string; rich: PageSchemaData["rich"] }> = {
  software: { schemaType: "SoftwareApplication", rich: { software: { category: "BusinessApplication", os: "Web", version: "1.0", price: "0", currency: "TRY", url: "", features: "Hızlı kurulum\nGüvenli veri saklama\nKolay entegrasyon" } } },
  offer: { schemaType: "WebPage", rich: { offer: { price: "99,90", currency: "TRY", validThrough: "", availability: "InStock", name: "Kampanya" } } },
  qa: { schemaType: "QAPage", rich: { qa: { enabled: true } } },
  tech: { schemaType: "TechArticle", rich: { tech: { level: "Beginner", dependencies: "" } } },
};
