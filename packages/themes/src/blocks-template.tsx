import React from "react";
import { normalizeDynamicQuery } from "@nexpress/core";
import type { BlockRenderContext } from "./block-context";
import { DynamicListView } from "./dynamic-list";
import { ResponsiveImage } from "./responsive-image";

const alignCls = (a: unknown) => (a === "center" ? "text-center justify-center" : a === "right" ? "text-right justify-end" : "text-left justify-start");

/** Şablon yuva blokları: veriyi `tpl` bağlamından alır; bağlam yoksa (örn. stüdyo önizlemesi) örnek içerik gösterir. */
export function renderTemplateBlock({ block, tokens, tpl, locale }: BlockRenderContext): React.ReactElement | null | undefined {
  if (!block.type.startsWith("tpl_")) return undefined;
  const p = (block.props ?? {}) as Record<string, unknown>;
  const loc = tpl?.locale ?? locale ?? "tr";
  switch (block.type) {
    case "tpl_post_title": {
      const title = tpl?.post?.title ?? tpl?.archive?.title ?? "Sayfa başlığı";
      return <h1 style={{ fontFamily: tokens.typography.headingFont }} className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${alignCls(p.align).split(" ")[0]}`}>{title}</h1>;
    }
    case "tpl_post_content":
      return <div className="nx-post-content">{tpl?.post?.content ?? <p className="rounded border border-dashed p-6 text-sm opacity-70">Sayfanın kendi içeriği burada görünür.</p>}</div>;
    case "tpl_featured_image": {
      const img = tpl?.post ? tpl.post.featuredImage : { url: "", alt: "" };
      if (tpl?.post && !img?.url) return null;
      return (
        <figure className="space-y-2">
          {img?.url ? <ResponsiveImage src={img.url} alt={img.alt} priority className="h-auto w-full object-cover" /> : <div className="flex aspect-[16/9] items-center justify-center rounded border border-dashed text-sm opacity-60">Öne çıkan görsel</div>}
          {img?.caption ? <figcaption className="text-center text-xs italic opacity-70">{img.caption}</figcaption> : null}
        </figure>
      );
    }
    case "tpl_post_meta": {
      const post = tpl?.post;
      const showDate = p.showDate !== false, showAuthor = p.showAuthor !== false, showCats = p.showCategories !== false;
      const date = post ? post.date : new Date().toISOString();
      const when = showDate && date ? new Date(date) : null;
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-75">
          {when && !Number.isNaN(when.getTime()) ? <time dateTime={when.toISOString().slice(0, 10)}>{new Intl.DateTimeFormat(loc, { dateStyle: "long", timeZone: "UTC" }).format(when)}</time> : null}
          {showAuthor && (post?.author ?? "Yazar") ? <span>{post?.author ?? "Yazar adı"}</span> : null}
          {showCats ? <span className="flex flex-wrap gap-2">{(post?.categories ?? [{ name: "Kategori", href: "#" }]).map((c) => <a key={c.href + c.name} href={c.href} className="rounded bg-black/5 px-2 py-0.5 text-xs font-medium hover:bg-black/10">{c.name}</a>)}</span> : null}
        </div>
      );
    }
    case "tpl_breadcrumb": {
      const crumbs = tpl?.breadcrumbs?.length ? tpl.breadcrumbs : [{ name: "Ana sayfa", href: (tpl?.lb ?? `/${loc}`) || "/" }, { name: "Sayfa", href: "#" }];
      return (
        <nav aria-label="Sayfa yolu" className="text-xs opacity-75">
          <ol className="flex flex-wrap items-center gap-1.5">
            {crumbs.map((c, i) => (
              <li key={c.href + i} className="flex items-center gap-1.5">
                {i > 0 ? <span aria-hidden="true">/</span> : null}
                {i === crumbs.length - 1 ? <span aria-current="page">{c.name}</span> : <a href={c.href} className="hover:underline">{c.name}</a>}
              </li>
            ))}
          </ol>
        </nav>
      );
    }
    case "tpl_archive_title": {
      const a = tpl?.archive;
      return (
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{a?.kindLabel ?? "Kategori"}</p>
          <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-3xl font-extrabold tracking-tight">{a?.title ?? "Arşiv başlığı"}</h1>
          {a?.description ? <p className="max-w-2xl text-sm opacity-80">{a.description}</p> : null}
        </header>
      );
    }
    case "tpl_archive_list": {
      const a = tpl?.archive;
      const query = normalizeDynamicQuery({ source: "posts", layout: p.layout, columns: p.columns, showImage: p.showImage, showExcerpt: p.showExcerpt, showDate: p.showDate, emptyText: "Bu başlık altında henüz yayın yok." });
      const sample = [1, 2, 3].map((n) => ({ id: `s${n}`, title: `Örnek yayın ${n}`, url: "#", excerpt: "Yayın özeti burada görünür.", date: new Date().toISOString() }));
      return (
        <div className="space-y-6">
          <DynamicListView query={query} items={a ? a.items : sample} tokens={tokens} locale={loc} />
          {a && a.pages > 1 ? (
            <nav aria-label="Sayfalama" className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
              {a.page > 1 ? <a rel="prev" href={a.pageHref(a.page - 1)} className="underline">← Yeni yayınlar</a> : <span />}
              <span className="opacity-70">Sayfa {a.page} / {a.pages}</span>
              {a.page < a.pages ? <a rel="next" href={a.pageHref(a.page + 1)} className="underline">Eski yayınlar →</a> : <span />}
            </nav>
          ) : null}
        </div>
      );
    }
    case "tpl_site_logo": {
      const s = tpl?.site ?? { name: "Site adı", logoText: "", logoImage: "" };
      const text = s.logoText || s.name;
      return (
        <a href={(tpl?.lb ?? `/${loc}`) || "/"} className={`flex items-center gap-2 ${alignCls(p.align).split(" ")[1] ?? ""}`}>
          {s.logoImage ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.logoImage} alt={text} className="h-8 w-auto" /> : <span style={{ fontFamily: tokens.typography.headingFont }} className="text-lg font-bold tracking-tight">{text}</span>}
        </a>
      );
    }
    case "tpl_menu": {
      const list = p.layout === "list";
      const node = list ? tpl?.menu?.list : tpl?.menu?.horizontal;
      if (!node) return <p className="text-xs opacity-60">Menü burada görünür (Menüler sayfasından düzenlenir).</p>;
      return <div className={`flex ${alignCls(p.align).split(" ")[1] ?? ""}`}>{node}</div>;
    }
    case "tpl_copyright":
      return <p className={`text-xs opacity-70 ${alignCls(p.align).split(" ")[0]}`}>{tpl?.copyright || `© ${new Date().getFullYear()} ${tpl?.site.name ?? "Site"}`}</p>;
    case "tpl_product_buy": {
      const pr = tpl?.product;
      if (!pr) return <div className="rounded border border-dashed p-4 text-sm opacity-70">Fiyat ve satın alma kutusu burada görünür (yalnızca mağaza ürün sayfalarında).</div>;
      return (
        <div className="space-y-4">
          <p className="flex items-baseline gap-3 text-2xl font-extrabold" style={{ color: tokens.colors.primary }}>
            {pr.priceLabel}
            {pr.compareLabel ? <s className="text-base font-normal opacity-50">{pr.compareLabel}</s> : null}
          </p>
          {pr.shortDescription ? <p className="text-sm opacity-80">{pr.shortDescription}</p> : null}
          {!pr.inStock ? (
            <p role="status" className="text-sm font-medium text-red-600">{pr.outOfStockLabel}</p>
          ) : (
            <form action={pr.action} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="productId" value={pr.id} />
              <input type="hidden" name="locale" value={loc} />
              {pr.variants.length > 0 ? (
                <label className="text-sm">Varyasyon<select name="variantId" defaultValue={pr.variants[0]!.id} className="ml-2 rounded border px-2 py-1.5">{pr.variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
              ) : null}
              <label className="text-sm">{pr.quantityLabel}<input name="quantity" type="number" min={1} max={99} defaultValue={1} className="ml-2 w-16 rounded border px-2 py-1.5" /></label>
              <button type="submit" style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground, borderRadius: tokens.geometry.borderRadius }} className="px-6 py-2.5 text-sm font-semibold">{pr.addLabel}</button>
            </form>
          )}
        </div>
      );
    }
    case "tpl_cart_link": {
      const c = tpl?.cart ?? { href: "#", label: "Sepet", count: 0 };
      return <div className={`flex ${alignCls(p.align).split(" ")[1] ?? ""}`}><a href={c.href} className="rounded-full border px-4 py-2 text-sm font-medium">{c.label}{c.count > 0 ? ` (${c.count})` : ""}</a></div>;
    }
    default:
      return null;
  }
}
