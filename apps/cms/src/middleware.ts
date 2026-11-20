import { NextResponse, type NextRequest } from "next/server";
import { resolveLocaleMode, type LocaleMode } from "@nexpress/core/locale-path";
import { sanitizePermalinkStructure, stripPermalinkPrefix, type PermalinkStructure } from "@nexpress/core/permalinks";
import { resolveSiteIdFromHost } from "@nexpress/core/tenancy";
import { verifySessionToken } from "@nexpress/core/session";
import { canOpenAdminPath, isLimitedRole } from "@nexpress/core/permissions";
import { htmlCacheControl } from "@nexpress/core/html-cache";
import { canonicalHostRedirect } from "@nexpress/core/host-redirect";
import { DEFAULT_CRAWL_HYGIENE, hasGoneParam, hasUnknownQueryParams, matchesGoneRule, sanitizeCrawlHygiene, type CrawlHygiene } from "@nexpress/core/crawl-hygiene";
import { SESSION_COOKIE, getAuthSecret } from "@/lib/auth/config";
import { isReservedPath } from "@/lib/public-paths";

/** Yalnızca `admin` rolünün açabildiği yönetim yolları. */
const ADMIN_ONLY_PATHS = ["/admin/users", "/admin/audit", "/admin/settings", "/admin/requests", "/admin/system", "/admin/redirects", "/admin/backup", "/admin/forms/email", "/admin/integrations", "/admin/content-types", "/admin/users/roles", "/admin/plugins/packages", "/admin/members"];

/** 410 kurallarının asla uygulanmadığı yollar: panel, API, medya, oturum sayfaları, site haritası ve kök dosyalar. */
const PROTECTED_PATH = /^\/(?:admin|api|_next|media|og|login|forgot-password|reset-password|sitemaps|\.well-known)(?:\/|$)|^\/(?:robots\.txt|sitemap\.xml|llms(?:-full)?\.txt|favicon\.ico|feed\.xml|atom\.xml|indexnow-key\.txt|manifest\.webmanifest)$/;

type SiteGate = LocaleMode & { index: boolean; permalink: PermalinkStructure; hygiene: CrawlHygiene };

const modeCache = new Map<string, { mode: SiteGate; at: number }>();

/** Dil kipi ve arama indeksi. Sorgu düşerse son başarılı sonuç kalır. */
async function siteGate(request: NextRequest, siteId: string): Promise<SiteGate> {
  const hit = modeCache.get(siteId);
  if (hit && Date.now() - hit.at < 15_000) return hit.mode;
  let fetched: (LocaleMode & { index?: boolean; permalink?: string; hygiene?: unknown }) | null = null;
  const port = process.env.PORT || "3000";
  const origins = [...new Set([process.env.INTERNAL_APP_URL, `http://127.0.0.1:${port}`, request.nextUrl.origin].filter((o): o is string => Boolean(o)))];
  for (const origin of origins) {
    try {
      const res = await fetch(`${origin}/api/locale-mode`, {
        headers: { "x-nexpress-site-id": siteId, host: request.headers.get("host") ?? "" },
        signal: AbortSignal.timeout(800),
        cache: "no-store",
      });
      if (!res.ok) continue;
      fetched = (await res.json()) as LocaleMode & { index?: boolean; permalink?: string; hygiene?: unknown };
      break;
    } catch {
      /* sonraki adres */
    }
  }
  const mode = resolveLocaleMode(fetched, hit?.mode ?? null);
  const index = typeof fetched?.index === "boolean" ? fetched.index : hit?.mode.index ?? true;
  const permalink = sanitizePermalinkStructure(fetched?.permalink ?? hit?.mode.permalink);
  const hygiene = fetched ? sanitizeCrawlHygiene(fetched.hygiene) : (hit?.mode.hygiene ?? DEFAULT_CRAWL_HYGIENE);
  const gate: SiteGate = { ...mode, index, permalink, hygiene };
  modeCache.set(siteId, { mode: gate, at: Date.now() });
  return gate;
}

