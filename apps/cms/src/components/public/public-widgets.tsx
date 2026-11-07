import React from "react";
import {
  ICON_PATHS,
  isSafeMenuHref,
  resolveSidebarWidgets,
  type DesignTokens,
  type SidebarAreaConfig,
  type SidebarConfig,
  type NavigationLink,
  type SiteWidget,
} from "@nexpress/core";
import type { PublicWidgetFeed } from "@/lib/public-data";
import { MenuList } from "./site-nav";

function PublicSvgIcon({ name, className = "h-4 w-4 shrink-0" }: { name?: string; className?: string }) {
  if (!name) return null;
  const path = ICON_PATHS[name];
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

/**
 * Tek bir Bileşeni (Widget) 0-KB React Server Component olarak çizdirir.
 */
export function RenderPublicWidget({
  widget,
  locale,
  lb,
  tokens,
  feed,
  cardStyle = "cards",
  menuLibrary,
}: {
  widget: SiteWidget;
  locale: string;
  /** Dilin kök adresi (`/tr`); tek dilli sitede boş. Verilmezse `/{locale}`. */
  lb?: string;
  tokens: DesignTokens;
  feed?: PublicWidgetFeed;
  cardStyle?: "cards" | "minimal" | "bordered" | "footer";
  /** Menü kimliği → çözülmüş ağaç. Footer ve kenar çubuğu aynı kaydı basar. */
  menuLibrary?: Record<string, NavigationLink[]>;
}) {
  if (!widget.enabled) return null;
  const s = widget.settings;
  const root = lb ?? `/${locale}`;

  // Kampanya kutusu kendi özel tasarım kartıyla çizilir
  if (widget.type === "campaigns") {
    const isPrimary = s.tone === "primary" || !s.tone;
    const isDark = s.tone === "dark";
    const href = s.ctaHref && isSafeMenuHref(s.ctaHref) ? s.ctaHref : `${root}/magaza`;
    return (
      <div
        style={{
          backgroundColor: isPrimary
            ? tokens.colors.primary
            : isDark
              ? tokens.colors.secondary
              : tokens.colors.muted,
          color: isPrimary
            ? tokens.colors.primaryForeground
            : isDark
              ? tokens.colors.secondaryForeground
              : tokens.colors.foreground,
          borderRadius: tokens.geometry.borderRadius,
        }}
        className="space-y-2.5 p-4 shadow-xs"
      >
        <div className="flex items-center justify-between gap-2">
          {s.badge ? (
            <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {s.badge}
            </span>
          ) : null}
          {s.discountText ? (
            <span className="text-xs font-extrabold">{s.discountText}</span>
          ) : null}
        </div>
        <div className="text-sm font-bold leading-snug">{widget.title}</div>
        {s.subtitle ? (
          <p className="text-xs leading-relaxed opacity-90">{s.subtitle}</p>
        ) : null}
        {s.couponCode ? (
          <div className="rounded border border-dashed border-current/35 bg-black/15 px-2.5 py-1 text-center font-mono text-xs font-bold">
            KUPON: {s.couponCode}
          </div>
        ) : null}
        {s.ctaLabel ? (
          <a
            href={href}
            className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 transition hover:opacity-95"
          >
            {s.ctaLabel} →
          </a>
        ) : null}
      </div>
    );
  }

  const wrapperClass =
    cardStyle === "cards"
      ? "rounded-xl border border-nx-line bg-nx-card p-4 space-y-3"
      : cardStyle === "bordered"
        ? "border-b border-nx-line pb-4 last:border-b-0 space-y-3"
        : "space-y-2.5";

  return (
    <div className={wrapperClass}>
      {widget.title ? (
        <div className="text-xs font-bold uppercase tracking-wider opacity-85">
          {widget.title}
        </div>
      ) : null}

      {/* KATEGORİLER */}
      {widget.type === "categories" && (
        <div className={s.style === "pills" ? "flex flex-wrap gap-1.5" : "space-y-1.5 text-xs"}>
          {(feed?.categories.length
            ? feed.categories.slice(0, s.count ?? 6)
            : [
                { id: "c1", name: "Performans & Mimari", slug: "mimari", count: 6, parentId: null },
                { id: "c2", name: "Teknik SEO & GEO", slug: "seo", count: 8, parentId: null },
                { id: "c3", name: "E-Ticaret Çözümleri", slug: "e-ticaret", count: 4, parentId: null },
                { id: "c4", name: "Kurumsal Rehberler", slug: "kurumsal", count: 5, parentId: null },
              ].slice(0, s.count ?? 6)
          ).map((cat) =>
            s.style === "pills" ? (
              <a
                key={cat.id}
                href={`${root}/kategori/${encodeURIComponent(cat.slug)}`}
                className="inline-flex items-center gap-1 rounded-full border border-nx-line px-2.5 py-1 text-xs font-medium opacity-85 hover:opacity-100"
              >
                <span>{cat.name}</span>
                {s.showCount !== false ? (
                  <span className="text-[10px] opacity-65">({cat.count})</span>
                ) : null}
              </a>
            ) : (
              <a
                key={cat.id}
                href={`${root}/kategori/${encodeURIComponent(cat.slug)}`}
                className={`flex items-center justify-between rounded-md px-1.5 py-1 opacity-85 transition hover:bg-black/5 hover:opacity-100 ${
                  s.showHierarchy && cat.parentId ? "pl-4" : ""
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {s.showCount !== false ? (
                  <span className="rounded bg-nx-subtle px-1.5 py-0.5 text-[10px] font-semibold opacity-75">
                    {cat.count}
                  </span>
                ) : null}
              </a>
            )
          )}
        </div>
      )}

      {/* SON YAZILAR */}
      {widget.type === "recent_posts" && (
        <ul className="space-y-2.5 text-xs">
          {(feed?.recentPosts ?? []).slice(0, s.count ?? 4).map((post, idx) => (
            <li key={post.id}>
              <a
                href={`${root}/${encodeURIComponent(post.slug)}`}
                className="group flex items-start gap-2.5 opacity-85 hover:opacity-100"
              >
                {s.style === "numbered" ? (
                  <span
                    style={{ color: tokens.colors.primary }}
                    className="font-mono text-xs font-bold"
                  >
                    0{idx + 1}
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 font-medium leading-snug group-hover:underline">
                    {post.title}
                  </div>
                  {s.showDate !== false && post.dateLabel ? (
                    <div className="mt-0.5 text-[11px] opacity-60">{post.dateLabel}</div>
                  ) : null}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* SON YORUMLAR */}
      {widget.type === "recent_comments" && (
        <ul className="space-y-2 text-xs">
          {(feed?.recentComments.length
            ? feed.recentComments.slice(0, s.count ?? 4)
            : [
                {
                  id: "rc1",
                  authorName: "Ahmet Yılmaz",
                  body: "Sayfa açılış hızı ve yeni şablon yapısı harika çalışıyor.",
                  rating: 5,
                },
                {
                  id: "rc2",
                  authorName: "Selin Kaya",
                  body: "Kurumsal sayfalarımızı dakikalar içinde yayına aldık.",
                  rating: 5,
                },
              ].slice(0, s.count ?? 4)
          ).map((cm) => (
            <li key={cm.id} className="rounded-lg border border-nx-line p-2.5">
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                <span>{cm.authorName}</span>
                {s.showRating !== false ? (
                  <span className="text-amber-500" aria-label={`${cm.rating} yıldız`}>
                    {"★".repeat(Math.min(5, Math.max(1, cm.rating)))}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed opacity-80">
                &ldquo;{cm.body}&rdquo;
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* ÖNE ÇIKAN ÜRÜNLER */}
      {widget.type === "featured_products" && (
        <div className="space-y-2 text-xs">
          {(feed?.featuredProducts.length
            ? feed.featuredProducts.slice(0, s.count ?? 3)
            : [
                { id: "fp1", title: "Kurumsal Dijital Vitrin Paketi", slug: "urun", priceLabel: "İncele" },
                { id: "fp2", title: "E-Ticaret & Katalog Modülü", slug: "magaza", priceLabel: "İncele" },
              ]
          ).map((prod) => (
            <a
              key={prod.id}
              href={`${root}/${encodeURIComponent(prod.slug)}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-nx-line p-2 opacity-85 hover:opacity-100"
            >
              <span className="truncate font-medium">{prod.title}</span>
              <span
                style={{ color: tokens.colors.primary }}
                className="shrink-0 text-[11px] font-bold"
              >
                {prod.priceLabel}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* POPÜLER ETİKETLER */}
      {widget.type === "popular_tags" && (
        <div className="flex flex-wrap gap-1.5">
          {(feed?.tags.length
            ? feed.tags.slice(0, s.count ?? 10)
            : [
                { id: "t1", name: "Performans", slug: "performans", count: 4 },
                { id: "t2", name: "SEO", slug: "seo", count: 5 },
                { id: "t3", name: "E-Ticaret", slug: "e-ticaret", count: 3 },
                { id: "t4", name: "Kurumsal", slug: "kurumsal", count: 4 },
              ]
          ).map((tag) => (
            <a
              key={tag.id}
              href={`${root}/etiket/${encodeURIComponent(tag.slug)}`}
              className="rounded-md bg-nx-subtle px-2 py-1 text-[11px] font-medium opacity-85 hover:opacity-100"
            >
              #{tag.name}
            </a>
          ))}
        </div>
      )}

      {/* SİTE İÇİ ARAMA */}
      {widget.type === "search" && (
        <div className="space-y-2">
          <form action={`${root}/ara`} method="get" className="flex gap-1.5">
            <input
              type="search"
              name="q"
              placeholder={s.placeholder || "Yazı veya ürün ara…"}
              aria-label={widget.title || "Site içi arama"}
              className="min-w-0 flex-1 rounded-lg border border-nx-line bg-transparent px-2.5 py-1.5 text-xs outline-none"
            />
            <button
              type="submit"
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.primaryForeground,
                borderRadius: tokens.geometry.borderRadius,
              }}
              className="px-3 py-1.5 text-xs font-semibold"
            >
              Ara
            </button>
          </form>
          {s.popularKeywords ? (
            <div className="flex flex-wrap gap-1 text-[11px] opacity-75">
              {s.popularKeywords
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean)
                .map((kw) => (
                  <a
                    key={kw}
                    href={`${root}/ara?q=${encodeURIComponent(kw)}`}
                    className="underline hover:opacity-100"
                  >
                    {kw}
                  </a>
                ))}
            </div>
          ) : null}
        </div>
      )}

      {/* E-BÜLTEN ABONELİĞİ */}
      {widget.type === "newsletter" && (
        <div className="space-y-2">
          {s.subtitle ? <p className="text-xs leading-relaxed opacity-80">{s.subtitle}</p> : null}
          <form action={`${root}/kurumsal`} className="flex gap-1.5">
            <input
              type="email"
              name="email"
              required
              placeholder={s.placeholder || "E-posta adresiniz…"}
              aria-label="E-posta"
              className="min-w-0 flex-1 rounded-lg border border-nx-line bg-transparent px-2.5 py-1.5 text-xs outline-none"
            />
            <button
              type="submit"
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.primaryForeground,
                borderRadius: tokens.geometry.borderRadius,
              }}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold"
            >
              {s.ctaLabel || "Kaydol"}
            </button>
          </form>
          {s.privacyNote ? <p className="text-[11px] opacity-60">{s.privacyNote}</p> : null}
        </div>
      )}

      {/* MARKA & SOSYAL MEDYA */}
      {widget.type === "about_brand" && (
        <div className="space-y-2.5 text-xs">
          {s.subtitle ? <p className="leading-relaxed opacity-80">{s.subtitle}</p> : null}
          <div className="space-y-1 opacity-80">
            {s.phone ? <div>Tel: {s.phone}</div> : null}
            {s.email ? <div>E-posta: {s.email}</div> : null}
            {s.address ? <div>Adres: {s.address}</div> : null}
          </div>
          {s.socials && Object.values(s.socials).some(Boolean) ? (
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold">
              {s.socials.x && isSafeMenuHref(s.socials.x) ? (
                <a href={s.socials.x} target="_blank" rel="noopener noreferrer" className="rounded border border-nx-line px-2 py-1 opacity-80 hover:opacity-100">
                  X
                </a>
              ) : null}
              {s.socials.linkedin && isSafeMenuHref(s.socials.linkedin) ? (
                <a href={s.socials.linkedin} target="_blank" rel="noopener noreferrer" className="rounded border border-nx-line px-2 py-1 opacity-80 hover:opacity-100">
                  LinkedIn
                </a>
              ) : null}
              {s.socials.instagram && isSafeMenuHref(s.socials.instagram) ? (
                <a href={s.socials.instagram} target="_blank" rel="noopener noreferrer" className="rounded border border-nx-line px-2 py-1 opacity-80 hover:opacity-100">
                  Instagram
                </a>
              ) : null}
              {s.socials.github && isSafeMenuHref(s.socials.github) ? (
                <a href={s.socials.github} target="_blank" rel="noopener noreferrer" className="rounded border border-nx-line px-2 py-1 opacity-80 hover:opacity-100">
                  GitHub
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {/* UZMAN DESTEĞİ & İLETİŞİM KARTI */}
      {widget.type === "contact_card" && (
        <div className="space-y-2 text-xs">
          {s.subtitle ? <p className="leading-relaxed opacity-80">{s.subtitle}</p> : null}
          {s.phone ? <div className="font-semibold">Telefon: {s.phone}</div> : null}
          {s.hours ? <div className="font-semibold">{s.hours}</div> : null}
          {s.email ? <a href={`mailto:${s.email}`}>Mail: {s.email}</a> : null}
          {s.address ? <div>Adres: {s.address}</div> : null}
          {s.ctaLabel ? (
            <a
              href={s.ctaHref && isSafeMenuHref(s.ctaHref) ? s.ctaHref : `${root}/kurumsal`}
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.primaryForeground,
                borderRadius: tokens.geometry.borderRadius,
              }}
              className="inline-block px-3 py-1.5 text-xs font-semibold"
            >
              {s.ctaLabel}
            </a>
          ) : null}
        </div>
      )}

      {/* GÜVEN & GARANTİ ROZETLERİ */}
      {widget.type === "trust_badges" && (
        <div className="space-y-2 text-xs">
          {(s.badges ?? []).map((b, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <PublicSvgIcon name={b.icon} className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-semibold">{b.title}</div>
                {b.subtitle ? <div className="text-[11px] opacity-70">{b.subtitle}</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* İÇİNDEKİLER REHBERİ */}
      {widget.type === "toc" && (
        <div className="space-y-1.5 border-l-2 border-nx-line pl-3 text-xs opacity-80">
          {s.subtitle ? <p className="text-[11px] opacity-75">{s.subtitle}</p> : null}
          <a href="#main-content" className="block hover:underline">
            Sayfa Özeti & Başlıklar
          </a>
        </div>
      )}

      {/* MENÜ & HIZLI BAĞLANTI GRUBU */}
      {widget.type === "nav_menu" && s.menuId && menuLibrary?.[s.menuId] ? (
        <MenuList links={menuLibrary[s.menuId]!} />
      ) : null}
      {widget.type === "nav_menu" && !(s.menuId && menuLibrary?.[s.menuId]) && (
        <ul className="space-y-2 text-xs">
          {(s.links ?? []).map((lnk, idx) => (
            <li key={lnk.id || idx}>
              <a
                href={isSafeMenuHref(lnk.href) ? lnk.href : (root || "/")}
                className="flex items-center justify-between gap-2 opacity-80 transition hover:opacity-100"
              >
                <span className="flex items-center gap-1.5 truncate">
                  {lnk.icon ? <PublicSvgIcon name={lnk.icon} className="h-3.5 w-3.5 opacity-75" /> : null}
                  <span>{lnk.label}</span>
                </span>
                {lnk.badge ? (
                  <span
                    style={{
                      backgroundColor: tokens.colors.primary,
                      color: tokens.colors.primaryForeground,
                    }}
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                  >
                    {lnk.badge}
                  </span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Ziyaretçi Kenar Çubuğu (Sağ / Sol Sidebar) Bileşen Alanı
 */
export function PublicSidebarWidgetArea({
  sidebar,
  locale,
  lb,
  tokens,
  feed,
  width = "300px",
  menuLibrary,
}: {
  sidebar: SidebarConfig | SidebarAreaConfig;
  locale: string;
  lb?: string;
  tokens: DesignTokens;
  feed?: PublicWidgetFeed;
  width?: string;
  menuLibrary?: Record<string, NavigationLink[]>;
}) {
  const widgets = (
    "widgets" in sidebar && Array.isArray(sidebar.widgets) && sidebar.widgets.length > 0
      ? sidebar.widgets
      : resolveSidebarWidgets(sidebar as SidebarConfig)
  ).filter((w) => w.enabled);
  const effectiveWidth = sidebar.width || width;

  return (
    <aside
      aria-label="Kenar çubuğu"
      style={{ width: effectiveWidth }}
      className="hidden shrink-0 px-4 py-10 md:block"
    >
      <div className={sidebar.sticky !== false ? "sticky top-24 space-y-4" : "space-y-4"}>
        {widgets.map((w) => (
          <RenderPublicWidget
            key={w.id}
            widget={w}
            locale={locale}
            lb={lb}
            tokens={tokens}
            feed={feed}
            cardStyle={sidebar.styleVariant ?? "cards"}
            menuLibrary={menuLibrary}
          />
        ))}
      </div>
    </aside>
  );
}

