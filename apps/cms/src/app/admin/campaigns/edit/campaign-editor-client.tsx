"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Megaphone,
  Tag,
  Gift,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Search,
  Eye,
  CheckCircle2,
  HelpCircle,
  FileText,
  Phone,
  MessageCircle,
  Clock,
} from "lucide-react";
import type { ResolvedCampaign } from "@nexpress/core";
import { buildCampaignOfferJsonLd } from "@nexpress/core";
import { saveCampaignAction } from "../actions";

interface CampaignEditorClientProps {
  initialCampaign?: ResolvedCampaign | null;
  siteName: string;
  siteUrl: string;
}

export function CampaignEditorClient({
  initialCampaign,
  siteName,
  siteUrl,
}: CampaignEditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"general" | "offer" | "terms" | "media" | "schema">("general");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [contentId, setContentId] = useState(initialCampaign?.contentId || "");
  const [title, setTitle] = useState(initialCampaign?.title || "");
  const [slug, setSlug] = useState(initialCampaign?.slug || "");
  const [tldr, setTldr] = useState(initialCampaign?.tldr || "");
  const [status, setStatus] = useState<"published" | "draft">(
    initialCampaign?.status === "draft" ? "draft" : "published"
  );
  const [badge, setBadge] = useState(initialCampaign?.badge || "");

  const [discount, setDiscount] = useState(initialCampaign?.discount || "");
  const [gift, setGift] = useState(initialCampaign?.gift || "");
  const [productName, setProductName] = useState(initialCampaign?.productName || "");
  const [productUrl, setProductUrl] = useState(initialCampaign?.productUrl || "");

  const [startDate, setStartDate] = useState(initialCampaign?.startDate || "");
  const [endDate, setEndDate] = useState(initialCampaign?.endDate || "");
  const [isPerpetual, setIsPerpetual] = useState(initialCampaign?.isPerpetual ?? false);
  const [terms, setTerms] = useState(initialCampaign?.terms || "");
  const [targetAudience, setTargetAudience] = useState(initialCampaign?.targetAudience || "");

  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialCampaign?.featuredImageUrl || "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(initialCampaign?.featuredImageAlt || "");
  const [ctaText, setCtaText] = useState(initialCampaign?.ctaText || "Hemen Teklif Al & Başvur");
  const [ctaUrl, setCtaUrl] = useState(initialCampaign?.ctaUrl || "/iletisim");
  const [contactPhone, setContactPhone] = useState(initialCampaign?.contactPhone || "");
  const [contactWhatsapp, setContactWhatsapp] = useState(initialCampaign?.contactWhatsapp || "");

  // Otomatik slug üretimi (ilk girişte)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialCampaign?.slug && !contentId) {
      const generated = val
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  // Canlı Kampanya Nesnesi
  const currentCampaign = useMemo<ResolvedCampaign>(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const isExpired = Boolean(endDate && !isPerpetual && endDate < todayStr);
    return {
      id: contentId || "temp",
      contentId: contentId || "temp",
      title: title || "Yeni Kampanya",
      slug: slug || "yeni-kampanya",
      tldr,
      status,
      discount,
      gift,
      productName,
      productUrl,
      badge,
      startDate,
      endDate,
      terms,
      targetAudience,
      ctaText,
      ctaUrl,
      contactPhone,
      contactWhatsapp,
      featuredImageUrl,
      featuredImageAlt,
      isPerpetual,
      isExpired,
      daysRemaining: 0,
      formattedValidity: endDate ? `Bitiş: ${endDate}` : "Süresiz",
    };
  }, [
    contentId,
    title,
    slug,
    tldr,
    status,
    discount,
    gift,
    productName,
    productUrl,
    badge,
    startDate,
    endDate,
    terms,
    targetAudience,
    ctaText,
    ctaUrl,
    contactPhone,
    contactWhatsapp,
    featuredImageUrl,
    featuredImageAlt,
    isPerpetual,
  ]);

  // Schema.org Offer JSON-LD Önizlemesi
  const offerJsonLd = useMemo(() => {
    return buildCampaignOfferJsonLd(currentCampaign, {
      siteUrl,
      pageUrl: `${siteUrl.replace(/\/$/, "")}/tr/kampanya/${slug || "kampanya"}`,
      siteName,
    });
  }, [currentCampaign, siteUrl, siteName, slug]);

  const handleSave = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg("Lütfen kampanya adını yazın.");
      setActiveTab("general");
      return;
    }

    startTransition(async () => {
      const res = await saveCampaignAction({
        contentId: contentId || undefined,
        title,
        slug,
        status,
        tldr,
        campaign: {
          discount,
          gift,
          productName,
          productUrl,
          badge,
          startDate,
          endDate,
          terms,
          targetAudience,
          ctaText,
          ctaUrl,
          contactPhone,
          contactWhatsapp,
          featuredImageUrl,
          featuredImageAlt,
          isPerpetual,
        },
      });

      if (!res.ok) {
        setErrorMsg(res.error || "Kampanya kaydedilirken bir hata oluştu.");
      } else {
        setSuccessMsg("Kampanya başarıyla kaydedildi.");
        if (res.contentId && !contentId) {
          setContentId(res.contentId);
          router.replace(`/admin/campaigns/edit?id=${res.contentId}`);
        }
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Üst Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E7EA] dark:border-[#23262E] pb-3.5">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/campaigns"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2.5 text-xs text-[#5F6570] dark:text-[#8C9099] hover:text-foreground transition shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kampanyalar</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-base font-bold text-[#14151A] dark:text-[#F3F4F6] truncate max-w-sm sm:max-w-md">
            {initialCampaign ? `Düzenle: ${initialCampaign.title}` : "Yeni Kampanya Oluştur"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {slug && (
            <Link
              href={`/tr/kampanya/${slug}`}
              target="_blank"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2.5 text-xs font-medium text-[#14151A] dark:text-[#F3F4F6] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] transition shadow-xs"
            >
              <Eye className="h-3.5 w-3.5 text-[#5F6570] dark:text-[#8C9099]" />
              <span>Önizle</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isPending ? "Kaydediliyor..." : "Kaydet & Yayınla"}</span>
          </button>
        </div>
      </div>

      {/* Bildirim Mesajları */}
      {errorMsg && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          {successMsg}
        </div>
      )}

      {/* Sekmeler */}
      <div className="flex border-b border-[#E6E7EA] dark:border-[#23262E] gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition ${
            activeTab === "general"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-[#5F6570] dark:text-[#8C9099] hover:text-foreground"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Genel & Başlık</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("offer")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition ${
            activeTab === "offer"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-[#5F6570] dark:text-[#8C9099] hover:text-foreground"
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          <span>Fırsat & Avantajlar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("terms")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition ${
            activeTab === "terms"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-[#5F6570] dark:text-[#8C9099] hover:text-foreground"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Zamanlama & Şartlar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition ${
            activeTab === "media"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-[#5F6570] dark:text-[#8C9099] hover:text-foreground"
          }`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Medya & Eylem (CTA)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("schema")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition ${
            activeTab === "schema"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-[#5F6570] dark:text-[#8C9099] hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Google SERP & Şema Önizlemesi</span>
        </button>
      </div>

      {/* Form Gövdesi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol 2 Kolon: Form Alanları */}
        <div className="lg:col-span-2 space-y-5">
          {/* SEKME 1: GENEL & BAŞLIK */}
          {activeTab === "general" && (
            <div className="rounded-xl border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-5 space-y-4 shadow-xs">
              <div>
                <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                  Kampanya Adı / Başlığı *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Örn: Wolvox Restoran Haziran Kampanyası"
                  className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-sm text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    URL Adresi (Slug)
                  </label>
                  <div className="flex items-center rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent overflow-hidden">
                    <span className="bg-[#F4F5F7] dark:bg-[#1F222A] px-2.5 py-2 text-xs text-[#5F6570] dark:text-[#8C9099] font-mono border-r border-[#E6E7EA] dark:border-[#23262E]">
                      /kampanya/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="wolvox-restoran-kampanyasi"
                      className="h-9 w-full bg-transparent px-2.5 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    Vurgu Rozeti
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Örn: Yıl Sonu Fırsatı, %35 İndirim"
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                  Kısa Özet & Fırsat Açıklaması (TL;DR)
                </label>
                <textarea
                  rows={3}
                  value={tldr}
                  onChange={(e) => setTldr(e.target.value)}
                  placeholder="Kampanyanın ana kazanımını 1-2 cümlede özetleyin (Google Snippet ve AI modeller bu alanı alıntılar)."
                  className="w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent p-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                  Yayın Durumu
                </label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === "published"}
                      onChange={() => setStatus("published")}
                      className="text-blue-600"
                    />
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">Yayında (Herkese Açık)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === "draft"}
                      onChange={() => setStatus("draft")}
                      className="text-blue-600"
                    />
                    <span className="font-medium text-amber-600 dark:text-amber-400">Taslak (Yalnızca Panel)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SEKME 2: FIRSAT & AVANTAJLAR */}
          {activeTab === "offer" && (
            <div className="rounded-xl border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-5 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    İndirim Oranı veya Tutarı
                  </label>
                  <input
                    type="text"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="Örn: %35 İndirim veya 5.000 TL İndirim"
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099] mt-1">
                    Google Offer şemasına ve kart rozetine doğrudan yansır.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    Hediye Ürün / Bonus Modül
                  </label>
                  <input
                    type="text"
                    value={gift}
                    onChange={(e) => setGift(e.target.value)}
                    placeholder="Örn: 1 Yıllık QR Menü + Mobil Garson Modülü Hediye"
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    Hedef Ürün / Yazılım Adı
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Örn: Wolvox Restoran Programı"
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    Hedef Ürün URL'si
                  </label>
                  <input
                    type="text"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="Örn: /wolvox-restoran veya https://..."
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SEKME 3: ZAMANLAMA & ŞARTLAR */}
          {activeTab === "terms" && (
            <div className="rounded-xl border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-5 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    disabled={isPerpetual}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPerpetual"
                  checked={isPerpetual}
                  onChange={(e) => {
                    setIsPerpetual(e.target.checked);
                    if (e.target.checked) setEndDate("");
                  }}
                  className="rounded border-border text-blue-600"
                />
                <label htmlFor="isPerpetual" className="text-xs font-medium cursor-pointer">
                  Bu kampanya süresizdir (kesintisiz fırsat, süre aşımı yok).
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                  Hedef Kitle
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Örn: Yeni Lisans Alımları, Mevcut Kullanıcılar, Sektörel Geçişler"
                  className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                  Katılım Şartları ve Koşulları (Madde Madde)
                </label>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Her satıra bir şart yazın:
• Yalnızca yeni lisans alımlarında geçerlidir.
• Diğer indirim ve promosyonlarla birleştirilemez.
• Kurulum ve eğitim desteği paket içeriğine dahildir."
                  className="w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent p-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden font-mono"
                />
              </div>
            </div>
          )}

          {/* SEKME 4: MEDYA & EYLEM (CTA) */}
          {activeTab === "media" && (
            <div className="rounded-xl border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-5 space-y-4 shadow-xs">
              <div>
                <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                  Kampanya Afiş Görseli URL
                </label>
                <input
                  type="text"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="Örn: /media/kampanyalar/wolvox-restoran-afis.webp veya https://..."
                  className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                  Görsel Alt Metni
                </label>
                <input
                  type="text"
                  value={featuredImageAlt}
                  onChange={(e) => setFeaturedImageAlt(e.target.value)}
                  placeholder="Görsel açıklaması (SEO için)"
                  className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    Eylem Butonu Metni
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Hemen Teklif Al & Başvur"
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    Eylem Butonu URL
                  </label>
                  <input
                    type="text"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="/demo-talebi veya /iletisim"
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    İletişim / Çağrı Telefonu
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Örn: 0 (232) 555 00 00"
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                    WhatsApp Destek Hattı
                  </label>
                  <input
                    type="text"
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    placeholder="Örn: 905551112233"
                    className="h-9 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-3 text-xs text-[#14151A] dark:text-[#F3F4F6] focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SEKME 5: GOOGLE SERP & SCHEMA ÖNİZLEMESİ */}
          {activeTab === "schema" && (
            <div className="rounded-xl border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-5 space-y-4 shadow-xs">
              <div className="border border-[#E6E7EA] dark:border-[#23262E] rounded-lg p-4 bg-[#FAFAFA] dark:bg-[#181A20]">
                <div className="text-xs text-[#5F6570] dark:text-[#8C9099] mb-1.5 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-blue-600" />
                  <span>Google Arama Sonucu Önizlemesi</span>
                </div>
                <div className="text-xs text-[#202124] dark:text-[#BDC1C6] font-mono">
                  {siteUrl}/tr/kampanya/{slug || "kampanya-adi"}
                </div>
                <div className="text-base text-[#1a0dab] dark:text-[#8ab4f8] font-medium hover:underline cursor-pointer">
                  {title || "Kampanya Başlığı"}
                </div>
                <div className="text-xs text-[#4d5156] dark:text-[#bdc1c6] mt-0.5">
                  {discount ? <strong className="text-emerald-700 dark:text-emerald-400">{discount} — </strong> : null}
                  {tldr || "Kampanya özeti ve detayları burada görüntülenecek."}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14151A] dark:text-[#F3F4F6] mb-1">
                  Schema.org JSON-LD (Google & AI Offer Graph)
                </label>
                <pre className="rounded-lg bg-[#0F1117] p-4 text-[11px] text-[#A6ACCD] overflow-x-auto font-mono max-h-72">
                  {JSON.stringify(offerJsonLd, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Sağ Kolon: Canlı Kart Önizlemesi */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099] flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>Canlı Vitrin Kartı</span>
            </h3>

            {/* Önizleme Kartı */}
            <div className="rounded-xl border border-[#E6E7EA] dark:border-[#23262E] overflow-hidden bg-white dark:bg-[#1C1E24] shadow-xs">
              {featuredImageUrl ? (
                <img
                  src={featuredImageUrl}
                  alt={featuredImageAlt || title}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-blue-600/10 to-indigo-600/10 flex items-center justify-center text-blue-600">
                  <Megaphone className="h-8 w-8 opacity-40" />
                </div>
              )}

              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {badge ? (
                    <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      {badge}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Kampanya
                    </span>
                  )}

                  {discount && (
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {discount}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-[#14151A] dark:text-[#F3F4F6] line-clamp-1">
                  {title || "Kampanya Başlığı"}
                </h4>

                {productName && (
                  <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099] line-clamp-1">
                    Geçerli: <strong className="text-foreground">{productName}</strong>
                  </p>
                )}

                {gift && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded">
                    <Gift className="h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{gift}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#E6E7EA] dark:border-[#23262E] flex items-center justify-between text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{endDate ? `Son: ${endDate}` : "Süresiz"}</span>
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    İncele →
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
              Bu kart <code>/{slug ? `tr/kampanyalar` : ""}</code> vitrininde ve ana sayfa duyuru bloklarında gösterilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

