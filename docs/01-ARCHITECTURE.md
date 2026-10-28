# 01 — Sistem Mimarisi ve Monorepo Yapısı

## 1. Çift Motorlu (Dual-Engine) CMS Felsefesi

NexPress CMS, hem **İnsan Ziyaretçiler (Human Web)** hem de **Yapay Zeka Ajanları (Agentic Web)** için aynı anda sıfır tavizle çalışan tek çekirdekli bir mimari sunar:

```mermaid
flowchart TB
    subgraph Clients [Ziyaretçi & Ajan Katmanı]
        Human[İnsan Ziyaretçi — Tarayıcı]
        Bot[AI Botları & Ajanlar — GPTBot, ClaudeBot, Perplexity, MCP]
        Editor[CMS Editörü & Site Yöneticisi]
    end

    subgraph NextApp [apps/cms — Next.js 15 Tekil Uygulama]
        AdminUI["/admin — Kurumsal shadcn/ui Panel & Görsel Stüdyo"]
        PublicRSC["/(public)/[locale] — 100/100 Lighthouse RSC & Tema Motoru"]
        AgentGateway["/api/mcp, /llms.txt, ?format=md — Agentic Gateway"]
    end

    subgraph CorePackages [Açık Kaynak Çekirdek Paketler (packages/*)]
        Core["@nexpress/core — Hook/Filter Bus, Plugin Slots, Implicit Tenancy"]
        ThemeEngine["@nexpress/themes — Tema Mağazası, Design Tokens, Block Skins"]
        VisualEditor["@nexpress/editor — Doküman + Görsel Grid + Header/Footer/MegaMenu"]
        SeoCore["@nexpress/seo-core — Meta, Hreflang, Sitemap, Temel Schema & llms.txt"]
        DB["@nexpress/database — Çift Diyalekt: LibSQL/SQLite & PostgreSQL/pgvector"]
        Commerce["@nexpress/commerce — Katalog, sepet, sipariş"]
        Market["@nexpress/marketplace — Pazar yeri sürücü kaydı"]
    end

    subgraph ProPlugins [Lisanslı Pro Eklentiler (plugins-pro/*)]
        ProSeo["@nexpress-pro/agentic-seo — @id Entity Graph, WebMCP, Bot Verifier, IndexNow"]
        ProOps["@nexpress-pro/content-ops — Site DNA, Few-Shot, Soru Madenciliği, 2-Pass RAG"]
    end

    Human --> PublicRSC
    Bot --> AgentGateway
    Editor --> AdminUI
    AdminUI & PublicRSC & AgentGateway --> Core
    Core --> ThemeEngine & VisualEditor & SeoCore & DB & Commerce & Market
    ProSeo & ProOps -.->|Slot & Hook Enjeksiyonu| Core
```

---

## 2. Monorepo Klasör Haritası (`pnpm` + `Turborepo`)

```
nexpresscms/
├── AGENTS.md                        # Zorunlu geliştirme ve mimari kuralları (Otomatik yüklenir)
├── GEMINI.md                        # Antigravity workspace kural işaretçisi
├── docker-compose.yml               # PostgreSQL 16 (pgvector) + Redis 7 konteyner tanımı
├── docs/                            # Eş zamanlı güncellenen modüler sistem dokümantasyonu
├── apps/
│   └── cms/                         # Next.js 15. Admin (/admin) + ön yüz (/[locale]). İşçi uygulaması bu aşamada yok.
├── packages/
│   ├── core/                        # Hook/Filter Event Bus, PluginSlot, SiteContext, Polimorfik Profiller
│   ├── database/                    # Drizzle ORM (LibSQL/SQLite + PostgreSQL/pgvector adaptörü)
│   ├── themes/                      # Tema motoru, Theme Store yöneticisi, CSS Token derleyicisi
│   ├── editor/                      # Blok kütüphanesi ve AI sayfa şeması (metin motoru admin'de TipTap)
│   ├── seo-core/                    # Ücretsiz teknik SEO, GEO/Hreflang, Sitemap, temel llms.txt
│   ├── rag/                         # Arama dizini: gömme sağlayıcıları, dizinleme, vektör arama, benzerlik raporu
│   └── wp-importer/                 # WordPress dışa aktarmasını (WXR) NexPress içeriğine çeviren saf mantık: okuyucu, HTML→blok, plan, SSRF IP denetimi
├── plugins-pro/                     # Pro eklentiler. Çekirdeğe yalnızca apps/cms/src/plugins/register.ts bağlar
│   ├── agentic-seo-pro/
│   └── content-ops-pro/
```

---

## 3. Open-Core & Pro Eklenti Sınır Mimarisi (`Slot & Hook Bus`)

Çekirdek kod Pro paketlere import etmez. Kurulum `apps/cms/src/plugins/register.ts` kompozisyon kökünden yapılır; bu modül `registerAgenticSeoProPlugin` ve `registerContentOpsProPlugin` çağırır.

1. **Veri ve Yaşam Döngüsü Kancaları (`packages/core/src/hooks.ts`):**
   - `content:beforeSave`: İçerik kaydedilmeden önce `markdownCache` üretimi veya Pro SEO puanlaması.
   - `content:afterPublish`: Önbellek temizliği (`revalidateTag`) + Pro IndexNow ping tetiklemesi.
   - `seo:buildSchemaGraph`: Temel JSON-LD grafiğine Pro `@id` (`Product`, `SoftwareApplication`, `Offer`, `TechArticle`) düğümlerinin eklenmesi.
2. **Görsel Admin Yuvaları (`<PluginSlot />`):**
   - `editor.sidebar.tabs`: Editör sağ çekmecesine "Canlı SEO & Kanibalizasyon" ve "Ürün/Entity Bağlantıları" sekmelerini ekler.
   - `admin.sidebar.nav`: Sol menüye "Content Ops Fabrikası", "Soru Madenciliği" ve "AI Bot Analitiği" menülerini ekler.
   - `dashboard.overview.cards`: Ana panele AI görünürlük ısı haritası ve içerik açığı (gap) özet kartlarını ekler.
