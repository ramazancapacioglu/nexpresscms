"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { uniqueSlug, type BlockNode } from "@nexpress/core";
import type { CampaignFields } from "@nexpress/core";

export async function saveCampaignAction(input: {
  contentId?: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  tldr: string;
  locale?: string;
  campaign: CampaignFields;
  blocks?: BlockNode[];
}) {
  const user = await requireUser({ audit: "campaigns.save" });
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const locale = input.locale || "tr";

  const camp = input.campaign;
  const cleanTitle = input.title.trim();
  if (!cleanTitle) {
    return { ok: false, error: "Kampanya başlığı zorunludur." };
  }

  // Slug kontrol ve benzersiz yapma
  const baseSlug = input.slug.trim() || cleanTitle;
  const existingContents = await repo.listContents({ locale });
  const taken = new Set(
    existingContents
      .filter((c) => c.contentId !== input.contentId)
      .map((c) => c.slug)
  );
  const slug = uniqueSlug(baseSlug, taken);

  // Varsayılan bloklar yoksa oluştur
  const blocks: BlockNode[] = input.blocks && input.blocks.length > 0
    ? input.blocks
    : [
        {
          id: "camp_p1",
          type: "paragraph",
          props: {
            text: input.tldr || `${cleanTitle} detayları ve katılım koşulları aşağıda listelenmiştir.`,
          },
        },
      ];

  // Schema attributes içine zengin kampanya alanlarını koy
  const schemaAttributes = {
    campaign: {
      discount: camp.discount,
      gift: camp.gift,
      productName: camp.productName,
      productUrl: camp.productUrl,
      catalogProductId: camp.catalogProductId,
      badge: camp.badge,
      startDate: camp.startDate,
      endDate: camp.endDate,
      terms: camp.terms,
      termsList: camp.termsList,
      targetAudience: camp.targetAudience,
      ctaText: camp.ctaText,
      ctaUrl: camp.ctaUrl,
      contactPhone: camp.contactPhone,
      contactWhatsapp: camp.contactWhatsapp,
      featuredImageUrl: camp.featuredImageUrl,
      featuredImageAlt: camp.featuredImageAlt,
      isPerpetual: camp.isPerpetual,
    },
    // WordPress / ACO geriye dönük uyumluluğu için eşzamanlı camp_* alanları
    camp_name: cleanTitle,
    camp_discount: camp.discount,
    camp_gift: camp.gift,
    camp_product_name: camp.productName,
    camp_product_url: camp.productUrl,
    camp_start: camp.startDate,
    camp_end: camp.endDate,
    camp_detail: input.tldr,
    camp_terms: camp.terms,
    // Google Schema.org Offer zenginleştirme düğümü
    richSchema: {
      offer: {
        name: cleanTitle,
        discount: camp.discount,
        validFrom: camp.startDate,
        validThrough: camp.endDate,
        terms: camp.terms,
      },
    },
    publishing: {
      categories: ["Kampanyalar"],
      featuredImageUrl: camp.featuredImageUrl,
      featuredImageAlt: camp.featuredImageAlt,
    },
  };

  const saved = await repo.saveContent({
    actor: { id: user.sub, email: user.email },
    contentId: input.contentId,
    type: "campaign",
    status: input.status,
    schemaType: "Offer",
    schemaAttributes,
    featuredImage: camp.featuredImageUrl || null,
    locale,
    slug,
    title: cleanTitle,
    tldr: input.tldr,
    blocks,
  });

  revalidatePath("/admin/campaigns");
  revalidatePath(`/${locale}/kampanyalar`);
  revalidatePath(`/${locale}/kampanya/${slug}`);
  revalidatePath(`/${locale}/${slug}`);

  return { ok: true, contentId: saved.contentId, slug };
}

export async function deleteCampaignAction(contentId: string) {
  await requireUser({ audit: "campaigns.delete" });
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  await repo.deleteContents([contentId]);
  revalidatePath("/admin/campaigns");
  return { ok: true };
}

export async function duplicateCampaignAction(contentId: string) {
  await requireUser({ audit: "campaigns.duplicate" });
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  const newContentId = await repo.duplicateContent(contentId);
  if (!newContentId) {
    return { ok: false, error: "Kampanya çoğaltılamadı." };
  }
  revalidatePath("/admin/campaigns");
  return { ok: true, newContentId };
}

export async function toggleCampaignStatusAction(contentId: string, status: "published" | "draft") {
  await requireUser({ audit: "campaigns.toggleStatus" });
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  await repo.patchContent(contentId, { status });
  revalidatePath("/admin/campaigns");
  return { ok: true };
}

