# 15 — Agentic SEO Pro: `agentic-content-ops` Taşıma Planı

Kaynak proje: `/home/dijitalevre/PROJELER/agentic-content-ops` (~72 bin satır): WordPress eklentisi **Agentic SEO Gateway** (PHP, v5.8) + **Content Ops** paneli (Next.js 15 + Prisma + BullMQ) + yardımcı paketler.

## 1. Karar: doğrudan aktarma değil, **uyarlayarak taşıma**

| Neden | Sonuç |
| :--- | :--- |
| Panel Prisma + yalnızca PostgreSQL; bizde Drizzle + SQLite/PG (kural 3) | Veri katmanı yeniden yazılır (`packages/database`), Prisma taşınmaz |
| Panel kendi SaaS çok kiracılığı, JWT, Stripe, paketler içerir; bizde örtük `siteId` kiracılığı | Kimlik, ekip, fatura, kota kodu **alınmaz** |
| WP eklentisi PHP; WordPress'e bağlı (CPT, REST, Rank Math) | Kavram taşınır, kod TypeScript'te yeniden yazılır (blok/içerik türü olarak) |
| BullMQ/Redis işçi | Önce istek-içi / `after()`; kuyruk gerekirse F13 sonrası |

Taşınan her özellik: saf mantık `plugins-pro/agentic-seo-pro/src/*` (testli) + bir **modül** (`manifest.ts`) olarak açılıp kapanır. Çekirdek eklentiyi tanımaz: `pluginRegistry` (manifest), `pluginRoutes` (uç nokta işleyici), `cmsHooks`/`slotRegistry` ve `isPluginModuleEnabled` kapısı üzerinden bağlanır.

## 2. Ücretsiz / Pro dağılımı

- **Temel SEO (ücretsiz, çekirdeğe gömülü, `@nexpress/seo-basic`):** başlık/meta şablonları, canlı analiz, otomatik şema + doğrulayıcı, 301, sitemap, robots + bot politikası, RSS/Atom, iç bağlantı denetimi, site içi arama, **Google / Bing / Yandex** doğrulama etiketleri ve IndexNow. *Planlı:* Search Console / Bing Webmaster / Yandex arama verisi (kullanıcı kararıyla ücretsizde kalır).
- **Agentic SEO Pro (`@nexpress-pro/agentic-seo` 6.0):** aşağıdaki tüm GEO / LLMs / ajan / analitik / zengin şema / içerik operasyonları modülleri. Eski `@nexpress-pro/content-ops` paketi buna **birleştirildi** (kaynak `.archive/content-ops-pro` içinde duruyor, derlemeye girmez).

## 3. Modül durumu (yeşil = bu depoda çalışıyor, test ve tarayıcıda doğrulandı)

### GEO & LLMs
| Modül | Kaynak (WP/panel) | Durum |
| :--- | :--- | :--- |
| `llms`, `llms-full` | `class-llms-txt.php` (4 katmanlı eylem sözleşmesi) | ✅ (içerik katmanı çekirdekte; Pro araç listesini ekler) |
| `ai-feed` | `class-feeds.php` `/ai-feed.json` önem skorlu | ✅ `/ai-feed.json` |
| `well-known` | `class-discovery.php` mcp/nlweb/ai-plugin/openapi | ✅ `/.well-known/{nlweb.json,ai-plugin.json,openapi.yaml}` (mcp.json çekirdekte) |
| `content-signal` | robots Content-Signal | ✅ bot politikasından türer |
| `entity-graph` | bağlantılı @id grafı | ✅ |

### Ajan API'si
| Modül | Durum |
| :--- | :--- |
| `mcp` (search_corpus hibrit, fetch_markdown, site_dna) | ✅ |
| `nlweb-ask` (schema.org ItemList) | ✅ JSON-RPC `ask` |
| `agent-actions` (lead / teklif / destek bileti / demo) | ✅ `nexpress_create_lead`, `nexpress_create_ticket`, `nexpress_book_demo`: `X-Agent-Key` + sunucuda `MCP_AGENT_KEY` (zamanlamaya dayanıklı karşılaştırma), alan doğrulama, saatte 30 talep sınırı, `agent_requests` tablosu, yönetici **Talepler** sayfası (`/admin/requests`, işlendi işareti, denetim kaydı). Kalan: e-posta bildirimi (SMTP yok), CSV dışa aktarma, saklama süresi |

