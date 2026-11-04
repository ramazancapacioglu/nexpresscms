"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  extractJson,
  readTemplateMeta,
  type BlockNode,
  type TemplateKind,
  type TemplateConditions,
  type TemplateBehavior,
  STARTER_TEMPLATES,
  cloneStarterBlocks,
} from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { invalidateSite } from "@/lib/cache";
import { recordAudit } from "@/lib/audit";
import { resolveSiteSettings } from "@nexpress/core";

export type StudioResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function getStudioContext(auditAction: string) {
  const user = await requireUser({ audit: auditAction });
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  return { user, siteId, repo, site, locale };
}

/**
 * Ek CSS ve Ek JS (Özel Kodlar) Kaydetme Eylemi
 */
export async function saveCustomCodeAction(input: {
  customCss: string;
  headerScripts?: string;
  footerScripts?: string;
}): Promise<StudioResult> {
  await requireAdmin("studio.saveCustomCode");
  const { user, siteId, repo, site } = await getStudioContext("studio.saveCustomCode");

  const currentSettings = resolveSiteSettings(site?.settings);
  const updatedCustomizer = {
    ...currentSettings.customizer,
    customCss: input.customCss ?? "",
    headerScripts: input.headerScripts ?? "",
    footerScripts: input.footerScripts ?? "",
  };

  const updatedSettings = {
    ...site?.settings,
    customizer: updatedCustomizer,
  };

  await repo.saveSiteSettings({
    customizer: updatedCustomizer,
  });

  await recordAudit({ id: user.sub, email: user.email }, "studio.saveCustomCode", {
    detail: "Özel CSS ve JS kodları güncellendi",
  });

  await invalidateSite(siteId);
  revalidatePath("/admin/studio");
  revalidatePath("/admin/themes");
  revalidatePath("/");

  return { ok: true };
}

/**
 * Sihirbaz ile Yeni Şablon veya Senkronize Model Oluşturma
 */
export async function createStudioItemAction(input: {
  name: string;
  kind: TemplateKind;
  layoutMode?: "full" | "right-sidebar" | "left-sidebar";
  visibility?: "private" | "public" | "marketplace";
  category?: string;
  description?: string;
  initialBlocks?: BlockNode[];
}): Promise<StudioResult<{ contentId: string; slug: string }>> {
  const { user, siteId, repo, locale } = await getStudioContext("studio.createItem");

  const cleanName = input.name.trim();
  if (!cleanName) {
    return { ok: false, error: "Tasarım veya şablon adı zorunludur." };
  }

  const suffix = Math.random().toString(36).slice(2, 8);
  const kind = input.kind;

  // Başlangıç blokları
  let blocks: BlockNode[] = [];
  const starter = STARTER_TEMPLATES.find((s) => s.kind === kind);
  if (input.initialBlocks && input.initialBlocks.length > 0) {
    blocks = cloneStarterBlocks(input.initialBlocks, suffix);
  } else if (starter && starter.blocks) {
    blocks = cloneStarterBlocks(starter.blocks, suffix);
  } else {
    blocks = [
      {
        id: `blk_hero_${suffix}`,
        type: "paragraph",
        props: {
          text: `${cleanName} içeriği ve blok yerleşimi bu alana eklenecektir.`,
        },
      },
    ];
  }

  const templateMeta = {
    kind,
    isDefault: false,
    visibility: input.visibility || "private",
    category: input.category || "Genel",
    layoutMode: input.layoutMode || "full",
  };

  const saved = await repo.saveContent({
    actor: { id: user.sub, email: user.email },
    type: "template",
    status: "draft",
    importanceScore: 1,
    schemaType: "WebPage",
    schemaAttributes: {
      template: templateMeta,
      description: input.description || "",
    },
    locale,
    region: "TR",
    slug: `tpl-${kind}-${suffix}`,
    title: cleanName,
    tldr: input.description || `${cleanName} şablonu.`,
    blocks,
  });

  await invalidateSite(siteId);
  revalidatePath("/admin/studio");
  revalidatePath("/admin/appearance/templates");

  return { ok: true, contentId: saved.contentId, slug: saved.slug };
}

/**
 * Şablonu .nxtemplate JSON Olarak Dışa Aktarır
 */
export async function exportStudioTemplateAction(input: {
  id: string;
}): Promise<StudioResult<{ filename: string; json: string }>> {
  const { siteId, repo, locale } = await getStudioContext("studio.exportTemplate");
  const all = await repo.listContents({ locale, type: "template" });
  const target = all.find((c) => c.contentId === input.id);

  if (!target) {
    return { ok: false, error: "Dışa aktarılacak şablon bulunamadı." };
  }

  const meta = readTemplateMeta(target.schemaAttributes);

  const templatePackage = {
    manifest: {
      format: "nxtemplate",
      version: "1.0.0",
      id: target.slug,
      name: target.title,
      description: target.tldr || "",
      kind: meta?.kind || "page",
      category: ((meta as unknown as Record<string, unknown> | undefined)?.category as string) || "Genel",
      exportedAt: new Date().toISOString(),
      generator: "NexPress Design Studio",
    },
    template: meta || { kind: "page", isDefault: false },
    blocks: target.blocks,
  };

  const filename = `${target.slug}.nxtemplate.json`;
  const json = JSON.stringify(templatePackage, null, 2);

  return { ok: true, filename, json };
}

/**
 * .nxtemplate JSON Paketini İçe Aktarır
 */
export async function importStudioTemplateAction(input: {
  json: string;
}): Promise<StudioResult<{ contentId: string; name: string }>> {
  const { user, siteId, repo, locale } = await getStudioContext("studio.importTemplate");

  if (!input.json || input.json.length > 500_000) {
    return { ok: false, error: "Geçersiz veya aşırı büyük şablon JSON dosyası." };
  }

  const parsed = extractJson(input.json);
  if (!parsed.ok) {
    return { ok: false, error: `JSON çözümlenemedi: ${parsed.error}` };
  }

  const data = parsed.value as Record<string, any>;
  const manifest = data.manifest || {};
  const name = String(manifest.name || data.title || "İçe Aktarılan Şablon");
  const kind = (data.template?.kind || manifest.kind || "page") as TemplateKind;
  const blocks = Array.isArray(data.blocks) ? (data.blocks as BlockNode[]) : [];

  const suffix = Math.random().toString(36).slice(2, 8);
  const clonedBlocks = cloneStarterBlocks(blocks, suffix);

  const saved = await repo.saveContent({
    actor: { id: user.sub, email: user.email },
    type: "template",
    status: "draft",
    importanceScore: 1,
    schemaType: "WebPage",
    schemaAttributes: {
      template: {
        kind,
        isDefault: false,
        category: manifest.category || "İçe Aktarılanlar",
        conditions: data.template?.conditions,
        behavior: data.template?.behavior,
      },
      source: "imported",
      importedAt: new Date().toISOString(),
    },
    locale,
    region: "TR",
    slug: `imported-${suffix}`,
    title: `${name} (İçe Aktarıldı)`,
    tldr: manifest.description || `${name} şablonu.`,
    blocks: clonedBlocks,
  });

  await invalidateSite(siteId);
  revalidatePath("/admin/studio");
  revalidatePath("/admin/appearance/templates");

  return { ok: true, contentId: saved.contentId, name };
}

