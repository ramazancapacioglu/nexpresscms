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
| `agent-actions` (lead / teklif / destek bileti / demo) | ✅ `nexpress_create_lead`, `nexpress_create_ticket`, `nexpress_book_demo`: `X-Agent-Key` + sunucuda `MCP_AGENT_KEY`, alan doğrulama, saatte 30 talep sınırı, `agent_requests`. Talepler sayfasında işlendi işareti, CSV ve 180 gün temizliği var. Oluşunca site iletişim adresine mektup gider; SMTP yoksa talep yine kaydolur. |

### Analitik
| Modül | Durum |
| :--- | :--- |
| `bot-analytics` (ısı haritası kartı; çekirdekte telemetri) | ✅ |
| `ai-referrals` (ChatGPT, Perplexity, Gemini, Copilot, Claude… yönlendirme) | ✅ JS'siz: `Referer` + `utm_source` sunucuda okunur (`ai_referral_daily`; IP/UA yok, botlar sayılmaz); panel kartı. Sayaçlar **göstergedir** (Referer taklit edilebilir / bazı uygulamalar göndermez) |
| `bot-verification` | ✅ **Çekirdeğe taşındı** (Temel SEO › "Bot doğrulama"): ters DNS + ileri doğrulama (Google, Bing, Apple, Yandex) ve **OpenAI + Perplexity'nin yayımladığı IP aralıkları** (24 sa önbellek, hata → `claimed`). Anthropic/Meta/Amazon aralık yayımlamıyor → `claimed` kalır. |
| `citations` | ✅ Hazırlık puanı (TL;DR + şema). Motor alıntısı kaydı yok; uydurma satır basılmaz. |
| `mcp-log` | ✅ |

### Zengin şema
| Modül | Durum |
| :--- | :--- |
| `local-seo` (LocalBusiness + geo meta; ayar formu) | ✅ Eklentiler > Ayarlar |
| `speakable` | ✅ |
| `faq-qa` (AI Prompt CPT, oylama, FAQ/QAPage) | ✅ QAPage ve FAQPage şema desteği, öne çıkan uzman cevabı entegrasyonu |
| `campaign-offer`, `tech-article`, `software-app` | ✅ Tam Schema.org grafik düğümleri ve görsel şema kartları |
| `google-reviews` | ✅ Yalnızca eklenti ayarına yazılan puan ve yorum şemaya girer. Boş ayar düğümü değiştirmez. |

### İçerik operasyonları (panelden)
| Modül | Panel kaynağı | Durum |
| :--- | :--- | :--- |
| `guardrails`, `copilot` (kanibalizasyon + iç bağlantı) | `llm-core` guardrails, `/content/cannibalization` | ✅ |
| `question-mining` | `question-intel` | ✅ Canlı sinyal havuzu + sözcük kümesi + editör taslağı. Tohum yazılmaz. Gömme kümesi yok. |
| `content-freshness` | WP "İçerik Tazeliği" | ✅ panel kartı (180+ gün); kampanya bitiş tarihi kampanya modülüyle |
| `serper-intel` (SERP, PAA, terim hedefleri) | `/analysis/serp`, `serper.ts` | ✅ Canlı sorgu havuza yazılır ve taslak açar. Anahtar yoksa liste "Demo verisi"dir ve kaydedilmez. |
| `gap-analysis` | `seo-analyzer` | ✅ panel kartı |
| `decay` | `seo-analyzer`, `/analysis/decay` | ✅ İçerik erimesi: 90+ gün güncellenmeyen, zayıf içerikli veya organik sıralama kaybı riski taşıyan sayfalar ve yenileme aksiyonu. |
| `kb-transform` (kaynak adres veya yapıştırma → taslak) | `kb-scraper`, `llm-transform` | ✅ İç adres kapısı, taslak kuyruğu. Yayın editör onayındadır. Sürekli kaynak izleme yok. |
| `ai-writer` (TL;DR, meta başlık/açıklama, SSS önerisi; marka yasak kalıpları; 2 geçişli düzeltme) | `llm-transform/editor-ai-rewrite.ts`, guardrails | ✅ Editör › SEO › "AI yazım asistanı" |
| `ai-brand` (Site DNA, marka profili, few-shot stil) | `llm-core/site`, `brand` | ✅ SEO › Ayarlar › Site DNA |

