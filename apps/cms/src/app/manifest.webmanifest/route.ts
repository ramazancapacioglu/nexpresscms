import { NextResponse } from "next/server";
import { resolveSiteSettings } from "@nexpress/core";
import { getPublicSite } from "@/lib/public-data";

/** Web uygulama bildirimi: ad, renk ve simgeler. Site simgesi ayarlı değilse 404 (boş simge yayımlanmaz). */
export async function GET(request: Request) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  const settings = resolveSiteSettings(site?.settings);
  if (!settings.seo.siteIcon) return new NextResponse(null, { status: 404 });
  const name = (site?.name ?? "NexPress").trim();
  const shortName = (() => {
    if (name.length <= 16) return name;
    const words = name.split(/\s+/);
    let acc = "";
    for (const w of words) {
      const next = acc ? `${acc} ${w}` : w;
      if (next.length > 16) break;
      acc = next;
    }
    return acc || name.slice(0, 12).trim();
  })();
  return NextResponse.json(
    {
      name,
      short_name: shortName,
      start_url: "/",
      display: "browser",
      theme_color: site?.designTokens?.colors.primary ?? "#2563eb",
      background_color: site?.designTokens?.colors.background ?? "#ffffff",
      icons: [
        { src: "/api/site-icon/192", sizes: "192x192", type: "image/png" },
        { src: "/api/site-icon/512", sizes: "512x512", type: "image/png" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } }
  );
}
