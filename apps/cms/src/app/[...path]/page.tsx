import { headers } from "next/headers";
import { redirectOrNotFound } from "@/lib/redirect-runtime";

export const dynamic = "force-dynamic";

/**
 * Hiçbir rotayla eşleşmeyen yollar (ör. eski adresler, `/tr/a/b`): elle yönlendirme varsa uygulanır,
 * yoksa 404 izleyiciye yazılıp 404 döner. Gerçek rotalar (statik segmentler) bunun önündedir.
 */
export default async function UnmatchedPath({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  await redirectOrNotFound(siteId, `/${path.map((p) => decodeURIComponent(p)).join("/")}`);
}