### Analitik
| Modül | Durum |
| :--- | :--- |
| `bot-analytics` (ısı haritası kartı; çekirdekte telemetri) | ✅ |
| `ai-referrals` (ChatGPT, Perplexity, Gemini, Copilot, Claude… yönlendirme) | ✅ JS'siz: `Referer` + `utm_source` sunucuda okunur (`ai_referral_daily`; IP/UA yok, botlar sayılmaz); panel kartı. Sayaçlar **göstergedir** (Referer taklit edilebilir / bazı uygulamalar göndermez) |
| `bot-verification` | ✅ **Çekirdeğe taşındı** (Temel SEO › "Bot doğrulama"): ters DNS + ileri doğrulama (Google, Bing, Apple, Yandex) ve **OpenAI + Perplexity'nin yayımladığı IP aralıkları** (24 sa önbellek, hata → `claimed`). Anthropic/Meta/Amazon aralık yayımlamıyor → `claimed` kalır. Web Bot Auth imzası **doğrulanmadı** (yalnızca başlık varlığı kanıt değildir) → yapılmadı |
| `citations`, `mcp-log` | ⬜ |

### Zengin şema
| Modül | Durum |
| :--- | :--- |
| `local-seo` (LocalBusiness + geo meta; ayar formu) | ✅ Eklentiler > Ayarlar |
| `speakable` | ✅ |
| `faq-qa` (AI Prompt CPT, oylama, FAQ/QAPage) | ⬜ (FAQPage blok şeması çekirdekte) |
| `campaign-offer`, `tech-article`, `software-app`, `google-reviews` | ⬜ |

### İçerik operasyonları (panelden)
| Modül | Panel kaynağı | Durum |
| :--- | :--- | :--- |
| `guardrails`, `copilot` (kanibalizasyon + iç bağlantı) | `llm-core` guardrails, `/content/cannibalization` | ✅ |
| `question-mining` | `question-intel` | ✅ yalnızca **demo kartı** ("Demo verisi" etiketli) |
| `content-freshness` | WP "İçerik Tazeliği" | ✅ panel kartı (180+ gün); kampanya bitiş tarihi kampanya modülüyle |
| `serper-intel` (SERP, PAA, terim hedefleri) | `/analysis/serp`, `serper.ts` | ⬜ SERPER_API_KEY gerekir |
| `gap-analysis`, `decay` (GSC) | `seo-analyzer`, `/analysis/decay` | ⬜ |
| `kb-transform` (kaynak izleme → TL;DR + taslak, insan onaylı) | `kb-scraper`, `llm-transform` | ⬜ |
| `ai-writer` (TL;DR, meta başlık/açıklama, SSS önerisi; marka yasak kalıpları; 2 geçişli düzeltme) | `llm-transform/editor-ai-rewrite.ts`, guardrails | ✅ Editör › SEO › "AI yazım asistanı"; **gerçek anahtarla denenmedi** (sahte OpenAI sunucusuyla uçtan uca doğrulandı) |
| `ai-brand` (Site DNA, marka profili, few-shot stil) | `llm-core/site`, `brand` | ✅ v1: Eklentiler › Ayarlar › Site DNA ("Siteden öner" → düzenle → kaydet), sektör/kitle/konumlandırma alanları, stil örnekleri otomatik seçilir. Kalan: sync sonrası otomatik DNA yenileme, ürün/kategori bağlamı, marka profili sihirbazı (site tarama), entity sözlüğü |

### Katalog & destek
`catalog-ai`, `merchant-feed`, `support-hub` → ⬜ (ticaret modülü `docs/09` ile birlikte).

### Temel SEO'ya (ücretsiz) ait arama motoru bağlantıları
Kaynak: `question-intel` (`gsc.ts`, `bing`, `yandex`, `ga4`). Doğrulama etiketleri ✅; OAuth ile Search Console / Bing Webmaster / Yandex Metrika / GA4 verisi ⬜.

## 4. Taşıma sırası (öneri)

