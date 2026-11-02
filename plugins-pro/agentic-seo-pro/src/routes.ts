import { isPluginModuleEnabled, pickLocale, pluginRoutes, resolvePublishing } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { PLUGIN_ID } from "./module-gate";
import { getCommerceRepository } from "@nexpress/database";
import { buildAiFeed } from "./geo/ai-feed";
import { buildMerchantFeed } from "./commerce/merchant-feed";
import { buildAiPluginManifest, buildNlwebManifest, buildOpenApiYaml } from "./geo/discovery-files";

const baseUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const CACHE = "public, s-maxage=300, stale-while-revalidate=3600";

const json = (body: unknown, siteId: string, contentType = "application/json; charset=utf-8") =>
  new Response(JSON.stringify(body, null, 2), { status: 200, headers: { "Content-Type": contentType, "Cache-Control": CACHE, "X-NexPress-Site-Id": siteId } });

/** Çekirdeğin sabit uç noktalarına işleyici bağlar; modül kapalıysa `null` (→ 404). */
export function registerAgenticRoutes(): void {
  pluginRoutes.register("ai-feed", PLUGIN_ID, async ({ siteId, request }) => {
    if (!(await isPluginModuleEnabled(siteId, PLUGIN_ID, "ai-feed"))) return null;
    const repo = getScopedRepository(siteId);
    const site = await repo.getSite();
    const defaultLocale = site?.defaultLocale ?? "tr";
    const locale = pickLocale(new URL(request.url).searchParams.get("locale"), site?.supportedLocales ?? [defaultLocale], defaultLocale);
    const contents = await repo.listContents({ locale, status: "published" });
    const visible = contents.filter((c) => !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public");
    return json(
      buildAiFeed({
        siteName: site?.name ?? "NexPress",
        baseUrl: baseUrl(),
        locale,
        items: visible.map((c) => ({
          id: c.contentId,
          title: c.title,
          slug: c.slug,
          type: c.type,
          schemaType: c.schemaType,
          importanceScore: c.importanceScore,
          tldr: c.tldr,
          updatedAt: new Date(c.updatedAt),
          publishedAt: c.publishedAt ? new Date(c.publishedAt) : null,
        })),
      }),
      siteId
    );
  });

  // Google Merchant Center ürün beslemesi (yayındaki ürünler; eksik verililer yok sayılır)
  pluginRoutes.register("merchant-feed", PLUGIN_ID, async ({ siteId, request }) => {
    if (!(await isPluginModuleEnabled(siteId, PLUGIN_ID, "merchant-feed"))) return null;
    const site = await getScopedRepository(siteId).getSite();
    const defaultLocale = site?.defaultLocale ?? "tr";
    const locale = pickLocale(new URL(request.url).searchParams.get("locale"), site?.supportedLocales ?? [defaultLocale], defaultLocale);
    const products = await getCommerceRepository(siteId).listProducts({ status: "published" });
    const xml = buildMerchantFeed({ siteName: site?.name ?? "NexPress", baseUrl: baseUrl(), locale, products });
    return new Response(xml, { status: 200, headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": CACHE, "X-NexPress-Site-Id": siteId } });
  });

  const wellKnown = (key: string, make: (i: { siteName: string; description: string; baseUrl: string }) => unknown, type?: string) =>
    pluginRoutes.register(key, PLUGIN_ID, async ({ siteId }) => {
      if (!(await isPluginModuleEnabled(siteId, PLUGIN_ID, "well-known"))) return null;
      const site = await getScopedRepository(siteId).getSite();
      const body = make({ siteName: site?.name ?? "NexPress", description: site?.tagline || site?.name || "", baseUrl: baseUrl() });
      return typeof body === "string"
        ? new Response(body, { status: 200, headers: { "Content-Type": type ?? "text/plain; charset=utf-8", "Cache-Control": CACHE, "X-NexPress-Site-Id": siteId } })
        : json(body, siteId);
    });
  wellKnown("nlweb", buildNlwebManifest);
  wellKnown("ai-plugin", buildAiPluginManifest);
  wellKnown("openapi", buildOpenApiYaml, "application/yaml; charset=utf-8");
}
