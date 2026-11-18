import "server-only";
import { randomBytes } from "node:crypto";
import { hashPassword } from "@nexpress/core/password";
import { getRedirectRepository, getScopedRepository, getUserRepository } from "@nexpress/database";
import { parseRankMathRedirects, parseReviewCard, plainText } from "@nexpress/wp-importer";
import { wpAll, type WpSession } from "./session";

export interface WpAdminUser {
  id: number;
  login: string;
  email: string;
  name: string;
}

const strip = (html: string) => plainText(html, 160);

/** REST kullanıcı ucu kapalı olduğundan Kullanıcılar listesinden okunur. */
export async function readWpUsers(session: WpSession): Promise<WpAdminUser[]> {
  const html = await session.text("/wp-admin/users.php");
  const out: WpAdminUser[] = [];
  for (const row of html.matchAll(/<tr id='user-(\d+)'([\s\S]*?)<\/tr>/g)) {
    const body = row[2] ?? "";
    const login = strip(/column-username[\s\S]*?<strong><a[^>]*>([\s\S]*?)<\/a>/.exec(body)?.[1] ?? "");
    const email = /mailto:([^"'>]+)/.exec(body)?.[1] ?? "";
    const name = strip(/column-name[^>]*>([\s\S]*?)<\/td>/.exec(body)?.[1] ?? "");
    if (login && email) out.push({ id: Number(row[1]), login, email: email.trim().toLowerCase(), name: name || login });
  }
  return out;
}

/**
 * Yazar kayıtları giriş kapalı olarak açılır: parola özeti WordPress'ten gelmez, rastgele ve kullanılamaz bir özet yazılır.
 * Teknik hesap (aktarımı yapan oturum) alınmaz. Sahip parola sıfırlamasıyla girişi kendisi açar.
 */
export async function importUsers(users: WpAdminUser[], siteId: string, skipLogin: string): Promise<number> {
  const repo = getUserRepository(siteId);
  let created = 0;
  for (const user of users) {
    if (user.login === skipLogin || (await repo.findByEmail(user.email))) continue;
    const made = await repo.create({ email: user.email, name: user.name, passwordHash: await hashPassword(randomBytes(24).toString("base64url")), role: "editor" });
    await repo.setStatus(made.id, "disabled");
    created += 1;
  }
  return created;
}

/** Rank Math yönlendirmeleri. Yalnızca tam eşleşme ve etkin olanlar taşınır; kalıp olanlar sayılır, yazılmaz. */
export async function importRedirects(session: WpSession, siteId: string): Promise<{ saved: number; patterns: number; inactive: number; rejected: number }> {
  const rows = [] as ReturnType<typeof parseRankMathRedirects>;
  const seen = new Set<string>();
  for (let page = 1; page <= 20; page += 1) {
    const html = await session.text(`/wp-admin/admin.php?page=rank-math-redirections&paged=${page}`);
    const fresh = parseRankMathRedirects(html).filter((row) => !seen.has(row.id));
    if (fresh.length === 0) break;
    fresh.forEach((row) => seen.add(row.id));
    rows.push(...fresh);
  }
  const repo = getRedirectRepository(siteId);
  let saved = 0;
  let patterns = 0;
  let inactive = 0;
  let rejected = 0;
  for (const row of rows) {
    if (!row.exact) {
      patterns += 1;
      continue;
    }
    let to = row.to;
    try {
      const target = new URL(row.to, session.origin);
      to = target.origin === session.origin || target.hostname.replace(/^www\./, "") === new URL(session.origin).hostname.replace(/^www\./, "") ? target.pathname + target.search : target.toString();
    } catch {
      rejected += 1;
      continue;
    }
    if (to.length > 1 && !/^https?:/.test(to)) to = to.replace(/\/$/, "");
    const result = await repo.save({ fromPath: `/${row.from.replace(/^\/+|\/+$/g, "")}`, toPath: to, code: row.code, note: "Rank Math", enabled: row.active });
    if (!row.active) inactive += 1;
    if (result.ok) saved += 1;
    else rejected += 1;
  }
  return { saved, patterns, inactive, rejected };
}

interface WpComment {
  id: number;
  post: number;
  parent: number;
  author_name?: string;
  date_gmt?: string;
  status?: string;
  content?: { rendered?: string };
}

/** Yorumların özgün tarihi (içe aktarma günü değil) ve eksik yorumlar. Spam ve çöp alınmaz. */
export async function refreshComments(session: WpSession, siteId: string, known: Set<number>): Promise<{ updated: number; skippedSpam: number }> {
  const repo = getScopedRepository(siteId);
  const rows = await wpAll<WpComment>(session, "comments?status=all&context=edit&_fields=id,post,parent,author_name,date_gmt,status,content", 50);
  let updated = 0;
  let skippedSpam = 0;
  for (const comment of [...rows].sort((a, b) => a.parent - b.parent)) {
    if (comment.status === "spam" || comment.status === "trash") {
      skippedSpam += 1;
      continue;
    }
    if (!known.has(comment.post)) continue;
    const card = parseReviewCard(comment.content?.rendered ?? "");
    const body = card ? card.body : plainText(comment.content?.rendered ?? "", 4000);
    if (!body) continue;
    const author = plainText(comment.author_name ?? "Ziyaretçi", 120) || "Ziyaretçi";
    // Yıldızlı kart yalnızca ziyaretçinin ilk düzey yorumudur; sitenin kendi yanıtı puan sayılmaz.
    const review = Boolean(card && card.stars > 0 && !comment.parent && !/ak[ıi]nsoft/i.test(author));
    await repo.saveCommentReview({
      id: `cmt_wp_${comment.id}`,
      contentId: `cnt_wp_${comment.post}`,
      authorName: author,
      entryType: review ? "review" : "comment",
      ...(review && card ? { rating: card.stars, title: card.title || undefined } : {}),
      body,
      status: comment.status === "hold" ? "pending" : "approved",
      parentId: comment.parent ? `cmt_wp_${comment.parent}` : null,
      ...(comment.date_gmt ? { createdAt: new Date(`${comment.date_gmt}Z`) } : {}),
    });
    updated += 1;
  }
  return { updated, skippedSpam };
}

interface WpTermLink {
  slug: string;
  link: string;
}

/**
 * Arşiv adresleri: WordPress'te kategori kökte (`/makaleler/`), etiket `/tag/…`, soru türü `/ai-prompts/` idi.
 * NexPress'te `/kategori/…`, `/etiket/…` ve `/sorular` olur. Kalıcı (301) yönlendirme ile sıralama değeri taşınır.
 */
export async function importArchiveRedirects(session: WpSession, siteId: string): Promise<{ saved: number }> {
  const repo = getRedirectRepository(siteId);
  const [cats, tags, types] = await Promise.all([
    wpAll<WpTermLink>(session, "categories?_fields=slug,link", 100),
    wpAll<WpTermLink>(session, "tags?_fields=slug,link", 100),
    session.json<Record<string, { rest_base?: string; has_archive?: boolean | string }>>("/wp-json/wp/v2/types").catch(() => ({}) as Record<string, { rest_base?: string; has_archive?: boolean | string }>),
  ]);
  const pairs: Array<[string, string]> = [];
  for (const term of cats) pairs.push([new URL(term.link).pathname, /kampanya/i.test(term.slug) ? "/kampanyalar" : `/kategori/${term.slug}`]);
  for (const term of tags) pairs.push([new URL(term.link).pathname, `/etiket/${term.slug}`]);
  if (types.ai_prompt?.has_archive) pairs.push(["/ai-prompts", "/sorular"]);
  // Hazır şablonlardaki "Kurumsal" bağlantısı (`/tr/kurumsal`) bu sitede Hakkımızda sayfasıdır.
  pairs.push(["/kurumsal", "/hakkimizda"]);
  let saved = 0;
  for (const [from, to] of pairs) {
    const path = `/${from.replace(/^\/+|\/+$/g, "")}`;
    if (path === "/" || path === to) continue;
    if ((await repo.save({ fromPath: path, toPath: to, code: 301, note: "WordPress arşivi" })).ok) saved += 1;
  }
  return { saved };
}

/** Gerçek NexPress rotaları: bunları kaynak alan yönlendirme (eski WordPress kuralı) yeni sayfayı gölgelerdi. */
const REAL_ROUTES = [/^\/kampanyalar$/, /^\/kampanya\//, /^\/kategori\//, /^\/etiket\//, /^\/sorular$/, /^\/yazar\//, /^\/ara$/, /^\/blog$/];

/**
 * Yönlendirme zincirlerini tek adıma indirir (A→B→C yerine A→C) ve gerçek rotayı gölgeleyen eski kuralları kapatır
 * (ör. WordPress'teki `/kampanyalar → /` kuralı yeni kampanya arşivini ana sayfaya yollardı). Hiçbir kural silinmez.
 */
export async function tidyRedirects(siteId: string): Promise<{ collapsed: number; disabled: number }> {
  const repo = getRedirectRepository(siteId);
  let disabled = 0;
  for (const rule of await repo.list()) {
    if (rule.enabled && REAL_ROUTES.some((pattern) => pattern.test(rule.fromPath))) {
      await repo.setEnabled(rule.id, false);
      disabled += 1;
    }
  }
  const rules = (await repo.list()).filter((rule) => rule.enabled);
  const next = new Map(rules.map((rule) => [rule.fromPath, rule.toPath]));
  let collapsed = 0;
  for (const rule of rules) {
    let target = rule.toPath;
    for (let hop = 0; hop < 5 && next.has(target) && next.get(target) !== rule.fromPath; hop += 1) target = next.get(target) ?? target;
    if (target === rule.toPath || target === rule.fromPath) continue;
    if ((await repo.save({ fromPath: rule.fromPath, toPath: target, code: rule.code, note: rule.note, enabled: true })).ok) collapsed += 1;
  }
  return { collapsed, disabled };
}
