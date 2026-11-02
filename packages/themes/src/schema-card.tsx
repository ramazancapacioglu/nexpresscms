import React from "react";
import { featureLines, schemaCardReady, type DesignTokens, type PageSchemaData, type SchemaCardKind } from "@nexpress/core";

const money = (price: string, currency: string, locale: string) => {
  const n = Number(price.replace(",", "."));
  if (!Number.isFinite(n)) return price;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: currency || "TRY", maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
  } catch {
    return `${price} ${currency}`;
  }
};
const LEVEL: Record<string, string> = { Beginner: "Başlangıç", Intermediate: "Orta", Expert: "İleri" };
const AVAIL: Record<string, string> = { InStock: "Stokta", LimitedAvailability: "Sınırlı stok", PreOrder: "Ön sipariş", OutOfStock: "Tükendi" };

/**
 * Şema kartı (RSC): SEO sekmesindeki şema verisini tasarımlı kart olarak gösterir. Veri yoksa (ya da kampanya bittiyse)
 * ziyaretçiye hiçbir şey çizilmez; stüdyoda (`preview`) neyin eksik olduğu söylenir. Sahte değer üretmez.
 */
export function SchemaCardView({ kind, data, tokens, locale = "tr", preview = false }: { kind: SchemaCardKind; data: PageSchemaData | undefined; tokens: DesignTokens; locale?: string; preview?: boolean }) {
  const d: PageSchemaData = data ?? { title: "", tldr: "", rich: {} };
  if (!schemaCardReady(kind, d)) {
    return preview ? (
      <div className="rounded border border-dashed p-4 text-sm opacity-80">
        {kind === "software" && "Yazılım kartı: SEO › Şema sekmesinde (ya da bu bloğun alanlarında) kategori ve işletim sistemi girin."}
        {kind === "offer" && "Kampanya kartı: fiyat ve gelecekteki bir bitiş günü girin. Gün geçince kart kendiliğinden kalkar."}
        {kind === "qa" && "Soru-cevap kartı: QAPage'i etkinleştirin ve TL;DR (en az 20 karakter) yazın."}
        {kind === "tech" && "Teknik künye: bilgi düzeyi veya bağımlılık girin."}
      </div>
    ) : null;
  }
  const box = { borderColor: tokens.colors.border, borderRadius: tokens.geometry.borderRadius, backgroundColor: tokens.colors.muted } as const;
  const chip = "rounded-full border px-2.5 py-0.5 text-xs font-medium";
  const cta = (href: string | undefined, label: string) => href ? <a href={href} style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground, borderRadius: tokens.geometry.borderRadius }} className="inline-flex items-center px-5 py-2.5 text-sm font-semibold">{label}</a> : null;

  if (kind === "software") {
    const sw = d.rich.software!;
    const features = featureLines(sw.features);
    return (
      <section aria-label="Yazılım bilgileri" style={box} className="space-y-4 border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1"><h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl font-bold tracking-tight">{sw.name || d.title}</h2>{d.tldr ? <p className="max-w-xl text-sm opacity-80">{d.tldr}</p> : null}</div>
          {sw.price ? <div className="text-right"><div className="text-2xl font-extrabold" style={{ color: tokens.colors.primary }}>{Number(sw.price.replace(",", ".")) === 0 ? "Ücretsiz" : money(sw.price, sw.currency ?? "TRY", locale)}</div></div> : null}
        </div>
        <ul className="flex flex-wrap gap-2"><li className={chip} style={{ borderColor: tokens.colors.border }}>{sw.category}</li><li className={chip} style={{ borderColor: tokens.colors.border }}>{sw.os}</li>{sw.version ? <li className={chip} style={{ borderColor: tokens.colors.border }}>v{sw.version}</li> : null}</ul>
        {features.length ? <ul className="grid gap-2 sm:grid-cols-2">{features.map((f) => <li key={f} className="flex items-start gap-2 text-sm"><span aria-hidden="true" style={{ color: tokens.colors.primary }}>✓</span><span>{f}</span></li>)}</ul> : null}
        {cta(sw.url, "İndir / Dene")}
      </section>
    );
  }
  if (kind === "offer") {
    const o = d.rich.offer!;
    const until = new Date(o.validThrough!);
    return (
      <section aria-label="Kampanya" style={box} className="flex flex-wrap items-center justify-between gap-4 border p-6">
        <div className="space-y-1"><p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.colors.primary }}>Kampanya</p><h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-xl font-bold">{o.name || d.title}</h2><p className="text-sm opacity-75">Son gün: <time dateTime={until.toISOString().slice(0, 10)}>{new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(until)}</time>{o.availability ? ` • ${AVAIL[o.availability] ?? o.availability}` : ""}</p></div>
        <div className="flex items-center gap-4"><div className="text-3xl font-extrabold" style={{ color: tokens.colors.primary }}>{money(o.price!, o.currency ?? "TRY", locale)}</div>{cta(o.url, "Fırsatı yakala")}</div>
      </section>
    );
  }
  if (kind === "qa") {
    return (
      <section aria-label="Soru ve cevap" style={box} className="space-y-3 border p-6">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.colors.primary }}>Soru</p>
        <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-xl font-bold">{d.title}</h2>
        <p className="text-xs font-bold uppercase tracking-wider opacity-60">Cevap</p>
        <p className="text-base leading-relaxed">{d.tldr}</p>
      </section>
    );
  }
  const t = d.rich.tech!;
  return (
    <aside aria-label="Teknik künye" style={box} className="flex flex-wrap items-center gap-3 border p-4 text-sm">
      {t.level ? <span className={chip} style={{ borderColor: tokens.colors.primary, color: tokens.colors.primary }}>Düzey: {LEVEL[t.level] ?? t.level}</span> : null}
      {t.dependencies ? <span><strong>Gereksinimler:</strong> {t.dependencies}</span> : null}
    </aside>
  );
}
