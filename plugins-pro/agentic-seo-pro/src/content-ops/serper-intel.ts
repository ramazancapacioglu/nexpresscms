/**
 * Serper.dev Google SERP & "İnsanlar Bunu da Sordu" (PAA) İstihbarat Motoru
 */

export interface SerperResultItem {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface SerperPaaQuestion {
  question: string;
  snippet: string;
  title?: string;
  link?: string;
}

export interface SerperIntelReport {
  keyword: string;
  organic: SerperResultItem[];
  peopleAlsoAsk: SerperPaaQuestion[];
  relatedSearches: string[];
}

const SEED_SERP_DATA: Record<string, SerperIntelReport> = {
  default: {
    keyword: "ön muhasebe programı",
    organic: [
      {
        title: "En İyi Ön Muhasebe Programları 2026 — Karşılaştırma",
        link: "https://example.com/on-muhasebe",
        snippet: "İşletmeler için cari hesap, fatura takibi, kasa ve banka entegrasyonu sunan güncel ön muhasebe yazılımları rehberi.",
        position: 1,
      },
      {
        title: "Wolvox Ön Muhasebe Modülü — Akınsoft İzmir Yetkili Bayi",
        link: "https://www.akinsoftizmir.com.tr/wolvox-erp/",
        snippet: "e-Fatura, e-Arşiv ve e-İrsaliye uyumlu bulut ve yerel ön muhasebe çözümleriyle finansal süreçlerinizi hızlandırın.",
        position: 2,
      },
      {
        title: "Küçük İşletmeler İçin Kolay Fatura & Cari Yönetimi",
        link: "https://example.com/kobi-muhasebe",
        snippet: "Karmaşık muhasebe bilgisine ihtiyaç duymadan gelir-gider ve stok takibi yapın.",
        position: 3,
      },
    ],
    peopleAlsoAsk: [
      {
        question: "Ön muhasebe programı ile genel muhasebe arasındaki fark nedir?",
        snippet: "Ön muhasebe işletmenin günlük fatura, cari hesap, kasa ve stok kayıtlarını tutarken; genel muhasebe resmi vergi beyannameleri ve yasal defterlerin tutulmasını kapsar.",
      },
      {
        question: "e-Fatura ve e-Arşiv için ön muhasebe programı zorunlu mu?",
        snippet: "Gelir İdaresi Başkanlığı tebliğine göre e-Dönüşüm mükellefi olan işletmelerin elektronik fatura düzenleyip saklayabilmesi için entegre bir yazılım veya GİB portalı kullanması gerekir.",
      },
      {
        question: "Ön muhasebe programı seçerken nelere dikkat edilmeli?",
        snippet: "Kullanım kolaylığı, e-Dönüşüm entegrasyonu, çoklu kullanıcı desteği, mobil erişim ve kesintisiz teknik destek en kritik kriterlerdir.",
      },
    ],
    relatedSearches: [
      "ücretsiz ön muhasebe programı",
      "bulut ön muhasebe programı tavsiye",
      "en iyi cari takip programı",
      "kobi ön muhasebe fiyatları",
      "akınsoft wolvox ön muhasebe lisans",
    ],
  },
};

export interface SerperQuery {
  report: SerperIntelReport;
  /** false ise tohum listedir; havuza yazılmaz. */
  live: boolean;
}

/**
 * Serper API'den canlı SERP ve PAA sorgular. Anahtar yoksa veya çağrı düşerse tohum döner (`live: false`).
 */
export async function querySerperIntel(keyword: string, apiKey?: string): Promise<SerperQuery> {
  const cleanKeyword = keyword.trim().toLowerCase();
  const key = apiKey || process.env.SERPER_API_KEY;

  if (key) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: cleanKeyword,
          gl: "tr",
          hl: "tr",
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        const rawOrganic = Array.isArray(data.organic) ? data.organic : [];
        const organic: SerperResultItem[] = rawOrganic.slice(0, 5).map((rawItem: unknown, i: number) => {
          const item = (rawItem || {}) as Record<string, unknown>;
          return {
            title: String(item.title || ""),
            link: String(item.link || ""),
            snippet: String(item.snippet || ""),
            position: i + 1,
          };
        });

        const rawPaa = Array.isArray(data.peopleAlsoAsk) ? data.peopleAlsoAsk : [];
        const peopleAlsoAsk: SerperPaaQuestion[] = rawPaa.slice(0, 6).map((rawItem: unknown) => {
          const item = (rawItem || {}) as Record<string, unknown>;
          return {
            question: String(item.question || ""),
            snippet: String(item.snippet || ""),
            title: typeof item.title === "string" ? item.title : undefined,
            link: typeof item.link === "string" ? item.link : undefined,
          };
        });

        const rawRelated = Array.isArray(data.relatedSearches) ? data.relatedSearches : [];
        const relatedSearches: string[] = rawRelated.slice(0, 8).map((rawItem: unknown) => {
          const item = (rawItem || {}) as Record<string, unknown>;
          return String(item.query || "");
        });

        return {
          live: true,
          report: {
            keyword: cleanKeyword,
            organic,
            peopleAlsoAsk,
            relatedSearches,
          },
        };
      }
    } catch (e) {
      console.warn("[serper-intel] Canlı API çağrısı başarısız oldu, tohum veriye geçiliyor:", e);
    }
  }

  return {
    live: false,
    report: {
      ...SEED_SERP_DATA.default!,
      keyword: cleanKeyword || SEED_SERP_DATA.default!.keyword,
    },
  };
}
