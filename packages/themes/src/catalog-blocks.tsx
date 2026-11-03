import { ResponsiveImage, type MediaFocalMap } from "./responsive-image";
import React from "react";
import { createTranslator } from "@nexpress/i18n";
import { resolveFormFields, safeBlockDomId, type BlockNode, type DesignTokens } from "@nexpress/core";
import type { FormRenderContext } from "./block-context";
import { RscForm } from "./rsc-form";
import { renderMotionBlock } from "./blocks-motion";

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
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("data:image/")) return url;
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
  form?: FormRenderContext
): React.ReactElement | null {
  const t = createTranslator(locale);
  const p = block.props ?? {};
  const box = frame(tokens);
  const items = rows(p.items);

  switch (block.type) {
    case "info_box":
      return (
        <article style={box} className="border bg-nx-card p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-nx-link">
            {text(p.kicker, "Bilgi")}
          </div>
          <h3 className="mt-1 text-lg font-bold text-nx-fg">{text(p.title, "Bilgi kutusu")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-nx-soft">{text(p.text)}</p>
          {safeUrl(p.href) ? (
            <a href={safeUrl(p.href)!} className="mt-3 inline-block text-sm font-semibold text-nx-link">
              {text(p.linkLabel, t("blocks.readMore"))}
            </a>
          ) : null}
        </article>
      );

    case "icon_list":
      return (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 text-sm text-nx-soft">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {text(item.mark, "✓")}
              </span>
              <span>
                <strong className="text-nx-fg">{text(item.title, text(item.text))}</strong>
                {text(item.text) && text(item.title) ? (
                  <span className="block text-nx-soft">{text(item.text)}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      );

    case "tabs": {
      const name = `nx-tabs-${safeBlockDomId(block.id)}`;
      return (
        <div className={name}>
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <label
                key={index}
                htmlFor={`${name}-${index}`}
                className="cursor-pointer rounded-md border px-3 py-1.5 text-sm font-semibold"
                style={box}
              >
                {text(item.label, `Sekme ${index + 1}`)}
              </label>
            ))}
          </div>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <input
                id={`${name}-${index}`}
                name={name}
                type="radio"
                defaultChecked={index === 0}
                className="absolute h-px w-px opacity-0"
              />
            </React.Fragment>
          ))}
          {items.map((item, index) => (
            <div key={`panel-${index}`} className={`${name}-panel-${index} mt-3 text-sm leading-relaxed text-nx-soft`}>
              {text(item.body)}
            </div>
          ))}
          <style>{`
            .${name} .${name}-panel-0, .${name} [class*="${name}-panel-"] { display: none; }
            ${items
              .map(
                (_, index) =>
                  `.${name} input:nth-of-type(${index + 1}):checked ~ .${name}-panel-${index} { display: block; }`
              )
              .join("")}
          `}</style>
        </div>
      );
    }

    case "accordion":
      return (
        <div className="space-y-2">
          {text(p.title) ? <h3 className="text-lg font-bold text-nx-fg">{text(p.title)}</h3> : null}
          {items.map((item, index) => (
            <details key={index} open={index === 0} className="border bg-nx-card px-4 py-3" style={box}>
              <summary className="cursor-pointer text-sm font-semibold text-nx-fg">
                {text(item.question, text(item.title, `${t("blocks.section")} ${index + 1}`))}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-nx-soft">{text(item.answer, text(item.body))}</p>
            </details>
          ))}
        </div>
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

    case "gallery":
      return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
      const mine = form.blockId === block.id ? form.status : null;
      return (
        <form action="/api/forms/submit" method="post" style={box} className="space-y-3 border bg-nx-card p-5">
          {title}
          {mine === "sent" ? <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{t("blocks.formSent")}</p> : null}
          {mine === "error" ? <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{t("blocks.formError")}</p> : null}
          <input type="hidden" name="_path" value={form.path} />
          <input type="hidden" name="_block" value={block.id} />
          <input type="hidden" name="_t" value={form.token} />
          <div style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
            <label>
              Website <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          {resolveFormFields(p.fields).map((field) => (
            <label key={field.name} className="block text-sm">
              <span className="mb-1 block font-medium text-nx-soft">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              {field.type === "textarea" ? (
                <textarea name={field.name} required={field.required} maxLength={5000} rows={5} className="w-full rounded-md border border-nx-line px-3 py-2" />
              ) : (
                <input name={field.name} type={field.type === "number" ? "number" : field.type} required={field.required} maxLength={500} className="w-full rounded-md border border-nx-line px-3 py-2" />
              )}
            </label>
          ))}
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{text(p.submitLabel, t("blocks.submit"))}</button>
        </form>
      );
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
      const query = text(p.query, "İstanbul");
      const href = `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
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
