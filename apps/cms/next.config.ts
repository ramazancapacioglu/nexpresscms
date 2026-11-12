import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * İçerik Güvenliği Politikası (yalnızca üretim; geliştirme `eval` kullanır). Next.js'in RSC verisi için satır içi betik
 * gerektiğinden `script-src` 'unsafe-inline' içerir; asıl kazanım: eklenti/nesne yok, dış betik yok, taban adresi ve
 * form hedefi kısıtlı, çerçeveleme yalnızca aynı kökenden, görsel/medya/çerçeve kaynakları sınırlı.
 * `CSP_MODE=report` yalnızca raporlar (ihlali engellemez), `off` kapatır; varsayılan `enforce`.
 * Ek kaynak (ör. analitik) gerekirse `CSP_EXTRA_SCRIPT_SRC="https://x.test"` (boşlukla ayrılmış).
 */
const cspMode = process.env.CSP_MODE ?? "enforce";
const extraScript = (process.env.CSP_EXTRA_SCRIPT_SRC ?? "").replace(/[;\r\n]/g, " ").trim();
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${extraScript ? ` ${extraScript}` : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${extraScript ? ` ${extraScript}` : ""}`,
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ...(isProd && cspMode !== "off" ? [{ key: cspMode === "report" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", value: csp }] : []),
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

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
    "@nexpress-pro/ai-design",
  ],
  // Yerel/yerel-ikili sürücüler paketlenmez (webpack README/LICENSE ve .node dosyalarını ayrıştıramaz)
  serverExternalPackages: ["@libsql/client", "libsql", "postgres", "sharp"],
  experimental: {
    // Middleware tüm istekten geçer; Next gövdeyi varsayılan 10 MB'ta keser (WordPress dışa aktarma dosyası 64 MB'a kadar).
    middlewareClientMaxBodySize: "70mb",
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
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
