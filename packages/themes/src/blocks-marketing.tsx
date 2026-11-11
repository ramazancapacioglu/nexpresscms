import React, { createElement } from "react";
import { createTranslator } from "@nexpress/i18n";
import { ICON_PATHS } from "@nexpress/core";
import type { BlockRenderContext } from "./block-context";
import { YF_THEME_ID } from "./yazilim-firmasi";
import { INK_GRID_ID } from "./ink-grid";
import { renderInkBento, renderInkCta, renderInkHero, renderInkNames, renderInkQuotes } from "./ink-blocks";
import { RichBlock } from "./rich-block";

/** Vitrin ve dönüşüm blokları: hero, istatistik, bento, fiyat, CTA, yorum ızgarası. Tanımsız dönerse sıradaki grup denenir. */
export function renderMarketingBlock({ block, themeId, tokens, isEditorial, isCommerce, renderChild, locale }: BlockRenderContext): React.ReactElement | null | undefined {
  const p = block.props ?? {};
  void renderChild;

  switch (block.type) {
    case "hero": {
      if (themeId === INK_GRID_ID) return renderInkHero(p, tokens);
      if (themeId === YF_THEME_ID) {
        return (
          <section className="nx-yf-hero">
            <div className="mx-auto max-w-[1200px]">
              {typeof p.badge === "string" && p.badge ? <p className="mb-4 text-xs font-semibold uppercase tracking-[.2em] text-[#00ac48]">{p.badge}</p> : null}
              {createElement(p.demoteTitle === true ? "h2" : "h1", { className: "max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl" }, String(p.title ?? ""))}
              {typeof p.subtitle === "string" ? <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-slate-400 sm:text-lg">{p.subtitle}</p> : null}
              <div className="mt-8 flex flex-wrap gap-3">
                {typeof p.primaryCtaLabel === "string" ? (
                  <a href={String(p.primaryCtaHref ?? "/tr/iletisim")} className="rounded-full bg-[#0071e3] px-6 py-3 text-sm font-semibold text-white">{p.primaryCtaLabel}</a>
                ) : null}
                {typeof p.secondaryCtaLabel === "string" ? (
                  <a href={String(p.secondaryCtaHref ?? "/tr/programlar")} className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white">{p.secondaryCtaLabel}</a>
                ) : null}
              </div>
            </div>
          </section>
        );
      }
      return (
        <section
          style={{
            borderRadius: tokens.geometry.borderRadius,
            borderColor: tokens.colors.border,
          }}
          className={`relative overflow-hidden border p-8 md:p-14 ${
            isEditorial
              ? "bg-zinc-950 text-white"
              : isCommerce
                ? "bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white"
                : "bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white"
          }`}
        >
          <div className="relative z-10 max-w-3xl space-y-6">
            {typeof p.badge === "string" && p.badge && (
              <span
                style={{ backgroundColor: tokens.colors.primary }}
                className="inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold tracking-wider text-white uppercase"
              >
                {p.badge}
              </span>
            )}
            {createElement(
              p.demoteTitle === true ? "h2" : "h1",
              { style: { fontFamily: tokens.typography.headingFont }, className: "text-3xl font-bold tracking-tight sm:text-5xl leading-tight" },
              String(p.title ?? "")
            )}
            {typeof p.subtitle === "string" && (
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                {p.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {typeof p.primaryCtaLabel === "string" && (
                <a
                  href={String(p.primaryCtaHref ?? "#")}
                  style={{
                    backgroundColor: tokens.colors.primary,
                    color: tokens.colors.primaryForeground,
                    borderRadius: tokens.geometry.borderRadius,
                  }}
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold shadow-sm transition hover:opacity-95"
                >
                  {p.primaryCtaLabel}
                </a>
              )}
              {typeof p.secondaryCtaLabel === "string" && (
                <a
                  href={String(p.secondaryCtaHref ?? "#")}
                  style={{ borderRadius: tokens.geometry.borderRadius }}
                  className="inline-flex items-center justify-center border border-white/25 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  {p.secondaryCtaLabel}
                </a>
              )}
            </div>
          </div>
        </section>
      );
    }

    case "tldr_box": {
      return (
        <aside
          aria-label="Answer-First Özet (TL;DR)"
          style={{
            borderColor: tokens.colors.primary,
            backgroundColor: tokens.colors.muted,
            borderRadius: tokens.geometry.borderRadius,
          }}
          className="border-l-4 p-6"
        >
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase mb-2" style={{ color: tokens.colors.primary }}>
            <span>⚡ {createTranslator(locale ?? "tr")("blocks.tldr")}</span>
          </div>
          <RichBlock
            as="div"
            className="nx-rich text-base font-medium leading-relaxed text-nx-fg"
            html={p.html}
            text={p.summary ?? p.text}
          />
        </aside>
      );
    }

    case "stats_strip": {
      if (themeId === INK_GRID_ID) return renderInkNames(p);
      if (themeId === YF_THEME_ID) {
        const stats = Array.isArray(p.stats) ? p.stats : [];
        return (
          <section className="nx-yf-band bg-black px-4 py-10 text-white">
            <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((st: { value?: string; label?: string }, idx: number) => (
                <div key={idx}>
                  <div className="text-3xl font-semibold tracking-tight text-white">{String(st?.value ?? "")}</div>
                  <div className="mt-1 text-xs text-slate-400">{String(st?.label ?? "")}</div>
                </div>
              ))}
            </div>
          </section>
        );
      }
      const stats = Array.isArray(p.stats) ? p.stats : [];
      return (
        <section
          style={{
            borderRadius: tokens.geometry.borderRadius,
            borderColor: tokens.colors.border,
          }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4 border bg-nx-card p-6 shadow-xs"
        >
          {stats.map((st: any, idx: number) => (
            <div key={idx} className="space-y-1 text-center md:text-left px-2">
              <div
                style={{ color: tokens.colors.primary, fontFamily: tokens.typography.headingFont }}
                className="text-2xl md:text-3xl font-extrabold tracking-tight"
              >
                {String(st?.value ?? "")}
              </div>
              <div className="text-xs md:text-sm font-medium text-nx-muted">
                {String(st?.label ?? "")}
              </div>
            </div>
          ))}
        </section>
      );
    }

    case "bento_features": {
      if (themeId === INK_GRID_ID) return renderInkBento(p, tokens);
      if (themeId === YF_THEME_ID) {
        const items = Array.isArray(p.items) ? p.items : [];
        return (
          <section className="nx-yf-band bg-black px-4 py-14 text-white">
            <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[1fr_2fr]">
              <div>
                {typeof p.title === "string" ? <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{p.title}</h2> : null}
                {typeof p.subtitle === "string" ? <p className="mt-4 text-sm font-light leading-relaxed text-slate-400">{p.subtitle}</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item: { title?: string; description?: string; href?: string }, idx: number) => (
                  <article key={idx} className="nx-yf-card p-6">
                    <h3 className="text-lg font-semibold">{String(item?.title ?? "")}</h3>
                    {item?.description ? <p className="mt-2 line-clamp-4 text-sm font-light leading-relaxed text-slate-400">{item.description}</p> : null}
                    {item?.href ? <a href={item.href} className="mt-4 inline-block text-sm text-[#4da3ff]">Detaylı bilgi</a> : null}
                  </article>
                ))}
              </div>
            </div>
          </section>
        );
      }
      const items = Array.isArray(p.items) ? p.items : [];
      const colCount =
        typeof p.columns === "number"
          ? p.columns
          : items.length === 4 || items.length === 8
            ? 4
            : items.length >= 3 && items.length % 3 === 0
              ? 3
              : 2;
      const gridColsClass =
        colCount === 4
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          : colCount === 3
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            : "grid-cols-1 md:grid-cols-2 gap-6";
      return (
        <section className="space-y-6">
          {(typeof p.title === "string" && p.title.trim()) || (typeof p.subtitle === "string" && p.subtitle.trim()) ? (
            <div className="space-y-2">
              {typeof p.title === "string" && p.title.trim() ? (
                <h2
                  style={{ fontFamily: tokens.typography.headingFont }}
                  className="text-2xl md:text-3xl font-bold tracking-tight text-nx-fg"
                >
                  {p.title}
                </h2>
              ) : null}
              {typeof p.subtitle === "string" && p.subtitle.trim() ? (
                <p className="text-base text-nx-soft leading-relaxed max-w-3xl">
                  {p.subtitle}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className={`grid ${gridColsClass}`}>
            {items.map((item: any, idx: number) => {
              const rawImg = typeof item?.image === "string" ? item.image.trim() : "";
              const imgUrl = /^(\/(?!\/)|https?:\/\/)/i.test(rawImg) ? rawImg : "";
              const rawHref = typeof item?.href === "string" ? item.href.trim() : "";
              const href = /^(\/(?!\/)|https?:\/\/|tel:|mailto:|#)/i.test(rawHref) ? rawHref : "";
              const cardInner = (
                <>
                  {imgUrl ? (
                    <div className="mb-3.5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-nx-subtle p-2">
                      <img
                        src={imgUrl}
                        alt={String(item?.title ?? "")}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div
                      style={{ backgroundColor: tokens.colors.muted, color: tokens.colors.primary }}
                      className="mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold"
                    >
                      {typeof item?.icon === "string" && ICON_PATHS[item.icon] ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d={ICON_PATHS[item.icon]} />
                        </svg>
                      ) : (
                        String(idx + 1).padStart(2, "0")
                      )}
                    </div>
                  )}
                  <h3
                    style={{ fontFamily: tokens.typography.headingFont }}
                    className="text-base md:text-lg font-bold text-nx-fg mb-1.5 group-hover:text-nx-primary transition-colors"
                  >
                    {String(item?.title ?? "")}
                  </h3>
                  {typeof item?.description === "string" && item.description.trim() ? (
                    <p className="text-sm text-nx-soft leading-relaxed">
                      {item.description}
                    </p>
                  ) : null}
                </>
              );
              const cardStyle = {
                borderRadius: tokens.geometry.borderRadius,
                borderColor: tokens.colors.border,
              };
              return href ? (
                <a
                  key={idx}
                  href={href}
                  style={cardStyle}
                  className="group flex flex-col justify-between border bg-nx-card p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md no-underline"
                >
                  <div>{cardInner}</div>
                </a>
              ) : (
                <div
                  key={idx}
                  style={cardStyle}
                  className="flex flex-col justify-between border bg-nx-card p-5 shadow-xs transition hover:shadow-md"
                >
                  <div>{cardInner}</div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case "pricing_table": {
      const plans = Array.isArray(p.plans) ? p.plans : [];
      return (
        <section className="space-y-6">
          {typeof p.title === "string" && (
            <h2
              style={{ fontFamily: tokens.typography.headingFont }}
              className="text-2xl md:text-3xl font-bold tracking-tight text-nx-fg"
            >
              {p.title}
            </h2>
          )}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan: any, idx: number) => {
              const featured = Boolean(plan?.featured);
              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: tokens.geometry.borderRadius,
                    borderColor: featured
                      ? tokens.colors.primary
                      : tokens.colors.border,
                  }}
                  className={`flex flex-col justify-between border bg-nx-card p-6 ${
                    featured ? "border-2 shadow-md" : "shadow-xs"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-nx-fg">
                        {String(plan?.name ?? "")}
                      </h3>
                      {featured && (
                        <span
                          style={{ backgroundColor: tokens.colors.primary }}
                          className="rounded px-2 py-0.5 text-[10px] font-bold text-white uppercase"
                        >
                          Önerilen
                        </span>
                      )}
                    </div>
                    <div
                      style={{ color: tokens.colors.primary }}
                      className="text-2xl font-extrabold tracking-tight"
                    >
                      {String(plan?.price ?? "")}
                    </div>
                    <p className="text-xs text-nx-soft leading-relaxed">
                      {String(plan?.description ?? "")}
                    </p>
                  </div>
                  <div className="pt-6">
                    <a
                      href="/admin"
                      style={{
                        backgroundColor: featured
                          ? tokens.colors.primary
                          : tokens.colors.muted,
                        color: featured
                          ? tokens.colors.primaryForeground
                          : tokens.colors.foreground,
                        borderRadius: tokens.geometry.borderRadius,
                      }}
                      className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-semibold"
                    >
                      {String(plan?.ctaLabel ?? "Planı Seç")}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case "cta_banner": {
      if (themeId === INK_GRID_ID) return renderInkCta(p, tokens);
      return (
        <section
          style={{
            borderRadius: tokens.geometry.borderRadius,
          }}
          className="bg-slate-950 text-white p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="space-y-1.5 max-w-2xl">
            <h3
              style={{ fontFamily: tokens.typography.headingFont }}
              className="text-xl font-bold"
            >
              {String(p.title ?? "")}
            </h3>
            {typeof p.subtitle === "string" && (
              <p className="text-sm text-slate-300">{p.subtitle}</p>
            )}
          </div>
          {typeof p.buttonLabel === "string" && (
            <a
              href={String(p.buttonHref ?? "/admin")}
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.primaryForeground,
                borderRadius: tokens.geometry.borderRadius,
              }}
              className="shrink-0 inline-flex items-center px-5 py-2.5 text-xs font-semibold"
            >
              {p.buttonLabel}
            </a>
          )}
        </section>
      );
    }

    case "testimonial_grid": {
      if (themeId === INK_GRID_ID) return renderInkQuotes(p, tokens);
      const items = Array.isArray(p.items) ? p.items : [];
      return (
        <section className="space-y-6">
          {typeof p.title === "string" && p.title && (
            <h2
              style={{ fontFamily: tokens.typography.headingFont }}
              className="text-2xl font-bold text-nx-fg"
            >
              {p.title}
            </h2>
          )}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {items.map((it: any, idx: number) => (
              <div
                key={idx}
                style={{
                  borderRadius: tokens.geometry.borderRadius,
                  borderColor: tokens.colors.border,
                }}
                className="border bg-nx-card p-6 space-y-3 shadow-xs"
              >
                <p className="text-sm italic text-nx-soft leading-relaxed">
                  “{String(it?.quote ?? "")}”
                </p>
                <div className="text-xs font-semibold text-nx-fg">
                  {String(it?.author ?? "")}
                  {it?.role ? (
                    <span className="text-nx-muted font-normal">
                      {" "}
                      — {String(it.role)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    default:
      return undefined;
  }
}
