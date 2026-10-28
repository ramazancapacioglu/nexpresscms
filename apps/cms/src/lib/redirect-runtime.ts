import "server-only";
import { after } from "next/server";
import { headers } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { normalizeRedirectPath, resolveRedirectChain, type RedirectCode } from "@nexpress/core";
import { getRedirectRepository } from "@nexpress/database";
import { cachedRead } from "./cache";

type Rule = [string, { to: string; code: RedirectCode }];

/** Etkin yönlendirmeler (JSON dizisi: önbellek katmanı Map taşımaz); yönetim eylemlerinde düşer. */
const activeRules = cachedRead("redirect-rules", async (siteId: string): Promise<Rule[]> => [...(await getRedirectRepository(siteId).activeMap()).entries()]);

const SKIP_LOG = /^\/(admin|api|_next|media|og)(\/|$)/;

/**
 * Bulunamayan bir ziyaretçi yolu için: eşleşen yönlendirme varsa uygular (301/308 kalıcı, 302/307 geçici),
 * yoksa 404'ü izleyiciye yazar (yanıttan sonra) ve `notFound()` fırlatır. Döngüde yönlendirme uygulanmaz.
 * Her zaman `never` döner.
 */
export async function redirectOrNotFound(siteId: string, path: string): Promise<never> {
  const clean = normalizeRedirectPath(path);
  const rules = new Map(await activeRules(siteId));
  const hit = resolveRedirectChain(rules, clean);
  if (hit && !("loop" in hit)) {
    after(() => getRedirectRepository(siteId).recordHit(clean).catch(() => undefined));
    if (hit.code === 301 || hit.code === 308) permanentRedirect(hit.to);
    redirect(hit.to);
  }
  if (!SKIP_LOG.test(clean)) {
    const ref = (await headers()).get("referer");
    let host = "";
    try {
      host = ref ? new URL(ref).hostname : "";
    } catch {
      host = "";
    }
    after(async () => {
      try {
        const repo = getRedirectRepository(siteId);
        await repo.recordNotFound(clean, host);
        if (Math.random() < 0.02) await repo.pruneNotFound();
      } catch {
        // izleyici asıl yanıtı bozmaz
      }
    });
  }
  notFound();
}
