# NexPress CMS 🚀

> **WordPress, Gutenberg ve Elementor Alternatifi:** Açık çekirdekli (Open-Core), sıfır kurulumla (**LibSQL/SQLite**) veya kurumsal ölçekte (**PostgreSQL 16 + pgvector**) çalışan; **Tema Mağazası (Theme Store)**, **0-KB RSC Görsel Sayfa & Mega-Menü Oluşturucu** ve **Pro Agentic SEO + RAG İçerik Fabrikası** destekli Next.js 15 CMS.

---

## ⚡ Hızlı Başlangıç (2 Seçenekli Kurulum)

### Seçenek A: Sıfır-Docker Hızlı Başlangıç (`LibSQL / SQLite`)
Docker kurmadan yerel dosya tabanlı veritabanı (ve yerel `F32_BLOB` vektör desteği) ile 10 saniyede başlatın:

```bash
pnpm install
pnpm db:push
pnpm dev
```

### Seçenek B: Geniş Paket Kurumsal Kurulum (`Docker: PostgreSQL 16 + pgvector + Redis`)
Yüksek trafikli siteler, çoklu-kiracı (Subdomain Demo/SaaS) modu ve tam ölçekli RAG/BullMQ kuyrukları için:

```bash
docker compose up -d
pnpm install
# .env içinde DB_DIALECT="postgresql" olarak ayarlayın
pnpm db:push
pnpm dev
```

**Varsayılan Portlar:**
- **CMS Vitrin & Admin Paneli (`/admin`):** `http://localhost:3000`
- **PostgreSQL 16 (`pgvector`):** `localhost:5434`
- **Redis 7 (`BullMQ`):** `localhost:6381`

---

## 📚 Mimari Dokümantasyon ve Kurallar

Projenin tüm mimari şartnamesi ve canlı ilerleme takibi [`./docs/`](./docs/README.md) klasöründedir:

- 📜 **[Zorunlu Proje Kuralları (AGENTS.md)](./AGENTS.md)**
- 🏗️ **[01 — Sistem Mimarisi ve Monorepo Yapısı](./docs/01-ARCHITECTURE.md)**
- 🗄️ **[02 — Veritabanı (SQLite ↔ PostgreSQL) ve Implicit Tenancy](./docs/02-DATABASE-AND-TENANCY.md)**
- 🎨 **[03 — Tema Mağazası, 0-KB RSC Görsel Editör ve Header/Footer/Mega-Menü Stüdyosu](./docs/03-THEME-STORE-AND-EDITOR.md)**
- 🔍 **[04 — Çekirdek SEO, Çok Boyutlu GEO ve Temel LLMO](./docs/04-CORE-SEO-AND-GEO.md)**
- 🧠 **[05 — Pro Eklentiler: Agentic SEO Gateway & RAG İçerik Fabrikası](./docs/05-PRO-PLUGINS-AND-RAG.md)**
- 📈 **[06 — Canlı Geliştirme ve İlerleme Günlüğü](./docs/06-PROGRESS-LOG.md)**
