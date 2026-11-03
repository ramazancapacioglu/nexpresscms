"use client";

import React, { useState } from "react";
import type { BlockNode } from "@nexpress/core";
import { Sparkles, X, Check, Layers, AlertCircle } from "lucide-react";
import { createPatternAction } from "@/app/admin/appearance/templates/actions";

export interface CreatePatternModalProps {
  open: boolean;
  block: BlockNode | null;
  onClose: () => void;
  onCreated: (pattern: { id: string; name: string; blocks: BlockNode[] }) => void;
}

const PATTERN_CATEGORIES = [
  { id: "hero", label: "Hero & Karşılama" },
  { id: "features", label: "Özellikler & Çözümler" },
  { id: "cta", label: "Çağrı & Banner (CTA)" },
  { id: "forms", label: "Form & Demo Talebi" },
  { id: "campaign", label: "Kampanya & Teklif" },
  { id: "pricing", label: "Fiyat & Karşılaştırma" },
  { id: "faq", label: "Soru-Cevap & SSS" },
  { id: "custom", label: "Genel / Özel" },
];

export function CreatePatternModal({
  open,
  block,
  onClose,
  onCreated,
}: CreatePatternModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("features");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !block) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Lütfen model için bir ad yazın.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await createPatternAction({
        name: name.trim(),
        description: description.trim(),
        category,
        blocks: [block],
      });
      if (!res.ok) {
        setError(res.error || "Model oluşturulamadı.");
        setSaving(false);
        return;
      }
      onCreated({
        id: res.id,
        name: res.name,
        blocks: [block],
      });
      setName("");
      setDescription("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Senkronize Model Oluştur"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        {/* Üst Başlık */}
        <div className="flex items-center justify-between border-b border-border bg-purple-50/50 px-5 py-3.5 dark:bg-purple-950/20">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Senkronize Model Oluştur</h3>
              <p className="text-[11px] text-muted-foreground">WordPress tarzı ortak akıllı blok</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Bilgilendirme */}
        <div className="bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground border-b border-border/60">
          <p>
            💡 <strong>Nasıl Çalışır?</strong> Bu bloğu model olarak kaydettiğinizde, diğer sayfalarda da ortak kullanabilirsiniz. Model üzerinde yapılan bir değişiklik, kullanıldığı <strong>tüm sayfalarda otomatik güncellenir</strong>.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Model Adı *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: ERP Çözüm Sekmeleri veya Hero Demo Formu"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {PATTERN_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Kısa Açıklama (İsteğe bağlı)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Wolvox ürün sayfalarında ortak çağrı ve iletişim şeridi"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-input px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Modeli Kaydet ve Bağla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