### Katalog & destek
| Modül | Durum |
| :--- | :--- |
| `catalog-ai` | ✅ Uzunluk denetimi. Yeniden yazma önerisi "Ürüne uygula" ile kayda geçer (anahtar varsa model, yoksa kural). |
| `merchant-feed` | ✅ Yayındaki ürünlerden Google Merchant Center beslemesi (`/merchant-feed.xml`). |
| `support-hub` | ✅ Sonuçsuz site araması kayda geçer. Sabit yüzde yoktur. |

### Temel SEO'ya (ücretsiz) ait arama motoru bağlantıları
- `search-console` (`@nexpress/seo-basic`): ✅ Google Search Console / Bing / Yandex sorgu metrikleri, CSV/JSON rapor içe aktarma, ilk sayfa fırsatları (Striking Distance: Pozisyon 4-15) ve düşük TO tespit paneli `/admin/seo` sayfasına entegre edildi.

## 4. Taşıma sırası (öneri)

1. ~~`ai-writer` çekirdeği~~ yapıldı; `ai-brand` v1 yapıldı.
2. `agent-actions` (gerçek lead/talep deposu) + `bot-verification` + `ai-referrals` (eklenti tablosu göçleri gerekir: `plugin_migrations`).
3. ~~Arama verisi bağlayıcıları (GSC → Bing → Yandex → GA4)~~: ✅ `@nexpress/seo-core/analytics-integrations` ve `/admin/seo/integrations` ile canlı API bağlantıları, anahtar kelime fırsat analitiği (Striking Distance, Düşük CTR) ve GA4 AI Yönlendirme (ChatGPT, Perplexity, Gemini, Claude, Copilot) entegrasyonu tamamlandı.
4. ~~`serper-intel` → `question-mining` gerçek veri~~: canlı sorgu ve CSV/API havuza yazılır, küme taslağı editörde açılır. Tohum yazılmaz.
5. ~~Şema paketleri ve katalog~~: yorumlar yalnız ayardan; katalog önerisi ürüne uygulanır.
6. ~~`kb-transform`~~: adres veya yapıştırma taslak açar. Yayın editör onayındadır. Değişen kaynak `source.recheck` ile işaretlenir.
7. SEO ayarları `/admin/seo/settings` altındadır. Raporlar üç grupta `/admin/seo/reports` sayfasındadır. Günlük eşitleme `CRON_SECRET` ile `/api/cron/seo` üzerindedir; örnek satır yazılmaz.

## 5. Ortam notu

`apps/cms/.env` içinde `OPENAI_API_KEY` **boş** (kaynak projede de bu anahtar tanımlı değil). RAG yerel gömmeyle çalışır. Gerçek anahtar `.env`'e yazıldığında sağlayıcı otomatik `openai` olur (`docs/04` §9). Sırlar sohbette paylaşılmamalıdır.

## 6. AI yazım asistanı (teknik)

- **Akış:** Editör (istemci) → `runPluginAction("ai-writer.suggest")` server action (`requireUser`, denetim `plugins.action`) → `pluginActions` → Pro işleyici (modül kapısı → `OPENAI_API_KEY` denetimi → kullanıcı başına 10/5 dk sınır → ayarlar → OpenAI sohbet).
- **Kural:** asistan hiçbir şeyi kaydetmez; "Uygula" yalnızca editör alanını doldurur, kaydetme ayrı adımdır. SSS yalnızca gösterilir (blok olarak elle eklenir).
- **Güvenlik/maliyet:** sır yalnızca sunucu ortamında; içerik 6.000 karaktere kısaltılıp gönderilir; çıktı JSON şemasıyla doğrulanıp uzunluk sınırlanır (başlık 60, açıklama 160, TL;DR 300); yasak kalıp (varsayılan klişeler + SEO › Ayarlar'daki liste) çıkarsa model bir kez düzeltmeye gönderilir, kalırsa arayüz uyarır.
- **Ayarlar:** SEO › Ayarlar: model (varsayılan `gpt-4o-mini` veya `AI_WRITER_MODEL`), marka tonu, yasak kalıplar, özel kurallar. `OPENAI_BASE_URL` ile OpenAI uyumlu başka sağlayıcı kullanılabilir.

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
