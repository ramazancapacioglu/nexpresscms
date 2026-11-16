import "server-only";
import { getScopedRepository } from "@nexpress/database";
import { plainText } from "@nexpress/wp-importer";
import type { WpSession } from "./session";

/**
 * Google yorumları (Agentic SEO `aseo_review`). Puan kaynakta saklanmadığından yıldız yazılmaz:
 * ana sayfaya onaylı yorum olarak, "google" etiketiyle eklenir. Uydurma puan yoktur.
 */
export async function importGoogleReviews(session: WpSession, siteId: string): Promise<{ reviews: number }> {
  const repo = getScopedRepository(siteId);
  const index = await session.json<{ page_on_front?: number }>("/wp-json/");
  const frontId = index.page_on_front ?? 0;
  if (!frontId || !(await repo.getContentById(`cnt_wp_${frontId}`, (await repo.getSite())?.defaultLocale || "tr"))) return { reviews: 0 };
  const list = await session.text("/wp-admin/edit.php?post_type=aseo_review&post_status=all");
  const rows = [...list.matchAll(/<tr id="post-(\d+)"[\s\S]*?<\/tr>/g)];
  let reviews = 0;
  for (const row of rows) {
    const id = row[1] ?? "";
    const when = /(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}):(\d{2})/.exec(row[0]);
    const title = plainText(/aria-label="([^"]*)"/.exec(row[0])?.[1] ?? "", 160);
    const author = title.replace(/^Yorum:\s*/i, "").trim() || "Google kullanıcısı";
    const edit = await session.text(`/wp-admin/post.php?post=${id}&action=edit`);
    const body = plainText(/id="content"[^>]*>([\s\S]*?)<\/textarea>/.exec(edit)?.[1] ?? "", 4000);
    if (!body) continue;
    await repo.saveCommentReview({
      id: `cmt_wp_g${id}`,
      contentId: `cnt_wp_${frontId}`,
      authorName: author,
      entryType: "comment",
      title: "Google yorumu",
      body,
      status: "approved",
      tags: ["google"],
      ...(when ? { createdAt: new Date(Date.UTC(Number(when[3]), Number(when[2]) - 1, Number(when[1]), Number(when[4]) - 3, Number(when[5]))) } : {}),
    });
    reviews += 1;
  }
  return { reviews };
}