1. ~~`ai-writer` çekirdeği~~ yapıldı; kalan: anahtarla gerçek kalite denemesi, gömme kalitesi ölçümü, toplu üretim ve ürün/kategori metni. `ai-brand` v1 yapıldı.
2. `agent-actions` (gerçek lead/talep deposu) + `bot-verification` + `ai-referrals` (eklenti tablosu göçleri gerekir: `plugin_migrations`).
3. Arama verisi bağlayıcıları (GSC → Bing → Yandex → GA4) ve `decay`, `gap-analysis`.
4. `serper-intel` → `question-mining` gerçek veri.
5. Şema paketleri (`faq-qa`, `campaign-offer`, `tech-article`, `software-app`, `google-reviews`) ve katalog.
6. `kb-transform`.

## 5. Ortam notu

`apps/cms/.env` içinde `OPENAI_API_KEY` **boş** (kaynak projede de bu anahtar tanımlı değil). RAG yerel gömmeyle çalışır. Gerçek anahtar `.env`'e yazıldığında sağlayıcı otomatik `openai` olur (`docs/04` §9). Sırlar sohbette paylaşılmamalıdır.

## 6. AI yazım asistanı (teknik)

- **Akış:** Editör (istemci) → `runPluginAction("ai-writer.suggest")` server action (`requireUser`, denetim `plugins.action`) → `pluginActions` → Pro işleyici (modül kapısı → `OPENAI_API_KEY` denetimi → kullanıcı başına 10/5 dk sınır → ayarlar → OpenAI sohbet).
- **Kural:** asistan hiçbir şeyi kaydetmez; "Uygula" yalnızca editör alanını doldurur, kaydetme ayrı adımdır. SSS yalnızca gösterilir (blok olarak elle eklenir).
- **Güvenlik/maliyet:** sır yalnızca sunucu ortamında; içerik 6.000 karaktere kısaltılıp gönderilir; çıktı JSON şemasıyla doğrulanıp uzunluk sınırlanır (başlık 60, açıklama 160, TL;DR 300); yasak kalıp (varsayılan klişeler + Eklentiler › Ayarlar'daki liste) çıkarsa model bir kez düzeltmeye gönderilir, kalırsa arayüz uyarır.
- **Ayarlar:** Eklentiler › Agentic SEO Pro › Ayarlar: model (varsayılan `gpt-4o-mini` veya `AI_WRITER_MODEL`), marka tonu, yasak kalıplar, özel kurallar. `OPENAI_BASE_URL` ile OpenAI uyumlu başka sağlayıcı kullanılabilir.

## 7. Marka profili ve Site DNA (teknik)

- **Veri:** Site DNA `sites.site_dna` (metin, en çok 2400 karakter; `saveSiteDna` kiracıya kapalı). Sektör, hedef kitle, GEO/LLM konumlandırma, marka tonu, yasak kalıplar ve özel kurallar `site_plugins.settings` içindedir.
- **Üretim:** `ai-brand.generate` yayındaki herkese açık içeriklerden (ana sayfa + en önemli 8) kısaltılmış örneklem alıp OpenAI'ye gönderir; yalnızca öneri döner, **kaydetmez**. `ai-brand.save` metni yazar (modül kapısı, hız sınırı 10 dk'da 3).
- **Kullanım:** `ai-writer.suggest` modül açıksa isteme Site DNA, profil alanları ve markanın kendi içeriğinden seçilen en çok 3 stil örneğini (yüksek SEO skoru, düz paragraf, ~380 karakter) ekler. Stil örnekleri saklanmaz, istek anında seçilir.
- **Gizlilik:** Yalnızca yayında ve herkese açık içerik gönderilir; taslak, noindex ve özel içerik hariçtir.

## 8. Ajan talepleri, AI yönlendirme ve bot doğrulama (teknik)

- **Tablolar (göç `0003`):** `agent_requests` (kişisel veri: ad, e-posta, telefon, mesaj), `ai_referral_daily` (gün/kaynak/yol sayacı). İkisi de `siteId` kapsamlı depolarla okunur/yazılır.
- **Gizlilik:** talepler yalnızca yönetici panelinde; ön yüzde gösterilmez. Saklama süresi/silme henüz yok (açık borç).
- **Yetki:** MCP yazma araçları anahtarsız çalışmaz; anahtar sızarsa saatte 30 talep sınırı kutuyu korur. `tools/list` ajan eylemleri modülü kapalıysa yazma araçlarını listelemez.
- **AI yönlendirme izleme:** middleware `x-nexpress-path` ve `x-nexpress-utm-source` başlıklarını (istemciden gelenleri ezerek) ayarlar; `trackAiReferral()` `after()` içinde sayar. Modül kapalıysa yazmaz.
