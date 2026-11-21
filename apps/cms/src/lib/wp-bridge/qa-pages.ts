import "server-only";
import type { BlockNode } from "@nexpress/core";
import { qaItemId, sanitizeQaState } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { parseQaPage, type QaPageData } from "@nexpress/wp-importer";
import { revalidatePath } from "@/lib/cache";
import { bridgeOrigin } from "./store";

/** Soru-cevap sayfasının görünür gövdesi: soru, kısa cevap, ayrıntı paragrafları, künye ve ürün bağlantısı (markdown'a da aynen yazılır). */
export function qaBlocks(wpId: string, d: QaPageData): BlockNode[] {
  const id = (n: string) => `qa_${wpId}_${n}`;
  const children: BlockNode[] = [
    { id: id("q"), type: "heading", props: { level: 2, text: d.question } },
    { id: id("a"), type: "tldr_box", props: { summary: d.shortAnswer } },
  ];
  if (d.detail.length > 0) {
    children.push({ id: id("dh"), type: "heading", props: { level: 3, text: "Ayrıntılı açıklama" } });
    d.detail.forEach((line, n) => children.push({ id: id(`d${n}`), type: "paragraph", props: { text: line } }));
  }
  const facts = [
    d.areaServed && `Hizmet bölgesi: ${d.areaServed}`,
    d.audience && `Hedef kitle: ${d.audience}`,
    d.about && `Hakkında: ${d.about}`,
    d.serviceType && `Hizmet tipi: ${d.serviceType}`,
  ].filter((x): x is string => Boolean(x));
  if (facts.length > 0) {
    children.push({ id: id("fh"), type: "heading", props: { level: 3, text: "Bu cevap kimler için?" } });
    children.push({ id: id("f"), type: "list_element", props: { ordered: false, items: facts } });
  }
  if (d.productUrl) children.push({ id: id("p"), type: "button_element", props: { label: "Ürünü incele", href: d.productUrl } });
  return [{ id: id("s"), type: "section", props: {}, children }];
}

export interface QaRepairResult {
  origin: string;
  scanned: number;
  repaired: number;
  skipped: Array<{ slug: string; reason: string }>;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "NexPress-Importer/1.0" }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * Aktarımda eksik kalan soru-cevap alanlarını (gerçek soru, ayrıntılı cevap, künye, ürün bağlantısı, faydalı oyu, cevaplanmış sorular)
 * kaynak sitenin herkese açık sayfasından tamamlar ve şemayı QAPage yapar. Yalnızca okur; yayında olmayan (taslak) kayıtlar kaynakta açık olmadığı için atlanır.
 */
export async function repairQaPages(siteId: string, opts: { dryRun?: boolean; origin?: string } = {}): Promise<QaRepairResult> {
  const origin = opts.origin?.startsWith("https://") ? new URL(opts.origin).origin : await bridgeOrigin(siteId);
  if (!origin.startsWith("https://")) return { origin: "", scanned: 0, repaired: 0, skipped: [{ slug: "-", reason: "Kaynak adres tanımlı değil" }] };
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  const rows = (await repo.listContents({ locale })).filter((row) => row.type === "ai_prompt");
  const result: QaRepairResult = { origin, scanned: rows.length, repaired: 0, skipped: [] };
  for (const row of rows) {
    const wpId = /^cnt_wp_(\d+)$/.exec(row.id)?.[1];
    if (!wpId) {
      result.skipped.push({ slug: row.slug, reason: "Kaynak kimliği yok" });
      continue;
    }
    if (row.status !== "published") {
      result.skipped.push({ slug: row.slug, reason: "Taslak: kaynakta herkese açık değil (WordPress oturumlu içe aktarma gerekir)" });
      continue;
    }
    try {
      const rest = JSON.parse(await fetchText(`${origin}/wp-json/wp/v2/ai_prompt?slug=${encodeURIComponent(row.slug)}&_fields=content`)) as Array<{ content?: { rendered?: string } }>;
      const pageHtml = await fetchText(`${origin}/ai-prompts/${encodeURIComponent(row.slug)}/`);
      const d = parseQaPage({ contentHtml: rest[0]?.content?.rendered ?? "", pageHtml, origin });
      if (!d) {
        result.skipped.push({ slug: row.slug, reason: "Soru ya da cevap ayrıştırılamadı" });
        continue;
      }
      const attrs = { ...((row.schemaAttributes ?? {}) as Record<string, unknown>) };
      const richSchema = { ...((attrs.richSchema ?? {}) as Record<string, unknown>) };
      richSchema.qa = {
        enabled: true,
        question: d.question,
        shortAnswer: d.shortAnswer,
        detail: d.detail.join("\n"),
        areaServed: d.areaServed,
        audience: d.audience,
        about: d.about,
        serviceType: d.serviceType,
        productUrl: d.productUrl,
      };
      attrs.richSchema = richSchema;
      const state = sanitizeQaState(attrs._qa);
      const known = new Set([...state.answered, ...state.pending].map((item) => item.question.toLocaleLowerCase("tr")));
      const answered = [...state.answered];
      d.answered.forEach((item, n) => {
        if (item.question.length < 10 || known.has(item.question.toLocaleLowerCase("tr"))) return;
        answered.push({ id: qaItemId(`wp${wpId}x${n}`), question: item.question, name: item.name, answer: item.answer, date: "" });
      });
      attrs._qa = { ...state, upvotes: Math.max(state.upvotes, d.upvotes), answered };
      if (!opts.dryRun) {
        await repo.saveContent({
          contentId: row.id,
          type: row.type,
          status: row.status,
          importanceScore: row.importanceScore,
          schemaType: "QAPage",
          schemaAttributes: attrs,
          featuredImage: row.featuredImage,
          locale: row.locale,
          slug: row.slug,
          title: row.title,
          excerpt: row.excerpt ?? undefined,
          tldr: row.tldr ?? undefined,
          blocks: qaBlocks(wpId, d),
          metaTitle: row.metaTitle ?? undefined,
          metaDescription: row.metaDescription ?? undefined,
          canonicalUrl: row.canonicalUrl ?? undefined,
          noIndex: row.noIndex,
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
        });
      }
      result.repaired += 1;
    } catch (error) {
      result.skipped.push({ slug: row.slug, reason: error instanceof Error ? error.message : "Bilinmeyen hata" });
    }
  }
  if (result.repaired > 0 && !opts.dryRun) {
    try {
      await revalidatePath("/");
    } catch {
      // İstek dışında (betik) önbellek temizliği atlanır.
    }
  }
  return result;
}
