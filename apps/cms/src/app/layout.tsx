import type { Metadata } from "next";
import "@/plugins/register";
import "./globals.css";

import { headers } from "next/headers";
import { localeDirection, webmasterVerification } from "@nexpress/core";
import { getPublicSite } from "@/lib/public-data";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  return {
    title: "NexPress CMS — Open-Core Dual-Engine Platform",
    description:
      "Next.js 15 (100/100 Lighthouse RSC), Dual-Database (LibSQL & PostgreSQL/pgvector), Theme Store & Agentic SEO CMS",
    verification: webmasterVerification(site?.settings?.seo?.verification),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  // Ziyaretçi sayfaları: URL dili. Yönetim paneli: kullanıcının panel dili (CSS `uppercase` doğru dil kuralıyla çalışsın).
  const path = h.get("x-nexpress-path") ?? "";
  const adminLang = path === "/admin" || path.startsWith("/admin/") ? (await getSession())?.uiLocale : undefined;
  const lang = adminLang ?? h.get("x-nexpress-locale") ?? "tr";
  return (
    <html lang={lang} dir={localeDirection(lang)} suppressHydrationWarning>
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
