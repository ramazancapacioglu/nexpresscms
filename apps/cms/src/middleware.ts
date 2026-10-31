import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteIdFromHost } from "@nexpress/core/tenancy";
import { verifySessionToken } from "@nexpress/core/session";
import { SESSION_COOKIE, getAuthSecret } from "@/lib/auth/config";

/** Yalnızca `admin` rolünün açabildiği yönetim yolları. */
const ADMIN_ONLY_PATHS = ["/admin/users", "/admin/audit", "/admin/settings", "/admin/requests", "/admin/system", "/admin/redirects", "/admin/backup", "/admin/forms/email", "/admin/integrations"];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get("host");
  const siteId = resolveSiteIdFromHost(host);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nexpress-site-id", siteId);
  // AI yönlendirme izleme girdileri: istemciden gelen değerler her zaman ezilir
  requestHeaders.set("x-nexpress-path", pathname);
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
  requestHeaders.set("x-nexpress-pathname", pathname);
  // Sayfa dili (kök <html lang/dir> için): ilk yol parçası dil etiketi gibiyse o, değilse boş
  const lang = pathname.match(/^\/([a-z]{2,3}(?:-[a-z0-9]{2,8})?)(?:\/|$)/)?.[1];
  if (lang) requestHeaders.set("x-nexpress-locale", lang);
  else requestHeaders.delete("x-nexpress-locale");
  const utm = searchParams.get("utm_source");
  if (utm) requestHeaders.set("x-nexpress-utm-source", utm.slice(0, 60));
  else requestHeaders.delete("x-nexpress-utm-source");

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
      return NextResponse.redirect(url);
    }
    // Yönetici bölümleri: editör için anında 307 (sayfa içinde de veritabanı rolüyle ayrıca denetlenir)
    if (session.role !== "admin" && ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Kök dizini varsayılan dile yönlendir
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/tr";
    return NextResponse.redirect(url);
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
    rewriteUrl.searchParams.set("targetPath", pathname);
    // Yeniden yazılan sorgu, rota işleyicisinin nextUrl'ine düşmeyebilir.
    // Asıl yol bu yüzden istek başlığında taşınır.
    requestHeaders.set("x-nexpress-target-path", pathname);
    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  if (previewing) response.headers.set("Cache-Control", "private, no-store");
  // Taslak önizleme bağlantısı: asla paylaşımlı önbelleğe girmez, dizinlenmez
  if (searchParams.has("nx_draft")) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  // Yapay zeka istemcileri için keşif: aynı içeriğin Markdown karşılığı (tek segmentli dil yolları)
  if (/^\/[a-z]{2}(\/[^/]+)?$/.test(pathname)) {
    response.headers.append("Link", `<${pathname}?format=md>; rel="alternate"; type="text/markdown"`);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
