# NexPress CMS — Dokümantasyon Merkezi (`@docs`)

> **Vizyon:** WordPress, Gutenberg ve Elementor ihtiyacını tek çatı altında bitiren; **Next.js 15 (100/100 Lighthouse RSC)**, **Çift Veritabanı (Zero-Docker LibSQL/SQLite & PostgreSQL/pgvector)**, **Tema Mağazası (Theme Store)** ve **Pro Agentic SEO + RAG İçerik Fabrikası** destekli açık çekirdekli (Open-Core) yeni nesil CMS.

---

## 📚 Doküman İndeksi

| # | Doküman | Kapsam | Durum |
| :- | :--- | :--- | :--- |
| **01** | [01-ARCHITECTURE.md](./01-ARCHITECTURE.md) | Genel sistem mimarisi, Monorepo paketleri, Open-Core (Slot & Hook Bus) yapısı | ✅ Güncel |
| **02** | [02-DATABASE-AND-TENANCY.md](./02-DATABASE-AND-TENANCY.md) | Single-Tenant + Subdomain Multi-Tenant (`siteId`), LibSQL/SQLite $\leftrightarrow$ PostgreSQL/pgvector ve Docker kurulumu | ✅ Güncel |
| **03** | [03-THEME-STORE-AND-EDITOR.md](./03-THEME-STORE-AND-EDITOR.md) | **Tema Motoru & Tema Mağazası**, Çift Modlu 0-KB RSC Görsel Editör, Header/Footer/Mega-Menü Stüdyosu ve Kurumsal `shadcn/ui` Admin UX | ✅ Güncel |
| **04** | [04-CORE-SEO-AND-GEO.md](./04-CORE-SEO-AND-GEO.md) | Ücretsiz Çekirdek SEO, Çok Boyutlu GEO/Hreflang matrisi, Temel Schema.org, `/llms.txt` ve `?format=md` | ✅ Güncel |
| **05** | [05-PRO-PLUGINS-AND-RAG.md](./05-PRO-PLUGINS-AND-RAG.md) | Pro Eklentiler (`@nexpress-pro/agentic-seo` & `@nexpress-pro/content-ops`), WebMCP, Bot Verifier, Site DNA ve 2-Pass AI Fabrika | ✅ Güncel |
| **06** | [06-PROGRESS-LOG.md](./06-PROGRESS-LOG.md) | Faz bazlı canlı geliştirme takibi, tamamlanan adımlar ve sıradaki görevler | 🔄 Canlı |
| **07** | [07-AI-PAGE-AND-BLOCK-SPEC.md](./07-AI-PAGE-AND-BLOCK-SPEC.md) | **AI İle Sayfa & Blok Tasarlatma Rehberi (`JSON AST Kontratı`)** — Claude / ChatGPT / Gemini ile sayfa üretip kanvasa aktarma şeması | ✅ Güncel |
| **08** | [08-AI-CHROME-SPEC.md](./08-AI-CHROME-SPEC.md) | AI ile header ve footer tasarlatma. Kütüphane JSON aktarımı | ✅ Güncel |
| **23** | [23-THEME-AND-DESIGN-AUTHORING.md](./23-THEME-AND-DESIGN-AUTHORING.md) | Tema paketi, tasarım kütüphanesi ve şablon yazarlığı. Modele verilecek sözleşme | ✅ Güncel |
| **09** | [09-COMMERCE.md](./09-COMMERCE.md) | Çekirdek e-ticaret: katalog, sepet, sipariş, `/admin/commerce` | ✅ Güncel |
| **10** | [10-MARKETPLACES.md](./10-MARKETPLACES.md) | Modüler pazar yeri sürücüleri ve kanal yönetimi | ✅ Güncel |
| **11** | [11-SECURITY-AND-OPERATIONS.md](./11-SECURITY-AND-OPERATIONS.md) | Kimlik doğrulama, roller, sır şifreleme, MCP anahtarı, HTTP başlıkları, testler | ✅ Güncel |
| **12** | [12-ROADMAP.md](./12-ROADMAP.md) | Öncelikli iş listesi (SEO/GEO/hız), güvenlik ve bakım borçları, yürütme sırası | 🔄 Canlı |
| **13** | [13-PLUGINS-AND-THEME-PACKAGES.md](./13-PLUGINS-AND-THEME-PACKAGES.md) | Eklenti sistemi, tema paketleri (yükleme/etkinleştirme) ve panel eksikleri planı | 📋 Plan |
| **14** | [14-MULTILINGUAL-PLAN.md](./14-MULTILINGUAL-PLAN.md) | Çok dilli altyapı planı (L1–L5) | 📋 Plan |
| **19** | [19-DEPLOYMENT.md](./19-DEPLOYMENT.md) | Yayına alma: ortam değişkenleri, kurulum, sağlık ucu, zamanlayıcı, yedek, güvenlik listesi | ✅ Güncel |

---

## 🔗 Proje Taşıma & Oturum Devamlılığı (Workspace Handoff)

Bu proje başlangıçta [Planlama ve Mimari Tasarım Oturumu](conversation://54d71360-78c0-4a83-86fe-96376273e8f2) içerisinde kurgulanmış ve doğrudan `\\wsl.localhost\Ubuntu\home\dijitalevre\PROJELER\nexpresscms` çalışma alanına (workspace) yerleştirilmiştir.

* Kök dizindeki [AGENTS.md](../AGENTS.md) ve [GEMINI.md](../GEMINI.md) dosyaları sayesinde, `nexpresscms` klasörünü aktif çalışma alanı olarak açtığınızda tüm kurallar ve bu `@docs` klasörü yeni oturumlarda **otomatik olarak** yüklenir.
* İlerleme durumu için her zaman [06-PROGRESS-LOG.md](./06-PROGRESS-LOG.md) dosyasını kontrol edin.
