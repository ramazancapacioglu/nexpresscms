import "server-only";
import { after } from "next/server";
import { headers } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { isPrefixless, normalizeRedirectPath, resolveRedirectChain, stripLocalePath, type RedirectCode } from "@nexpress/core";
import { getRedirectRepository } from "@nexpress/database";
import { cachedRead } from "./cache";
import { getPublicSite } from "./public-data";

type Rule = [string, { to: string; code: RedirectCode }];

/** Etkin yönlendirmeler (JSON dizisi: önbellek katmanı Map taşımaz); yönetim eylemlerinde düşer. */
const activeRules = cachedRead("redirect-rules", async (siteId: string): Promise<Rule[]> => [...(await getRedirectRepository(siteId).activeMap()).entries()]);

const SKIP_LOG = /^\/(admin|api|_next|media|og)(\/|$)/;

/**
 * Bulunamayan bir ziyaretçi yolu için: eşleşen yönlendirme varsa uygular (301/308 kalıcı, 302/307 geçici),
 * yoksa 404'ü izleyiciye yazar (yanıttan sonra) ve `notFound()` fırlatır. Döngüde yönlendirme uygulanmaz.
 * Her zaman `never` döner.
 */
export async function redirectOrNotFound(siteId: string, path: string, opts: { orElse?: string } = {}): Promise<never> {
  const clean = normalizeRedirectPath(path);
  const rules = new Map(await activeRules(siteId));
  const hit = resolveRedirectChain(rules, clean);
  if (hit && !("loop" in hit)) {
    after(() => getRedirectRepository(siteId).recordHit(clean).catch(() => undefined));
    // Tek dilli sitede hedefteki dil ön eki kalkar (kayıtlı `/tr/x` → `/x`)
    const site = await getPublicSite(siteId);
    const to = isPrefixless(site, site?.defaultLocale ?? "tr") ? stripLocalePath(hit.to, site?.defaultLocale ?? "tr") : hit.to;
    if (hit.code === 301 || hit.code === 308) permanentRedirect(to);
    redirect(to);
  }
  // Elle yönlendirme yoksa: verilmişse kalıcı yönlendirme (ör. ikinci dil eklenince eski ön eksiz adresler `/{varsayılan dil}/...` olur)
  if (opts.orElse) permanentRedirect(opts.orElse);
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
