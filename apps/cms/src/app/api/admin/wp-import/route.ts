import { NextResponse } from "next/server";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-api";
import { invalidateSite, revalidatePath } from "@/lib/cache";
import { notify } from "@/lib/notify";
import { WP_IMPORT_LIMITS, planFromXml, runWpImport } from "@/lib/wp-import";

export const runtime = "nodejs";
export const maxDuration = 300;

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
const TYPES = ["post", "page", "product"] as const;

/**
 * WordPress dışa aktarma (WXR .xml) içe aktarma. `mode=analyze`: dosyayı çözümler, hiçbir şey yazmaz, özet döner.
 * `mode=run`: aynı dosya ve seçeneklerle yazar. Yalnızca yönetici; dosya en çok 64 MB.
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const { session } = auth;
  if (Number(request.headers.get("content-length") ?? 0) > WP_IMPORT_LIMITS.fileBytes + 64 * 1024) return fail("Dosya 64 MB sınırını aşıyor.", 413);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) return fail("Dosya bulunamadı.");
  if (file.size > WP_IMPORT_LIMITS.fileBytes) return fail("Dosya 64 MB sınırını aşıyor.", 413);

  const get = (k: string) => String(form.get(k) ?? "");
  const flag = (k: string, dflt: boolean) => (form.get(k) === null ? dflt : get(k) === "1");
  const types = get("types") ? get("types").split(",").filter((t): t is (typeof TYPES)[number] => (TYPES as readonly string[]).includes(t)) : [...TYPES];
  const site = await getScopedRepository(session.siteId).getSite();
  const locale = site?.defaultLocale ?? "tr";
  const parsed = planFromXml(await file.text(), { locale, types, includeDrafts: flag("includeDrafts", true) });
  if (!parsed.ok) return fail(parsed.error, 422);
  const { plan } = parsed;

  if (get("mode") !== "run") {
    return NextResponse.json({
      ok: true,
      summary: {
        siteTitle: plan.siteTitle,
        baseUrl: plan.baseUrl,
        totals: plan.totals,
        importing: plan.items.length,
        terms: plan.terms.length,
        images: plan.imageUrls.length,
        skipped: plan.skipped,
        warnings: plan.warnings,
        itemWarnings: plan.items.filter((i) => i.warnings.length).slice(0, 20).map((i) => ({ title: i.title, warnings: i.warnings })),
        sample: plan.items.slice(0, 8).map((i) => ({ title: i.title, type: i.wpType, status: i.status, slug: i.slug, blocks: i.blocks.length })),
        locale,
      },
    });
  }

  const report = await runWpImport(session.siteId, plan, { locale, types, includeDrafts: flag("includeDrafts", true), createRedirects: flag("createRedirects", true), downloadImages: flag("downloadImages", false), update: flag("update", false) }, { id: session.sub, email: session.email });
  await recordAudit({ id: session.sub, email: session.email }, "wp-import.run", { detail: `${report.created} yeni, ${report.updated} güncel, ${report.failed.length} hata`, siteId: session.siteId });
  await notify(session.siteId, { kind: "wp-import.done", severity: report.failed.length ? "warning" : "info", title: "WordPress içe aktarma tamamlandı", body: `${report.created} yeni, ${report.updated} güncel, ${report.failed.length} hata`, href: "/admin/posts", audience: "admin", window: 0 });
  await invalidateSite(session.siteId);
  for (const p of ["/admin", "/admin/pages", "/admin/posts", "/admin/contents", "/admin/taxonomies", "/admin/redirects", "/admin/media"]) await revalidatePath(p);
  return NextResponse.json({ ok: true, report });
}
