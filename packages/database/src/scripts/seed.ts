import { compileBlocksToMarkdown, type DesignTokens } from "@nexpress/core";
import { getDbDialect } from "../client";
import { backendFor } from "../dialect";
import { migrateDatabase } from "./migrate";
import { defaultFooter, defaultHeader, defaultMenuItems } from "./seed-chrome";
import { seedContents } from "./seed-contents";
import { seedCommerceProducts, seedMedia, seedReviews, seedTaxonomies, themesToInstall } from "./seed-catalog";

export const DEFAULT_CORPORATE_AURORA_TOKENS: DesignTokens = {
  colors: {
    primary: "#2563eb",
    primaryForeground: "#ffffff",
    secondary: "#0f172a",
    secondaryForeground: "#f8fafc",
    accent: "#4f46e5",
    accentForeground: "#ffffff",
    background: "#ffffff",
    foreground: "#09090b",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    border: "#e2e8f0",
  },
  typography: {
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "JetBrains Mono, monospace",
    baseSizePx: 16,
    scaleRatio: 1.25,
  },
  geometry: {
    borderRadius: "0.75rem",
    containerMaxWidth: "1280px",
    sectionSpacingY: "5rem",
    cardShadow: "md",
  },
};

export async function seedDatabase(): Promise<void> {
  await migrateDatabase();
  const dialect = getDbDialect();
  const now = new Date();
  const siteId = "default";
  const { db, t } = backendFor(dialect);
  await db
    .insert(t.sites)
    .values({
      id: "site_default",
      siteId,
      name: "NexPress Kurumsal Vitrin",
      tagline: "100/100 Lighthouse RSC & Agentic SEO CMS",
      domain: "localhost:3000",
      subdomain: "default",
      siteProfile: "corporate",
      defaultLocale: "tr",
      supportedLocales: ["tr"],
      activeThemeId: "corporate-aurora",
      designTokens: DEFAULT_CORPORATE_AURORA_TOKENS,
      siteDna:
        "NexPress; hızı, açık çekirdekli esnekliği ve yapay zeka ajanlarıyla tam uyumu merkezine alan otoriter, net ve kanıt odaklı bir mühendislik diline sahiptir.",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  await db
    .insert(t.navigationLayouts)
    .values({
      id: "nav_default_tr",
      siteId,
      locale: "tr",
      headerConfig: defaultHeader,
      menuItems: defaultMenuItems,
      footerConfig: defaultFooter,
      updatedAt: now,
    })
    .onConflictDoNothing();

  for (const thm of themesToInstall) {
    await db
      .insert(t.installedThemes)
      .values({
        id: thm.id,
        siteId,
        themeId: thm.themeId,
        isActive: thm.isActive,
        customTokens: {},
        installedAt: now,
      })
      .onConflictDoNothing();
  }

  for (const item of seedContents) {
    const md = compileBlocksToMarkdown(item.blocks, {
      title: item.title,
      tldr: item.tldr,
    });
    await db
      .insert(t.contents)
      .values({
        id: item.id,
        siteId,
        type: item.type,
        status: "published",
        importanceScore: item.importanceScore,
        schemaType: item.schemaType,
        schemaAttributes: item.schemaAttributes,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    await db
      .insert(t.contentTranslations)
      .values({
        id: `tr_${item.id}_tr`,
        siteId,
        contentId: item.id,
        locale: "tr",
        region: "TR",
        slug: item.slug,
        title: item.title,
        excerpt: item.tldr,
        tldr: item.tldr,
        blocks: item.blocks,
        markdownCache: md,
        metaTitle: item.title,
        metaDescription: item.tldr,
        seoScore: item.seoScore,
        gapFindings: [],
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  await db
    .insert(t.contentEntityLinks)
    .values([
      {
        id: "elnk_kb_to_prod",
        siteId,
        sourceContentId: "cnt_kb_rsc",
        targetContentId: "cnt_product_cloud",
        relationType: "about",
        anchorText: "NexPress Enterprise Cloud",
        createdAt: now,
      },
      {
        id: "elnk_camp_to_prod",
        siteId,
        sourceContentId: "cnt_campaign_spring",
        targetContentId: "cnt_product_cloud",
        relationType: "offer_for",
        anchorText: "NexPress Enterprise Cloud %30 İndirim",
        createdAt: now,
      },
    ])
    .onConflictDoNothing();

  for (const tax of seedTaxonomies) {
    await db
      .insert(t.taxonomies)
      .values({
        ...tax,
        siteId,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: t.taxonomies.id,
        set: {
          parentId: tax.parentId,
          imageUrl: tax.imageUrl,
          sortOrder: tax.sortOrder,
        },
      });
  }

  for (const med of seedMedia) {
    await db
      .insert(t.mediaAssets)
      .values({
        ...med,
        siteId,
        createdAt: now,
      })
      .onConflictDoNothing();
  }

  for (const rev of seedReviews) {
    await db
      .insert(t.commentsReviews)
      .values({
        ...rev,
        siteId,
        createdAt: now,
      })
      .onConflictDoNothing();
  }

  for (const prod of seedCommerceProducts) {
    await db
      .insert(t.commerceProducts)
      .values({
        ...prod,
        siteId,
        galleryUrls: [],
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: t.commerceProducts.id,
        set: {
          name: prod.name,
          priceCents: prod.priceCents,
          status: prod.status,
          updatedAt: now,
        },
      });
  }

  console.log(`[NexPress DB] ${dialect} başlangıç verileri başarıyla yüklendi.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
