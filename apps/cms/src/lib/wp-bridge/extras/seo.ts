import "server-only";
import { sanitizeOrganizationSchema } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { originalUploadUrl, parsePublicHead } from "@nexpress/wp-importer";
import { readMediaMap } from "../store";
import type { WpSession } from "./session";

/**
 * Site geneli kuruluş şeması: yerel işletme alanları (adres, saat, telefon, koordinat), sameAs ve logo.
 * Kaynak ana sayfanın JSON-LD'sinden okunur. Logo medya kitaplığındaysa yerel adres yazılır.
 */
export async function importSiteSeo(session: WpSession, siteId: string): Promise<{ organizationFields: number; sameAs: number; logo: string }> {
  const homeHtml = await session.text("/");
  const head = parsePublicHead(homeHtml);
  const org = head.organization;
  if (!org) return { organizationFields: 0, sameAs: 0, logo: "" };
  const schema = sanitizeOrganizationSchema(org.schema);
  const map = await readMediaMap(siteId);
  const logoUrl = org.logo.split("?")[0] ?? "";
  const logo = map[logoUrl] ?? (org.logo.startsWith("https://") ? org.logo : "");
  // Site simgesi (favicon): kaynaktaki `rel="icon"` görselinin yerel kopyası; yoksa `/favicon.ico` 404 verir
  const iconHref = /<link[^>]+rel=["']icon["'][^>]*href=["']([^"']+)["']/i.exec(homeHtml)?.[1] ?? "";
  const iconKey = iconHref ? originalUploadUrl(iconHref) : "";
  const siteIcon = map[iconHref.split("?")[0] ?? ""] ?? map[iconKey] ?? map[logoUrl] ?? "";
  await getScopedRepository(siteId).saveSiteSettings({
    seo: {
      organizationName: org.name,
      ...(siteIcon ? { siteIcon } : {}),
      ...(logo ? { organizationLogo: logo } : {}),
      ...(org.sameAs.length > 0 ? { sameAs: org.sameAs } : {}),
      ...(schema ? { organizationSchema: schema } : {}),
    },
  });
  return { organizationFields: schema ? Object.keys(schema).length : 0, sameAs: org.sameAs.length, logo: logo ? (logo === org.logo ? "uzak" : "yerel") : "yok" };
}
