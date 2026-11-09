import { ResponsiveImage, type MediaFocalMap } from "./responsive-image";
import React from "react";
import { createTranslator } from "@nexpress/i18n";
import { ICON_PATHS, normalizeFormSpec, safeBlockDomId, type BlockNode, type DesignTokens } from "@nexpress/core";
import type { FormRenderContext } from "./block-context";
import { RscForm } from "./rsc-form";
import { renderMotionBlock } from "./blocks-motion";
import { AccordionView, TabsView } from "./blocks-disclosure";

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function rows(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (
    (url.startsWith("/") && !url.startsWith("//")) ||
    url.startsWith("#") ||
    url.startsWith("data:image/") ||
    url.startsWith("tel:") ||
    url.startsWith("mailto:")
  ) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    return null;
  }
  return null;
}

function frame(tokens: DesignTokens): React.CSSProperties {
  return {
    borderColor: tokens.colors.border,
    borderRadius: tokens.geometry.borderRadius,
  };
}

export function renderStudioCatalogBlock(
  block: BlockNode,
  tokens: DesignTokens,
  focal?: MediaFocalMap,
  locale = "tr",
  form?: FormRenderContext,
  renderChild?: (child: BlockNode) => React.ReactElement | null
): React.ReactElement | null {
  const t = createTranslator(locale);
  const p = block.props ?? {};
  const box = frame(tokens);
  const items = rows(p.items);

  switch (block.type) {
    case "info_box": {
      const iconPath = typeof p.icon === "string" ? ICON_PATHS[p.icon] : undefined;
      const imgUrl = safeUrl(p.image);
      const href = safeUrl(p.href);
      const kicker = text(p.kicker);
      const bodyText = text(p.text, text(p.description));
      const cardContent = (
        <>
          {imgUrl ? (
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-nx-subtle p-1.5">
              <img src={imgUrl} alt={text(p.title)} loading="lazy" className="h-full w-full object-contain" />
            </div>
          ) : iconPath ? (
            <div
              style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }}
              className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={iconPath} />
              </svg>
            </div>
          ) : null}
          {kicker ? (
            <div className="text-[11px] font-bold uppercase tracking-wider text-nx-link">
              {kicker}
            </div>
          ) : null}
          <h3 className="mt-1 text-base md:text-lg font-bold text-nx-fg">{text(p.title, "Bilgi kutusu")}</h3>
          {bodyText ? <p className="mt-1.5 text-sm leading-relaxed text-nx-soft">{bodyText}</p> : null}
          {href && text(p.linkLabel) ? (
            <span className="mt-3 inline-block text-sm font-semibold text-nx-link">
              {text(p.linkLabel)}
            </span>
          ) : null}
        </>
      );
      return href ? (
        <a href={href} style={box} className="block h-full border bg-nx-card p-5 transition hover:-translate-y-0.5 hover:shadow-md no-underline">
          {cardContent}
        </a>
      ) : (
        <article style={box} className="h-full border bg-nx-card p-5">
          {cardContent}
        </article>
      );
    }

    case "icon_list": {
      const colCount = typeof p.columns === "number" ? p.columns : 1;
      const listGridClass =
        colCount === 3
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
          : colCount === 2
            ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
            : "space-y-2.5";
      return (
        <ul className={listGridClass}>
          {items.map((item, index) => {
            const iconPath = typeof item.icon === "string" ? ICON_PATHS[item.icon] : undefined;
            const href = safeUrl(item.href);
            const label = text(item.title, text(item.text));
            const sub = text(item.text, text(item.description));
            const hasSub = Boolean(sub && text(item.title) && sub !== label);
            const badge = (
              <span
                style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }}
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              >
                {iconPath ? (
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={iconPath} />
                  </svg>
                ) : (
                  text(item.mark, "✓")
                )}
              </span>
            );
            return (
              <li key={index} className="list-none">
                {href ? (
                  <a
                    href={href}
                    style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                    className="group flex items-center gap-2.5 border bg-nx-card px-3.5 py-2.5 text-sm text-nx-fg transition hover:shadow-xs no-underline"
                  >
                    {badge}
                    <span className="min-w-0 flex-1">
                      <strong className="font-semibold text-nx-fg group-hover:text-nx-link transition-colors">{label}</strong>
                      {hasSub ? <span className="block text-xs text-nx-soft">{sub}</span> : null}
                    </span>
                  </a>
                ) : (
                  <div className="flex items-start gap-2.5 text-sm text-nx-soft">
                    {badge}
                    <span className="min-w-0 flex-1">
                      <strong className="font-semibold text-nx-fg">{label}</strong>
                      {hasSub ? <span className="block text-nx-soft">{sub}</span> : null}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      );
    }

    case "tabs":
      return <TabsView block={block} tokens={tokens} renderChild={renderChild} />;

    case "accordion":
      return (
        <AccordionView
          block={block}
          tokens={tokens}
          items={items.map((item, index) => ({
            q: text(item.question, text(item.title, `${t("blocks.section")} ${index + 1}`)),
            a: text(item.answer, text(item.body)),
          }))}
        />
      );

    case "toc":
      return (
        <nav style={box} className="border bg-nx-subtle p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-nx-muted">{t("blocks.toc")}</div>
          <ol className="mt-2 space-y-1 text-sm">
            {items.map((item, index) => (
              <li key={index}>
                <a href={safeUrl(item.href) ?? "#"} className="text-nx-link hover:underline">
                  {text(item.label, `${t("blocks.heading")} ${index + 1}`)}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      );

    case "anchor_nav": {
      const styleVariant = text(p.styleVariant, "underline");
      const titleText = text(p.title);
      const ctaLabel = text(p.ctaLabel);
      const ctaHref = safeUrl(p.ctaHref) ?? "#teklif-formu";
      const navItems = items.length > 0 ? items : [
        { label: "Genel Bakış", href: "#genel-bakis", icon: "sparkles" },
        { label: "Ürün & Çözümler", href: "#urunler", icon: "layers" },
        { label: "Detaylı İncele", href: "#detayli-incele", icon: "check-circle" },
        { label: "Karşılaştırma", href: "#karsilastirma", icon: "bar-chart" },
        { label: "Sıkça Sorulan Sorular", href: "#sss", icon: "help-circle" },
        { label: "Referanslar", href: "#referanslar", icon: "award" },
      ];
      return (
        <nav
          aria-label={titleText || "Sayfa İçi Bölüm Gezgini"}
          style={{ borderColor: tokens.colors.border }}
          className="w-full rounded-xl border bg-nx-card/95 px-4 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-4 overflow-x-auto">
            {titleText ? (
              <div
                style={{ borderColor: tokens.colors.border }}
                className="hidden shrink-0 items-center gap-2 border-r py-3 pr-4 text-xs font-extrabold tracking-wider text-nx-fg uppercase lg:flex"
              >
                <span
                  style={{ backgroundColor: tokens.colors.primary }}
                  className="inline-block h-2 w-2 rounded-full"
                />
                <span>{titleText}</span>
              </div>
            ) : null}

            <div className="flex min-w-max flex-1 items-center gap-1 py-1.5">
              {navItems.map((item, index) => {
                const rawHref = text(item.href, `#bolum-${index + 1}`);
                const href = rawHref.startsWith("#") ? rawHref : safeUrl(rawHref) ?? `#bolum-${index + 1}`;
                const label = text(item.label, `${t("blocks.section")} ${index + 1}`);
                const iconName = text(item.icon);
                const badge = text(item.badge);
                const isFirst = index === 0;

                const variantClass =
                  styleVariant === "pills"
                    ? isFirst
                      ? "rounded-full px-3.5 py-1.5 font-bold shadow-xs"
                      : "rounded-full px-3.5 py-1.5 text-nx-soft hover:bg-nx-subtle hover:text-nx-fg"
                    : styleVariant === "boxed"
                      ? isFirst
                        ? "rounded-lg border px-3.5 py-1.5 font-bold"
                        : "rounded-lg border border-transparent px-3.5 py-1.5 text-nx-soft hover:border-nx-border hover:bg-nx-subtle hover:text-nx-fg"
                      : isFirst
                        ? "border-b-2 px-3.5 py-2.5 font-bold text-nx-fg"
                        : "border-b-2 border-transparent px-3.5 py-2.5 text-nx-soft hover:border-current hover:text-nx-fg";

                const variantStyle: React.CSSProperties =
                  styleVariant === "pills" && isFirst
                    ? { backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }
                    : styleVariant === "boxed" && isFirst
                      ? {
                          borderColor: tokens.colors.primary,
                          color: tokens.colors.primary,
                          backgroundColor: `color-mix(in srgb, ${tokens.colors.primary} 10%, transparent)`,
                        }
                      : styleVariant === "underline" && isFirst
                        ? { borderBottomColor: tokens.colors.primary, color: tokens.colors.primary }
                        : {};

                return (
                  <a
                    key={index}
                    href={href}
                    style={variantStyle}
                    className={`inline-flex shrink-0 items-center gap-1.5 text-[13px] transition-colors ${variantClass}`}
                  >
                    {iconName && ICON_PATHS[iconName] ? (
                      <span className="opacity-85">
                        <svg
                          viewBox="0 0 24 24"
                          width={14}
                          height={14}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d={ICON_PATHS[iconName]} />
                        </svg>
                      </span>
                    ) : null}
                    <span>{label}</span>
                    {badge ? (
                      <span
                        style={{
                          backgroundColor: `color-mix(in srgb, ${tokens.colors.primary} 14%, transparent)`,
                          color: tokens.colors.primary,
                        }}
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                      >
                        {badge}
                      </span>
                    ) : null}
                  </a>
                );
              })}
            </div>

            {ctaLabel ? (
              <div className="shrink-0 py-2 pl-2">
                <a
                  href={ctaHref.startsWith("#") ? ctaHref : safeUrl(p.ctaHref) ?? "#"}
                  style={{
                    backgroundColor: tokens.colors.primary,
                    color: tokens.colors.primaryForeground,
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold shadow-xs transition hover:opacity-95"
                >
                  <span>{ctaLabel}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            ) : null}
          </div>
        </nav>
      );
    }

    case "show_more":
      return (
        <details style={box} className="border bg-nx-card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-nx-fg">
            {text(p.summary, t("blocks.showMore"))}
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-nx-soft">{text(p.body, text(p.text))}</p>
        </details>
      );

    case "button_row":
      return (
        <div className="flex flex-wrap gap-2" style={{ justifyContent: text(p.align, "left") === "center" ? "center" : "flex-start" }}>
          {rows(p.buttons).map((button, index) => {
            const href = safeUrl(button.href) ?? "#";
            const solid = text(button.variant, "primary") !== "ghost";
            return (
              <a
                key={index}
                href={href}
                className={`inline-flex rounded-md px-4 py-2 text-sm font-semibold ${
                  solid ? "bg-blue-600 text-white" : "border border-nx-line text-nx-fg"
                }`}
              >
                {text(button.label, "Buton")}
              </a>
            );
          })}
        </div>
      );

    case "gallery": {
      if (p.variant === "collage" && items.length === 3) {
        const first = items[0]!;
        const second = items[1]!;
        const third = items[2]!;
        return (
          <div className="grid grid-cols-2 gap-3.5 items-center">
            <figure style={box} className="overflow-hidden border bg-nx-subtle shadow-sm">
              {safeUrl(first.url) ? (
                <ResponsiveImage focal={focal} src={safeUrl(first.url)!} alt={text(first.alt)} sizes="(min-width: 768px) 25vw, 50vw" className="w-full h-auto object-cover" />
              ) : null}
            </figure>
            <div className="space-y-3.5">
              {[second, third].map((item, idx) => {
                const src = safeUrl(item.url);
                return (
                  <figure key={idx} style={box} className="overflow-hidden border bg-nx-subtle shadow-sm">
                    {src ? (
                      <ResponsiveImage focal={focal} src={src} alt={text(item.alt)} sizes="(min-width: 768px) 25vw, 50vw" className="w-full h-auto object-cover" />
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </div>
        );
      }
      return (
        <div className={`grid grid-cols-2 gap-3 ${items.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {items.map((item, index) => {
            const src = safeUrl(item.url);
            return (
              <figure key={index} style={box} className="overflow-hidden border bg-nx-subtle">
                {src ? <ResponsiveImage focal={focal} src={src} alt={text(item.alt)} sizes="(min-width: 768px) 33vw, 50vw" className="aspect-[4/3] w-full object-cover" /> : null}
                {text(item.caption) ? (
                  <figcaption className="px-2 py-1 text-[11px] text-nx-muted">{text(item.caption)}</figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>
      );
    }

    case "image_overlay": {
      const src = safeUrl(p.url);
      const href = safeUrl(p.href);
      const card = (
        <article style={box} className="relative min-h-48 overflow-hidden border bg-slate-900 text-white">
          {src ? <ResponsiveImage focal={focal} src={src} alt={text(p.alt)} sizes="100vw" className="absolute inset-0 h-full w-full object-cover opacity-70" /> : null}
          <div className="relative flex min-h-48 flex-col justify-end p-5">
            <h3 className="text-xl font-bold">{text(p.title, t("blocks.imageCover"))}</h3>
            <p className="text-sm text-white/80">{text(p.subtitle)}</p>
          </div>
        </article>
      );
      return href ? <a href={href}>{card}</a> : card;
    }

    case "video_popup": {
      const href = safeUrl(p.url);
      return (
        <a href={href ?? "#"} style={box} className="block border bg-slate-950 p-6 text-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Video</div>
          <div className="mt-2 text-lg font-bold">{text(p.title, t("blocks.openVideo"))}</div>
          <div className="mt-1 text-sm text-white/70">{t("blocks.videoNote")}</div>
        </a>
      );
    }

    case "slider":
      return (
        <div className="flex snap-x gap-3 overflow-x-auto pb-2">
          {rows(p.slides).map((slide, index) => (
            <article key={index} style={box} className="w-[80%] shrink-0 snap-start border bg-nx-card p-5 md:w-[46%]">
              <h3 className="text-lg font-bold text-nx-fg">{text(slide.title, `Slayt ${index + 1}`)}</h3>
              <p className="mt-2 text-sm text-nx-soft">{text(slide.text)}</p>
            </article>
          ))}
        </div>
      );

    case "countdown": {
      const target = Date.parse(text(p.targetDate));
      const days = Number.isFinite(target)
        ? Math.max(0, Math.ceil((target - Date.now()) / 86_400_000))
        : null;
      return (
        <section style={box} className="border bg-slate-950 px-5 py-6 text-center text-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
            {text(p.kicker, t("blocks.duration"))}
          </div>
          <div className="mt-2 text-4xl font-black tabular-nums">{days === null ? "—" : days}</div>
          <div className="text-sm text-white/70">{text(p.label, t("blocks.daysLeft"))}</div>
        </section>
      );
    }

    case "progress_bar": {
      const value = Math.min(100, Math.max(0, Number(p.value ?? 0)));
      return (
        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold text-nx-soft">
            <span>{text(p.label, t("blocks.progress"))}</span>
            <span>{value}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-blue-600" style={{ width: `${value}%` }} />
          </div>
        </div>
      );
    }

    case "form_block": {
      const bound = typeof p.formId === "string" ? form?.forms?.[p.formId] : undefined;
      if (bound && form) {
        if (bound.status !== "active") return <p style={box} className="border bg-nx-subtle p-4 text-sm text-nx-soft">{t("blocks.formClosed")}</p>;
        return <RscForm form={bound} blockId={block.id} ctx={form} frame={box} title={text(p.title)} t={t} />;
      }
      if (typeof p.formId === "string" && p.formId) return null; // bağlı form silinmiş/bulunamadı: boş form gösterilmez
      const action = safeUrl(p.action);
      const title = <h3 className="text-lg font-bold text-nx-fg">{text(p.title, t("blocks.contact"))}</h3>;
      // Dış `action` verilmişse eski davranış (GET); aksi halde gelen kutusuna POST (JS'siz)
      if (action || !form) {
        return (
          <form action={action ?? undefined} method="get" style={box} className="space-y-3 border bg-nx-card p-5">
            {title}
            {rows(p.fields).map((field, index) => (
              <label key={index} className="block text-sm">
                <span className="mb-1 block font-medium text-nx-soft">{text(field.label, "Alan")}</span>
                <input name={text(field.name, `alan_${index}`)} type={text(field.type, "text") === "email" ? "email" : "text"} className="w-full rounded-md border border-nx-line px-3 py-2" />
              </label>
            ))}
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{text(p.submitLabel, t("blocks.submit"))}</button>
          </form>
        );
      }
      const spec = normalizeFormSpec({ fields: p.fields, submitLabel: text(p.submitLabel, t("blocks.submit")), successMessage: text(p.successMessage), appearance: p.appearance });
      return <RscForm form={{ id: block.id, name: text(p.title), status: "active", spec }} blockId={block.id} ctx={form} frame={box} title={text(p.title)} t={t} />;
    }

    case "data_table": {
      const headers = Array.isArray(p.headers) ? p.headers : [];
      const body = Array.isArray(p.rows) ? p.rows : [];
      const pad = p.compact === true ? "px-2 py-1" : "px-3 py-2";
      const numeric = (v: unknown) => p.alignNumbers !== false && /^[-+]?[\d.,\s%₺$€]+$/.test(String(v).trim()) && String(v).trim() !== "";
      const label = text(p.title, "Tablo");
      return (
        // Kaydırılabilir bölge klavyeyle odaklanabilir (erişilebilirlik); başlık tablonun `caption`ıdır
        <div className="overflow-x-auto" role="region" aria-label={label} tabIndex={0} style={p.stickyHeader === true ? { maxHeight: "28rem", overflowY: "auto" } : undefined}>
          <table className="w-full border-collapse text-sm">
            {text(p.title) ? <caption className="mb-2 text-left text-lg font-bold text-nx-fg">{text(p.title)}</caption> : null}
            {headers.length > 0 ? (
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={index} scope="col" className={`border-b ${pad} text-left font-semibold text-nx-fg ${p.stickyHeader === true ? "sticky top-0 bg-nx-card" : ""}`}>
                      {String(header)}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {body.map((row, index) => (
                <tr key={index} className={p.striped === true && index % 2 === 1 ? "bg-nx-subtle" : undefined}>
                  {(Array.isArray(row) ? row : []).map((cell, cellIndex) =>
                    cellIndex === 0 && p.firstColumnHeader === true ? (
                      <th key={cellIndex} scope="row" className={`border-b ${pad} text-left font-semibold text-nx-fg`}>{String(cell)}</th>
                    ) : (
                      <td key={cellIndex} className={`border-b ${pad} text-nx-soft ${numeric(cell) ? "text-right tabular-nums" : ""}`}>
                        {String(cell)}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "map_embed": {
      const query = text(p.query, "İzmir");
      const rawEmbed = typeof p.embedUrl === "string" ? p.embedUrl.trim() : "";
      const isSafeMapEmbed = /^https:\/\/(?:www\.)?google\.com\/maps|^https:\/\/maps\.google\.com\/maps/i.test(rawEmbed);
      const href = `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
      if (isSafeMapEmbed) {
        return (
          <figure style={box} className="overflow-hidden border bg-nx-subtle shadow-xs">
            <iframe
              src={rawEmbed}
              title={text(p.title, query)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-80 w-full border-0"
            />
          </figure>
        );
      }
      return (
        <a href={href} style={box} className="block border bg-nx-subtle p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-nx-muted">Konum</div>
          <div className="mt-1 text-lg font-bold text-nx-fg">{text(p.title, query)}</div>
          <div className="text-sm text-nx-link">{t("blocks.openMap")}</div>
        </a>
      );
    }

    case "search_box":
      return (
        <form action={safeUrl(p.action) ?? `/${locale}/ara`} method="get" role="search" className="flex gap-2">
          <label className="sr-only" htmlFor={`nx-sb-${safeBlockDomId(block.id)}`}>{t("search.title")}</label>
          <input
            id={`nx-sb-${safeBlockDomId(block.id)}`}
            type="search"
            name="q"
            placeholder={text(p.placeholder, t("search.placeholder"))}
            className="w-full rounded-md border border-nx-line bg-nx-card px-3 py-2 text-sm text-nx-fg"
          />
          <button type="submit" className="rounded-md px-4 py-2 text-sm font-semibold" style={{ background: tokens.colors.primary, color: tokens.colors.primaryForeground }}>
            {t("search.button")}
          </button>
        </form>
      );

    case "post_grid":
    case "portfolio_grid":
    case "product_row":
      return (
        <section>
          {text(p.title) ? <h3 className="mb-3 text-lg font-bold text-nx-fg">{text(p.title)}</h3> : null}
          <div className={`grid gap-3 ${block.type === "product_row" ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {items.map((item, index) => {
              const href = safeUrl(item.href);
              const src = safeUrl(item.image);
              const body = (
                <article style={box} className="h-full overflow-hidden border bg-nx-card">
                  {src ? <ResponsiveImage focal={focal} src={src} alt={text(item.alt, text(item.title))} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[16/10] w-full object-cover" /> : null}
                  <div className="p-4">
                    <h4 className="font-bold text-nx-fg">{text(item.title, "Kart")}</h4>
                    <p className="mt-1 text-sm text-nx-soft">{text(item.excerpt, text(item.text))}</p>
                    {text(item.price) ? <div className="mt-2 text-sm font-semibold text-nx-link">{text(item.price)}</div> : null}
                  </div>
                </article>
              );
              return href ? (
                <a key={index} href={href}>
                  {body}
                </a>
              ) : (
                <div key={index}>{body}</div>
              );
            })}
          </div>
        </section>
      );

    case "modal_panel":
      return (
        <details style={box} className="border bg-nx-card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-nx-link">
            {text(p.trigger, t("blocks.openDialog"))}
          </summary>
          <div className="mt-3">
            <h3 className="font-bold text-nx-fg">{text(p.title)}</h3>
            <p className="mt-1 text-sm text-nx-soft">{text(p.body, text(p.text))}</p>
          </div>
        </details>
      );

    case "split_content": {
      const src = safeUrl(p.image);
      const reversed = p.reverse === true;
      return (
        <section className={`grid items-center gap-6 md:grid-cols-2 ${reversed ? "md:[&>*:first-child]:order-2" : ""}`}>
          <div>
            <h3 className="text-2xl font-bold text-nx-fg">{text(p.title, t("blocks.twoColumns"))}</h3>
            <p className="mt-2 text-sm leading-relaxed text-nx-soft">{text(p.text)}</p>
          </div>
          {src ? <ResponsiveImage focal={focal} src={src} alt={text(p.alt)} style={box} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3] w-full border object-cover" /> : null}
        </section>
      );
    }

    case "user_card":
      return (
        <article style={box} className="flex items-center gap-3 border bg-nx-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {text(p.name, "K").slice(0, 1)}
          </div>
          <div>
            <div className="font-bold text-nx-fg">{text(p.name, "Yazar")}</div>
            <div className="text-sm text-nx-soft">{text(p.role)}</div>
            {text(p.since) ? <div className="text-xs text-nx-muted">{t("blocks.since")}: {text(p.since)}</div> : null}
          </div>
        </article>
      );

    case "repeater":
      return (
        <div className="space-y-3">
          {items.map((item, index) => (
            <article key={index} style={box} className="border bg-nx-card p-4">
              <h3 className="font-bold text-nx-fg">{text(item.title, `${t("blocks.entry")} ${index + 1}`)}</h3>
              <p className="mt-1 text-sm text-nx-soft">{text(item.text)}</p>
            </article>
          ))}
        </div>
      );

    case "vector_mark":
      return (
        <div style={box} className="inline-flex items-center gap-3 border bg-nx-card px-4 py-3">
          <svg viewBox="0 0 32 32" className="h-8 w-8 text-nx-link" aria-hidden="true">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="currentColor" opacity="0.15" />
            <path d="M8 18l5 5 11-12" fill="none" stroke="currentColor" strokeWidth="2.4" />
          </svg>
          <div>
            <div className="text-sm font-bold text-nx-fg">{text(p.title, t("blocks.marker"))}</div>
            <div className="text-xs text-nx-muted">{text(p.text)}</div>
          </div>
        </div>
      );

    default:
      return renderMotionBlock(block) ?? null;
  }
}
