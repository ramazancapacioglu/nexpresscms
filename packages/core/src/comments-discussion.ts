/**
 * Tartışma, Yorum Ağacı ve 5 Yıldızlı Değerlendirme Motoru (Saf Mantık).
 * - Ziyaretçi sayfalarında 0-KB RSC prensibiyle çalışır.
 * - Etiket dizisi (`tags`) içerisinden sabitleme (`_pinned`), resmi ekip/yazar yanıtı (`_official`)
 *   ve faydalı oy sayısını (`_up:N`) ayrıştırır ve serileştirir.
 * - Çok katmanlı (en çok 3 derinlik) yanıt ağacını (`buildCommentTree`) ve 5 yıldızlı puan dağılım
 *   histogramını (`computeRatingSummary`) hesaplar.
 * - Ziyaretçi gönderimlerini (honeypot, bağlantı/spam sınırı, alan boyutu) doğrular.
 */

export type DiscussionSortMode = "popular" | "newest" | "oldest";

export interface ParsedCommentMeta {
  visibleTags: string[];
  pinned: boolean;
  official: boolean;
  upvotes: number;
}

const PINNED_TAG = "_pinned";
const OFFICIAL_TAG = "_official";
const UPVOTE_PREFIX = "_up:";

export function parseCommentTags(tags: string[] | null | undefined): ParsedCommentMeta {
  const list = Array.isArray(tags) ? tags : [];
  const visibleTags: string[] = [];
  let pinned = false;
  let official = false;
  let upvotes = 0;

  for (const raw of list) {
    const t = String(raw ?? "").trim();
    if (!t) continue;
    if (t === PINNED_TAG) {
      pinned = true;
    } else if (t === OFFICIAL_TAG) {
      official = true;
    } else if (t.startsWith(UPVOTE_PREFIX)) {
      const n = Number(t.slice(UPVOTE_PREFIX.length));
      if (Number.isFinite(n) && n >= 0) upvotes = Math.round(n);
    } else if (!t.startsWith("_")) {
      visibleTags.push(t);
    }
  }

  return { visibleTags, pinned, official, upvotes };
}

export function serializeCommentTags(input: {
  visibleTags?: string[];
  pinned?: boolean;
  official?: boolean;
  upvotes?: number;
}): string[] {
  const out: string[] = [];
  if (input.pinned) out.push(PINNED_TAG);
  if (input.official) out.push(OFFICIAL_TAG);
  const up = Math.max(0, Math.round(Number(input.upvotes ?? 0)));
  if (up > 0) out.push(`${UPVOTE_PREFIX}${up}`);
  const seen = new Set<string>();
  for (const raw of input.visibleTags ?? []) {
    const clean = String(raw ?? "")
      .trim()
      .replace(/^_+/, "")
      .slice(0, 32);
    if (!clean) continue;
    const key = clean.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= 10) break;
  }
  return out;
}

export function incrementCommentUpvoteTag(tags: string[] | null | undefined, delta = 1): string[] {
  const parsed = parseCommentTags(tags);
  return serializeCommentTags({
    ...parsed,
    upvotes: Math.max(0, parsed.upvotes + delta),
  });
}

export interface FlatDiscussionItem {
  id: string;
  parentId?: string | null;
  authorName: string;
  body: string;
  title?: string | null;
  rating?: number;
  pros?: string[];
  cons?: string[];
  isVerified?: boolean;
  createdAtMs?: number;
  dateLabel?: string;
  tags?: string[];
}

export interface ThreadedDiscussionNode extends FlatDiscussionItem {
  meta: ParsedCommentMeta;
  depth: number;
  replyToAuthor: string | null;
  totalReplies: number;
  children: ThreadedDiscussionNode[];
}

/**
 * Düz yorum listesini en çok `maxDepth` (varsayılan 3) derinlikte hiyerarşik ağaca dönüştürür.
 * 3. derinliğin altındaki yanıtlar mobil taşmayı önlemek için 3. katmanda `@Yazar` atfıyla düzleştirilir.
 * Kök düğümler önce `_pinned` bayrağına, ardından seçilen sıralama kipine (`popular` | `newest` | `oldest`) göre dizilir.
 */
