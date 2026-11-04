"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  Search,
  Calendar,
  Tag,
  Gift,
  ExternalLink,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import type { ResolvedCampaign } from "@nexpress/core";
import {
  deleteCampaignAction,
  duplicateCampaignAction,
  toggleCampaignStatusAction,
} from "./actions";

interface CampaignsClientProps {
  campaigns: ResolvedCampaign[];
}

export function CampaignsClient({ campaigns: initialCampaigns }: CampaignsClientProps) {
  const [campaigns, setCampaigns] = useState<ResolvedCampaign[]>(initialCampaigns);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "draft">("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Metrikler
  const totalCount = campaigns.length;
  const activeCount = campaigns.filter((c) => c.status === "published" && !c.isExpired).length;
  const expiredCount = campaigns.filter((c) => c.status === "published" && c.isExpired).length;
  const draftCount = campaigns.filter((c) => c.status === "draft").length;

  const filtered = campaigns.filter((c) => {
    if (filter === "active" && (c.status !== "published" || c.isExpired)) return false;
    if (filter === "expired" && (c.status !== "published" || !c.isExpired)) return false;
    if (filter === "draft" && c.status !== "draft") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        c.title.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.productName && c.productName.toLowerCase().includes(q)) ||
        (c.discount && c.discount.toLowerCase().includes(q)) ||
        (c.gift && c.gift.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleDelete = (contentId: string, title: string) => {
    if (!confirm(`"${title}" kampanyasını silmek istediğinize emin misiniz?`)) return;
    startTransition(async () => {
      await deleteCampaignAction(contentId);
      setCampaigns((prev) => prev.filter((c) => c.contentId !== contentId));
    });
  };

  const handleDuplicate = (contentId: string) => {
    startTransition(async () => {
      const res = await duplicateCampaignAction(contentId);
      if (res.ok) {
        window.location.reload();
      }
    });
  };

  const handleToggleStatus = (contentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    startTransition(async () => {
      await toggleCampaignStatusAction(contentId, nextStatus);
      setCampaigns((prev) =>
        prev.map((c) => (c.contentId === contentId ? { ...c, status: nextStatus } : c))
      );
    });
  };

  return (
    <div className="space-y-5">
      {/* Üst Başlık & Aksiyon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E7EA] dark:border-[#23262E] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white shadow-xs">
              <Megaphone className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">
              Kampanyalar & Fırsatlar
            </h1>
          </div>
          <p className="text-xs text-[#5F6570] dark:text-[#8C9099] mt-1">
            İndirim oranları, hediye ürünler, süre sayaçları ve Google Offer / ItemList şemaları ile satışlarınızı artırın.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tr/kampanyalar"
            target="_blank"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-3 text-xs font-medium text-[#14151A] dark:text-[#F3F4F6] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] transition shadow-xs"
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-[#5F6570] dark:text-[#8C9099]" />
            <span>Canlı Vitrin (/kampanyalar)</span>
          </Link>
          <Link
            href="/admin/campaigns/edit?new=1"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Yeni Kampanya Ekle</span>
          </Link>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5F6570] dark:text-[#8C9099]">
            <span>Toplam Kampanya</span>
            <Tag className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#14151A] dark:text-[#F3F4F6]">
            {totalCount}
          </div>
        </div>

        <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
            <span>Aktif & Geçerli</span>
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </div>
        </div>

        <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
            <span>Süresi Dolanlar</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {expiredCount}
          </div>
        </div>

        <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
            <span>Taslaklar</span>
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {draftCount}
          </div>
        </div>
      </div>

      {/* Arama & Sekme Filtreleri */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-[#F4F5F7] dark:bg-[#1C1E24] p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1.5 transition ${
              filter === "all"
                ? "bg-white dark:bg-[#2A2D35] text-[#14151A] dark:text-[#F3F4F6] shadow-xs font-semibold"
                : "text-[#5C5F66] dark:text-[#9CA3AF] hover:text-foreground"
            }`}
          >
            Tümü ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`rounded-md px-3 py-1.5 transition ${
              filter === "active"
                ? "bg-white dark:bg-[#2A2D35] text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                : "text-[#5C5F66] dark:text-[#9CA3AF] hover:text-foreground"
            }`}
          >
            Aktifler ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("expired")}
            className={`rounded-md px-3 py-1.5 transition ${
              filter === "expired"
                ? "bg-white dark:bg-[#2A2D35] text-rose-600 dark:text-rose-400 shadow-xs font-semibold"
                : "text-[#5C5F66] dark:text-[#9CA3AF] hover:text-foreground"
            }`}
          >
            Süresi Dolanlar ({expiredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("draft")}
            className={`rounded-md px-3 py-1.5 transition ${
              filter === "draft"
                ? "bg-white dark:bg-[#2A2D35] text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                : "text-[#5C5F66] dark:text-[#9CA3AF] hover:text-foreground"
            }`}
          >
            Taslaklar ({draftCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#5F6570] dark:text-[#8C9099]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kampanya, ürün veya indirim ara..."
            className="h-8 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] pl-8 pr-3 text-xs text-[#14151A] dark:text-[#F3F4F6] placeholder-[#8C9099] focus:border-blue-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Tablo Görünümü */}
      <div className="rounded-xl border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FAFAFA] dark:bg-[#181A20] text-[#5F6570] dark:text-[#8C9099] font-medium">
              <tr>
                <th className="px-4 py-3 w-14">Afiş</th>
                <th className="px-4 py-3 min-w-[220px]">Kampanya Adı & Hedef</th>
                <th className="px-4 py-3 min-w-[150px]">Fırsat & Avantaj</th>
                <th className="px-4 py-3 min-w-[150px]">Geçerlilik</th>
                <th className="px-4 py-3 w-28">Durum</th>
                <th className="px-4 py-3 w-32 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E7EA] dark:divide-[#23262E]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Megaphone className="mx-auto h-8 w-8 opacity-30 mb-2" />
                    <p className="text-sm font-medium">Kayıtlı kampanya bulunamadı.</p>
                    <p className="text-xs text-[#5F6570] dark:text-[#8C9099] mt-1">
                      Yeni kampanya oluşturmak için sağ üstteki butona tıklayın.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isPublished = item.status === "published";
                  const isExp = isPublished && item.isExpired;

                  return (
                    <tr
                      key={item.contentId}
                      className="hover:bg-[#F9FAFB] dark:hover:bg-[#181A20]/60 transition"
                    >
                      {/* Afiş */}
                      <td className="px-4 py-3 align-middle">
                        {item.featuredImageUrl ? (
                          <img
                            src={item.featuredImageUrl}
                            alt={item.featuredImageAlt || item.title}
                            className="h-10 w-16 rounded object-cover border border-[#E6E7EA] dark:border-[#23262E]"
                          />
                        ) : (
                          <div className="h-10 w-16 rounded bg-[#F4F5F7] dark:bg-[#20232B] flex items-center justify-center text-[#8C9099]">
                            <Megaphone className="h-4 w-4 opacity-40" />
                          </div>
                        )}
                      </td>

                      {/* Başlık & Hedef */}
                      <td className="px-4 py-3 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/admin/campaigns/edit?id=${item.contentId}`}
                              className="font-semibold text-sm text-[#14151A] dark:text-[#F3F4F6] hover:text-blue-600 transition truncate max-w-md"
                            >
                              {item.title}
                            </Link>
                            {item.badge && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                <Sparkles className="h-2.5 w-2.5 mr-1" />
                                {item.badge}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                            <span className="font-mono text-[#8C9099]">/kampanya/{item.slug}</span>
                            {item.productName && (
                              <span>• Hedef: <strong className="font-medium text-foreground">{item.productName}</strong></span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fırsat & Avantaj */}
                      <td className="px-4 py-3 align-middle">
                        <div className="space-y-1">
                          {item.discount && (
                            <div className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              <Tag className="h-3 w-3" />
                              <span>{item.discount}</span>
                            </div>
                          )}
                          {item.gift && (
                            <div className="flex items-center gap-1 text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                              <Gift className="h-3 w-3 text-amber-500 shrink-0" />
                              <span className="truncate max-w-[200px]">{item.gift}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Geçerlilik */}
                      <td className="px-4 py-3 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-[#14151A] dark:text-[#F3F4F6]">
                            <Calendar className="h-3 w-3 text-[#5F6570] dark:text-[#8C9099]" />
                            <span>{item.formattedValidity}</span>
                          </div>
                          {item.daysRemaining !== null && (
                            <div>
                              {item.isExpired ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                                  Süresi Doldu
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                                  Son {item.daysRemaining} gün
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Durum */}
                      <td className="px-4 py-3 align-middle">
                        {isPublished ? (
                          isExp ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                              <Clock className="h-3 w-3" />
                              Sona Erdi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              Yayında
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                            <AlertTriangle className="h-3 w-3" />
                            Taslak
                          </span>
                        )}
                      </td>

                      {/* İşlemler */}
                      <td className="px-4 py-3 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/tr/kampanya/${item.slug}`}
                            target="_blank"
                            title="Canlı Kampanya Sayfası"
                            className="p-1 rounded text-[#5F6570] hover:text-[#14151A] dark:hover:text-white hover:bg-[#F4F5F7] dark:hover:bg-[#20232B] transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/admin/campaigns/edit?id=${item.contentId}`}
                            title="Düzenle"
                            className="p-1 rounded text-[#5F6570] hover:text-blue-600 hover:bg-[#F4F5F7] dark:hover:bg-[#20232B] transition"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(item.contentId)}
                            title="Çoğalt"
                            className="p-1 rounded text-[#5F6570] hover:text-[#14151A] dark:hover:text-white hover:bg-[#F4F5F7] dark:hover:bg-[#20232B] transition"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.contentId, item.title)}
                            title="Sil"
                            className="p-1 rounded text-[#5F6570] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

