"use client";

import type { Dispatch, SetStateAction } from "react";

/** `schemaAttributes.richSchema` (Pro eklenti): sunucuda doğrulanır; burada yalnızca düz metin alanları tutulur. */
export interface RichSchemaFields {
  qa?: { enabled?: boolean };
  offer?: { price?: string; currency?: string; validThrough?: string; availability?: string; name?: string; url?: string };
  tech?: { level?: string; dependencies?: string };
  software?: { category?: string; os?: string; version?: string; price?: string; currency?: string; features?: string };
}

const box = "h-8 w-full rounded border border-border bg-background px-2 text-[11px]";
const cap = "block text-[10px] text-muted-foreground mb-1";

function Group({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2 rounded border border-border p-2.5">
      <legend className="px-1 text-[11px] font-semibold">{title}</legend>
      <p className="text-[10px] text-muted-foreground">{hint}</p>
      {children}
    </fieldset>
  );
}

/**
 * Gelişmiş şema türleri. İlgili Pro modül kapalıysa alanlar kaydedilir ama şemaya yazılmaz.
 * Boş bırakılan grup hiçbir şey üretmez; bozuk değerler (fiyat, para birimi, tarih) sunucuda elenir.
 */
export function RichSchemaPanel({ value, onChange }: { value: RichSchemaFields; onChange: Dispatch<SetStateAction<RichSchemaFields>> }) {
  const set = <K extends keyof RichSchemaFields>(group: K, patch: Partial<NonNullable<RichSchemaFields[K]>>) =>
    onChange((cur) => {
      const next = { ...cur, [group]: { ...(cur[group] ?? {}), ...patch } };
      const g = next[group] as Record<string, unknown>;
      if (Object.values(g).every((v) => v === "" || v === false || v === undefined)) delete next[group];
      return next;
    });
  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gelişmiş şema (Pro)</div>
      <Group title="Soru-cevap (QAPage)" hint="Sayfa başlığı soru, TL;DR (en az 20 karakter) cevap olarak işaretlenir.">
        <label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={Boolean(value.qa?.enabled)} onChange={(e) => set("qa", { enabled: e.target.checked })} /> Bu sayfayı QAPage olarak işaretle</label>
      </Group>
      <Group title="Kampanya (Offer)" hint="Bitiş günü geçince teklif işareti kendiliğinden kalkar.">
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
      <Group title="Bilgi bankası (TechArticle)" hint="Şema türü TechArticle iken uygulanır.">
        <div className="grid grid-cols-2 gap-2">
          <div><label className={cap} htmlFor="rs-level">Bilgi düzeyi</label>
            <select id="rs-level" value={value.tech?.level ?? ""} onChange={(e) => set("tech", { level: e.target.value })} className={box}>
              <option value="">Belirtilmedi</option><option value="Beginner">Başlangıç</option><option value="Intermediate">Orta</option><option value="Expert">İleri</option>
            </select></div>
          <div><label className={cap} htmlFor="rs-deps">Bağımlılıklar</label><input id="rs-deps" placeholder="Node.js 20, PostgreSQL 16" value={value.tech?.dependencies ?? ""} onChange={(e) => set("tech", { dependencies: e.target.value })} className={box} /></div>
        </div>
      </Group>
      <Group title="Yazılım / uygulama (SoftwareApplication)" hint="Kategori ve işletim sistemi zorunludur; biri boşsa işaret üretilmez.">
        <div className="grid grid-cols-2 gap-2">
          <div><label className={cap} htmlFor="rs-cat">Kategori</label><input id="rs-cat" placeholder="BusinessApplication" value={value.software?.category ?? ""} onChange={(e) => set("software", { category: e.target.value })} className={box} /></div>
          <div><label className={cap} htmlFor="rs-os">İşletim sistemi</label><input id="rs-os" placeholder="Web, Windows, macOS" value={value.software?.os ?? ""} onChange={(e) => set("software", { os: e.target.value })} className={box} /></div>
          <div><label className={cap} htmlFor="rs-ver">Sürüm</label><input id="rs-ver" value={value.software?.version ?? ""} onChange={(e) => set("software", { version: e.target.value })} className={box} /></div>
          <div className="grid grid-cols-2 gap-2"><div><label className={cap} htmlFor="rs-sp">Fiyat</label><input id="rs-sp" inputMode="decimal" value={value.software?.price ?? ""} onChange={(e) => set("software", { price: e.target.value })} className={box} /></div><div><label className={cap} htmlFor="rs-sc">Birim</label><input id="rs-sc" maxLength={3} value={value.software?.currency ?? ""} onChange={(e) => set("software", { currency: e.target.value.toUpperCase() })} className={box} /></div></div>
        </div>
        <div><label className={cap} htmlFor="rs-feat">Özellikler (her satıra bir tane)</label><textarea id="rs-feat" rows={3} value={value.software?.features ?? ""} onChange={(e) => set("software", { features: e.target.value })} className="w-full rounded border border-border bg-background p-2 text-[11px]" /></div>
      </Group>
    </div>
  );
}
