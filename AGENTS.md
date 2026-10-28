# NexPress CMS — Zorunlu Geliştirme ve Mimari Kuralları (AGENTS.md)

Bu proje; açık çekirdekli (Open-Core), **Next.js 15 (App Router + RSC)**, **Drizzle ORM (LibSQL/SQLite & PostgreSQL/pgvector)** ve **shadcn/ui** tabanlı, SEO/GEO ve hız canavarı yeni nesil bir WordPress alternatifidir.

Projede kod yazan veya mimari değişiklik yapan her geliştirici ve AI ajanı aşağıdaki kurallara uyar:

---

## 1. Eş Zamanlı Dokümantasyon Kuralı (`docs/` Senkronizasyonu)
- Kod tabanında yapılan her yeni modül, veritabanı tablosu, kanca (hook), tema özelliği veya API değişikliği **aynı görev (turn) içerisinde** ilgili `docs/*.md` dosyasına ve `docs/06-PROGRESS-LOG.md` ilerleme günlüğüne işlenmelidir.
- Dokümanı güncellenmemiş hiçbir özellik "tamamlandı" sayılamaz.

## 2. Örtük Çoklu-Kiracı (Implicit Tenancy) Kuralı (`siteId`)
- Sistem varsayılan olarak **Single-Tenant** (`CMS_MODE=single`, `siteId = 'default'`) çalışır; ancak kullanıcıların subdomain (`firma.demo.nexpress.com`) ile kayıt olup sistemi deneyimleyebilmesi için **Multi-Tenant** (`CMS_MODE=multi_subdomain`) altyapısına sahiptir.
- **Veritabanı Kuralı:** Oluşturulan her tabloda `siteId: text('site_id').default('default').notNull()` sütunu ve indeksi bulunmak zorundadır.
- **Önbellek Kuralı:** Ziyaretçi sayfaları veriyi `apps/cms/src/lib/public-data.ts` (`cachedRead`) üzerinden okur; admin eylemleri `revalidatePath`'i `@/lib/cache` içinden alır, böylece kiracı etiketi düşer. Ticaret ve oturumlu veri önbelleğe alınmaz.
- **Şema/göç kuralı:** şema yalnızca `packages/database/src/schema/*` içinde değişir; ardından `pnpm db:generate` ile göç dosyası üretilip commit edilir (`push.ts` dondurulmuştur). Kimliğe göre yazan her sorgu kiracıya kapalı olmalıdır (`upsertScoped`). Depolar motor dalı içermez (`backendFor`).
- **Sorgu Kuralı:** Hiçbir sorgu doğrudan ham tablo üzerinden `siteId` filtresi olmadan çağrılmaz; her zaman `getCmsContext()` içinden dönen kapsamlı (scoped) repository kullanılır.

## 3. Çift Veritabanı (Zero-Docker SQLite/LibSQL & PostgreSQL/pgvector) Kuralı
- Kullanıcılar Docker kurmadan yerel `LibSQL / SQLite` (`file:./data/nexpress.db`) ile sistemi 5 saniyede ayağa kaldırabilmeli; kurumsal ölçekte ise `PostgreSQL 16 + pgvector` (`docker-compose.yml`) kullanabilmelidir.
- `packages/database` dışındaki hiçbir pakette veritabanı motoruna özgü (dialect-specific) ham SQL yazılamaz. Vektör aramaları ve JSON sorguları `packages/database` içindeki birleşik Repository adaptörü üzerinden çağrılır.

## 4. Open-Core & Pro Eklenti Sınır Kuralı (`Slot & Hook Bus`)
- Çekirdek paketler (`packages/core`, `packages/editor`, `packages/seo-core`, `packages/themes`) içinde **asla** `if (isPro)` veya `@nexpress-pro/*` importu bulunamaz.
- `apps/cms` özellik kodu da Pro paket import edemez. Tek istisna kompozisyon köküdür: `apps/cms/src/plugins/register.ts`. Bu dosya eklentilerin `register*` fonksiyonlarını çağırır. Sunucu girişi (`instrumentation.ts`, kök layout, server action ve ilgili route) yalnızca bu modülü yükler.
- Eklentiler `pluginRegistry` ile manifest (modül listesi, ayar alanları) bildirir; çekirdek uç noktaları `pluginRoutes` ile, çalışma zamanı kapısı `isPluginModuleEnabled(siteId, pluginId, moduleId)` ile bağlanır (durum `site_plugins` tablosunda, kiracı başına).
- Özellikler **Genişleme Yuvaları (`<PluginSlot name="..." />`)** ve **Yaşam Döngüsü Kancaları (`cmsHooks.runFilter / runAction`)** üzerinden bağlanır.

## 5. Tema Motoru, Görsel Editör ve 0-KB RSC Hız Kuralı
- Ön yüzde (Public Web) **100/100 Lighthouse** ve **0 KB gereksiz İstemci JavaScript'i** kırmızı çizgimizdir.
- Görsel kanvas, yerleşim stüdyosu ve metin editörü **yalnızca `/admin` altında** istemci bileşenidir.
- Metin motoru **TipTap**'tir. Sayfa yerleşimi TipTap belgesi değildir: satır, sütun ve bloklar `BlockNode` JSON AST olarak kalır. TipTap yalnızca başlık, paragraf, kısa yanıt ve alıntı alanlarının içindedir.
- Zengin metin `props.html` alanına, düz metin `props.text` (veya bloğun kendi alanına) yazılır. `markdownCache`, `inlineHtmlToMarkdown` ile bu HTML'den üretilir. Ön yüz HTML'i `sanitizeInlineHtml` ile basar.
- İçerik kaydedildiği anda:
  1. Görsel bloklar saf JSON AST'ye (`blocks`) derlenir ve ön yüzde **%100 React Server Components (RSC)** olarak render edilir.
  2. Aynı anda `markdownCache` sütununa saf Markdown derlenir (`?format=md`, `/llms.txt` ve RAG için).
