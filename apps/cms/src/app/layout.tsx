import type { Metadata } from "next";
import "@/plugins/register";
import "./globals.css";

import { headers } from "next/headers";
import { localeDirection, resolveSiteSettings, webmasterVerification } from "@nexpress/core";
import { getPublicSite } from "@/lib/public-data";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  const hasIcon = Boolean(resolveSiteSettings(site?.settings).seo.siteIcon);
  return {
    title: site?.name ?? "NexPress CMS",
    description: site?.tagline || undefined,
    verification: webmasterVerification(site?.settings?.seo?.verification),
    // Simge ayarlıysa sekme, ana ekran ve manifest bağlantıları basılır (ayarlı değilse kırık adres yazılmaz)
    ...(hasIcon
      ? {
          icons: { icon: [{ url: "/favicon.ico", sizes: "32x32", type: "image/png" }, { url: "/api/site-icon/192", sizes: "192x192", type: "image/png" }], apple: "/apple-touch-icon.png" },
          manifest: "/manifest.webmanifest",
        }
      : {}),
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
