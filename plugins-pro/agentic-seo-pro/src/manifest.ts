import type { PluginManifest, PluginModuleDef } from "@nexpress/core";

type M = Omit<PluginModuleDef, "defaultEnabled"> & { defaultEnabled?: boolean };
const mod = (m: M): PluginModuleDef => ({ defaultEnabled: true, ...m });

/**
 * Agentic SEO Pro modül kataloğu. Kaynak: `agentic-content-ops` projesi (WordPress eklentisi
 * "Agentic SEO Gateway" + Content Ops paneli). `ready` yalnızca kodu bu depoda çalışanlardır;
 * `planned` olanlar taşıma sırasını gösterir (docs/15-AGENTIC-PRO-MIGRATION.md).
 */
export const AGENTIC_SEO_MANIFEST: PluginManifest = {
  id: "@nexpress-pro/agentic-seo",
  name: "Agentic SEO Pro",
  version: "6.0.0",
  vendor: "NexPress",
  license: "pro",
  icon: "Sparkles",
  description:
    "Yapay zeka arama ve ajanlar için gelişmiş GEO / LLMs katmanı: llms.txt, MCP, keşif dosyaları, AI trafik analizi, zengin şema ve içerik operasyonları (AI fabrika, soru madenciliği, analiz paketi).",
  hooks: ["seo:buildSchemaGraph", "llms:buildTxt", "mcp:handleRequest", "content:beforeSave"],
  slots: ["dashboard.overview.cards", "admin.sidebar.nav", "editor.sidebar.tabs"],
  endpoints: ["/llms-full.txt", "/api/mcp", "/.well-known/mcp.json", "/ai-feed.json", "/.well-known/nlweb.json", "/.well-known/ai-plugin.json", "/.well-known/openapi.yaml"],
  settingsHref: "/admin/plugins",
  settings: [
    { key: "businessName", label: "İşletme adı", type: "text", module: "local-seo", group: "Yerel SEO", help: "Boşsa site adı kullanılır.", maxLength: 120 },
    { key: "businessType", label: "İşletme türü", type: "select", module: "local-seo", group: "Yerel SEO", options: [
      { value: "LocalBusiness", label: "Yerel işletme" }, { value: "ProfessionalService", label: "Profesyonel hizmet" }, { value: "Store", label: "Mağaza" },
      { value: "Restaurant", label: "Restoran" }, { value: "MedicalBusiness", label: "Sağlık" }, { value: "RealEstateAgent", label: "Emlak" }, { value: "AutomotiveBusiness", label: "Otomotiv" } ] },
    { key: "phone", label: "Telefon", type: "text", module: "local-seo", group: "Yerel SEO", placeholder: "+90 232 000 00 00", maxLength: 40 },
    { key: "email", label: "E-posta", type: "text", module: "local-seo", group: "Yerel SEO", maxLength: 120 },
    { key: "street", label: "Cadde / sokak", type: "text", module: "local-seo", group: "Adres" },
    { key: "city", label: "Şehir / ilçe", type: "text", module: "local-seo", group: "Adres" },
    { key: "region", label: "Bölge / il kodu", type: "text", module: "local-seo", group: "Adres", help: "Örn. 35 (İzmir).", maxLength: 10 },
    { key: "postalCode", label: "Posta kodu", type: "text", module: "local-seo", group: "Adres", maxLength: 12 },
    { key: "country", label: "Ülke kodu", type: "text", module: "local-seo", group: "Adres", placeholder: "TR", maxLength: 2 },
    { key: "latitude", label: "Enlem", type: "number", module: "local-seo", group: "Konum", min: -90, max: 90 },
    { key: "longitude", label: "Boylam", type: "number", module: "local-seo", group: "Konum", min: -180, max: 180 },
    { key: "aiModel", label: "Model", type: "text", module: "ai-writer", group: "AI yazım asistanı", placeholder: "gpt-4o-mini", help: "Boşsa AI_WRITER_MODEL ortam değişkeni, o da yoksa gpt-4o-mini.", maxLength: 60 },
    { key: "aiTone", label: "Marka tonu", type: "text", module: "ai-writer", group: "AI yazım asistanı", placeholder: "Kurumsal, net, güven veren", maxLength: 120 },
    { key: "aiForbiddenPhrases", label: "Yasak kalıplar", type: "textarea", module: "ai-writer", group: "AI yazım asistanı", help: "Satır veya virgülle ayırın. Varsayılan yapay zeka klişeleri zaten yasaktır.", maxLength: 1000 },
    { key: "aiCustomRules", label: "Özel marka kuralları", type: "textarea", module: "ai-writer", group: "AI yazım asistanı", help: "Örn. Ürün adlarını büyük harfle yaz; fiyat vaadi verme.", maxLength: 1000 },
    { key: "brandSector", label: "Sektör", type: "text", module: "ai-brand", group: "Marka profili", placeholder: "Örn. kurumsal yazılım", maxLength: 120 },
    { key: "brandAudience", label: "Hedef kitle", type: "text", module: "ai-brand", group: "Marka profili", placeholder: "Örn. KOBİ muhasebe ve operasyon yöneticileri", maxLength: 160 },
    { key: "brandPositioning", label: "GEO / LLM konumlandırma", type: "textarea", module: "ai-brand", group: "Marka profili", help: "Yapay zeka yanıtlarında markanın nasıl anılmasını istiyorsunuz?", maxLength: 500 },
    { key: "priceRange", label: "Fiyat aralığı", type: "text", module: "local-seo", group: "Yerel SEO", placeholder: "₺₺", maxLength: 10 },
  ],
  modules: [
    // GEO & LLMs
    mod({ id: "llms", group: "GEO & LLMs", status: "ready", label: "llms.txt eylem sözleşmesi", description: "llms.txt'e ajan araç listesi ve keşif uç noktalarını ekler.", surfaces: ["/llms.txt"] }),
    mod({ id: "llms-full", group: "GEO & LLMs", status: "ready", label: "llms-full.txt", description: "Tüm içeriğin 4 katmanlı, önem sıralı tam indeksi.", surfaces: ["/llms-full.txt"] }),
    mod({ id: "ai-feed", group: "GEO & LLMs", status: "ready", label: "ai-feed.json", description: "Önem skoruna göre sıralı, tür ve tazelik bilgili AI besleme dosyası.", surfaces: ["/ai-feed.json"] }),
    mod({ id: "well-known", group: "GEO & LLMs", status: "ready", label: "Keşif dosyaları", description: "mcp.json, nlweb.json, ai-plugin.json ve OpenAPI bildirimi.", surfaces: ["/.well-known/*"] }),
    mod({ id: "content-signal", group: "GEO & LLMs", status: "ready", label: "robots.txt Content-Signal", description: "Arama / yapay zeka girdisi / eğitim izin sinyalleri.", surfaces: ["/robots.txt"] }),
    mod({ id: "entity-graph", group: "GEO & LLMs", status: "ready", label: "Varlık grafiği", description: "İçerikler arası ilişkileri bağlantılı @id düğümleriyle JSON-LD'ye işler." }),
    // Ajan API'si
    mod({ id: "mcp", group: "Ajan API'si", status: "ready", label: "MCP sunucusu", description: "JSON-RPC araçları: içerik arama (hibrit RAG), içerik getirme, kimlik.", surfaces: ["/api/mcp"] }),
    mod({ id: "nlweb-ask", group: "Ajan API'si", status: "ready", label: "NLWeb ask", description: "Doğal dil sorgusu: SSS + içerik aramasını schema.org tipli sonuçlara birleştirir." }),
    mod({ id: "agent-actions", group: "Ajan API'si", status: "ready", label: "Ajan eylemleri (Talepler)", description: "Ajanlar MCP ile teklif, destek ve demo talebi bırakır (X-Agent-Key + MCP_AGENT_KEY); kayıtlar Talepler kutusuna düşer, saatte 30 sınırı.", surfaces: ["/admin/requests", "nexpress_create_lead|ticket|book_demo"] }),
    // Analitik
    mod({ id: "bot-analytics", group: "Analitik", status: "ready", label: "AI bot ısı haritası", description: "Bot ziyaretleri (bot_daily_stats) panel kartı.", surfaces: ["Panel kartı"] }),
    mod({ id: "ai-referrals", group: "Analitik", status: "ready", label: "AI yönlendirme trafiği", description: "ChatGPT, Perplexity, Gemini, Copilot, Claude vb. kaynaklardan gelen insan ziyaretleri; Referer ve utm_source sunucuda okunur (JS yok).", surfaces: ["Panel kartı"] }),
    mod({ id: "citations", group: "Analitik", status: "planned", label: "AI alıntı izleme", description: "Markanızın yapay zeka yanıtlarında alıntılanma takibi. Yapılmadı — yapay zeka arama servislerine API erişimi (anahtar ve kota) gerekir." }),
    mod({ id: "mcp-log", group: "Analitik", status: "ready", surfaces: ["Panel kartı"], label: "MCP istek günlüğü", description: "MCP isteklerini kaydeder: araç, ajan (User-Agent), sonuç ve süre; son 30 günün özeti panel kartında. Gövde ve anahtar yazılmaz, 90 günden eski kayıt silinir." }),
    // Zengin şema
    mod({ id: "local-seo", group: "Zengin şema", status: "ready", label: "Yerel SEO", description: "LocalBusiness JSON-LD ve geo meta etiketleri (adres, koordinat)." }),
    mod({ id: "speakable", group: "Zengin şema", status: "ready", label: "Speakable", description: "Sesli asistanlar için okunacak bölümleri işaretler." }),
    mod({ id: "faq-qa", group: "Zengin şema", status: "ready", label: "SSS / AI Prompt içerikleri", description: "Editörde \"QAPage\" seçeneği: sayfa başlığı soru, TL;DR cevap olarak QAPage şeması üretir (SSS bloğu FAQPage üretmeye devam eder). Oylama yok." }),
    mod({ id: "campaign-offer", group: "Zengin şema", status: "ready", label: "Kampanya Offer şeması", description: "Editörde fiyat, para birimi ve bitiş tarihi girilir; bitiş günü geçince Offer düğümü kendiliğinden kalkar. Kampanya kartı yok." }),
    mod({ id: "tech-article", group: "Zengin şema", status: "ready", label: "Bilgi bankası (TechArticle)", description: "TechArticle için bilgi düzeyi (proficiencyLevel) ve bağımlılıklar. İndirilebilir dosyalar için içerikte Dosya bloğu (medya kitaplığı) kullanılır." }),
    mod({ id: "software-app", group: "Zengin şema", status: "ready", label: "SoftwareApplication", description: "Yazılım/ürün sayfaları: kategori, işletim sistemi, sürüm, fiyat ve özellik listesiyle SoftwareApplication düğümü." }),
    mod({ id: "google-reviews", group: "Zengin şema", status: "planned", label: "Google yorumları", description: "Haritalar yorumlarını LocalBusiness şemasına birleştirir. Yapılmadı — Google Places API anahtarı gerekir." }),
    // İçerik operasyonları
    mod({ id: "guardrails", group: "İçerik operasyonları", status: "ready", label: "Kalite korkulukları", description: "Kayıtta yapay zeka klişelerini ve yasak kalıpları denetler." }),
    mod({ id: "copilot", group: "İçerik operasyonları", status: "ready", label: "Editör Co-Pilot", description: "Kanibalizasyon ve iç bağlantı önerileri (dizin vektörleri).", surfaces: ["Editör çekmecesi"] }),
    mod({ id: "question-mining", group: "İçerik operasyonları", status: "ready", label: "Soru madenciliği kartı", description: "Panel kartı. Şimdilik demo veri; gerçek bağlayıcılar aşağıda." }),
    mod({ id: "content-freshness", group: "İçerik operasyonları", status: "ready", label: "İçerik tazeliği", description: "Süresi dolan kampanyalar ve 6+ aydır güncellenmeyen içerikler." }),
    mod({ id: "serper-intel", group: "İçerik operasyonları", status: "planned", label: "Serper SERP & PAA", description: "Arama sonucu analizi, 'İnsanlar bunu da sordu', rakip terim hedefleri. Yapılmadı — Serper API anahtarı ve kullanım kotası gerekir." }),
    mod({ id: "gap-analysis", group: "İçerik operasyonları", status: "ready", surfaces: ["Panel kartı"], label: "İçerik açığı analizi", description: "Yayındaki içerikte TL;DR eksik/kısa, 180+ gün bayat, iç bağlantı almayan, 150 sözcükten ince ve birbirine çok benzeyen içerikleri bulur (panel kartı)." }),
    mod({ id: "decay", group: "İçerik operasyonları", status: "planned", label: "İçerik erimesi", description: "Search Console verisiyle düşen ve yükselen sayfalar. Yapılmadı — Google Search Console OAuth bağlantısı gerekir." }),
    mod({ id: "kb-transform", group: "İçerik operasyonları", status: "planned", label: "Bilgi bankası dönüşümü", description: "Kaynak izleme, uzun kuyruklu başlık + TL;DR üretimi, insan onaylı yayın. Yapılmadı — kaynak izleme ve insan onaylı yayın akışı tasarımı gerekir." }),
    mod({ id: "ai-writer", group: "İçerik operasyonları", status: "ready", label: "AI yazım asistanı", description: "Editörde TL;DR, meta başlık/açıklama ve SSS önerisi; marka yasak kalıpları ve 2 geçişli düzeltme (OpenAI anahtarı gerekir).", surfaces: ["Editör › SEO"] }),
    mod({ id: "ai-compose", group: "İçerik operasyonları", status: "ready", label: "AI içerik yazımı", description: "Editörde seçili paragraf/başlık için yaz, yeniden yaz, genişlet, kısalt, düzelt. Yalnızca öneri üretir; siz onaylayıp uygularsınız. Marka yasak kalıpları, uydurma rakam ve doğrulanması gereken iddialar işaretlenir (OpenAI anahtarı gerekir).", surfaces: ["Editör › Blok"] }),
    mod({ id: "ai-brand", group: "İçerik operasyonları", status: "ready", label: "Marka profili & Site DNA", description: "Yayındaki içerikten Site DNA (kimlik özeti) üretir; sektör, kitle ve konumlandırma ile birlikte, markanın kendi içeriğinden seçilen stil örnekleriyle AI yazım asistanına bağlam verir.", surfaces: ["Eklentiler › Ayarlar › Site DNA"] }),
    // Katalog & destek
    mod({ id: "catalog-ai", group: "Katalog & destek", status: "planned", label: "Ürün / kategori AI SEO", description: "Katalog metinlerini marka kurallarıyla yeniden yazma. Yapılmadı — ürün metni için onay akışı (AI çıktısı doğrudan yazılmamalı) tasarımı gerekir." }),
    mod({ id: "merchant-feed", group: "Katalog & destek", status: "ready", surfaces: ["/merchant-feed.xml"], label: "Merchant ürün beslemesi", description: "Yayındaki ürünlerden Google Merchant Center beslemesi (/merchant-feed.xml). Fiyatı, görseli veya açıklaması eksik ürünler beslemeye girmez." }),
    mod({ id: "support-hub", group: "Katalog & destek", status: "planned", label: "Destek merkezi araması", description: "RAG tabanlı destek araması ve içerik açığı raporu. Yapılmadı — destek araması günlüğü ve boş sonuç raporu gerekir." }),
  ],
};