- Temalar içerik verisini değiştirmez. Tasarım token'ları, header/footer şablonları ve blok görünümleri `packages/themes` içindedir. Ayrı `themes/<slug>` paket klasörü bu aşamada yoktur.

- **Ön yüz JS kuralı (ölçülür):** ziyaretçi sayfaları `next/link`, `next-themes` veya herhangi bir `"use client"` bileşeni içermez; CI'daki bütçe testi (`perf-budget.json`) ihlalde derlemeyi düşürür. "0 KB" = sayfaya özel istemci kodu yok (React/Next çalışma zamanı ~101 kB gzip hariç).

## 6. Kurumsal Admin UI/UX ve `shadcn/ui` Standartları
- Yönetim paneli (`/admin`), **shadcn/ui (New York stili)**, **Tailwind CSS v4**, **Lucide Icons** ve **Radix UI** ile sakin, sıkı ve okunaklı tasarlanır.
- Her ekran karanlık/aydınlık mod, komut paleti (`Cmd+K` / `Ctrl+K`) ve boş durum ile yükleme iskeleti hedefler.
- Yerleşim denetçisi üç iş katmanıdır: **Genel**, **Stil** (masaüstü / tablet / mobil), **Gelişmiş** (çapa, gizleme, özel CSS). Sütun oranları `12`, `6+6`, `4+8`, `8+4`, `4+4+4`, `3+6+3`, `3+3+3+3` preset'leridir.
- Arayüzde, kod yorumunda ve dokümanda üçüncü parti sayfa oluşturucu veya tema ürünlerinin adları yazılmaz.

## 7. Dosya Boyutu
- Bir ekran tek dosyaya yığılmaz. Stüdyo; kanvas, metin alanı, denetçi ve sabitler olarak ayrılır.
- Yeni bir admin modülü yaklaşık 400 satırı aşıyorsa bölünür. Aynı işi yapan ikinci soyutlama yazılmaz.

## 8. Dil
- Arayüz dili şimdilik Türkçedir. Varsayılan locale `tr`dir. Herkese açık adres `/{locale}/...` olarak kalır.
- İkinci dil eklenmeden çeviri dosyası veya `locales` / `regions` tablosu açılmaz. Dil listesi `sites.supportedLocales` alanındadır.

## 9. Güvenlik Kuralı
- `apps/cms` içindeki her admin `server action` ilk satırında `requireUser()` (yalnızca `admin` işlemleri için `requireAdmin()`) çağırır. Sayfa koruması (middleware) bunun yerine geçmez.
- Her yeni admin server action eylem adını bildirir: `requireUser({ audit: "alan.eylem" })` veya `requireAdmin("alan.eylem")`; kullanıcı/oturum/ayar gibi hassas eylemler sonucu ayrıca `recordAudit` ile yazar. Yönetici sayfaları `requireAdminPage()` kullanır.
- Üçüncü taraf sırlar veritabanına düz yazılmaz (`@nexpress/core/secret-box`). Parola yalnızca `scrypt` özetiyle saklanır. Sır karşılaştırmaları `safeEqual` ile yapılır.
- Saf mantık (SEO, derleyici, kiracı, kimlik) için test eklenmeden birleştirilmez (`pnpm test`).
- Ön yüzde sahte veri gösterilmez (yapay puan, örnek etiket); demo veri arayüzde "Demo verisi" diye etiketlenir.

## 10. Referans Doküman Haritası
Geliştirme yaparken her zaman aşağıdaki dokümanları referans alın:
- Mimari ve Monorepo: `./docs/01-ARCHITECTURE.md`
- Veritabanı, Docker ve Tenancy: `./docs/02-DATABASE-AND-TENANCY.md`
- Tema Mağazası, Görsel Editör ve Admin UX: `./docs/03-THEME-STORE-AND-EDITOR.md`
- Çekirdek SEO, GEO ve LLMO: `./docs/04-CORE-SEO-AND-GEO.md`
- Pro Eklentiler (Agentic SEO Gateway & RAG Fabrika): `./docs/05-PRO-PLUGINS-AND-RAG.md`
- Canlı İlerleme Günlüğü: `./docs/06-PROGRESS-LOG.md`
- AI sayfa ve blok sözleşmesi: `./docs/07-AI-PAGE-AND-BLOCK-SPEC.md`
- AI header ve footer sözleşmesi: `./docs/08-AI-CHROME-SPEC.md`
- E-Ticaret modülü: `./docs/09-COMMERCE.md`
- Pazar yeri entegrasyonu: `./docs/10-MARKETPLACES.md`
- Güvenlik, kimlik doğrulama ve işletim: `./docs/11-SECURITY-AND-OPERATIONS.md`
- Yol haritası ve bilinen borçlar: `./docs/12-ROADMAP.md`
- Eklenti sistemi, tema paketleri ve panel eksikleri planı: `./docs/13-PLUGINS-AND-THEME-PACKAGES.md`
- Çok dilli altyapı planı: `./docs/14-MULTILINGUAL-PLAN.md`
- Agentic SEO Pro taşıma planı ve modül durumu: `./docs/15-AGENTIC-PRO-MIGRATION.md`
