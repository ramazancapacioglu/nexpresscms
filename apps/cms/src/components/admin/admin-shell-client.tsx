"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Sun,
  Moon,
  ExternalLink,
  Database,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { createTranslator } from "@nexpress/i18n";
import { NotificationBell } from "./notification-bell";
import { NAV_LABEL_KEYS, QUICK_COMMANDS, SECTION_LABEL_KEYS, WORKSPACE_SECTIONS } from "./admin-nav";

interface AdminShellClientProps {
  children: React.ReactNode;
  siteId: string;
  cmsMode: string;
  dbDialect: string;
  activeThemeId: string;
  sidebarSlot?: React.ReactNode;
  accountSlot?: React.ReactNode;
  /** Oturum rolü: yönetici olmayanlar için yönetim bölümleri gizlenir (sayfalar ayrıca korunur). */
  role?: "admin" | "editor";
  /** Panel arayüz dili (menü metinleri) */
  uiLocale?: string;
}

export function AdminShellClient({
  children,
  siteId,
  cmsMode,
  dbDialect,
  activeThemeId,
  sidebarSlot,
  accountSlot,
  role,
  uiLocale = "tr",
}: AdminShellClientProps) {
  const t = createTranslator(uiLocale);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        if (window.location.pathname.startsWith("/admin/contents")) return;
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredCommands = QUICK_COMMANDS.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const studioOpen = pathname.startsWith("/admin/contents");
  const studioType = searchParams.get("type") ?? "";
  const studioIsPost =
    studioType === "post" || studioType === "kb_tech" || studioType === "ai_prompt";
  const studioBackHref = studioIsPost ? "/admin/posts" : "/admin/pages";
  const studioBackLabel = studioIsPost ? "Blog Yazılarına Dön" : "Sayfalara Dön";

  const currentBreadcrumb =
    pathname === "/admin"
      ? "Records & Telemetry"
      : pathname.startsWith("/admin/contents")
        ? "Visual Canvas & Block Studio"
        : pathname.startsWith("/admin/themes")
          ? "Design / Theme Tokens"
          : pathname.startsWith("/admin/seo")
            ? "SEO / Motor"
            : pathname.startsWith("/admin/commerce/marketplaces")
              ? "Commerce / Pazar yerleri"
              : pathname.startsWith("/admin/commerce")
              ? "Commerce / Mağaza"
              : pathname.startsWith("/admin/appearance")
              ? "Design / Site Chrome"
              : pathname.startsWith("/admin/migration")
                ? "Tools / WP Importer"
                : pathname.startsWith("/admin/plugins")
                  ? "Sistem / Eklentiler"
                  : pathname.startsWith("/admin/requests")
                    ? "Workspace / Talepler"
                    : pathname.startsWith("/admin/translations")
                      ? "Workspace / Çeviriler"
                      : "Workspace";

  return (
    <div className="min-h-screen flex bg-[#FBFBFB] dark:bg-[#0D0E11] text-[#14151A] dark:text-[#F3F4F6] font-sans antialiased text-[13px]">
      {/* ATTIO CRM TARZI GİZLENEBİLİR SOL SIDEBAR */}
      {sidebarOpen && !studioOpen && (
        <aside className="w-[224px] shrink-0 border-r border-[#E6E7EA] dark:border-[#23262E] bg-[#F4F5F6] dark:bg-[#121317] flex flex-col justify-between select-none">
          <div className="p-2 space-y-2.5">
            <div className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-[#EAECED]/70 dark:hover:bg-[#1C1E24] transition">
              <Link href="/admin" className="flex items-center gap-2 min-w-0">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[#14151A] dark:bg-[#F3F4F6] text-[10px] font-bold text-white dark:text-[#14151A]">
                  N
                </div>
                <span className="text-[13px] font-semibold tracking-tight truncate">
                  NexPress
                </span>
                <span className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#1C1E24] px-1 py-0.2 text-[10px] font-mono text-[#5C5F66] dark:text-[#9CA3AF]">
                  {siteId}
                </span>
              </Link>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  title="Görünüm Modu"
                  className="flex h-6 w-6 items-center justify-center rounded text-[#5C5F66] dark:text-[#9CA3AF] hover:bg-[#EAECED] dark:hover:bg-[#22252D] transition"
                >
                  {theme === "dark" ? (
                    <Sun className="h-3.5 w-3.5" strokeWidth={1.75} />
                  ) : (
                    <Moon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  title="Kenar Çubuğunu Gizle (Ctrl+B)"
                  className="flex h-6 w-6 items-center justify-center rounded text-[#5C5F66] dark:text-[#9CA3AF] hover:bg-[#EAECED] dark:hover:bg-[#22252D] transition"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Attio Quick Search / Command Trigger */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="w-full h-7 flex items-center justify-between rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2 text-[12px] text-[#8C9099] hover:border-[#D0D3D9] dark:hover:border-[#2E323D] transition"
            >
              <span className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-[#8C9099]" strokeWidth={1.75} />
                <span>Hızlı arama...</span>
              </span>
              <kbd className="font-mono text-[10px] text-[#8C9099]">⌘K</kbd>
            </button>

            {/* Gruplanmış Attio Navigasyon Ağacı */}
            <div className="space-y-3 pt-0.5">
              {WORKSPACE_SECTIONS.map((section) => ({
                ...section,
                items: section.items.filter(
                  (item) => !item.adminOnly || role === "admin"
                ),
              }))
                .filter((section) => section.items.length > 0)
                .map((section) => (
                <div key={section.label} className="space-y-0.5">
                  <div className="px-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8C9099]">
                    {SECTION_LABEL_KEYS[section.label] ? t(SECTION_LABEL_KEYS[section.label]!) : section.label}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : item.href === "/admin/commerce"
                          ? pathname === "/admin/commerce" ||
                            (pathname.startsWith("/admin/commerce/") &&
                              !pathname.startsWith("/admin/commerce/marketplaces"))
                          : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] transition ${
                          isActive
                            ? "bg-[#EAECED] dark:bg-[#22252D] text-[#14151A] dark:text-[#F3F4F6] font-medium"
                            : "text-[#5C5F66] dark:text-[#9CA3AF] hover:bg-[#EAECED]/60 dark:hover:bg-[#1C1E24] hover:text-[#14151A] dark:hover:text-[#F3F4F6]"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isActive
                                ? "text-[#14151A] dark:text-[#F3F4F6]"
                                : "text-[#8C9099]"
                            }`}
                            strokeWidth={1.75}
                          />
                          <span className="truncate">{NAV_LABEL_KEYS[item.href] ? t(NAV_LABEL_KEYS[item.href]!) : item.label}</span>
                        </span>
                        {item.count && (
                          <span className="font-mono text-[10px] text-[#8C9099]">
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}

              {/* Kural 4: Open-Core Genişleme Yuvası (<PluginSlot name="admin.sidebar.nav" />) */}
              <div className="space-y-1 pt-2 border-t border-[#E6E7EA] dark:border-[#23262E]">
                <div className="px-2 pb-0.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#8C9099]">
                  <span>Agentic Feeds</span>
                </div>
                {sidebarSlot}
              </div>
              {accountSlot}
            </div>
          </div>

          {/* Alt Sistem Telemetri Özeti */}
          <div className="p-2 border-t border-[#E6E7EA] dark:border-[#23262E] space-y-1.5">
            <div className="rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2.5 py-1.5 space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-[#8C9099] flex items-center gap-1.5">
                  <Database className="h-3 w-3" strokeWidth={1.75} />
                  <span>DB Motoru</span>
                </span>
                <span className="inline-flex items-center gap-1 font-mono font-medium text-[#14151A] dark:text-[#F3F4F6]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {dbDialect}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8C9099]">Mod / Tema</span>
                <span className="font-mono text-[#5C5F66] dark:text-[#9CA3AF]">
                  {cmsMode === "single" ? "single" : "multi"} •{" "}
                  {activeThemeId.split("-")[0]}
                </span>
              </div>
            </div>

            <Link
              href="/tr"
              target="_blank"
              className="w-full h-7 flex items-center justify-between rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2.5 text-[12px] font-medium text-[#14151A] dark:text-[#F3F4F6] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] transition"
            >
              <span>Canlı RSC Vitrin (/tr)</span>
              <ExternalLink className="h-3 w-3 text-[#8C9099]" strokeWidth={1.75} />
            </Link>
          </div>
        </aside>
      )}

      {/* SAĞ ÇALIŞMA ALANI (SIFIR GEREKSİZ BOŞLUK, TAM GENİŞLİK ATTIO VIEWPORT) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 40px (h-10) Ultra-Kompakt Attio Top Breadcrumb Bar */}
        <header className="h-10 border-b border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-[12px]">
            {studioOpen ? (
              <Link
                href={studioBackHref}
                className="h-6 px-1.5 inline-flex items-center gap-1 rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] text-[#5C5F66] dark:text-[#9CA3AF] hover:text-[#14151A] dark:hover:text-white transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="text-[11px]">{studioBackLabel}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                title={
                  sidebarOpen
                    ? "Kenar Çubuğunu Gizle (Ctrl+B)"
                    : "Kenar Çubuğunu Göster (Ctrl+B)"
                }
                className="h-6 px-1.5 inline-flex items-center gap-1 rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] text-[#5C5F66] dark:text-[#9CA3AF] hover:text-[#14151A] dark:hover:text-white transition cursor-pointer"
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.75} />
                ) : (
                  <PanelLeftOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
                )}
                <span className="text-[11px] hidden sm:inline">
                  {sidebarOpen ? "Menüyü Gizle" : "Menüyü Göster"}
                </span>
              </button>
            )}
            <span className="font-medium text-[#14151A] dark:text-[#F3F4F6]">
              {currentBreadcrumb}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1 font-mono text-[11px]">
              <Link
                href="/llms.txt"
                target="_blank"
                className="h-6 inline-flex items-center rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2 text-[#5C5F66] dark:text-[#9CA3AF] hover:text-[#14151A] dark:hover:text-white transition"
              >
                /llms.txt
              </Link>
              <Link
                href="/tr?format=md"
                target="_blank"
                className="h-6 inline-flex items-center rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2 text-[#5C5F66] dark:text-[#9CA3AF] hover:text-[#14151A] dark:hover:text-white transition"
              >
                ?format=md
              </Link>
            </div>

            <NotificationBell />
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="h-6 inline-flex items-center gap-1.5 rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#1C1E24] px-2 text-[11px] font-medium text-[#14151A] dark:text-[#F3F4F6] hover:bg-[#F4F5F7] transition cursor-pointer"
            >
              <SlidersHorizontal className="h-3 w-3 text-[#8C9099]" />
              <span>Komutlar</span>
              <kbd className="font-mono text-[10px] text-[#8C9099]">⌘K</kbd>
            </button>
          </div>
        </header>

        {/* Tam Genişlikli, Sıfır Gereksiz Boşluklu İçerik Alanı */}
        <main className="flex-1 p-3 w-full">{children}</main>
      </div>

      {/* ATTIO CRM TARZI KOMUT PALETİ MODAL (Cmd+K / Ctrl+K) */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-[1px] pt-20 px-4"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b border-[#E6E7EA] dark:border-[#23262E] px-3.5 py-2.5 gap-2.5">
              <Search className="h-4 w-4 text-[#8C9099]" strokeWidth={1.75} />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nesne, görünüm, tema veya Agentic uç nokta ara..."
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8C9099]"
              />
              <button
                type="button"
                onClick={() => setCmdOpen(false)}
                className="rounded border border-[#E6E7EA] dark:border-[#23262E] px-1.5 py-0.5 text-[10px] font-mono text-[#8C9099]"
              >
                ESC
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.href}
                  type="button"
                  onClick={() => {
                    setCmdOpen(false);
                    router.push(cmd.href);
                  }}
                  className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] transition"
                >
                  <div>
                    <div className="text-[12px] font-medium text-[#14151A] dark:text-[#F3F4F6]">
                      {cmd.title}
                    </div>
                    <div className="text-[11px] text-[#8C9099]">
                      {cmd.subtitle}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#8C9099]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
