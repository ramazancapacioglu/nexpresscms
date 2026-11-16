import "server-only";
import { sanitizeOrganizationSchema } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { parsePublicHead } from "@nexpress/wp-importer";
import { readMediaMap } from "../store";
import type { WpSession } from "./session";

/**
 * Site geneli kuruluş şeması: yerel işletme alanları (adres, saat, telefon, koordinat), sameAs ve logo.
 * Kaynak ana sayfanın JSON-LD'sinden okunur. Logo medya kitaplığındaysa yerel adres yazılır.
 */
export async function importSiteSeo(session: WpSession, siteId: string): Promise<{ organizationFields: number; sameAs: number; logo: string }> {
  const head = parsePublicHead(await session.text("/"));
  const org = head.organization;
  if (!org) return { organizationFields: 0, sameAs: 0, logo: "" };
  const schema = sanitizeOrganizationSchema(org.schema);
  const map = await readMediaMap(siteId);
  const logoUrl = org.logo.split("?")[0] ?? "";
  const logo = map[logoUrl] ?? (org.logo.startsWith("https://") ? org.logo : "");
  await getScopedRepository(siteId).saveSiteSettings({
    seo: {
      organizationName: org.name,
      ...(logo ? { organizationLogo: logo } : {}),
      ...(org.sameAs.length > 0 ? { sameAs: org.sameAs } : {}),
      ...(schema ? { organizationSchema: schema } : {}),
    },
  });
  return { organizationFields: schema ? Object.keys(schema).length : 0, sameAs: org.sameAs.length, logo: logo ? (logo === org.logo ? "uzak" : "yerel") : "yok" };
}
