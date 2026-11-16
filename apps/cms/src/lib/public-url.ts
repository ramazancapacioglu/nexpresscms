/**
 * Ziyaretçiye dönen mutlak adres. Ters vekil arkasında `request.url` ana makine adı olarak `localhost:PORT` verir
 * (Next, `Host` başlığını kullanmaz); bu yüzden yönlendirmeler ziyaretçiyi `localhost`a gönderirdi.
 * Ana makine `Host` / `X-Forwarded-Host` başlığından, şema `X-Forwarded-Proto` başlığından okunur; geçersizse `request.url`.
 */
const HOST_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{2,5})?$/i;

export function publicUrl(path: string, request: Request): URL {
  const headers = request.headers;
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "").split(",")[0]?.trim() ?? "";
  const proto = (headers.get("x-forwarded-proto") ?? "").split(",")[0]?.trim() === "http" ? "http" : "https";
  if (!HOST_RE.test(host)) return new URL(path, request.url);
  const scheme = /^(localhost|127\.0\.0\.1)(:|$)/.test(host) && !headers.get("x-forwarded-proto") ? "http" : proto;
  return new URL(path, `${scheme}://${host}`);
}
