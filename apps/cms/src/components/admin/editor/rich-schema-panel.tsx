"use client";

import type { Dispatch, SetStateAction } from "react";

/** `schemaAttributes.richSchema`: sayfa/içerik bazlı yapılandırılmış veri alanları (sunucuda JSON-LD `@graph`'a derlenir). */
export interface RichSchemaFields {
  qa?: { enabled?: boolean; upvotes?: number | string; question?: string; shortAnswer?: string; detail?: string; about?: string; audience?: string; areaServed?: string; serviceType?: string; productUrl?: string };
  offer?: { price?: string; currency?: string; validThrough?: string; availability?: string; name?: string; url?: string };
  tech?: { level?: string; dependencies?: string; teaches?: string; aboutSoftwareName?: string; aboutSoftwareUrl?: string; reviewedBy?: string; lastReviewed?: string; citations?: string };
  software?: { name?: string; url?: string; category?: string; os?: string; version?: string; price?: string; currency?: string; features?: string; subCategory?: string; requirements?: string };
  service?: { serviceType?: string; areaServed?: string; audience?: string; priceRange?: string };
  product?: { brand?: string; sku?: string; gtin?: string; price?: string; currency?: string; availability?: string };
  article?: { articleSection?: string; keywords?: string };
  speakable?: boolean;
  about?: string;
}

const box = "h-8 w-full rounded border border-border bg-background px-2 text-[11px]";
const cap = "block text-[10px] text-muted-foreground mb-1";

function Group({ title, hint, badge, children }: { title: string; hint: string; badge?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2 rounded border border-border p-2.5">
      <legend className="flex items-center gap-1.5 px-1 text-[11px] font-semibold">
        <span>{title}</span>
        {badge && <span className="rounded bg-blue-600/15 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:text-blue-300">{badge}</span>}
      </legend>
      <p className="text-[10px] text-muted-foreground">{hint}</p>
      {children}
    </fieldset>
  );
}

type GroupKey = "qa" | "offer" | "tech" | "software" | "service" | "product" | "article";

function primaryGroupFor(schemaType?: string): GroupKey | null {
  switch (schemaType) {
    case "SoftwareApplication": return "software";
    case "QAPage": return "qa";
    case "Offer": return "offer";
    case "TechArticle": return "tech";
    case "Service":
    case "LocalBusiness": return "service";
    case "Product": return "product";
    case "Article":
    case "BlogPosting":
    case "NewsArticle": return "article";
    default: return null;
  }
}

function hasData(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  return Object.values(v as Record<string, unknown>).some((x) => x !== "" && x !== false && x !== undefined && x !== null);
}

/**
 * Sayfa/içerik bazlı şema alanları. Seçili şema türüne göre ilgili alanlar otomatik öne çıkar;
 * mevcut dolu gruplar her zaman görünür kalır. Tüm veriler canlı JSON-LD `@graph` çıktısına doğrudan işlenir.
 */
