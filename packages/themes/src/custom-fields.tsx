import React from "react";
import type { DisplayField } from "@nexpress/core";

/**
 * Özel içerik türünün alan tablosu (0 KB RSC). Hem `custom_fields` bloğu hem yerleşik makale düzeni aynı bileşeni kullanır.
 * Bağlantı (`url`), e-posta ve görsel alanları tıklanabilir; görsel adres yalnızca yerel medya ya da https'tir (kayıtta doğrulanır).
 */
export function CustomFieldList({ rows, title }: { rows: DisplayField[]; title?: string }) {
  if (rows.length === 0) return null;
  return (
    <section className="nx-custom-fields rounded-xl border border-nx-line bg-nx-subtle/40 p-5" aria-label={title || undefined}>
      {title ? <h2 className="mb-3 text-lg font-bold text-nx-fg">{title}</h2> : null}
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.key} className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wider text-nx-muted">{row.label}</dt>
            <dd className="mt-0.5 break-words text-sm text-nx-fg">
              {row.kind === "image" && row.href ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.href} alt={row.label} loading="lazy" decoding="async" className="max-h-32 w-auto rounded-md" />
              ) : row.href ? (
                <a href={row.href} className="text-nx-link underline" {...(/^https?:/.test(row.href) ? { rel: "noopener noreferrer" } : {})}>{row.kind === "email" ? row.text : row.text}</a>
              ) : (
                row.text
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
