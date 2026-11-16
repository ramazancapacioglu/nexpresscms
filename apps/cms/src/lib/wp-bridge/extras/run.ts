import "server-only";
import { getScopedRepository } from "@nexpress/database";
import { plainText } from "@nexpress/wp-importer";
import { enrichPublished, importDrafts, importMedia } from "./content";
import { importEntries, importForms } from "./forms";
import { importArchiveRedirects, importRedirects, importUsers, readWpUsers, refreshComments } from "./people";
import { importGoogleReviews } from "./reviews";
import { importSiteSeo } from "./seo";
import { openWpSession } from "./session";

export interface WpExtrasResult {
  ok: boolean;
  dryRun: boolean;
  steps: Record<string, unknown>;
}

/**
 * Köprünün ve herkese açık taramanın taşımadığı yönetici verileri: yazarlar, formlar ve girdileri, Rank Math yönlendirmeleri,
 * taslaklar, yorum tarihleri, Google yorumları ve tüm medya. Kaynak siteye yalnızca okuma yapar.
 * Parola, çerez ve girdi içeriği günlüğe yazılmaz; yalnızca sayılar döner.
 */
export async function importWpExtras(siteId: string, opts: { origin: string; user: string; password: string; only?: string[]; dryRun?: boolean }): Promise<WpExtrasResult> {
  const session = await openWpSession(opts.origin, opts.user, opts.password);
  const want = (step: string) => !opts.only || opts.only.includes(step);
  const steps: Record<string, unknown> = {};
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  const users = await readWpUsers(session);
  const authors = new Map(users.map((user) => [user.id, plainText(user.name, 120)]));
  steps.wpUsers = users.length;
  if (opts.dryRun) return { ok: true, dryRun: true, steps };
  if (want("users")) steps.users = await importUsers(users, siteId, opts.user);
  const formResult = want("forms") || want("entries") || want("content") ? await importForms(session, siteId) : { forms: 0, ids: new Map<string, string>() };
  if (want("forms")) steps.forms = formResult.forms;
  if (want("content")) steps.enrich = await enrichPublished(session, siteId, authors, formResult.ids);
  if (want("entries")) steps.entries = await importEntries(session, siteId, formResult.ids);
  if (want("redirects")) steps.redirects = { ...(await importRedirects(session, siteId)), archives: await importArchiveRedirects(session, siteId) };
  if (want("drafts")) steps.drafts = await importDrafts(session, siteId, authors);
  const known = new Set((await repo.listContents({ locale })).map((row) => Number(/^cnt_wp_(\d+)$/.exec(row.id)?.[1] ?? 0)).filter(Boolean));
  if (want("comments")) steps.comments = await refreshComments(session, siteId, known);
  if (want("reviews")) steps.reviews = await importGoogleReviews(session, siteId);
  if (want("seo")) steps.seo = await importSiteSeo(session, siteId);
  if (want("media")) steps.media = await importMedia(session, siteId);
  return { ok: true, dryRun: false, steps };
}