export function buildCommentTree(
  items: FlatDiscussionItem[],
  sort: DiscussionSortMode = "popular",
  maxDepth = 3
): ThreadedDiscussionNode[] {
  const byId = new Map<string, FlatDiscussionItem>();
  for (const item of items) byId.set(item.id, item);

  const childrenMap = new Map<string, FlatDiscussionItem[]>();
  const roots: FlatDiscussionItem[] = [];

  for (const item of items) {
    const pid = item.parentId;
    if (pid && pid !== item.id && byId.has(pid)) {
      const list = childrenMap.get(pid) ?? [];
      list.push(item);
      childrenMap.set(pid, list);
    } else {
      roots.push(item);
    }
  }

  // Yanıtlar her zaman kronolojik (eskiden yeniye) akar
  const sortChronological = (a: FlatDiscussionItem, b: FlatDiscussionItem) =>
    (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0);

  const buildNode = (
    item: FlatDiscussionItem,
    depth: number,
    parentAuthor: string | null
  ): ThreadedDiscussionNode => {
    const rawChildren = [...(childrenMap.get(item.id) ?? [])].sort(sortChronological);
    const meta = parseCommentTags(item.tags);

    if (depth >= maxDepth) {
      // Bu derinlikten sonraki tüm alt ağacı bu düğümün kardeş/alt listesi olarak düzleştir
      const flattened: ThreadedDiscussionNode[] = [];
      const collectDeep = (parent: FlatDiscussionItem, children: FlatDiscussionItem[]) => {
        for (const ch of children) {
          const chMeta = parseCommentTags(ch.tags);
          flattened.push({
            ...ch,
            meta: chMeta,
            depth,
            replyToAuthor: parent.authorName,
            totalReplies: 0,
            children: [],
          });
          const grand = [...(childrenMap.get(ch.id) ?? [])].sort(sortChronological);
          if (grand.length > 0) collectDeep(ch, grand);
        }
      };
      collectDeep(item, rawChildren);
      return {
        ...item,
        meta,
        depth,
        replyToAuthor: parentAuthor,
        totalReplies: flattened.length,
        children: flattened,
      };
    }

    const builtChildren = rawChildren.map((ch) => buildNode(ch, depth + 1, item.authorName));
    const totalReplies = builtChildren.reduce((sum, ch) => sum + 1 + ch.totalReplies, 0);

    return {
      ...item,
      meta,
      depth,
      replyToAuthor: parentAuthor,
      totalReplies,
      children: builtChildren,
    };
  };

  const builtRoots = roots.map((r) => buildNode(r, 1, null));

  builtRoots.sort((a, b) => {
    if (a.meta.pinned !== b.meta.pinned) return a.meta.pinned ? -1 : 1;
    if (sort === "oldest") {
      return (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0);
    }
    if (sort === "newest") {
      return (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
    }
    // popular: faydalı oy * 2 + yanıt sayısı, eşitlikte en yeni
    const scoreA = a.meta.upvotes * 2 + a.totalReplies;
    const scoreB = b.meta.upvotes * 2 + b.totalReplies;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
  });

  return builtRoots;
}

export interface StarBreakdownRow {
  star: 5 | 4 | 3 | 2 | 1;
  count: number;
  percent: number;
}

export interface RatingSummary {
  total: number;
  average: number;
  averageLabel: string;
  verifiedCount: number;
  stars: StarBreakdownRow[];
}

export function computeRatingSummary(
  reviews: Array<{ rating?: number; isVerified?: boolean }>
): RatingSummary {
  const valid = reviews.filter((r) => typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5);
  const total = valid.length;
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let verifiedCount = 0;

  for (const r of valid) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating!))) as 1 | 2 | 3 | 4 | 5;
    counts[star] += 1;
    sum += star;
    if (r.isVerified) verifiedCount += 1;
  }

  const average = total > 0 ? Number((sum / total).toFixed(1)) : 0;
  const averageLabel = total > 0 ? average.toFixed(1) : "–";
  const stars: StarBreakdownRow[] = ([5, 4, 3, 2, 1] as const).map((star) => ({
    star,
    count: counts[star],
    percent: total > 0 ? Math.round((counts[star] / total) * 100) : 0,
  }));

  return { total, average, averageLabel, verifiedCount, stars };
}

