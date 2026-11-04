"use client";

import React from "react";
import { useStudioInspector } from "./studio-inspector-context";
import {
  LayoutGrid,
  SlidersHorizontal,
  Sparkles,
  Megaphone,
  CheckCircle2,
  Calendar,
  Percent,
  Gift,
  Phone,
  MessageCircle,
} from "lucide-react";

const box =
  "h-8 w-full rounded border border-border bg-background px-2.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary";
const cap = "mb-1 block text-[11px] font-medium text-muted-foreground";

/**
 * Kampanya Vitrini Bloğu Özelleştirme Alanları (`campaign_showcase`):
 * - Gösterim modu: Karosel/Slide, Izgara (Grid), Öne Çıkan Vitrin (Spotlight), İndirim Şeridi (Ticker)
 * - 0-KB RSC mimarisiyle %100 uyumlu CSS snap scroll veya ızgara kontrolü
 * - İndirim rozeti, geri sayım sayacı, hediye bilgisi, WhatsApp ve teklif butonları
 */
export function CampaignShowcaseFields() {
  const { selectedBlock, updateSelectedBlockProps } = useStudioInspector();
  if (!selectedBlock) return null;

  const p = selectedBlock.props ?? {};
  const set = (patch: Record<string, unknown>) => updateSelectedBlockProps(patch);

  const heading = String(p.heading ?? "Özel Kampanyalar & Fırsatlar");
  const subheading = String(p.subheading ?? "");
  const layout = String(p.layout ?? "carousel");
  const columns = Number(p.columns ?? 3);
  const limit = Number(p.limit ?? 6);
  const filter = String(p.filter ?? "active");
  const showDiscountBadge = p.showDiscountBadge !== false;
  const showCountdown = p.showCountdown !== false;
  const showGift = p.showGift !== false;
  const showCta = p.showCta !== false;
  const showWhatsapp = Boolean(p.showWhatsapp);
  const showPhone = Boolean(p.showPhone);
  const emptyText = String(
    p.emptyText ?? "Şu anda yayında aktif bir kampanya bulunmamaktadır."
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/20 text-[11px] leading-relaxed text-blue-900 dark:text-blue-200">
        <div className="flex items-center gap-1.5 font-bold mb-0.5">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>Dinamik Kampanya Vitrini</span>
        </div>
        Bu blok; yayındaki aktif kampanyaları (indirim oranları, geri sayım süresi, hediyeler) seçtiğiniz düzende 0-KB istemci JS ile hızlıca sunar.
      </div>

      {/* Başlık & Alt Başlık */}
      <div className="space-y-2">
        <div>
          <label className={cap} htmlFor="cs-heading">
            Bölüm Başlığı
          </label>
          <input
            id="cs-heading"
            className={box}
            value={heading}
            maxLength={100}
            onChange={(e) => set({ heading: e.target.value })}
            placeholder="Özel Kampanyalar & Fırsatlar"
          />
        </div>
        <div>
          <label className={cap} htmlFor="cs-subheading">
            Alt Başlık / Açıklama
          </label>
          <input
            id="cs-subheading"
            className={box}
            value={subheading}
            maxLength={160}
            onChange={(e) => set({ subheading: e.target.value })}
            placeholder="Sınırlı süre geçerli indirim ve avantajları kaçırmayın"
          />
        </div>
      </div>

      {/* Gösterim Düzeni Seçimi */}
      <div>
        <label className={cap}>Gösterim Düzeni (Yerleşim)</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => set({ layout: "carousel" })}
            className={`flex items-center gap-2 rounded-lg border p-2 text-left text-[11px] font-medium transition ${
              layout === "carousel"
                ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
            <div>
              <div className="font-semibold">Karosel / Slide</div>
              <div className="text-[10px] opacity-75">Yatay kaydırmalı</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => set({ layout: "grid" })}
            className={`flex items-center gap-2 rounded-lg border p-2 text-left text-[11px] font-medium transition ${
              layout === "grid"
                ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
            <div>
              <div className="font-semibold">Izgara (Grid)</div>
              <div className="text-[10px] opacity-75">2–4 sütun kartlar</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => set({ layout: "spotlight" })}
            className={`flex items-center gap-2 rounded-lg border p-2 text-left text-[11px] font-medium transition ${
              layout === "spotlight"
                ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <div>
              <div className="font-semibold">Vitrin Kartı</div>
              <div className="text-[10px] opacity-75">Geniş öne çıkan</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => set({ layout: "ticker" })}
            className={`flex items-center gap-2 rounded-lg border p-2 text-left text-[11px] font-medium transition ${
              layout === "ticker"
                ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Megaphone className="h-3.5 w-3.5 shrink-0" />
            <div>
              <div className="font-semibold">İndirim Şeridi</div>
              <div className="text-[10px] opacity-75">Duyuru bandı</div>
            </div>
          </button>
        </div>
      </div>

      {/* Sütun Sayısı ve Kampanya Adedi */}
      <div className="grid grid-cols-2 gap-2">
        {(layout === "carousel" || layout === "grid") && (
          <div>
            <label className={cap} htmlFor="cs-cols">
              Sütun Sayısı
            </label>
            <select
              id="cs-cols"
              className={box}
              value={columns}
              onChange={(e) => set({ columns: Number(e.target.value) })}
            >
              <option value={2}>2 Sütun (Geniş)</option>
              <option value={3}>3 Sütun (Standart)</option>
              <option value={4}>4 Sütun (Kompakt)</option>
            </select>
          </div>
        )}

        <div className={layout !== "carousel" && layout !== "grid" ? "col-span-2" : ""}>
          <label className={cap} htmlFor="cs-limit">
            Kampanya Limiti (1–12)
          </label>
          <input
            id="cs-limit"
            type="number"
            min={1}
            max={12}
            className={box}
            value={limit}
            onChange={(e) => set({ limit: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Filtreleme */}
      <div>
        <label className={cap} htmlFor="cs-filter">
          Filtre Kuralı
        </label>
        <select
          id="cs-filter"
          className={box}
          value={filter}
          onChange={(e) => set({ filter: e.target.value })}
        >
          <option value="active">Yalnızca Aktif Kampanyalar (Sona erenler gizlenir)</option>
          <option value="all">Tüm Kampanyalar (Geçmiş kampanyalar dahil)</option>
        </select>
      </div>

      {/* Kart Görünüm Bileşenleri & Seçenekleri */}
      <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
        <div className="text-[11px] font-bold text-foreground mb-1">
          Kart Görünüm Seçenekleri
        </div>

        <label className="flex items-center gap-2 text-[12px] cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={showDiscountBadge}
            onChange={(e) => set({ showDiscountBadge: e.target.checked })}
          />
          <Percent className="h-3.5 w-3.5 text-blue-600" />
          <span>İndirim Rozetini Göster (örn: %40)</span>
        </label>

        <label className="flex items-center gap-2 text-[12px] cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={showCountdown}
            onChange={(e) => set({ showCountdown: e.target.checked })}
          />
          <Calendar className="h-3.5 w-3.5 text-amber-600" />
          <span>Kalan Gün Sayacını Göster (örn: 27 gün kaldı)</span>
        </label>

        <label className="flex items-center gap-2 text-[12px] cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={showGift}
            onChange={(e) => set({ showGift: e.target.checked })}
          />
          <Gift className="h-3.5 w-3.5 text-emerald-600" />
          <span>Hediye & Bonus Bilgisini Göster</span>
        </label>

        <label className="flex items-center gap-2 text-[12px] cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={showCta}
            onChange={(e) => set({ showCta: e.target.checked })}
          />
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
          <span>Başvuru / Teklif Al Butonunu Göster</span>
        </label>

        <label className="flex items-center gap-2 text-[12px] cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={showWhatsapp}
            onChange={(e) => set({ showWhatsapp: e.target.checked })}
          />
          <MessageCircle className="h-3.5 w-3.5 text-green-600" />
          <span>Hızlı WhatsApp İletişim Butonunu Göster</span>
        </label>

        <label className="flex items-center gap-2 text-[12px] cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={showPhone}
            onChange={(e) => set({ showPhone: e.target.checked })}
          />
          <Phone className="h-3.5 w-3.5 text-indigo-600" />
          <span>Doğrudan Telefon Arama Butonunu Göster</span>
        </label>
      </div>

      {/* Boş Durum Metni */}
      <div>
        <label className={cap} htmlFor="cs-empty">
          Kampanya Yoksa Gösterilecek Not (Boşsa blok gizlenir)
        </label>
        <input
          id="cs-empty"
          className={box}
          value={emptyText}
          maxLength={160}
          onChange={(e) => set({ emptyText: e.target.value })}
        />
      </div>
    </div>
  );
}
