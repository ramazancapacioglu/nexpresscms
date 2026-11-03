"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Sayfa başlığı (h1) alanı: tuvalin ilk satırıdır, sitenin başlık yazı tipiyle çizilir. Çok satıra otomatik büyür;
 * Enter satır eklemez (başlık tek paragraftır). Çerçeve içinde çalışır (yüksekliği kendi belgesinde ölçer).
 */
export function TitleField({ value, onChange, fontFamily }: { value: string; onChange: (v: string) => void; fontFamily: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      aria-label="Sayfa başlığı"
      placeholder="Başlık"
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
      style={{ fontFamily, fontWeight: "var(--nx-heading-weight, 800)" }}
      className="mb-6 block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-4xl leading-tight tracking-tight text-inherit outline-none placeholder:opacity-30 focus:outline-none"
    />
  );
}
