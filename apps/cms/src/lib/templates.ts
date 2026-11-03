import "server-only";
import { readTemplateMeta, resolveTemplate, type TemplateContext, type TemplateKind, type TemplateRecord } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { cachedRead } from "./cache";

/** Şablonlar (`type: "template"` içerik): yönetim kaydında önbellek düşer. Yalnızca varsayılan dilin kaydı okunur. */
export const listTemplates = cachedRead("templates", async (siteId: string): Promise<TemplateRecord[]> => {
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale ?? "tr";
  const rows = await repo.listContents({ locale, type: "template" });
  return rows
    .filter((c) => c.type === "template")
    .flatMap((c) => {
      const meta = readTemplateMeta(c.schemaAttributes);
      return meta ? [{ id: c.contentId, name: c.title, meta, blocks: c.blocks }] : [];
    });
});

/** Atama: `"none"` = yerleşik görünüm (şablon kullanma); kimlik = o şablon; boş = görüntüleme koşulu eşleşen şablon, yoksa türün varsayılanı. */
export async function templateFor(siteId: string, kind: TemplateKind, assigned?: string | null, ctx?: TemplateContext): Promise<TemplateRecord | null> {
  if (assigned === "none") return null;
  return resolveTemplate(kind, await listTemplates(siteId), assigned, ctx);
}

/** Senkronize modeller haritası: patternId -> BlockNode[] */
export const getSyncedPatternsMap = async (siteId: string): Promise<Record<string, import("@nexpress/core").BlockNode[]>> => {
  const templates = await listTemplates(siteId);
  const map: Record<string, import("@nexpress/core").BlockNode[]> = {};
  for (const t of templates) {
    if (t.meta.kind === "pattern") {
      map[t.id] = t.blocks;
    }
  }
  return map;
};
