import React from "react";
import type { DesignTokens, TechMarkdownData } from "@nexpress/core";

const LEVEL_TR: Record<string, string> = {
  Beginner: "Başlangıç",
  Intermediate: "Orta Seviye",
  Expert: "İleri Seviye",
};

/**
 * 0-KB RSC Teknik Rehber Künyesi (`TechArticle`).
 * JSON-LD'deki `proficiencyLevel`, `dependencies`, `about`, `teaches`, `citation` ve
 * WebPage `reviewedBy` / `lastReviewed` alanlarını ziyaretçiye ve arama motorlarına görünür kılar.
 */
export function TechArticleBar({
  tech,
  lb,
  tokens,
}: {
  tech: TechMarkdownData | null | undefined;
  lb: string;
  tokens: DesignTokens;
}) {
  if (!tech) return null;
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const level = s(tech.level);
  const deps = s(tech.dependencies);
  const swName = s(tech.aboutSoftwareName);
  const swUrlRaw = s(tech.aboutSoftwareUrl);
  const swUrl = swUrlRaw ? (swUrlRaw.startsWith("http") ? swUrlRaw : `${lb}${swUrlRaw.startsWith("/") ? swUrlRaw : `/${swUrlRaw}`}`) : "";
  const reviewedBy = s(tech.reviewedBy);
  const lastReviewed = s(tech.lastReviewed);
  const teaches = s(tech.teaches)
    .split(/\r?\n|;/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 6);
  const citations = s(tech.citations)
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => /^https?:\/\//i.test(x))
    .slice(0, 4);

  if (!level && !deps && !swName && !reviewedBy && !lastReviewed && teaches.length === 0) return null;

  return (
    <aside
      aria-label="Teknik rehber künyesi"
      style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
      className="mt-4 rounded-xl border bg-nx-subtle/50 p-4 text-xs space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }}
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          >
            Teknik Bilgi Bankası
          </span>
          {level ? (
            <span className="rounded-full border border-nx-line bg-nx-card px-2.5 py-0.5 font-medium text-nx-fg">
              Seviye: {LEVEL_TR[level] ?? level}
            </span>
          ) : null}
          {swName && swUrl ? (
            <a
              href={swUrl}
              style={{ color: tokens.colors.primary }}
              className="rounded-full border border-nx-line bg-nx-card px-2.5 py-0.5 font-semibold hover:underline"
            >
              İlgili Yazılım: {swName} →
            </a>
          ) : swName ? (
            <span className="rounded-full border border-nx-line bg-nx-card px-2.5 py-0.5 font-medium text-nx-fg">
              Yazılım: {swName}
            </span>
          ) : null}
        </div>
        {reviewedBy || lastReviewed ? (
          <span className="text-[11px] text-nx-muted">
            {reviewedBy ? `Teknik İnceleme: ${reviewedBy}` : "Son Kontrol"}
            {lastReviewed ? ` · ${lastReviewed}` : ""}
          </span>
        ) : null}
      </div>

      {deps ? (
        <p className="text-nx-soft leading-relaxed">
          <strong className="text-nx-fg">Ön Koşullar:</strong> {deps}
        </p>
      ) : null}

      {teaches.length > 0 ? (
        <div className="space-y-1">
          <div className="font-semibold text-nx-fg">Bu rehberde öğrenecekleriniz:</div>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 text-nx-soft">
            {teaches.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span style={{ color: tokens.colors.primary }} className="font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {citations.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-nx-line/70 pt-2 text-[11px] text-nx-muted">
          <span className="font-semibold text-nx-fg">Resmî Kaynaklar:</span>
          {citations.map((url) => {
            const label = url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
            return (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-nx-fg">
                {label} ↗
              </a>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}
