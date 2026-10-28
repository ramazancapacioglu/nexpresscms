import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

/**
 * Ziyaretçi HTML'i için CDN önbelleği (saniye). 0 = kapalı (varsayılan).
 * Değer derleme anında okunur. Düzenleme sonrası CDN'deki kopya en fazla bu kadar bayat kalır;
 * uygulama içi veri önbelleği ise yazma anında düşer. Mağaza yolları bilerek hariçtir (sepet çerezi).
 */
const publicCacheSeconds = Number(process.env.PUBLIC_CACHE_SECONDS ?? 0);
const publicCacheControl = `public, s-maxage=${publicCacheSeconds}, stale-while-revalidate=${publicCacheSeconds * 5}`;

const nextConfig: NextConfig = {
  // Doğrulama/CI için ayrı çıktı klasörü: aynı klasörde çalışan bir `next dev` ile çakışmaz.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  compress: true,
  transpilePackages: [
    "@nexpress/core",
    "@nexpress/database",
    "@nexpress/editor",
    "@nexpress/themes",
    "@nexpress/seo-core",
    "@nexpress/i18n",
    "@nexpress/rag",
    "@nexpress/wp-importer",
    "@nexpress-pro/agentic-seo",
  ],
  // Yerel/yerel-ikili sürücüler paketlenmez (webpack README/LICENSE ve .node dosyalarını ayrıştıramaz)
  serverExternalPackages: ["@libsql/client", "libsql", "postgres", "sharp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    const publicHtml =
      publicCacheSeconds > 0
        ? ["/:locale(tr)", "/:locale(tr)/:slug((?!magaza(?:/|$)).+)"].map((source) => ({
            source,
            headers: [{ key: "Cache-Control", value: publicCacheControl }],
          }))
        : [];
    return [
      { source: "/:path*", headers: securityHeaders },
      ...publicHtml,
      {
        // Yönetim ve giriş sayfaları çerçeveye alınamaz ve önbelleğe alınmaz
        source: "/(admin|login)/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
