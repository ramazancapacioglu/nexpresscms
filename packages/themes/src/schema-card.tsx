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
    const sw = d.rich.software ?? {};
    const features = featureLines(sw.features);
    const modules = featureLines(sw.modules);
    return (
      <section aria-label="Yazılım bilgileri" style={box} className="space-y-4 border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.colors.primary }}>Yazılım Çözümü</span>
              {sw.ratingValue ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  ★ {sw.ratingValue} {sw.ratingCount ? `(${sw.ratingCount} değerlendirme)` : ""}
                </span>
              ) : null}
            </div>
            <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl font-bold tracking-tight">
              {sw.name || d.title}
            </h2>
            {sw.alternateName ? (
              <p className="text-xs text-muted-foreground font-medium">Diğer adlar: {sw.alternateName}</p>
            ) : null}
            {d.tldr ? <p className="max-w-xl text-sm opacity-80">{d.tldr}</p> : null}
          </div>
          {sw.price && Number(sw.price.replace(",", ".")) > 0 ? (
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Başlangıç fiyatı</span>
              <div className="text-2xl font-extrabold" style={{ color: tokens.colors.primary }}>
                {money(sw.price, sw.currency ?? "TRY", locale)}
              </div>
              {sw.license ? <span className="text-xs text-muted-foreground block">{sw.license}</span> : null}
            </div>
          ) : (
            <div className="text-right">
              <div className="text-xl font-bold" style={{ color: tokens.colors.primary }}>
                {sw.license || "Lisanslı / Kurumsal"}
              </div>
            </div>
          )}
        </div>

        {/* Etiketler / Çipler */}
        <ul className="flex flex-wrap gap-2 text-xs">
          {sw.category ? <li className={chip} style={{ borderColor: tokens.colors.border }}>{sw.category}</li> : null}
          {sw.subCategory ? <li className={chip} style={{ borderColor: tokens.colors.border }}>{sw.subCategory}</li> : null}
          {sw.os ? <li className={chip} style={{ borderColor: tokens.colors.border }}>💻 {sw.os}</li> : null}
          {sw.version ? <li className={chip} style={{ borderColor: tokens.colors.border }}>v{sw.version}</li> : null}
          {sw.devices ? <li className={chip} style={{ borderColor: tokens.colors.border }}>📱 {sw.devices}</li> : null}
        </ul>

        {/* Modüller */}
        {modules.length ? (
          <div className="space-y-2 pt-2 border-t border-dashed" style={{ borderColor: tokens.colors.border }}>
            <span className="text-xs font-bold uppercase tracking-wider block opacity-70">Entegre Modüller</span>
            <div className="flex flex-wrap gap-1.5">
              {modules.map((m) => (
                <span key={m} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-background border border-border">
                  ✓ {m}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Özellikler */}
        {features.length ? (
          <div className="space-y-2 pt-2 border-t border-dashed" style={{ borderColor: tokens.colors.border }}>
            <span className="text-xs font-bold uppercase tracking-wider block opacity-70">Öne Çıkan Özellikler</span>
            <ul className="grid gap-2 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span aria-hidden="true" style={{ color: tokens.colors.primary }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Sistem Gereksinimleri */}
        {sw.requirements ? (
          <div className="text-xs opacity-75 pt-1">
            <strong>Sistem Gereksinimleri:</strong> {sw.requirements}
          </div>
        ) : null}

        {/* Butonlar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {cta(sw.demoUrl || "/tr/demo-talebi", "Canlı Demo Talebi")}
          {sw.url && sw.url !== sw.demoUrl ? (
            <a href={sw.url} className="inline-flex items-center px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted/50">
              Detaylı Bilgi & Fiyat Teklifi →
            </a>
          ) : null}
        </div>
      </section>
    );
  }

  if (kind === "offer") {
    const o = d.rich.offer ?? {};
    const until = o.validThrough ? new Date(o.validThrough) : null;
    const isExpired = until && !Number.isNaN(until.getTime()) && until.getTime() < Date.now();
    return (
      <section aria-label="Kampanya" style={box} className="space-y-4 border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.colors.primary }}>
                {o.badge || "Özel Kampanya"}
              </span>
              {isExpired ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                  Kampanya Sona Erdi
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Aktif Fırsat
                </span>
              )}
            </div>
            <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl font-bold">
              {o.name || d.title}
            </h2>
            {until && !Number.isNaN(until.getTime()) ? (
              <p className="text-xs text-muted-foreground">
                Son geçerlilik tarihi: <time dateTime={until.toISOString().slice(0, 10)}>{new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(until)}</time>
                {o.availability ? ` • ${AVAIL[o.availability] ?? o.availability}` : ""}
              </p>
            ) : null}
          </div>

          <div className="text-right">
            {o.discount ? (
              <div className="inline-block px-3 py-1 rounded-lg font-extrabold text-lg text-white mb-1 shadow-xs" style={{ backgroundColor: tokens.colors.primary }}>
                {o.discount}
              </div>
            ) : null}
            {o.price && Number(o.price.replace(",", ".")) > 0 ? (
              <div className="text-2xl font-extrabold" style={{ color: tokens.colors.primary }}>
                {money(o.price, o.currency ?? "TRY", locale)}
              </div>
            ) : null}
          </div>
        </div>

        {/* Hediye ve Hedef Ürün */}
        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-dashed" style={{ borderColor: tokens.colors.border }}>
          {o.gift ? (
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-xs font-bold uppercase tracking-wider block text-amber-700">🎁 Hediye & Avantaj</span>
              <p className="text-sm font-medium">{o.gift}</p>
            </div>
          ) : null}
          {o.targetProduct ? (
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-xs font-bold uppercase tracking-wider block opacity-70">Hedef Ürün</span>
              {o.targetProductUrl ? (
                <a href={o.targetProductUrl} className="text-sm font-semibold hover:underline" style={{ color: tokens.colors.primary }}>
                  {o.targetProduct} →
                </a>
              ) : (
                <p className="text-sm font-medium">{o.targetProduct}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Şartlar ve Kupon Kodu */}
        {o.terms ? (
          <p className="text-xs opacity-75">
            <strong>Kampanya Şartları:</strong> {o.terms}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {o.couponCode ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-primary bg-primary/5 text-xs">
              <span className="opacity-70">Kupon Kodu:</span>
              <strong className="font-mono text-sm tracking-wide text-primary">{o.couponCode}</strong>
            </div>
          ) : <div />}
          {cta(o.url || "/tr/iletisim", "Fırsattan Yararlanın / Teklif Al")}
        </div>
      </section>
    );
  }

  if (kind === "qa") {
    const q = d.rich.qa ?? {};
    const shortAns = q.shortAnswer || d.tldr;
    return (
      <section aria-label="Soru ve uzman cevabı" style={box} className="space-y-4 border p-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {q.category || "Uzman Soru & Cevap"}
            </span>
            {q.upvotes ? (
              <span className="text-xs opacity-75">👍 {q.upvotes} kişi faydalı buldu</span>
            ) : null}
          </div>
          <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl font-bold tracking-tight">
            {d.title}
          </h2>
          {q.author ? (
            <p className="text-xs opacity-75">Cevaplayan: <strong>{q.author}</strong></p>
          ) : null}
        </div>

        {/* Öne Çıkan Kısa Cevap Kutusu (Featured Snippet) */}
        {shortAns ? (
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-4 space-y-1.5 dark:bg-blue-950/30 dark:border-blue-800/60">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
              <span>✓ Doğrudan Uzman Özeti</span>
            </div>
            <p className="text-sm leading-relaxed text-blue-950 dark:text-blue-100 font-medium">
              {shortAns}
            </p>
          </div>
        ) : null}

        {/* Detaylı Açıklama */}
        {q.detail ? (
          <div className="space-y-1 text-sm leading-relaxed opacity-90 pt-2 border-t border-dashed" style={{ borderColor: tokens.colors.border }}>
            <span className="text-xs font-bold uppercase tracking-wider block opacity-70">Detaylı Açıklama & Mevzuat</span>
            <p>{q.detail}</p>
          </div>
        ) : null}

        {/* İlgili Alt Sorular */}
        {Array.isArray(q.faqList) && q.faqList.length > 0 ? (
          <div className="space-y-2 pt-2 border-t border-dashed" style={{ borderColor: tokens.colors.border }}>
            <span className="text-xs font-bold uppercase tracking-wider block opacity-70">Bu Konuyla İlgili Sık Sorulanlar</span>
            <div className="space-y-2">
              {q.faqList.map((item, idx) => (
                <details key={idx} className="group rounded-lg border border-border bg-background p-3 text-sm">
                  <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                    <span>{item.question}</span>
                    <span className="text-xs opacity-60 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-2 text-xs opacity-85 leading-relaxed pl-2 border-l-2 border-primary/40">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  const t = d.rich.tech ?? {};
  return (
    <aside aria-label="Teknik künye" style={box} className="space-y-3 border p-5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.colors.primary }}>Teknik Dokümantasyon</span>
        {t.level ? <span className={chip} style={{ borderColor: tokens.colors.primary, color: tokens.colors.primary }}>Düzey: {LEVEL[t.level] ?? t.level}</span> : null}
      </div>
      {t.architecture ? <div className="text-xs"><strong>Mimari:</strong> {t.architecture}</div> : null}
      {t.prerequisites ? <div className="text-xs"><strong>Ön Koşullar:</strong> {t.prerequisites}</div> : null}
      {t.dependencies ? <div className="text-xs"><strong>Gereksinimler / Bağımlılıklar:</strong> {t.dependencies}</div> : null}
    </aside>
  );
}
