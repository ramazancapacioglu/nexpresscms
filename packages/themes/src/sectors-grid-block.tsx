import React from "react";
import type { DesignTokens } from "@nexpress/core";

export interface SectorItem {
  name: string;
  badge?: string;
  summary: string;
  useCases?: string[];
  href?: string;
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * 0-KB RSC Sektörler Bloğu.
 * Ürün ve çözüm sayfalarında hangi sektörlerin bu yazılımdan nasıl yararlandığını net, hizalı kartlarla sunar.
 * İleride açılacak `/sektorler/<slug>` sayfalarına doğrudan bağlanabilir (`href`).
 */
export function SectorsGridBlock({ tokens, props: p }: { tokens: DesignTokens; props: Record<string, unknown> }) {
  const title = str(p.title) || "Hangi Sektörler İçin Uygundur?";
  const subtitle = str(p.subtitle);
  const raw = Array.isArray(p.items) ? p.items : [];
  const items: SectorItem[] = raw
    .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
    .map((x) => ({
      name: str(x.name),
      badge: str(x.badge) || undefined,
      summary: str(x.summary),
      useCases: Array.isArray(x.useCases) ? x.useCases.map((u) => str(u)).filter(Boolean) : undefined,
      href: str(x.href) || undefined,
    }))
    .filter((x) => x.name && x.summary);

  if (items.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="space-y-1.5">
        <span
          style={{ color: tokens.colors.primary }}
          className="inline-block text-[11px] font-bold uppercase tracking-wider"
        >
          Sektörel Uyumluluk
        </span>
        <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl font-bold tracking-tight text-nx-fg">
          {title}
        </h2>
        {subtitle ? <p className="text-sm text-nx-soft max-w-3xl leading-relaxed">{subtitle}</p> : null}
      </div>

      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${items.length >= 3 ? "lg:grid-cols-3" : ""}`}>
        {items.map((it, idx) => {
          const inner = (
            <div
              style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
              className="flex h-full flex-col justify-between gap-3 border bg-nx-card p-5 transition hover:border-nx-link/50 hover:shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-nx-fg leading-snug">{it.name}</h3>
                  {it.badge ? (
                    <span
                      style={{ backgroundColor: tokens.colors.muted, color: tokens.colors.primary }}
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    >
                      {it.badge}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-nx-soft leading-relaxed">{it.summary}</p>
              </div>
              {it.useCases && it.useCases.length > 0 ? (
                <ul className="space-y-1 border-t border-nx-line/70 pt-3 text-xs text-nx-muted">
                  {it.useCases.map((u, ui) => (
                    <li key={ui} className="flex items-start gap-1.5">
                      <span style={{ color: tokens.colors.primary }} className="font-bold">•</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );

          return it.href ? (
            <a key={idx} href={it.href} className="block h-full no-underline">
              {inner}
            </a>
          ) : (
            <div key={idx} className="h-full">
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
