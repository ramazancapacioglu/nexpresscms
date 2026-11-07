import React from "react";
import type { BlockRenderContext } from "./block-context";
import { INK_GRID_ID } from "./ink-grid";
import { renderInkFaq } from "./ink-blocks";
import { RichBlock } from "./rich-block";
import { AccordionView } from "./blocks-disclosure";

/** Bilgi blokları: adımlar, SSS, kutular, kod, alıntı, liste, video, tablo, inceleme. Tanımsız dönerse sıradaki grup denenir. */
export function renderContentBlock({ block, themeId, tokens, isEditorial, isCommerce, renderChild }: BlockRenderContext): React.ReactElement | null | undefined {
  const p = block.props ?? {};
  void renderChild;

  switch (block.type) {
    case "product_embed": {
      return (
        <section
          style={{
            borderRadius: tokens.geometry.borderRadius,
            borderColor: tokens.colors.primary,
          }}
          className="border-2 bg-gradient-to-r from-slate-50 to-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span
                style={{ backgroundColor: tokens.colors.primary }}
                className="rounded px-2.5 py-0.5 text-[11px] font-semibold text-white uppercase"
              >
                Bağlantılı @id Entity Kartı
              </span>
              {typeof p.sku === "string" && (
                <span className="text-xs font-mono text-nx-muted">SKU: {p.sku}</span>
              )}
            </div>
            <h3
              style={{ fontFamily: tokens.typography.headingFont }}
              className="text-xl font-bold text-nx-fg"
            >
              {String(p.productName ?? "")}
            </h3>
            {typeof p.summary === "string" && (
              <p className="text-sm text-nx-soft">{p.summary}</p>
            )}
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            {typeof p.price === "string" && (
              <span className="text-2xl font-extrabold text-nx-fg">{p.price}</span>
            )}
            <a
              href="/tr/nexpress-enterprise-cloud"
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.primaryForeground,
                borderRadius: tokens.geometry.borderRadius,
              }}
              className="inline-flex items-center px-5 py-2.5 text-xs font-semibold"
            >
              Ürünü & Schema Grafiğini İncele →
            </a>
          </div>
        </section>
      );
    }

    case "howto_steps": {
      const steps = Array.isArray(p.steps) ? p.steps : [];
      return (
        <section className="space-y-6">
          {typeof p.title === "string" && (
            <h2
              style={{ fontFamily: tokens.typography.headingFont }}
              className="text-2xl font-bold text-nx-fg"
            >
              {p.title}
            </h2>
          )}
          <div className="space-y-4">
            {steps.map((step: any, idx: number) => (
              <div
                key={idx}
                style={{
                  borderRadius: tokens.geometry.borderRadius,
                  borderColor: tokens.colors.border,
                }}
                className="flex gap-4 border bg-nx-card p-5"
              >
                <div
                  style={{ backgroundColor: tokens.colors.primary }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                >
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-nx-fg">
                    {String(step?.title ?? "")}
                  </h3>
                  <p className="mt-1 text-sm text-nx-soft">
                    {String(step?.description ?? "")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "faq_accordion": {
      if (themeId === INK_GRID_ID) return renderInkFaq(p, tokens);
      const items = Array.isArray(p.items) ? p.items : [];
      const openMode = p.openMode === "none" || p.openMode === "all" ? p.openMode : "first";
      const exclusive = p.exclusive === true && openMode !== "all";
      if (typeof p.accordionStyle === "string" && p.accordionStyle) {
        return (
          <AccordionView
            block={block}
            tokens={tokens}
            items={items.map((item: any) => ({ q: String(item?.question ?? ""), a: String(item?.answer ?? "") }))}
          />
        );
      }
      return (
        <section className="space-y-6">
          <h2
            style={{ fontFamily: tokens.typography.headingFont }}
            className="text-2xl font-bold text-nx-fg"
          >
            {String(p.title ?? "Sıkça Sorulan Sorular")}
          </h2>
          <div className="space-y-3">
            {items.map((item: any, idx: number) => (
              <details
                key={idx}
                open={openMode === "all" || (openMode === "first" && idx === 0)}
                {...(exclusive ? ({ name: `nx-faq-${block.id}` } as Record<string, string>) : {})}
                style={{
                  borderRadius: tokens.geometry.borderRadius,
                  borderColor: tokens.colors.border,
                }}
                className="group border bg-nx-card p-5"
              >
                <summary className="cursor-pointer list-none font-semibold text-nx-fg flex items-center justify-between">
                  <span>{String(item?.question ?? "")}</span>
                  <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-sm text-nx-soft leading-relaxed border-t pt-3">
                  {String(item?.answer ?? "")}
                </p>
              </details>
            ))}
          </div>
        </section>
      );
    }

    case "callout": {
      return (
        <div
          style={{
            borderRadius: tokens.geometry.borderRadius,
            borderColor: tokens.colors.accent,
          }}
          className="border bg-indigo-50/60 p-5 space-y-1"
        >
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.colors.accent }}>
            {String(p.tone ?? "NOTE")} — {String(p.title ?? "")}
          </div>
          <p className="text-sm text-nx-soft leading-relaxed">{String(p.text ?? "")}</p>
        </div>
      );
    }

    case "code_block": {
      return (
        <pre
          style={{
            borderRadius: tokens.geometry.borderRadius,
            fontFamily: tokens.typography.monoFont,
          }}
          className="overflow-x-auto bg-slate-950 p-5 text-xs text-slate-100"
        >
          <code>{String(p.code ?? "")}</code>
        </pre>
      );
    }

    case "quote": {
      return (
        <blockquote
          style={{
            borderColor: tokens.colors.primary,
            borderRadius: tokens.geometry.borderRadius,
          }}
          className="border-l-4 bg-slate-50/80 p-6 md:p-8 space-y-3"
        >
          <RichBlock
            as="p"
            html={p.html}
            text={p.quote ?? p.text}
            style={{ fontFamily: tokens.typography.headingFont }}
            className="text-lg font-medium italic leading-relaxed text-nx-fg md:text-xl"
          />
          {(typeof p.author === "string" || typeof p.role === "string") && (
            <footer className="text-xs font-semibold text-nx-soft">
              — {String(p.author ?? "")}
              {typeof p.role === "string" && p.role ? (
                <span className="text-slate-400 font-normal"> • {p.role}</span>
              ) : null}
            </footer>
          )}
        </blockquote>
      );
    }

    case "list_element": {
      const items = Array.isArray(p.items) ? p.items : [];
      const listType = String(p.listType ?? "check");
      if (listType === "numbered") {
        return (
          <ol className="list-decimal pl-6 space-y-2 text-base text-nx-soft">
            {items.map((it: any, idx: number) => (
              <li key={idx} className="leading-relaxed">
                {String(it)}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="space-y-2.5 text-base text-nx-soft">
          {items.map((it: any, idx: number) => (
            <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <span
                style={{ color: tokens.colors.primary }}
                className="font-bold mt-0.5 shrink-0"
              >
                {listType === "check" ? "✓" : "•"}
              </span>
              <span>{String(it)}</span>
            </li>
          ))}
        </ul>
      );
    }

    case "video_embed": {
      const url = String(p.url ?? "");
      const title = String(p.title ?? "Video");
      const caption = typeof p.caption === "string" ? p.caption : "";
      const isYoutubeOrVimeo =
        url.includes("youtube.com/embed") || url.includes("player.vimeo.com");
      return (
        <figure className="space-y-2.5">
          <div
            style={{
              borderRadius: tokens.geometry.borderRadius,
              borderColor: tokens.colors.border,
            }}
            className="overflow-hidden border bg-slate-950 aspect-video flex items-center justify-center"
          >
            {isYoutubeOrVimeo ? (
              <iframe
                src={url}
                title={title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : url ? (
              <video src={url} controls className="w-full h-full object-cover" />
            ) : (
              <div className="text-xs text-slate-400">{title}</div>
            )}
          </div>
          {caption ? (
            <figcaption className="text-xs text-nx-muted text-center italic">
              {caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    case "comparison_table": {
      const headers = Array.isArray(p.headers) ? p.headers : [];
      const rows = Array.isArray(p.rows) ? p.rows : [];
      return (
        <section className="space-y-4">
          {typeof p.title === "string" && p.title && (
            <h3
              style={{ fontFamily: tokens.typography.headingFont }}
              className="text-xl font-bold text-nx-fg"
            >
              {p.title}
            </h3>
          )}
          <div
            style={{
              borderRadius: tokens.geometry.borderRadius,
              borderColor: tokens.colors.border,
            }}
            className="overflow-x-auto border bg-nx-card"
          >
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr
                  style={{ backgroundColor: tokens.colors.muted }}
                  className="border-b"
                >
                  {headers.map((h: any, idx: number) => (
                    <th
                      key={idx}
                      className="px-4 py-3 font-semibold text-nx-fg"
                    >
                      {String(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-50/60">
                    {(Array.isArray(row) ? row : []).map(
                      (cell: any, cIdx: number) => (
                        <td
                          key={cIdx}
                          className={`px-4 py-3 ${
                            cIdx === 0
                              ? "font-medium text-nx-fg"
                              : "text-nx-soft"
                          }`}
                        >
                          {String(cell)}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    case "review_box": {
      const rating = Number(p.rating ?? 4.9);
      const pros = Array.isArray(p.pros) ? p.pros : [];
      const cons = Array.isArray(p.cons) ? p.cons : [];
      return (
        <section
          style={{
            borderRadius: tokens.geometry.borderRadius,
            borderColor: tokens.colors.border,
          }}
          className="border bg-nx-card p-6 md:p-8 space-y-6 shadow-xs"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                Editoryal İnceleme & Değerlendirme
              </div>
              <h3
                style={{ fontFamily: tokens.typography.headingFont }}
                className="text-xl font-bold text-nx-fg mt-1"
              >
                {String(p.itemName ?? "Ürün İncelemesi")}
              </h3>
            </div>
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200/80 px-4 py-2.5 rounded-xl">
              <div className="text-2xl font-extrabold text-amber-600">
                {rating.toFixed(1)}
                <span className="text-xs font-normal text-amber-700/80"> / 5.0</span>
              </div>
              <div className="text-amber-500 text-sm tracking-widest">★★★★★</div>
            </div>
          </div>
          {typeof p.verdict === "string" && p.verdict && (
            <p className="text-sm font-medium text-nx-soft leading-relaxed">
              {p.verdict}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/60 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Artılar (Pros)
              </div>
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {pros.map((pr: any, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600">+</span>
                    <span>{String(pr)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-rose-50/60 border border-rose-200/60 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Eksiler (Cons)
              </div>
              <ul className="space-y-1.5 text-xs text-rose-950">
                {cons.map((cn: any, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bold text-rose-600">−</span>
                    <span>{String(cn)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      );
    }

    default:
      return undefined;
  }
}
