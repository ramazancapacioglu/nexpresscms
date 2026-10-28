import type { Metadata } from "next";
import "@/plugins/register";
import "./globals.css";

import { headers } from "next/headers";
import { localeDirection, webmasterVerification } from "@nexpress/core";
import { getPublicSite } from "@/lib/public-data";

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
  const lang = (await headers()).get("x-nexpress-locale") ?? "tr";
  return (
    <html lang={lang} dir={localeDirection(lang)} suppressHydrationWarning>
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
