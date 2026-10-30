"use server";

import { buildThemePackage, ThemeJsonSchema, TokensSchema } from "@nexpress/themes/package";
import { extractJson, pluginActions, type DesignMode } from "@nexpress/core";
import { DESIGN_KINDS, getDesignLibraryRepository, getScopedRepository, type DesignKind } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "@/lib/cache";
import { evaluateDesign, exportDesignPrompt, type DesignPreview } from "@/lib/design-library";
import { installThemePackage } from "@/lib/theme-packages";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; code?: string };
const MODES: DesignMode[] = ["section", "page", "theme"];
const isMode = (m: unknown): m is DesignMode => MODES.includes(m as DesignMode);

/** AI ile üretir (eklenti eylemi). Yazmaz; sunucuda yeniden doğrulanmış önizleme döner. */
export async function generateDesignAction(input: { mode: DesignMode; prompt: string }): Promise<Result<{ design: DesignPreview }>> {
  const me = await requireUser({ audit: "design.generate" });
  if (!isMode(input.mode)) return { ok: false, error: "Geçersiz tasarım türü." };
  const res = await pluginActions.run("ai-design.generate", { siteId: me.siteId, userId: me.sub, input: { mode: input.mode, prompt: input.prompt } });
  if (!res.ok) return { ok: false, error: res.error, code: res.code };
  // Modelin döndürdüğü nesne yine sunucuda, güncel site bağlamıyla doğrulanır (eklenti çıktısına güvenilmez)
  const g = res.data as Record<string, any>;
  const raw = input.mode === "theme" ? { id: g.theme?.id, name: g.name, tagline: g.theme?.tagline, description: g.description, tokens: g.tokens } : { ...g.page, name: g.name, description: g.description, category: g.category, blocks: g.lint?.blocks };
  const design = await evaluateDesign(me.siteId, input.mode, raw);
  return { ok: true, design: { ...design, attempts: Number(g.attempts) || undefined, model: typeof g.model === "string" ? g.model : undefined } };
}

/** Dış sohbetten gelen JSON'u (yapıştırma) aynı doğrulamadan geçirir: anahtar gerektirmez. */
export async function validateDesignJsonAction(input: { mode: DesignMode; json: string }): Promise<Result<{ design: DesignPreview }>> {
  const me = await requireUser({ audit: "design.import" });
  if (!isMode(input.mode)) return { ok: false, error: "Geçersiz tasarım türü." };
  if (input.json.length > 300_000) return { ok: false, error: "JSON çok büyük." };
  const parsed = extractJson(input.json);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, design: await evaluateDesign(me.siteId, input.mode, parsed.value) };
}

export async function exportPromptAction(input: { mode: DesignMode }): Promise<Result<{ prompt: string }>> {
  const me = await requireUser({ audit: "design.prompt" });
  if (!isMode(input.mode)) return { ok: false, error: "Geçersiz tasarım türü." };
  return { ok: true, prompt: await exportDesignPrompt(me.siteId, input.mode) };
}

/** Kütüphaneye kaydeder. Hatalı (errors > 0) tasarım kaydedilmez; veri istemciden değil, yeniden doğrulanmış halinden yazılır. */
export async function saveDesignAction(input: { design: DesignPreview; name: string; prompt?: string; source: "ai" | "manual" }): Promise<Result<{ id: string }>> {
  const me = await requireUser({ audit: "design.save" });
  const d = input.design;
  if (!isMode(d?.mode)) return { ok: false, error: "Geçersiz tasarım." };
  const raw = d.mode === "theme" ? { id: d.theme?.id, name: d.name, tagline: d.theme?.tagline, description: d.description, tokens: d.theme?.tokens } : { ...d.page, name: d.name, description: d.description, category: d.category, blocks: d.blocks };
  const fresh = await evaluateDesign(me.siteId, d.mode, raw);
  if (fresh.errors.length > 0) return { ok: false, error: `Tasarım doğrulamadan geçmedi: ${fresh.errors[0]}` };
  const name = input.name.trim() || fresh.name;
  const payload = d.mode === "theme" ? { theme: fresh.theme } : d.mode === "page" ? { page: fresh.page, blocks: fresh.blocks } : { blocks: fresh.blocks };
  const res = await getDesignLibraryRepository(me.siteId).create({
    kind: d.mode as DesignKind,
    name,
    description: fresh.description,
    category: fresh.category,
    payload,
    source: input.source,
    prompt: input.prompt,
    report: { score: fresh.score, warnings: fresh.warnings.slice(0, 20), stats: fresh.stats, model: d.model, attempts: d.attempts },
    placeholderData: fresh.placeholderData,
    createdBy: me.email,
  });
  if (!res.ok) return res;
  await revalidatePath("/admin/design-library");
  return { ok: true, id: res.item.id };
}

