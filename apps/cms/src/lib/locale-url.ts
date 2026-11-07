import "server-only";
import { localeBase } from "@nexpress/core";
import { getPublicSite } from "./public-data";

/** Dilin dışarıya verilen kök adresi: tek dilli sitede boş, aksi halde `/{dil}`. Adres üretirken `${lb}/yol` yazılır; kök adres `lb || "/"`. */
export async function siteLocaleBase(siteId: string, locale: string): Promise<string> {
  return localeBase(await getPublicSite(siteId), locale);
}
