import { slugFromTitle } from "@nexpress/core";

/** Yazar arşiv adresi. Aynı ada düşen ilk kullanıcı sayfayı açar. */
export function authorSlug(name: string): string {
  return slugFromTitle(name, 60) || "yazar";
}