const AVATAR_PALETTE = [
  { bg: "#EEF2FF", fg: "#3730A3", border: "#C7D2FE" },
  { bg: "#ECFDF5", fg: "#065F46", border: "#A7F3D0" },
  { bg: "#FFFBEB", fg: "#92400E", border: "#FDE68A" },
  { bg: "#FDF2F8", fg: "#9D174D", border: "#FBCFE8" },
  { bg: "#F0F9FF", fg: "#075985", border: "#BAE6FD" },
  { bg: "#F5F3FF", fg: "#5B21B6", border: "#DDD6FE" },
] as const;

export function commentAvatarProps(authorName: string): {
  initials: string;
  bg: string;
  fg: string;
  border: string;
} {
  const clean = (authorName ?? "").trim() || "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toLocaleUpperCase("tr-TR")
      : clean.slice(0, 2).toLocaleUpperCase("tr-TR");
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  const palette = AVATAR_PALETTE[hash % AVATAR_PALETTE.length]!;
  return { initials, ...palette };
}

export interface PublicCommentSubmissionInput {
  honeypot?: string;
  contentId?: string;
  parentId?: string | null;
  entryType?: string;
  authorName?: string;
  authorEmail?: string;
  title?: string;
  body?: string;
  rating?: number | string;
  prosText?: string;
  consText?: string;
}

export type PublicCommentValidationResult =
  | {
      ok: true;
      data: {
        contentId: string;
        parentId: string | null;
        entryType: "comment" | "review";
        authorName: string;
        authorEmail?: string;
        title?: string;
        body: string;
        rating: number;
        pros: string[];
        cons: string[];
      };
    }
  | { ok: false; reason: "honeypot" | "invalid_input" | "spam_links" };

function splitLinesOrCommas(raw: string | undefined, maxItems = 5): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n•,]+/)
    .map((s) => s.trim().slice(0, 120))
    .filter((s) => s.length >= 2)
    .slice(0, maxItems);
}

/**
 * Ziyaretçi yorum/inceleme gönderimini doğrular:
 * - Honeypot doluysa sessizce reddeder.
 * - Gövdede 2'den fazla dış bağlantı (`http://`, `https://`) varsa spam olarak reddeder.
 * - HTML etiketlerini temizler ve uzunluk sınırlarını uygular.
 */
export function validatePublicCommentSubmission(
  input: PublicCommentSubmissionInput
): PublicCommentValidationResult {
  if (String(input.honeypot ?? "").trim() !== "") {
    return { ok: false, reason: "honeypot" };
  }
  const contentId = String(input.contentId ?? "").trim();
  const authorName = String(input.authorName ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 80);
  const body = String(input.body ?? "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 2000);

  if (!contentId.startsWith("cnt_") || authorName.length < 2 || body.length < 3) {
    return { ok: false, reason: "invalid_input" };
  }

  const urlMatches = body.match(/https?:\/\/|www\./gi) ?? [];
  if (urlMatches.length > 2) {
    return { ok: false, reason: "spam_links" };
  }

  const entryType: "comment" | "review" = input.entryType === "review" ? "review" : "comment";
  const parentId = entryType === "comment" && input.parentId ? String(input.parentId).trim() : null;
  const rawEmail = String(input.authorEmail ?? "").trim().slice(0, 120);
  const authorEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : undefined;
  const title = String(input.title ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 120) || undefined;
  const numRating = Number(input.rating ?? 5);
  const rating = entryType === "review" ? Math.min(5, Math.max(1, Number.isFinite(numRating) ? Math.round(numRating) : 5)) : 0;
  const pros = entryType === "review" ? splitLinesOrCommas(input.prosText) : [];
  const cons = entryType === "review" ? splitLinesOrCommas(input.consText) : [];

  return {
    ok: true,
    data: {
      contentId,
      parentId,
      entryType,
      authorName,
      authorEmail,
      title,
      body,
      rating,
      pros,
      cons,
    },
  };
}

