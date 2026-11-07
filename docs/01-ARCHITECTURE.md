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
        ProSeo["@nexpress-pro/agentic-seo — Entity Graph, WebMCP, içerik operasyonları"]
        ProDesign["@nexpress-pro/ai-design — bölüm, sayfa ve tema jetonu"]
    end

    Human --> PublicRSC
    Bot --> AgentGateway
    Editor --> AdminUI
    AdminUI & PublicRSC & AgentGateway --> Core
    Core --> ThemeEngine & VisualEditor & SeoCore & DB & Commerce & Market
    ProSeo & ProDesign -.->|Slot & Hook Enjeksiyonu| Core
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
│   ├── agentic-seo-pro/             # GEO, ajan API ve içerik operasyonları (src/content-ops)
│   └── ai-design/                   # AI Tasarım Pro
```

Eski `@nexpress-pro/content-ops` paketi 2026-10-28'de `agentic-seo-pro` içine birleşti. Kaynak `.archive/content-ops-pro` altındadır; workspace'e girmez, derlenmez. Ayrıntı: `docs/15`.

---

## 3. Open-Core & Pro Eklenti Sınır Mimarisi (`Slot & Hook Bus`)

Çekirdek kod Pro paketlere import etmez. Kurulum `apps/cms/src/plugins/register.ts` kompozisyon kökünden yapılır; bu modül `registerAgenticSeoProPlugin` ve `registerAiDesignProPlugin` çağırır. İçerik operasyonları ayrı kayıt fonksiyonu değildir: `registerAgenticSeoProPlugin` içinde `registerContentOps()` çalışır. IndexNow çekirdek kompozisyondadır (`registerIndexNow`).

1. **Veri ve Yaşam Döngüsü Kancaları (`packages/core/src/hooks.ts`):**
   - `content:beforeSave`: İçerik kaydedilmeden önce `markdownCache` üretimi; Pro tarafta klişe kalkanı ve SEO puanı (`src/content-ops`).
   - `content:afterPublish`: Önbellek temizliği (`revalidateTag`) ve IndexNow ping'i.
   - `seo:buildSchemaGraph`: Temel JSON-LD grafiğine Pro `@id` (`Product`, `SoftwareApplication`, `Offer`, `TechArticle`) düğümlerinin eklenmesi.
2. **Görsel Admin Yuvaları (`<PluginSlot />`):**
   - `editor.sidebar.tabs`: Editör sağ çekmecesine Co-Pilot (kanibalizasyon ve iç bağlantı).
   - `admin.sidebar.nav`: Agentic SEO Pro menü kaydı.
   - `seo.reports.content` / `seo.reports.queries` / `seo.reports.visibility`: içerik açığı, soru havuzu ve görünürlük kartları.
