import { NextResponse } from "next/server";
import { getScopedRepository } from "@nexpress/database";
import { readPublicShell } from "@nexpress/wp-importer";
import { recordAudit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-api";
import { FetchBlocked, fetchPublicHtml } from "@/lib/safe-fetch";

export const runtime = "nodejs";
export const maxDuration = 30;

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/**
 * Tek yayımlanmış sayfanın görünüm taslağı. Hiçbir içerik, jeton veya menü yazılmaz.
 * Adres, görsel indirmedekiyle aynı genel internet kuralından geçer.
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const { session } = auth;
  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  let page: URL;
  try {
    page = new URL(String(body?.url ?? "").trim());
  } catch {
    return fail("Adres geçersiz.");
  }
  if (page.protocol !== "http:" && page.protocol !== "https:") return fail("Yalnızca http/https.");
  const site = await getScopedRepository(session.siteId).getSite();
  const locale = site?.defaultLocale ?? "tr";
  let html: string;
  try {
    html = await fetchPublicHtml(page.toString());
  } catch (err) {
    const message = err instanceof FetchBlocked || err instanceof Error ? err.message : "Sayfa okunamadı.";
    return fail(message, 422);
  }
  const shell = readPublicShell(html, page.toString(), locale);
  const blocks: Record<string, number> = {};
  for (const block of shell.blocks) blocks[block.type] = (blocks[block.type] ?? 0) + 1;
  await recordAudit({ id: session.sub, email: session.email }, "wp-shell.preview", {
    detail: page.origin,
    siteId: session.siteId,
  });
  return NextResponse.json({
    ok: true,
    summary: {
      title: shell.title,
      description: shell.description,
      phone: shell.phone,
      email: shell.email,
      primary: shell.tokens.colors.primary,
      accent: shell.tokens.colors.accent,
      menu: shell.menu.slice(0, 12).map((item) => item.label),
      footerColumns: shell.footer.columns.length,
      blocks,
      blockCount: shell.blocks.length,
      warnings: shell.warnings,
      locale,
    },
  });
}
