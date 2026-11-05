"use client";

import React, { useState } from "react";
import { transformRawKbToArticle, type KbTransformResult } from "./kb-transform";
import { runOps } from "./ops-client";

export function KbTransformCard() {
  const [rawText, setRawText] = useState("");
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [result, setResult] = useState<KbTransformResult | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleTransform = () => {
    if (!rawText.trim()) return;
    const transformed = transformRawKbToArticle(rawText, suggestedTitle);
    setResult(transformed);
  };

  const handleRecheck = async () => {
    setBusy(true);
    const res = await runOps("source.recheck", {});
    setBusy(false);
    const checked = Number(res.data?.checked ?? 0);
    const changed = Number(res.data?.changed ?? 0);
    setSavedNotice(res.ok ? `${checked} kaynak denetlendi, ${changed} tanesi değişmiş.` : (res.error ?? "Denetim tamamlanamadı."));
  };

  const handleImportUrl = async () => {
    if (!sourceUrl.trim()) return;
    setBusy(true);
    const res = await runOps("source.import", { url: sourceUrl });
    setBusy(false);
    setSavedNotice(res.ok ? `Taslak açıldı: ${String(res.data?.href ?? "")}` : (res.error ?? "Adres çekilemedi."));
  };

  const handleSaveDraft = async () => {
    if (!rawText.trim()) return;
    setBusy(true);
    const res = await runOps("source.paste", { title: suggestedTitle, text: rawText });
    setBusy(false);
    if (!res.ok) {
      setSavedNotice(res.error ?? "Taslak kaydedilemedi.");
      return;
    }
    setSavedNotice(`Taslak kaydedildi: ${String(res.data?.href ?? "")}`);
    setResult(null);
    setRawText("");
    setSuggestedTitle("");
  };

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-nx-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-nx-fg">Bilgi Bankası Dönüşümü (KB Transform)</h4>
            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
              Taslak kuyruğu
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            Dış adresten metin çekilir veya yapıştırılır. Kayıt taslaktır; yayın içerik editöründe onaylanır.
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          {savedNotice}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-nx-soft mb-1">Kaynak adresi</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs text-nx-fg focus:outline-none focus:ring-1 focus:ring-nx-primary"
            />
            <button type="button" onClick={() => void handleImportUrl()} disabled={busy || !sourceUrl.trim()} className="shrink-0 rounded-lg border border-nx-line px-3 py-1.5 text-xs font-semibold text-nx-fg disabled:opacity-50">
              Çek
            </button>
            <button type="button" onClick={() => void handleRecheck()} disabled={busy} className="shrink-0 rounded-lg border border-nx-line px-3 py-1.5 text-xs font-semibold text-nx-fg disabled:opacity-50">
              Denetle
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-nx-soft mb-1">Önerilen Başlık (İsteğe Bağlı)</label>
          <input
            type="text"
            value={suggestedTitle}
            onChange={(e) => setSuggestedTitle(e.target.value)}
            placeholder="Örn: Wolvox ERP Firebird veritabanı yedeği nasıl alınır?"
            className="w-full rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs text-nx-fg focus:outline-none focus:ring-1 focus:ring-nx-primary"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-nx-soft mb-1">Ham Not, Destek Talebi veya Mevzuat Metni</label>
          <textarea
            rows={3}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Destek personelinin aldığı notları veya teknik rehber metnini buraya yapıştırın..."
            className="w-full rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs text-nx-fg focus:outline-none focus:ring-1 focus:ring-nx-primary"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleTransform}
            disabled={!rawText.trim()}
            className="rounded-lg bg-nx-primary px-3.5 py-1.5 text-xs font-semibold text-nx-primary-fg hover:opacity-90 transition disabled:opacity-50"
          >
            ⚡ Bloklara ve Şemaya Dönüştür
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-lg border border-nx-line bg-nx-subtle p-4 space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-nx-fg">Dönüştürülen Taslak Önizlemesi</span>
            <span className="text-[10px] text-nx-soft">Kategori: {result.category}</span>
          </div>

          <div className="rounded bg-nx-card border border-nx-line p-3 space-y-2 text-xs">
            <div className="font-bold text-sm text-nx-fg">{result.title}</div>
            <div className="rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 p-2 text-[11px] leading-relaxed">
              <strong>TL;DR Doğrudan Yanıt:</strong> {result.tldr}
            </div>
            <div className="text-[11px] text-nx-soft">
              Oluşturulan Blok Sayısı: <strong>{result.blocks.length} blok</strong> (Başlık, Uzman Kutusu, Metin, Aksiyon)
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setResult(null)}
              className="rounded px-3 py-1 text-xs text-nx-soft hover:text-nx-fg"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => void handleSaveDraft()}
              disabled={busy}
              className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
            >
              Taslak olarak kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