export async function middleware(request: NextRequest) {
  // `/sayfa.md`: aynı içeriğin Markdown karşılığı (`?format=md` ve `Accept: text/markdown` ile aynı yanıt). Panel, API, medya ve dosya yolları hariç.
  if (/^\/(?!admin\/|api\/|_next\/|media\/|wp-content\/|sitemaps\/|\.well-known\/)[^?]+\.md$/.test(request.nextUrl.pathname)) {
    request.nextUrl.pathname = request.nextUrl.pathname.slice(0, -3);
    request.nextUrl.searchParams.set("format", "md");
  }
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get("host");
  // www ↔ apeks: kanonik adres NEXT_PUBLIC_APP_URL. Kiracı alt alanına ve localhost'a uygulanmaz.
  const canonicalOrigin = canonicalHostRedirect(host, process.env.NEXT_PUBLIC_APP_URL);
  if (canonicalOrigin) {
    const dest = new URL(`${pathname}${request.nextUrl.search}`, canonicalOrigin);
    return NextResponse.redirect(dest, 308);
  }
  const siteId = resolveSiteIdFromHost(host);

  // Tek dilli sitede dil ön eki yoktur: `/tr/x` → 308 `/x`; ön eksiz yol içeride `/tr/x` olarak yeniden yazılır.
  const gate = pathname === "/api/locale-mode" ? null : await siteGate(request, siteId);
  const indexing = gate?.index !== false;
  // Spam/artık adresler: `410 Gone` (arama motoruna "kalıcı silindi"); yönetim, API, medya ve dosya yolları hariç
  if (gate && (request.method === "GET" || request.method === "HEAD") && !PROTECTED_PATH.test(pathname) && (matchesGoneRule(pathname, gate.hygiene.goneRules) || hasGoneParam(searchParams, gate.hygiene.goneParams))) {
    return new NextResponse(request.method === "HEAD" ? null : "410 Gone\n", { status: 410, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "public, max-age=86400" } });
  }
  const publicPath = gate ? stripPermalinkPrefix(pathname, gate.permalink) : pathname;
  const seal = (response: NextResponse) => {
    if (!indexing) response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  };
  const prefixless = Boolean(gate && !isReservedPath(pathname) && gate.single);
  if (gate && prefixless && (publicPath === `/${gate.locale}` || publicPath.startsWith(`/${gate.locale}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = publicPath.slice(gate.locale.length + 1) || "/";
    return seal(NextResponse.redirect(url, 308));
  }
  const internalPath = gate && prefixless ? `/${gate.locale}${publicPath === "/" ? "" : publicPath}` : publicPath;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nexpress-site-id", siteId);
  if (prefixless) requestHeaders.set("x-nexpress-prefixless", "1");
  else requestHeaders.delete("x-nexpress-prefixless");
  // AI yönlendirme izleme girdileri: istemciden gelen değerler her zaman ezilir
  requestHeaders.set("x-nexpress-path", internalPath);
  requestHeaders.set("x-nexpress-search", searchParams.toString().slice(0, 180));
  // Tema önizleme: yalnızca geçerli oturumlu kullanıcı için (`?nx_preview=<tema>`); istemciden gelen başlık her zaman ezilir
  requestHeaders.delete("x-nexpress-preview-theme");
  const previewId = searchParams.get("nx_preview");
  let previewing = false;
  if (previewId && /^[a-z0-9][a-z0-9-]{1,38}$/.test(previewId) && !pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    const sess = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, getAuthSecret());
    if (sess && sess.siteId === siteId) {
      requestHeaders.set("x-nexpress-preview-theme", previewId);
      previewing = true;
    }
  }
  requestHeaders.set("x-nexpress-pathname", internalPath);
  // Sayfa dili (kök <html lang/dir> için): ilk yol parçası dil etiketi gibiyse o, değilse boş
  const lang = internalPath.match(/^\/([a-z]{2,3}(?:-[a-z0-9]{2,8})?)(?:\/|$)/)?.[1];
  if (lang) requestHeaders.set("x-nexpress-locale", lang);
  else requestHeaders.delete("x-nexpress-locale");
  const utm = searchParams.get("utm_source");
  if (utm) requestHeaders.set("x-nexpress-utm-source", utm.slice(0, 60));
  else requestHeaders.delete("x-nexpress-utm-source");

  // Eski pazar yeri adresi sanal mağaza eklentisine taşındı
  if (pathname === "/admin/commerce/marketplaces" || pathname.startsWith("/admin/commerce/marketplaces/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/admin/commerce/marketplaces", "/admin/marketplaces");
    return NextResponse.redirect(url, 308);
  }

  // /admin yalnızca bu siteye ait geçerli oturumla açılır
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const session = await verifySessionToken(
      request.cookies.get(SESSION_COOKIE)?.value,
      getAuthSecret()
    );
    if (!session || session.siteId !== siteId) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return seal(NextResponse.redirect(url));
    }
    // Sınırlı roller (yazar, katkıcı): yalnızca kendi içerik yolları; kök "içeriklerim"e yönlenir
    if (isLimitedRole(session.role) && !canOpenAdminPath(session.role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/my-content";
      url.search = "";
      return seal(NextResponse.redirect(url));
    }
    // Yönetici bölümleri: editör için anında 307 (sayfa içinde de veritabanı rolüyle ayrıca denetlenir)
    if (session.role !== "admin" && ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return seal(NextResponse.redirect(url));
    }
  }

  // Kök dizini varsayılan dile yönlendir
  if (pathname === "/" && !prefixless) {
    const url = request.nextUrl.clone();
    url.pathname = "/tr";
    return seal(NextResponse.redirect(url));
  }

  // Kural 5 & 04-CORE-SEO-AND-GEO:
  // ?format=md veya Accept: text/markdown geldiğinde 0ms CPU maliyetiyle markdownCache döndür
  const wantsMarkdown =
    searchParams.get("format") === "md" ||
    (request.headers.get("accept")?.includes("text/markdown") ?? false);

  if (
    wantsMarkdown &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next")
  ) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/api/markdown-negotiation";
    rewriteUrl.searchParams.set("targetPath", internalPath);
    // Yeniden yazılan sorgu, rota işleyicisinin nextUrl'ine düşmeyebilir.
    // Asıl yol bu yüzden istek başlığında taşınır.
    requestHeaders.set("x-nexpress-target-path", internalPath);
    return seal(NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    }));
  }

  let response: NextResponse;
  if (prefixless || publicPath !== pathname) {
    const rewriteTo = request.nextUrl.clone();
    rewriteTo.pathname = internalPath;
    response = NextResponse.rewrite(rewriteTo, { request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (previewing) response.headers.set("Cache-Control", "private, no-store");
  // Taslak önizleme bağlantısı: asla paylaşımlı önbelleğe girmez, dizinlenmez
  if (searchParams.has("nx_draft")) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  if (!indexing) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  // Bilinmeyen sorgu parametreli sayfa (`/?j=rastgele`) yinelenen adres olarak dizinlenmesin; izleme/sayfalama parametreleri etkilenmez
  else if (gate?.hygiene.noindexUnknownParams && (request.method === "GET" || request.method === "HEAD") && !isReservedPath(pathname) && !pathname.startsWith("/admin") && !pathname.startsWith("/api") && hasUnknownQueryParams(searchParams)) {
    response.headers.set("X-Robots-Tag", "noindex, follow");
  }
  // Paylaşımlı (CDN/vekil) HTML önbelleği: çalışma zamanında `PUBLIC_CACHE_SECONDS`; yalnızca herkese aynı çıktı veren istekler
  if (!previewing && !searchParams.has("nx_draft")) {
    const cacheControl = htmlCacheControl({
      method: request.method,
      path: internalPath,
      searchParams,
      cookieNames: request.cookies.getAll().map((c) => c.name),
      ttlSeconds: Number(process.env.PUBLIC_CACHE_SECONDS ?? 0),
    });
    // Kapalı siteler (noindex) paylaşımlı önbelleğe girmez: kapı kararı değişince bayat kopya kalmasın
    if (cacheControl && indexing) response.headers.set("Cache-Control", cacheControl);
  }
  // Yapay zeka istemcileri için keşif: aynı içeriğin Markdown karşılığı (tek segmentli dil yolları)
  if (/^\/[a-z]{2}(\/[^/]+)?$/.test(internalPath)) {
    response.headers.append("Link", `<${pathname}?format=md>; rel="alternate"; type="text/markdown"`);
  }
  return response;
}

export const config = {
  // favicon.ico dışarıda bırakılmaz: kiracı başlığı (x-nexpress-site-id) simge rotasına da ulaşmalı
  matcher: ["/((?!_next/static|_next/image).*)"],
};