export function RichSchemaPanel({
  value,
  onChange,
  only,
  schemaType,
}: {
  value: RichSchemaFields;
  onChange: Dispatch<SetStateAction<RichSchemaFields>>;
  only?: "qa" | "offer" | "tech" | "software";
  schemaType?: string;
}) {
  const primary = primaryGroupFor(schemaType);

  const set = <K extends GroupKey>(group: K, patch: Partial<NonNullable<RichSchemaFields[K]>>) =>
    onChange((cur) => {
      const next = { ...cur, [group]: { ...(cur[group] ?? {}), ...patch } };
      const g = next[group] as Record<string, unknown>;
      if (Object.values(g).every((v) => v === "" || v === false || v === undefined)) delete next[group];
      return next;
    });

  const setRoot = (patch: Partial<Pick<RichSchemaFields, "speakable" | "about">>) =>
    onChange((cur) => {
      const next = { ...cur, ...patch };
      if (!next.speakable) delete next.speakable;
      if (!next.about?.trim()) delete next.about;
      return next;
    });

  const renderGroup = (k: GroupKey) => {
    const isPrimary = primary === k;
    const filled = hasData(value[k]);
    const badge = isPrimary ? "Aktif Tür" : filled ? "Veri Var" : undefined;

    if (k === "software") {
      return (
        <Group key="software" title="Yazılım / Uygulama (SoftwareApplication)" badge={badge} hint="Kategori ve işletim sistemi canlı JSON-LD düğümüne doğrudan işlenir.">
          <div><label className={cap} htmlFor="rs-name">Uygulama adı <span className="font-normal text-muted-foreground">(boşsa sayfa başlığı)</span></label><input id="rs-name" value={value.software?.name ?? ""} onChange={(e) => set("software", { name: e.target.value })} className={box} /></div>
          <div><label className={cap} htmlFor="rs-url">İndirme / demo adresi</label><input id="rs-url" placeholder="https://…" value={value.software?.url ?? ""} onChange={(e) => set("software", { url: e.target.value })} className={`${box} font-mono`} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={cap} htmlFor="rs-cat">Kategori</label><input id="rs-cat" placeholder="BusinessApplication" value={value.software?.category ?? ""} onChange={(e) => set("software", { category: e.target.value })} className={box} /></div>
            <div><label className={cap} htmlFor="rs-os">İşletim sistemi</label><input id="rs-os" placeholder="Windows, Web, Android" value={value.software?.os ?? ""} onChange={(e) => set("software", { os: e.target.value })} className={box} /></div>
            <div><label className={cap} htmlFor="rs-ver">Sürüm</label><input id="rs-ver" value={value.software?.version ?? ""} onChange={(e) => set("software", { version: e.target.value })} className={box} /></div>
            <div className="grid grid-cols-2 gap-1.5">
              <div><label className={cap} htmlFor="rs-sp">Fiyat</label><input id="rs-sp" inputMode="decimal" value={value.software?.price ?? ""} onChange={(e) => set("software", { price: e.target.value })} className={box} /></div>
              <div><label className={cap} htmlFor="rs-sc">Birim</label><input id="rs-sc" maxLength={3} placeholder="TRY" value={value.software?.currency ?? ""} onChange={(e) => set("software", { currency: e.target.value.toUpperCase() })} className={box} /></div>
            </div>
          </div>
          <div><label className={cap} htmlFor="rs-feat">Özellikler (her satıra bir tane)</label><textarea id="rs-feat" rows={3} value={value.software?.features ?? ""} onChange={(e) => set("software", { features: e.target.value })} className="w-full rounded border border-border bg-background p-2 text-[11px]" /></div>
        </Group>
      );
    }

    if (k === "service") {
      return (
        <Group key="service" title="Hizmet (Service)" badge={badge} hint="Kurulum, danışmanlık ve yerel hizmet sayfaları için Schema.org Service alanları.">
          <div className="grid grid-cols-2 gap-2">
            <div><label className={cap} htmlFor="rs-stype">Hizmet türü</label><input id="rs-stype" placeholder="ERP Kurulum ve Destek" value={value.service?.serviceType ?? ""} onChange={(e) => set("service", { serviceType: e.target.value })} className={box} /></div>
            <div><label className={cap} htmlFor="rs-sarea">Hizmet bölgesi</label><input id="rs-sarea" placeholder="İzmir, Türkiye" value={value.service?.areaServed ?? ""} onChange={(e) => set("service", { areaServed: e.target.value })} className={box} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={cap} htmlFor="rs-saud">Hedef kitle</label><input id="rs-saud" placeholder="KOBİ ve Kurumsal İşletmeler" value={value.service?.audience ?? ""} onChange={(e) => set("service", { audience: e.target.value })} className={box} /></div>
            <div><label className={cap} htmlFor="rs-sprice">Fiyat aralığı</label><input id="rs-sprice" placeholder="₺₺" value={value.service?.priceRange ?? ""} onChange={(e) => set("service", { priceRange: e.target.value })} className={box} /></div>
          </div>
        </Group>
      );
    }

    if (k === "product") {
      return (
        <Group key="product" title="Ürün (Product)" badge={badge} hint="Marka, SKU, GTIN ve fiyat bilgileri Product JSON-LD düğümüne işlenir.">
          <div className="grid grid-cols-3 gap-2">
            <div><label className={cap} htmlFor="rs-pbrand">Marka</label><input id="rs-pbrand" placeholder="Akınsoft" value={value.product?.brand ?? ""} onChange={(e) => set("product", { brand: e.target.value })} className={box} /></div>
            <div><label className={cap} htmlFor="rs-psku">SKU</label><input id="rs-psku" value={value.product?.sku ?? ""} onChange={(e) => set("product", { sku: e.target.value })} className={box} /></div>
            <div><label className={cap} htmlFor="rs-pgtin">GTIN / Barkod</label><input id="rs-pgtin" value={value.product?.gtin ?? ""} onChange={(e) => set("product", { gtin: e.target.value })} className={box} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={cap} htmlFor="rs-pprice">Fiyat</label><input id="rs-pprice" inputMode="decimal" value={value.product?.price ?? ""} onChange={(e) => set("product", { price: e.target.value })} className={box} /></div>
            <div><label className={cap} htmlFor="rs-pcur">Para birimi</label><input id="rs-pcur" maxLength={3} placeholder="TRY" value={value.product?.currency ?? ""} onChange={(e) => set("product", { currency: e.target.value.toUpperCase() })} className={box} /></div>
            <div>
              <label className={cap} htmlFor="rs-pavail">Stok</label>
              <select id="rs-pavail" value={value.product?.availability ?? "InStock"} onChange={(e) => set("product", { availability: e.target.value })} className={box}>
                <option value="InStock">Stokta</option><option value="LimitedAvailability">Sınırlı</option><option value="PreOrder">Ön sipariş</option><option value="OutOfStock">Tükendi</option>
              </select>
            </div>
          </div>
        </Group>
      );
    }

    if (k === "article") {
      return (
        <Group key="article" title="Makale / Yazı (Article & BlogPosting)" badge={badge} hint="Bölüm adı ve anahtar kelimeler makale şemasına doğrudan eklenir.">
          <div className="grid grid-cols-2 gap-2">
            <div><label className={cap} htmlFor="rs-asec">Bölüm (articleSection)</label><input id="rs-asec" placeholder="e-Dönüşüm, ERP" value={value.article?.articleSection ?? ""} onChange={(e) => set("article", { articleSection: e.target.value })} className={box} /></div>
            <div><label className={cap} htmlFor="rs-akw">Anahtar kelimeler</label><input id="rs-akw" placeholder="e-fatura, wolvox, erp" value={value.article?.keywords ?? ""} onChange={(e) => set("article", { keywords: e.target.value })} className={box} /></div>
          </div>
        </Group>
      );
    }

    if (k === "qa") {
      return (
        <Group key="qa" title="Soru-cevap detayları (QAPage)" badge={badge} hint="Her alan sayfada ve şemada kendi yerine yazılır: soru, cevap, açıklama, künye.">
          <label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={Boolean(value.qa?.enabled)} onChange={(e) => set("qa", { enabled: e.target.checked })} /> Bu sayfayı QAPage olarak işaretle</label>
          {value.qa?.enabled ? (
            <>
              <div><label className={cap} htmlFor="rs-q">Soru (Question)</label><textarea id="rs-q" rows={2} maxLength={300} placeholder="E-Fatura kesildiğini nasıl anlarız?" value={value.qa?.question ?? ""} onChange={(e) => set("qa", { question: e.target.value })} className="w-full rounded border border-border bg-background px-2 py-1 text-[11px]" /></div>
              <div><label className={cap} htmlFor="rs-sa">Cevap (Answer) <span className="font-normal">— kısa, doğrudan; şemada kabul edilen cevap</span></label><textarea id="rs-sa" rows={3} maxLength={600} value={value.qa?.shortAnswer ?? ""} onChange={(e) => set("qa", { shortAnswer: e.target.value })} className="w-full rounded border border-border bg-background px-2 py-1 text-[11px]" /></div>
              <div><label className={cap} htmlFor="rs-sd">Açıklama (Description) <span className="font-normal">— ayrıntı</span></label><textarea id="rs-sd" rows={4} maxLength={3000} value={value.qa?.detail ?? ""} onChange={(e) => set("qa", { detail: e.target.value })} className="w-full rounded border border-border bg-background px-2 py-1 text-[11px]" /></div>
              <div className="grid grid-cols-[1fr_6rem] gap-2">
                <div><label className={cap} htmlFor="rs-about">Hakkında (About)</label><input id="rs-about" maxLength={160} value={value.qa?.about ?? ""} onChange={(e) => set("qa", { about: e.target.value })} className={box} /></div>
                <div><label className={cap} htmlFor="rs-votes">Oy sayısı</label><input id="rs-votes" type="number" min={0} max={1000000} value={value.qa?.upvotes ?? ""} onChange={(e) => set("qa", { upvotes: e.target.value === "" ? "" : Number(e.target.value) })} className={box} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={cap} htmlFor="rs-area">Hizmet bölgesi</label><input id="rs-area" maxLength={80} placeholder="TR" value={value.qa?.areaServed ?? ""} onChange={(e) => set("qa", { areaServed: e.target.value })} className={box} /></div>
                <div><label className={cap} htmlFor="rs-type">Hizmet tipi</label><input id="rs-type" maxLength={120} placeholder="ERP yazılımı" value={value.qa?.serviceType ?? ""} onChange={(e) => set("qa", { serviceType: e.target.value })} className={box} /></div>
              </div>
              <div><label className={cap} htmlFor="rs-aud">Hedef kitle</label><input id="rs-aud" maxLength={160} value={value.qa?.audience ?? ""} onChange={(e) => set("qa", { audience: e.target.value })} className={box} /></div>
              <div><label className={cap} htmlFor="rs-prod">Referans URL</label><input id="rs-prod" placeholder="/wolvox-erp" value={value.qa?.productUrl ?? ""} onChange={(e) => set("qa", { productUrl: e.target.value })} className={`${box} font-mono`} /></div>
            </>
          ) : null}
        </Group>
      );
    }

    if (k === "offer") {
      return (
        <Group key="offer" title="Kampanya / Teklif (Offer)" badge={badge} hint="Bitiş günü geçince teklif işareti kendiliğinden kalkar.">
          <div className="grid grid-cols-3 gap-2">
            <div><label className={cap} htmlFor="rs-price">Fiyat</label><input id="rs-price" inputMode="decimal" placeholder="99,90" value={value.offer?.price ?? ""} onChange={(e) => set("offer", { price: e.target.value })} className={box} /></div>
            <div><label className={cap} htmlFor="rs-cur">Para birimi</label><input id="rs-cur" maxLength={3} placeholder="TRY" value={value.offer?.currency ?? ""} onChange={(e) => set("offer", { currency: e.target.value.toUpperCase() })} className={box} /></div>
            <div><label className={cap} htmlFor="rs-until">Bitiş günü</label><input id="rs-until" type="date" value={value.offer?.validThrough ?? ""} onChange={(e) => set("offer", { validThrough: e.target.value })} className={box} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={cap} htmlFor="rs-avail">Stok durumu</label>
              <select id="rs-avail" value={value.offer?.availability ?? "InStock"} onChange={(e) => set("offer", { availability: e.target.value })} className={box}>
                <option value="InStock">Stokta</option><option value="LimitedAvailability">Sınırlı</option><option value="PreOrder">Ön sipariş</option><option value="OutOfStock">Tükendi</option>
              </select></div>
            <div><label className={cap} htmlFor="rs-offer-name">Teklif adı</label><input id="rs-offer-name" value={value.offer?.name ?? ""} onChange={(e) => set("offer", { name: e.target.value })} className={box} /></div>
          </div>
        </Group>
      );
    }

    return (
      <Group key="tech" title="Teknik Rehber (TechArticle)" badge={badge} hint="Şema türü TechArticle iken uygulanır; sayfa üstünde teknik künye ve WebPage inceleme bilgisi üretir.">
        <div className="grid grid-cols-2 gap-2">
          <div><label className={cap} htmlFor="rs-level">Bilgi düzeyi</label>
            <select id="rs-level" value={value.tech?.level ?? ""} onChange={(e) => set("tech", { level: e.target.value })} className={box}>
              <option value="">Belirtilmedi</option><option value="Beginner">Başlangıç</option><option value="Intermediate">Orta</option><option value="Expert">İleri</option>
            </select></div>
          <div><label className={cap} htmlFor="rs-deps">Ön koşullar / Bağımlılıklar</label><input id="rs-deps" placeholder="Wolvox ERP, Windows 11" value={value.tech?.dependencies ?? ""} onChange={(e) => set("tech", { dependencies: e.target.value })} className={box} /></div>
          <div><label className={cap} htmlFor="rs-sw-name">İlgili yazılım adı</label><input id="rs-sw-name" placeholder="Akınsoft Wolvox ERP" value={value.tech?.aboutSoftwareName ?? ""} onChange={(e) => set("tech", { aboutSoftwareName: e.target.value })} className={box} /></div>
          <div><label className={cap} htmlFor="rs-sw-url">İlgili yazılım adresi</label><input id="rs-sw-url" placeholder="/wolvox-erp" value={value.tech?.aboutSoftwareUrl ?? ""} onChange={(e) => set("tech", { aboutSoftwareUrl: e.target.value })} className={box} /></div>
          <div><label className={cap} htmlFor="rs-rev-by">İnceleyen uzman</label><input id="rs-rev-by" placeholder="Ramazan Çapacıoğlu" value={value.tech?.reviewedBy ?? ""} onChange={(e) => set("tech", { reviewedBy: e.target.value })} className={box} /></div>
          <div><label className={cap} htmlFor="rs-rev-at">Son kontrol tarihi</label><input id="rs-rev-at" type="date" value={value.tech?.lastReviewed ?? ""} onChange={(e) => set("tech", { lastReviewed: e.target.value })} className={box} /></div>
        </div>
        <div><label className={cap} htmlFor="rs-teaches">Öğrenme kazanımları (her satıra bir madde)</label><textarea id="rs-teaches" rows={2} placeholder="Sunucu bağlantısı kurma&#10;İstemci ayarları" value={value.tech?.teaches ?? ""} onChange={(e) => set("tech", { teaches: e.target.value })} className="w-full rounded border border-border bg-background p-2 text-[11px]" /></div>
        <div><label className={cap} htmlFor="rs-cites">Resmî kaynaklar (her satıra bir URL)</label><textarea id="rs-cites" rows={2} placeholder="https://ebelge.gib.gov.tr/..." value={value.tech?.citations ?? ""} onChange={(e) => set("tech", { citations: e.target.value })} className="w-full rounded border border-border bg-background p-2 text-[11px] font-mono" /></div>
      </Group>
    );
  };

  if (only) return <div className="space-y-2.5">{renderGroup(only)}</div>;

  const allGroups: GroupKey[] = ["software", "service", "product", "article", "qa", "offer", "tech"];
  const visibleGroups = allGroups.filter((k) => k === primary || hasData(value[k]));
  const hiddenGroups = allGroups.filter((k) => !visibleGroups.includes(k));

  return (
    <div className="space-y-2.5">
      {/* Sayfa Bazlı GEO / AI Varlık Alanları */}
      <fieldset className="space-y-2 rounded border border-border bg-muted/20 p-2.5">
        <legend className="px-1 text-[11px] font-semibold">GEO &amp; AI İşaretleme</legend>
        <label className="flex items-center gap-2 text-[11px]">
          <input
            type="checkbox"
            checked={Boolean(value.speakable)}
            onChange={(e) => setRoot({ speakable: e.target.checked })}
          />
          <span>SpeakableSpecification ekle (AI &amp; sesli arama alıntısı)</span>
        </label>
        <div>
          <label className={cap} htmlFor="rs-root-about">Hakkında / Varlıklar (virgülle ayırın)</label>
          <input
            id="rs-root-about"
            placeholder="Örn: Akınsoft, Wolvox ERP, e-Fatura"
            value={value.about ?? ""}
            onChange={(e) => setRoot({ about: e.target.value })}
            className={box}
          />
        </div>
      </fieldset>

      {visibleGroups.map((k) => renderGroup(k))}

      {hiddenGroups.length > 0 && (
        <details className="rounded border border-dashed border-border p-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            Diğer şema alanlarını göster ({hiddenGroups.length})
          </summary>
          <div className="mt-2.5 space-y-2.5">{hiddenGroups.map((k) => renderGroup(k))}</div>
        </details>
      )}
    </div>
  );
}
