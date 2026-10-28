"use client";

import React from "react";
import Link from "next/link";
import { Check, ExternalLink, Save } from "lucide-react";

export type AppearanceScreen = "header" | "menu" | "footer" | "sidebar";

const TABS: Array<{ id: AppearanceScreen; label: string; href: string }> = [
  { id: "header", label: "Header", href: "/admin/appearance/header" },
  { id: "menu", label: "Menü", href: "/admin/appearance/menus" },
  { id: "footer", label: "Footer", href: "/admin/appearance/footer" },
  { id: "sidebar", label: "Kenar çubuğu", href: "/admin/appearance/sidebar" },
];

export const fieldClass =
  "w-full rounded border border-[#E6E7EA] bg-[#FBFBFB] px-2.5 py-1.5 text-[12px] outline-none dark:border-[#23262E] dark:bg-[#121317]";

export function AppearanceTabs({ current }: { current: AppearanceScreen }) {
  return (
    <nav className="flex flex-wrap gap-1">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`rounded-md px-2.5 py-1 text-[12px] ${
            current === tab.id
              ? "bg-[#14151A] text-white dark:bg-[#F3F4F6] dark:text-[#14151A]"
              : "border border-[#E6E7EA] text-[#5C5F66] dark:border-[#23262E]"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function SaveBar({
  title,
  pending,
  notice,
  onSave,
}: {
  title: string;
  pending: boolean;
  notice: string | null;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E6E7EA] bg-white px-4 py-2.5 dark:border-[#23262E] dark:bg-[#15171C]">
      <div className="flex items-center gap-3 text-[12px]">
        <span className="font-medium">{title}</span>
        {notice ? (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-800 dark:text-emerald-400">
            <Check className="h-3 w-3" />
            {notice}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/tr"
          target="_blank"
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#E6E7EA] px-2.5 text-[12px] text-[#5C5F66] dark:border-[#23262E]"
        >
          Ön yüz
          <ExternalLink className="h-3 w-3" />
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={onSave}
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[#14151A] px-3 text-[12px] font-medium text-white dark:bg-[#F3F4F6] dark:text-[#14151A]"
        >
          <Save className="h-3 w-3" />
          {pending ? "Kaydediliyor" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

export function TemplateRow({
  templates,
  onApply,
}: {
  templates: Array<{ id: string; name: string; description: string }>;
  onApply: (id: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {templates.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          onClick={() => onApply(tpl.id)}
          className="rounded-lg border border-[#E6E7EA] bg-white p-3 text-left hover:border-[#14151A] dark:border-[#23262E] dark:bg-[#15171C]"
        >
          <div className="text-[12px] font-semibold">{tpl.name}</div>
          <p className="mt-1 text-[11px] leading-snug text-[#5F6570] dark:text-[#8C9099]">{tpl.description}</p>
        </button>
      ))}
    </div>
  );
}
