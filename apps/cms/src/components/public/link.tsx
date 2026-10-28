import type { AnchorHTMLAttributes } from "react";

/**
 * Ziyaretçi sayfaları için düz bağlantı. `next/link` istemci JS'i (ön yükleme, yumuşak gezinti)
 * indirir; içerik siteleri için tam sayfa gezinti + CDN önbelleği daha hızlı ve 0 KB'dır.
 */
export function Link({ href, ...rest }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string }) {
  return <a href={href} {...rest} />;
}
