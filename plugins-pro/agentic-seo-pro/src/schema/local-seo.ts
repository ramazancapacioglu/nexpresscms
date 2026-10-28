/** Yerel SEO (saf mantık): LocalBusiness JSON-LD düğümü ve geo meta etiketleri. */
export interface LocalBusinessSettings {
  businessName?: string;
  businessType?: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  latitude?: number | "";
  longitude?: number | "";
  priceRange?: string;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Adres veya koordinattan hiçbiri yoksa `null` (boş düğüm üretilmez). */
export function buildLocalBusinessNode(s: LocalBusinessSettings, ctx: { siteName: string; url: string; id: string }): Record<string, unknown> | null {
  const lat = num(s.latitude);
  const lon = num(s.longitude);
  const hasAddress = Boolean(str(s.street) || str(s.city));
  if (!hasAddress && lat === undefined) return null;
  return {
    "@type": str(s.businessType) || "LocalBusiness",
    "@id": ctx.id,
    name: str(s.businessName) || ctx.siteName,
    url: ctx.url,
    ...(str(s.phone) ? { telephone: str(s.phone) } : {}),
    ...(str(s.email) ? { email: str(s.email) } : {}),
    ...(str(s.priceRange) ? { priceRange: str(s.priceRange) } : {}),
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            ...(str(s.street) ? { streetAddress: str(s.street) } : {}),
            ...(str(s.city) ? { addressLocality: str(s.city) } : {}),
            ...(str(s.region) ? { addressRegion: str(s.region) } : {}),
            ...(str(s.postalCode) ? { postalCode: str(s.postalCode) } : {}),
            addressCountry: str(s.country) || "TR",
          },
        }
      : {}),
    ...(lat !== undefined && lon !== undefined ? { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lon } } : {}),
  };
}

/** `geo.region`, `geo.placename`, `geo.position`, `ICBM` etiketleri. */
export function buildGeoMeta(s: LocalBusinessSettings): Array<{ name: string; content: string }> {
  const tags: Array<{ name: string; content: string }> = [];
  const country = str(s.country) || "TR";
  const region = str(s.region);
  if (region) tags.push({ name: "geo.region", content: `${country}-${region}` });
  else tags.push({ name: "geo.region", content: country });
  if (str(s.city)) tags.push({ name: "geo.placename", content: str(s.city) });
  const lat = num(s.latitude);
  const lon = num(s.longitude);
  if (lat !== undefined && lon !== undefined) {
    tags.push({ name: "geo.position", content: `${lat};${lon}` }, { name: "ICBM", content: `${lat}, ${lon}` });
  }
  return tags;
}
