import React from "react";
import type { DesignTokens, DynamicItem } from "@nexpress/core";
import { ResponsiveImage } from "./responsive-image";

const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

const CAROUSEL_W: Record<number, string> = {
  1: "w-[92%] sm:w-[85%]",
  2: "w-[85%] sm:w-[calc(50%-0.625rem)]",
  3: "w-[85%] sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.85rem)]",
  4: "w-[85%] sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.95rem)]",
};

/**
 * Atlıkarınca: betiksiz. Kaydırma yakalama (scroll-snap) her tarayıcıda çalışır; Chrome'un yerel atlıkarınca özellikleri
 * (`::scroll-button`, `::scroll-marker`) varsa önceki/sonraki düğmeleri ve noktalar da çıkar. Desteklemeyen tarayıcı kaydırır.
 */
const CAROUSEL_CSS = `
.nx-camp-track{scroll-padding-inline:4px}
@supports selector(::scroll-button(left)){
  .nx-camp-hint{display:none!important}
  .nx-camp-track{scroll-marker-group:after;anchor-name:--nx-camp}
  .nx-camp-track::scroll-button(inline-start),.nx-camp-track::scroll-button(inline-end){
    position:fixed;position-anchor:--nx-camp;top:calc(anchor(center) - 22px);width:44px;height:44px;border-radius:999px;border:0;cursor:pointer;
    background:var(--nx-card,#fff);color:var(--nx-secondary,#042646);font-size:26px;line-height:1;
    box-shadow:0 6px 20px rgba(4,38,70,.22);z-index:2
  }
  .nx-camp-track::scroll-button(inline-start){content:"‹" / "Önceki";left:calc(anchor(left) + 8px)}
  .nx-camp-track::scroll-button(inline-end){content:"›" / "Sonraki";left:calc(anchor(right) - 52px)}
  .nx-camp-track::scroll-button(*):disabled{opacity:.35;cursor:default}
  .nx-camp-track::scroll-marker-group{display:flex;justify-content:center;gap:8px;padding-top:14px}
  .nx-camp-track li::scroll-marker{content:"";width:9px;height:9px;border-radius:999px;background:#c7d7e2;transition:width .2s,background .2s}
  .nx-camp-track li::scroll-marker:target-current{width:26px;background:var(--nx-primary,#0c644e)}
}
`;

const SAMPLE_CAMPAIGNS: DynamicItem[] = [
  {
    id: "sample_1",
    title: "Restoran ERP ve Barkod Otomasyonu Kampanyası",
    url: "#",
    excerpt:
      "Sınırlı süreye özel tüm restoran, kafe ve paket servis modüllerinde net indirim ve ücretsiz kurulum fırsatı.",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Restoran Programı Kampanyası",
    date: new Date().toISOString(),
    discount: "%40",
    badge: "ÖZEL FIRSAT",
    gift: "1 Yıllık QR Menü + Paket Servis Modülü Hediye",
    daysRemaining: 27,
    isExpired: false,
    ctaText: "Hemen Teklif Al & Başvur",
    ctaUrl: "#",
    contactWhatsapp: "905550000000",
    contactPhone: "02120000000",
  },
  {
    id: "sample_2",
    title: "E-Ticaret ve Pazaryeri Entegrasyon Paketi",
    url: "#",
    excerpt:
      "Pazaryeri siparişleri ve e-ticaret sitenizi tek merkezden yönetin. Yılın en avantajlı lisans paketi.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    imageAlt: "E-Ticaret Paketi",
    date: new Date().toISOString(),
    discount: "%35",
    badge: "SINIRLI KONTENJAN",
    gift: "Pazaryeri Entegrasyon Modülü Hediyeli",
    daysRemaining: 14,
    isExpired: false,
    ctaText: "Detaylı Bilgi & Başvuru",
    ctaUrl: "#",
    contactWhatsapp: "905550000000",
    contactPhone: "02120000000",
  },
  {
    id: "sample_3",
    title: "Hızlı Satış & Dokunmatik POS Terminal Kampanyası",
    url: "#",
    excerpt:
      "Perakende mağazaları ve marketler için tak-çalıştır dokunmatik POS terminal seti avantajlı fiyatlarla.",
    image:
      "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80",
    imageAlt: "POS Terminal Kampanyası",
    date: new Date().toISOString(),
    discount: "%25",
    badge: "POPÜLER",
    gift: "Kablosuz Barkod Okuyucu Hediyesi",
    daysRemaining: null,
    isExpired: false,
    ctaText: "Fiyat Teklifi Al",
    ctaUrl: "#",
    contactWhatsapp: "905550000000",
    contactPhone: "02120000000",
  },
];