export async function renameDesignAction(input: { id: string; name: string }): Promise<Result> {
  const me = await requireUser({ audit: "design.rename" });
  const ok = await getDesignLibraryRepository(me.siteId).rename(input.id, { name: input.name });
  await revalidatePath("/admin/design-library");
  return ok ? { ok: true } : { ok: false, error: "Tasarım bulunamadı." };
}

export async function deleteDesignAction(input: { id: string }): Promise<Result> {
  const me = await requireUser({ audit: "design.delete" });
  const ok = await getDesignLibraryRepository(me.siteId).remove(input.id);
  if (ok) await recordAudit({ id: me.sub, email: me.email }, "design.delete", { detail: input.id });
  await revalidatePath("/admin/design-library");
  return ok ? { ok: true } : { ok: false, error: "Tasarım bulunamadı." };
}

/** Sayfa tasarımından TASLAK sayfa oluşturur (yayınlamaz). Slug çakışmasında sayı eklenir. */
export async function createPageFromDesignAction(input: { id: string }): Promise<Result<{ contentId: string }>> {
  const me = await requireUser({ audit: "design.create-page" });
  const item = await getDesignLibraryRepository(me.siteId).get(input.id);
  if (!item || item.kind !== "page") return { ok: false, error: "Sayfa tasarımı bulunamadı." };
  const fresh = await evaluateDesign(me.siteId, "page", { ...(item.payload.page as object), blocks: item.payload.blocks });
  if (fresh.errors.length > 0 || !fresh.page) return { ok: false, error: `Tasarım artık geçerli değil: ${fresh.errors[0] ?? "sayfa bilgisi yok"}` };
  const repo = getScopedRepository(me.siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const taken = new Set((await repo.listContents({ locale })).map((c) => c.slug));
  let slug = fresh.page.slug;
  for (let n = 2; taken.has(slug); n++) slug = `${fresh.page.slug.slice(0, 74)}-${n}`;
  const saved = await repo.saveContent({
    actor: { id: me.sub, email: me.email },
    type: "page",
    status: "draft",
    schemaType: fresh.page.schemaType,
    schemaAttributes: { canvas: true, designSource: item.id },
    locale,
    slug,
    title: fresh.page.title,
    tldr: fresh.page.tldr,
    metaTitle: fresh.page.metaTitle || undefined,
    metaDescription: fresh.page.metaDescription || undefined,
    blocks: fresh.blocks,
  });
  await revalidatePath("/admin/pages");
  return { ok: true, contentId: saved.contentId };
}

/** Tema tasarımını yüklenen tema olarak KURAR (etkinleştirmez; `/admin/themes/packages` üzerinden etkinleştirilir). */
export async function installThemeDesignAction(input: { id: string }): Promise<Result<{ themeId: string }>> {
  const me = await requireUser({ audit: "design.install-theme" });
  const item = await getDesignLibraryRepository(me.siteId).get(input.id);
  if (!item || item.kind !== "theme") return { ok: false, error: "Tema tasarımı bulunamadı." };
  const t = item.payload.theme as Record<string, any> | undefined;
  const fresh = await evaluateDesign(me.siteId, "theme", { id: t?.id, name: item.name, tagline: t?.tagline, description: item.description, tokens: t?.tokens });
  if (fresh.errors.length > 0 || !fresh.theme) return { ok: false, error: `Tema artık geçerli değil: ${fresh.errors[0] ?? "jeton yok"}` };
  const meta = ThemeJsonSchema.parse({ id: fresh.theme.id, name: fresh.name, version: "1.0.0", author: "AI Tasarım", tagline: fresh.theme.tagline, description: fresh.theme.description, recommendedProfile: "corporate", features: ["AI tarafından üretildi"] });
  const bytes = buildThemePackage({ theme: meta, tokens: TokensSchema.parse(fresh.theme.tokens) });
  const report = await installThemePackage(me.siteId, bytes);
  if (!report.ok) return { ok: false, error: report.errors[0] ?? "Tema kurulamadı." };
  await recordAudit({ id: me.sub, email: me.email }, "design.install-theme", { detail: report.theme.id });
  await revalidatePath("/admin/themes");
  return { ok: true, themeId: report.theme.id };
}
