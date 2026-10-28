import { NextResponse, type NextRequest } from "next/server";
import { resolveFormFields, spamReasons, validateSubmission, safeBlockDomId, type BlockNode } from "@nexpress/core";
import { getFormSubmissionRepository, getScopedRepository } from "@nexpress/database";
import "@/plugins/register";
import { ipDigest, verifyFormToken } from "@/lib/form-token";

export const runtime = "nodejs";

const PATH_RE = /^\/([a-z]{2,3}(?:-[a-z0-9]{2,8})?)(?:\/([a-z0-9][a-z0-9-]{0,120}))?$/;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;

function findBlock(blocks: BlockNode[], id: string): BlockNode | null {
  for (const b of blocks) {
    if (b.id === id && b.type === "form_block") return b;
    const hit = b.children ? findBlock(b.children, id) : null;
    if (hit) return hit;
  }
  return null;
}

/**
 * Ziyaretçi formu gönderimi (JS'siz: düz HTML POST → 303 yönlendirme). Alan tanımı sunucudaki içerikten okunur;
 * istemci yalnızca değer gönderir. Korumalar: aynı-kaynak, balküpü alanı, imzalı zaman belirteci (3 sn–24 sa),
 * IP özeti başına hız sınırı (10 dk'da 5), alan doğrulaması, bağlantı sezgisiyle spam işareti.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const get = (k: string) => (typeof form?.get(k) === "string" ? (form!.get(k) as string) : "");
  const path = get("_path");
  const pathMatch = path.match(PATH_RE);
  const back = (status: "sent" | "error", blockId = "") =>
    NextResponse.redirect(
      new URL(pathMatch ? `${path}?form=${status}${blockId ? `&fb=${encodeURIComponent(blockId)}#${safeBlockDomId(blockId)}` : ""}` : "/", request.url),
      303
    );

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return new NextResponse("Çapraz kaynak isteği reddedildi.\n", { status: 403 });
  if (!form || !pathMatch) return new NextResponse("Geçersiz istek.\n", { status: 400 });

  const blockId = get("_block");
  // Balküpü: botlar doldurur. Sessizce "başarılı" gösterilir, kaydedilmez.
  if (get("website").trim()) return back("sent", blockId);

  const token = verifyFormToken(path, get("_t"));
  if (token !== "ok") return back("error", blockId);

  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = pathMatch[1]!;
  if (!site || !site.supportedLocales.includes(locale)) return back("error");
  const slug = pathMatch[2] ?? "ana-sayfa";
  const content = await repo.getContentBySlug(slug, locale, { publicOnly: true });
  const block = content ? findBlock(content.blocks, blockId) : null;
  if (!content || !block) return back("error");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  const ipHash = ipDigest(ip);
  const inbox = getFormSubmissionRepository(siteId);
  if ((await inbox.recentFromIp(ipHash, RATE_WINDOW_MS)) >= RATE_MAX) return back("error", blockId);

  const defs = resolveFormFields((block.props as Record<string, unknown>)?.fields);
  const raw: Record<string, unknown> = {};
  for (const d of defs) raw[d.name] = form.get(d.name);
  const result = validateSubmission(defs, raw);
  if (!result.ok) return back("error", blockId);

  await inbox.create({
    pagePath: path,
    locale,
    formId: block.id,
    formTitle: typeof (block.props as Record<string, unknown>)?.title === "string" ? ((block.props as Record<string, unknown>).title as string) : "",
    fields: result.values,
    status: spamReasons(result.values).length > 0 ? "spam" : "new",
    ipHash,
  });
  return back("sent", blockId);
}
