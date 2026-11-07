import type { CommerceSettings } from "@nexpress/commerce";

/** Mağaza kök adresi. `lb` dilin kök adresidir (`/tr`; tek dilli sitede boş). */
export function shopBasePath(settings: CommerceSettings, lb: string): string {
  const segment = settings.shopBasePath.replace(/^\/+|\/+$/g, "") || "magaza";
  return `${lb}/${segment}`;
}
