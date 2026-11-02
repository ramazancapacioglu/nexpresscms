"use server";

import { headers } from "next/headers";
import { cloneStarterBlocks, isTemplateKind, readTemplateMeta, STARTER_TEMPLATES, validateTemplate } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { invalidateSite, revalidatePath } from "@/lib/cache";
import { requireUser } from "@/lib/auth/session";

export type TemplateResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function ctx(audit: string) {
  const session = await requireUser({ audit });
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale ?? "tr";
  return { session, siteId, repo, locale };
}

async function refresh(siteId: string) {
  await invalidateSite(siteId);
  await revalidatePath("/admin/appearance/templates");
}

/** Hazır şablondan kopya oluşturur (her zaman taslak ve varsayılan DEĞİL; kullanıcı "Varsayılan yap" der). */
export async function createTemplateAction(input: { starterId: string }): Promise<TemplateResult<{ id: string }>> {
  const { session, siteId, repo, locale } = await ctx("template.create");
  const starter = STARTER_TEMPLATES.find((s) => s.id === input.starterId);
  if (!starter) return { ok: false, error: "Hazır şablon bulunamadı." };
  const suffix = Math.random().toString(36).slice(2, 8);
  const res = await repo.saveContent({
    actor: { id: session.sub, email: session.email },
    type: "template",
    status: "draft",
    importanceScore: 1,
    schemaType: "WebPage",
    schemaAttributes: { template: { kind: starter.kind, isDefault: false } },
    locale,
    region: "TR",
    slug: `tpl-${suffix}`,
    title: starter.name,
    tldr: starter.description,
    blocks: cloneStarterBlocks(starter.blocks, suffix),
  } as never);
  await refresh(siteId);
  return { ok: true, id: res.contentId };
}

/** Türün varsayılan şablonunu değiştirir (türde yalnızca bir varsayılan). Hatalı şablon (zorunlu yuva yok) varsayılan yapılamaz. */
export async function setDefaultTemplateAction(input: { id: string; makeDefault: boolean }): Promise<TemplateResult> {
  const { session, siteId, repo, locale } = await ctx("template.default");
  const all = await repo.listContents({ locale, type: "template" });
  const target = all.find((c) => c.contentId === input.id);
  const meta = target ? readTemplateMeta(target.schemaAttributes) : null;
  if (!target || !meta) return { ok: false, error: "Şablon bulunamadı." };
  if (input.makeDefault) {
    const errors = validateTemplate(meta.kind, target.blocks).filter((i) => i.level === "error");
    if (errors.length) return { ok: false, error: `Varsayılan yapılamaz: ${errors[0]!.message}` };
  }
  for (const c of all) {
    const m = readTemplateMeta(c.schemaAttributes);
    if (!m || m.kind !== meta.kind) continue;
    const want = c.contentId === input.id ? input.makeDefault : false;
    if (m.isDefault === want) continue;
    await repo.saveContent({
      actor: { id: session.sub, email: session.email },
      contentId: c.contentId,
      type: "template",
      status: "draft",
      importanceScore: c.importanceScore,
      schemaType: c.schemaType,
      schemaAttributes: { ...c.schemaAttributes, template: { ...m, isDefault: want } },
      locale,
      region: "TR",
      slug: c.slug,
      title: c.title,
      tldr: c.tldr ?? "",
      blocks: c.blocks,
    } as never);
  }
  await refresh(siteId);
  return { ok: true };
}

export async function deleteTemplateAction(input: { id: string }): Promise<TemplateResult> {
  const { siteId, repo, locale } = await ctx("template.delete");
  const all = await repo.listContents({ locale, type: "template" });
  if (!all.some((c) => c.contentId === input.id)) return { ok: false, error: "Şablon bulunamadı." };
  await repo.deleteContents([input.id]);
  await refresh(siteId);
  return { ok: true };
}

/** Bir kategori/etiketin arşiv şablonunu seçer (boş = türün varsayılanı, "none" = yerleşik görünüm). */
export async function assignTaxonomyTemplateAction(input: { taxonomyId: string; templateId: string | null }): Promise<TemplateResult> {
  const { siteId, repo, locale } = await ctx("template.assign");
  const term = (await repo.listTaxonomies()).find((t) => t.id === input.taxonomyId);
  if (!term) return { ok: false, error: "Terim bulunamadı." };
  const kind = term.taxonomyType;
  if (!isTemplateKind(kind) || (kind !== "category" && kind !== "tag")) return { ok: false, error: "Bu terim türü şablon desteklemiyor." };
  if (input.templateId && input.templateId !== "none") {
    const t = (await repo.listContents({ locale, type: "template" })).find((c) => c.contentId === input.templateId);
    if (!t || readTemplateMeta(t.schemaAttributes)?.kind !== kind) return { ok: false, error: "Seçilen şablon bu terim türüne uygun değil." };
  }
  await repo.saveTaxonomy({ id: term.id, taxonomyType: term.taxonomyType, slug: term.slug, name: term.name, description: term.description ?? undefined, parentId: term.parentId, imageUrl: term.imageUrl, sortOrder: term.sortOrder, color: term.color ?? undefined, seoTitle: term.seoTitle ?? undefined, seoDescription: term.seoDescription ?? undefined, templateId: input.templateId || null });
  await refresh(siteId);
  await revalidatePath("/admin/taxonomies");
  return { ok: true };
}
