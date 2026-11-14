/**
 * `www` ile apeks arasındaki tek farkı, `NEXT_PUBLIC_APP_URL` üzerindeki kanonik ada 308 ile çeker.
 * Başka alt alan adlarına (kiracı) dokunmaz. Ara katman bu işlevi kullanır; Node API'si yoktur.
 */

/** Yönlendirilecek kök (`https://alanadiniz.com`). Gerek yoksa `null`. */
export function canonicalHostRedirect(requestHost: string | null | undefined, appUrl: string | undefined): string | null {
  const raw = (requestHost ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  const configured = appUrl?.trim() ?? "";
  if (!raw || !configured) return null;
  let canonical: URL;
  try {
    canonical = new URL(configured);
  } catch {
    return null;
  }
  if (canonical.protocol !== "http:" && canonical.protocol !== "https:") return null;
  const reqHost = raw.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  const canHost = canonical.hostname.toLowerCase();
  if (reqHost === canHost) return null;
  if (reqHost === "localhost" || reqHost === "127.0.0.1" || reqHost === "::1") return null;
  if (canHost === "localhost" || canHost === "127.0.0.1" || canHost === "::1") return null;
  const bare = (host: string) => (host.startsWith("www.") ? host.slice(4) : host);
  if (!bare(reqHost) || bare(reqHost) !== bare(canHost)) return null;
  return canonical.origin;
}