export interface CampaignShowcaseViewProps {
  props?: Record<string, unknown>;
  items?: DynamicItem[];
  tokens: DesignTokens;
  locale?: string;
  preview?: boolean;
}

/**
 * Kampanya Vitrini Görünümü (RSC):
 * - Pure CSS scroll-snap tabanlı Atlıkarınca (Carousel/Slide)
 * - 2, 3 veya 4 sütunlu Izgara (Grid)
 * - Büyük Öne Çıkan Vitrin Kartı (Spotlight)
 * - İndirim Şeridi (Ticker / Banner)
 * - %100 0-KB İstemci JS (Rule 5 uyumlu).
 */
export function CampaignShowcaseView({
  props: rawProps,
  items: rawItems,
  tokens,
  preview = false,
}: CampaignShowcaseViewProps) {
  const p = rawProps ?? {};
  const heading = typeof p.heading === "string" ? p.heading.trim() : "";
  const subheading = typeof p.subheading === "string" ? p.subheading.trim() : "";
  const layout = String(p.layout ?? "carousel");
  const columns = Math.min(4, Math.max(1, Number(p.columns) || 3));
  const showDiscountBadge = p.showDiscountBadge !== false;
  const showCountdown = p.showCountdown !== false;
  const showGift = p.showGift !== false;
  const showCta = p.showCta !== false;
  const showWhatsapp = Boolean(p.showWhatsapp);
  const showPhone = Boolean(p.showPhone);
  const emptyText =
    typeof p.emptyText === "string" && p.emptyText.trim()
      ? p.emptyText.trim()
      : "Şu anda yayında aktif bir kampanya bulunmamaktadır.";

  const hasRealItems = Array.isArray(rawItems) && rawItems.length > 0;
  const items = hasRealItems ? rawItems : preview ? SAMPLE_CAMPAIGNS : [];

  if (items.length === 0) {
    return emptyText ? (
      <p className="text-sm opacity-70 py-4 text-center">{emptyText}</p>
    ) : null;
  }

  // SPOTLIGHT DÜZENİ
  if (layout === "spotlight") {
    const primary = items[0]!;
    const secondary = items.slice(1, 4);
    return (
      <section aria-label={heading || "Öne Çıkan Kampanya"} className="space-y-6">
        {heading && (
          <div className="space-y-1">
            <h2
              style={{ fontFamily: tokens.typography.headingFont }}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            >
              {heading}
            </h2>
            {subheading && <p className="text-sm sm:text-base opacity-75">{subheading}</p>}
          </div>
        )}

        <div
          style={{
            borderColor: tokens.colors.border,
            borderRadius: tokens.geometry.borderRadius,
          }}
          className="relative overflow-hidden border bg-card shadow-sm transition hover:shadow-md"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center">
            {/* Görsel Alanı */}
            <div className="lg:col-span-7 relative overflow-hidden bg-muted/40 aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-full min-h-[280px]">
              {primary.image ? (
                <ResponsiveImage
                  src={primary.image}
                  alt={primary.imageAlt || primary.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-black text-muted-foreground/30">
                  KAMPANYA
                </div>
              )}

              {/* Vurgu Rozeti */}
              {showDiscountBadge && (primary.discount || primary.badge) && (
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {primary.badge && (
                    <span style={{ backgroundColor: tokens.colors.secondary, color: tokens.colors.secondaryForeground }} className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm">
                      {primary.badge}
                    </span>
                  )}
                  {primary.discount && (
                    <span style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }} className="rounded-full px-3.5 py-1 text-xs font-extrabold shadow-sm">
                      {primary.discount} İndirim
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bilgi ve Eylem Alanı */}
            <div className="lg:col-span-5 p-6 sm:p-8 space-y-4">
              {showCountdown && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                  <span>⏳</span>
                  <span>
                    {primary.daysRemaining != null
                      ? `Kampanyanın bitmesine ${primary.daysRemaining} gün kaldı`
                      : "Süresiz Özel Avantaj"}
                  </span>
                </div>
              )}

              <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                <a href={primary.url} className="hover:underline">
                  {primary.title}
                </a>
              </h3>

              {primary.excerpt && (
                <p className="text-sm opacity-80 leading-relaxed line-clamp-3">
                  {primary.excerpt}
                </p>
              )}

              {showGift && primary.gift && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs font-semibold text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <span className="mr-1.5">🎁</span>
                  <span>{primary.gift}</span>
                </div>
              )}

              {/* Aksiyon Butonları */}
              <div className="space-y-2 pt-2">
                {showCta && (
                  <a
                    href={primary.ctaUrl || primary.url}
                    style={{
                      backgroundColor: tokens.colors.primary,
                      color: tokens.colors.primaryForeground,
                      borderRadius: tokens.geometry.borderRadius,
                    }}
                    className="flex w-full items-center justify-center px-5 py-3 text-sm font-bold shadow-sm transition hover:opacity-95"
                  >
                    {primary.ctaText || "Hemen Teklif Al & Başvur"}
                  </a>
                )}

                <div className="flex flex-wrap gap-2">
                  {showWhatsapp && primary.contactWhatsapp && (
                    <a
                      href={`https://wa.me/${primary.contactWhatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ borderRadius: tokens.geometry.borderRadius }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 border border-emerald-300 bg-emerald-50/80 px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    >
                      <span>💬 WhatsApp&apos;tan Hızlı Bilgi Al</span>
                    </a>
                  )}

                  {showPhone && primary.contactPhone && (
                    <a
                      href={`tel:${primary.contactPhone.replace(/\s+/g, "")}`}
                      style={{ borderRadius: tokens.geometry.borderRadius }}
                      className="inline-flex items-center justify-center gap-1.5 border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:bg-muted transition"
                    >
                      <span>📞 {primary.contactPhone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Varsa İkincil Kampanya Kartları */}
        {secondary.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {secondary.map((it) => (
              <CampaignCard
                key={it.id}
                item={it}
                tokens={tokens}
                showDiscountBadge={showDiscountBadge}
                showCountdown={showCountdown}
                showGift={showGift}
                showCta={showCta}
                showWhatsapp={showWhatsapp}
                showPhone={showPhone}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  // TICKER (ŞERİT) DÜZENİ
  if (layout === "ticker") {
    return (
      <section
        style={{
          borderRadius: tokens.geometry.borderRadius,
          borderColor: tokens.colors.border,
        }}
        className="overflow-hidden border bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 text-white shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-red-600 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-white animate-pulse">
              FIRSAT
            </span>
            <span className="text-sm font-bold sm:text-base leading-tight">
              {items[0]!.title}
            </span>
            {items[0]!.discount && (
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-black">
                {items[0]!.discount} İndirim
              </span>
            )}
            {showCountdown && items[0]!.daysRemaining != null && (
              <span className="text-xs text-white/80 font-medium">
                ⏳ {items[0]!.daysRemaining} gün kaldı
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={items[0]!.ctaUrl || items[0]!.url}
              style={{ borderRadius: tokens.geometry.borderRadius }}
              className="inline-flex items-center justify-center bg-white px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-white/90"
            >
              {items[0]!.ctaText || "Fırsatı Yakala →"}
            </a>
          </div>
        </div>
      </section>
    );
  }

  // CAROUSEL & GRID DÜZENLERİ
  const isCarousel = layout === "carousel";

  return (
    <section aria-label={heading || "Kampanyalar Vitrini"} className="relative space-y-4">
      {/* Başlık & Üst Bilgi */}
      {(heading || isCarousel) && (
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            {heading && (
              <h2
                style={{ fontFamily: tokens.typography.headingFont }}
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              >
                {heading}
              </h2>
            )}
            {subheading && <p className="text-sm opacity-75">{subheading}</p>}
          </div>

          {/* Atlıkarınca için Kaydırma İpucu (0-KB CSS) */}
          {isCarousel && items.length > columns && (
            <div className="nx-camp-hint hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground select-none">
              <span>Yatay kaydırın</span>
              <span className="text-base font-bold">⇄</span>
            </div>
          )}
        </div>
      )}

      {/* Kart Listesi (Carousel: snap-x scroll; Grid: CSS grid) */}
      {isCarousel ? <style>{CAROUSEL_CSS}</style> : null}
      <ul
        {...(isCarousel
          ? {
              role: "region",
              tabIndex: 0,
              "aria-label": heading || "Kampanyalar Atlıkarıncası",
            }
          : {})}
        className={
          isCarousel
            ? "nx-camp-track flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : `grid grid-cols-1 gap-6 ${COLS[columns] ?? COLS[3]}`
        }
      >
        {items.map((it) => (
          <li
            key={it.id}
            className={
              isCarousel
                ? `shrink-0 snap-start transition duration-200 hover:-translate-y-1 ${
                    CAROUSEL_W[columns] ?? CAROUSEL_W[3]
                  }`
                : "transition duration-200 hover:-translate-y-1"
            }
          >
            <CampaignCard
              item={it}
              tokens={tokens}
              showDiscountBadge={showDiscountBadge}
              showCountdown={showCountdown}
              showGift={showGift}
              showCta={showCta}
              showWhatsapp={showWhatsapp}
              showPhone={showPhone}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Tekil Kampanya Kartı Bileşeni
 */
function CampaignCard({
  item,
  tokens,
  showDiscountBadge,
  showCountdown,
  showGift,
  showCta,
  showWhatsapp,
  showPhone,
}: {
  item: DynamicItem;
  tokens: DesignTokens;
  showDiscountBadge: boolean;
  showCountdown: boolean;
  showGift: boolean;
  showCta: boolean;
  showWhatsapp: boolean;
  showPhone: boolean;
}) {
  return (
    <div
      style={{
        borderColor: tokens.colors.border,
        borderRadius: tokens.geometry.borderRadius,
      }}
      className="group flex h-full flex-col overflow-hidden border bg-card shadow-xs transition hover:shadow-md"
    >
      {/* Görsel ve Üst Rozetler */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/30">
        {item.image ? (
          <a href={item.url} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
            <ResponsiveImage
              src={item.image}
              alt={item.imageAlt || item.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </a>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-black text-muted-foreground/20">
            KAMPANYA
          </div>
        )}

        {/* İndirim ve Vurgu Rozeti */}
        {showDiscountBadge && (item.discount || item.badge) && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
            {item.discount && (
              <span style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }} className="rounded-full px-2.5 py-0.5 text-[11px] font-black shadow-sm">
                {item.discount} İndirim
              </span>
            )}
            {item.badge && (
              <span style={{ backgroundColor: tokens.colors.secondary, color: tokens.colors.secondaryForeground }} className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Kart Gövdesi */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 space-y-3">
        <div className="space-y-2">
          {/* Kalan Gün Sayacı */}
          {showCountdown && (
            <div style={{ color: tokens.colors.primary }} className="inline-flex items-center gap-1 text-[11px] font-bold">
              <span>⏳</span>
              <span>
                {item.daysRemaining != null
                  ? `Bitmesine ${item.daysRemaining} gün kaldı`
                  : "Süresiz Fırsat"}
              </span>
            </div>
          )}

          {/* Başlık */}
          <h3 className="text-base font-bold leading-snug line-clamp-2">
            <a href={item.url} className="hover:underline">
              {item.title}
            </a>
          </h3>

          {/* Özet Metin */}
          {item.excerpt && (
            <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
              {item.excerpt}
            </p>
          )}

          {/* Hediye Bilgisi */}
          {showGift && item.gift && (
            <div style={{ backgroundColor: `color-mix(in srgb, ${tokens.colors.primary} 8%, transparent)`, borderColor: `color-mix(in srgb, ${tokens.colors.primary} 28%, transparent)`, color: tokens.colors.secondary }} className="rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold line-clamp-2">
              <span className="mr-1">🎁</span>
              <span>{item.gift}</span>
            </div>
          )}
        </div>

        {/* Butonlar */}
        <div className="space-y-1.5 pt-2">
          {showCta && (
            <a
              href={item.ctaUrl || item.url}
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.primaryForeground,
                borderRadius: tokens.geometry.borderRadius,
              }}
              className="flex w-full items-center justify-center px-4 py-2 text-xs font-bold shadow-xs transition hover:opacity-95"
            >
              {item.ctaText || "Hemen Teklif Al & Başvur"}
            </a>
          )}

          <div className="flex gap-1.5">
            {showWhatsapp && item.contactWhatsapp && (
              <a
                href={`https://wa.me/${item.contactWhatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ borderRadius: tokens.geometry.borderRadius }}
                className="flex-1 inline-flex items-center justify-center gap-1 border border-emerald-300 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              >
                <span>💬 WhatsApp</span>
              </a>
            )}

            {showPhone && item.contactPhone && (
              <a
                href={`tel:${item.contactPhone.replace(/\s+/g, "")}`}
                style={{ borderRadius: tokens.geometry.borderRadius }}
                className="inline-flex items-center justify-center gap-1 border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted transition"
                title="Ara"
              >
                <span>📞 Ara</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
