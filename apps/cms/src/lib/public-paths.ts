/** Dil ön eki kuralının dışında kalan yollar: panel, API, medya, oturum sayfaları, kök dosyalar ve dosya uzantılı yollar. */
const RESERVED = /^\/(admin|api|_next|media|login|forgot-password|reset-password|og|sitemaps|\.well-known)(\/|$)/;
const ROOT_FILES = /^\/(sitemap\.xml|robots\.txt|llms(-full)?\.txt|feed\.xml|atom\.xml|ai-feed\.json|ai-sitemap\.json|indexnow-key\.txt|merchant-feed\.xml|favicon\.ico|manifest\.webmanifest)$/;

export const isReservedPath = (pathname: string): boolean => RESERVED.test(pathname) || ROOT_FILES.test(pathname) || /\.[a-z0-9]{2,5}$/i.test(pathname);
