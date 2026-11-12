import React from "react";
import type { DesignTokens } from "@nexpress/core";

/** Üye sayfaları için ortak kabuk ve öğeler: yalnızca sunucu bileşeni, istemci JS'i yok. */
export function MemberCard({ title, children, tokens }: { title: string; children: React.ReactNode; tokens: DesignTokens }) {
  return (
    <section style={{ borderRadius: tokens.geometry.borderRadius }} className="mx-auto my-10 max-w-lg space-y-5 border border-nx-line bg-nx-card p-6 shadow-xs sm:p-8">
      <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl font-bold text-nx-fg">{title}</h1>
      {children}
    </section>
  );
}

export function MemberButton({ tokens, children, variant = "primary" }: { tokens: DesignTokens; children: React.ReactNode; variant?: "primary" | "danger" | "plain" }) {
  const style =
    variant === "primary"
      ? { backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground, borderRadius: tokens.geometry.borderRadius }
      : { borderRadius: tokens.geometry.borderRadius };
  return (
    <button type="submit" style={style} className={`inline-flex items-center justify-center px-4 py-2 text-sm font-semibold transition hover:opacity-95 ${variant === "danger" ? "border border-red-600 text-red-700" : variant === "plain" ? "border border-nx-line text-nx-fg" : ""}`}>
      {children}
    </button>
  );
}

export const memberFieldClass = "w-full rounded-lg border border-nx-line bg-nx-bg px-3.5 py-2 text-sm text-nx-fg outline-none focus:ring-2";

export function MemberNotice({ kind, children }: { kind: "ok" | "error"; children: React.ReactNode }) {
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm ${kind === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>
      {children}
    </p>
  );
}
