import type { CommerceSettings } from "@nexpress/commerce";

export function shopBasePath(settings: CommerceSettings, locale: string): string {
  const segment = settings.shopBasePath.replace(/^\/+|\/+$/g, "") || "magaza";
  return `/${locale}/${segment}`;
}
