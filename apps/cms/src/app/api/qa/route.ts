import { NextResponse } from "next/server";
import { isPluginModuleEnabled, sanitizeQaState } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { revalidatePath } from "@/lib/cache";
import { createRateLimiter } from "@/lib/rate-limit";
import { QA_PLUGIN_ID } from "@/plugins/qa";
import { appendPendingQuestion, qaCaptchaOk, readQa, writeQa } from "@/lib/qa-store";

const askLimit = createRateLimiter("qa-ask", 5, 10 * 60 * 1000);
const VOTE_COOKIE = "nx_qav";

function back(request: Request, flag: string): URL {
  const referer = request.headers.get("referer");
  let url: URL;
  try {
    url = new URL(referer && new URL(referer).host === request.headers.get("host") ? referer : "/", request.url);
  } catch {
    url = new URL("/", request.url);
  }
  url.searchParams.set("qa", flag);
  return url;
}

/** Ziyaretçi sorusu ve faydalı oyu. İkisi de düz form; betik yok. */
export async function POST(request: Request) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const form = await request.formData().catch(() => null);
  const action = String(form?.get("action") ?? "");
  const contentId = String(form?.get("contentId") ?? "");
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(contentId)) {
    return NextResponse.redirect(back(request, "err"), 303);
  }
  const row = await getScopedRepository(siteId).getContentById(contentId, "tr");
  if (!row || row.type !== "ai_prompt" || row.status !== "published") {
    return NextResponse.redirect(back(request, "err"), 303);
  }

  if (action === "vote") {
    if (!(await isPluginModuleEnabled(siteId, QA_PLUGIN_ID, "vote"))) return NextResponse.redirect(back(request, "err"), 303);
    const current = request.headers.get("cookie") ?? "";
    const voted = new Set((current.match(/(?:^|;\s*)nx_qav=([^;]+)/)?.[1] ?? "").split(",").filter(Boolean));
    if (voted.has(contentId)) return NextResponse.redirect(back(request, "voted"), 303);
    const state = await readQa(siteId, contentId);
    await writeQa(siteId, contentId, sanitizeQaState({ ...state, upvotes: state.upvotes + 1 }));
    voted.add(contentId);
    const res = NextResponse.redirect(back(request, "voted"), 303);
    res.cookies.set(VOTE_COOKIE, [...voted].slice(-40).join(","), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" });
    res.headers.set("Cache-Control", "private, no-store");
    await revalidatePath(`/${row.slug}`);
    return res;
  }

  if (action !== "ask" || !(await isPluginModuleEnabled(siteId, QA_PLUGIN_ID, "ask"))) {
    return NextResponse.redirect(back(request, "err"), 303);
  }
  if (String(form?.get("website") ?? "").trim()) return NextResponse.redirect(back(request, "ok"), 303);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!(await askLimit.take(`${siteId}:${ip}:${contentId}`))) return NextResponse.redirect(back(request, "rate"), 303);
  if (!qaCaptchaOk(form?.get("captchaToken"), form?.get("captcha"))) return NextResponse.redirect(back(request, "captcha"), 303);
  const question = String(form?.get("question") ?? "");
  if (question.replace(/\s+/g, " ").trim().length < 10) return NextResponse.redirect(back(request, "short"), 303);
  const saved = await appendPendingQuestion(siteId, contentId, question, String(form?.get("name") ?? ""));
  await revalidatePath(`/${row.slug}`);
  return NextResponse.redirect(back(request, saved ? "ok" : "err"), 303);
}
