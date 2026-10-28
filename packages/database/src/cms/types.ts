import { type BlockNode, type ContentStatus, type ContentType, type DesignTokens, type FooterConfig, type HeaderConfig, type NavigationMenuItem, type SidebarConfig, type SiteProfile, type SiteSettings } from "@nexpress/core";

export interface SiteSettingsPatch {
  seo?: Partial<SiteSettings["seo"]>;
  general?: Partial<SiteSettings["general"]>;
  customizer?: {
    typography?: Partial<SiteSettings["customizer"]["typography"]>;
    layout?: Partial<SiteSettings["customizer"]["layout"]>;
    buttons?: Partial<SiteSettings["customizer"]["buttons"]>;
    header?: Partial<SiteSettings["customizer"]["header"]>;
    footer?: Partial<SiteSettings["customizer"]["footer"]>;
    pageTitle?: Partial<SiteSettings["customizer"]["pageTitle"]>;
    archive?: Partial<SiteSettings["customizer"]["archive"]>;
    customCss?: string;
  };
}

export interface SiteDto {
  id: string;
  siteId: string;
  name: string;
  tagline: string | null;
  domain: string;
  subdomain: string | null;
  siteProfile: SiteProfile;
  defaultLocale: string;
  supportedLocales: string[];
  activeThemeId: string;
  designTokens: DesignTokens;
  siteDna: string | null;
  settings: SiteSettings;
}

export interface ContentWithTranslationDto {
  id: string;
  contentId: string;
  siteId: string;
  type: ContentType;
  status: ContentStatus;
  importanceScore: number;
  schemaType: string;
  schemaAttributes: Record<string, unknown>;
  featuredImage: string | null;
  authorName: string;
  publishedAt: Date | null;
  createdAt: Date;
  translationId: string;
  locale: string;
  region: string;
  slug: string;
  title: string;
  excerpt: string | null;
  tldr: string | null;
  blocks: BlockNode[];
  markdownCache: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  seoScore: number;
  gapFindings: string[];
  updatedAt: Date;
}

export type ContentDto = ContentWithTranslationDto;

export interface TaxonomyDto {
  id: string;
  siteId: string;
  taxonomyType: string; // 'category' | 'tag'
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  color: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  imageUrl: string | null;
  sortOrder: number;
  itemCount: number;
  createdAt: Date;
}

export interface MediaAssetDto {
  id: string;
  siteId: string;
  filename: string;
  url: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  altText: string;
  titleText: string | null;
  caption: string | null;
  focalPoint: { x: number; y: number };
  seoScore: number;
  createdAt: Date;
}

export interface CommentReviewDto {
  id: string;
  siteId: string;
  contentId: string;
  authorName: string;
  authorEmail: string | null;
  entryType: string; // 'comment' | 'review'
  rating: number;
  title: string | null;
  body: string;
  pros: string[];
  cons: string[];
  status: string; // 'approved' | 'pending' | 'spam'
  isVerified: boolean;
  createdAt: Date;
}

export interface NavigationLayoutDto {
  id: string;
  siteId: string;
  locale: string;
  headerConfig: HeaderConfig;
  menuItems: NavigationMenuItem[];
  footerConfig: FooterConfig;
  sidebarConfig: SidebarConfig;
}

export interface InstalledThemeDto {
  id: string;
  siteId: string;
  themeId: string;
  isActive: boolean;
  customTokens: Partial<DesignTokens> | null;
}

export interface EntityLinkDto {
  id: string;
  siteId: string;
  sourceContentId: string;
  targetContentId: string;
  relationType: string;
  anchorText: string | null;
}

export interface SaveContentInput {
  /** Revizyon geçmişinde görünecek yazar (yoksa anonim/sistem kaydı). */
  actor?: { id: string | null; email: string };
  contentId?: string;
  type: ContentType;
  status?: ContentStatus;
  importanceScore?: number;
  schemaType?: string;
  schemaAttributes?: Record<string, unknown>;
  featuredImage?: string | null;
  locale: string;
  region?: string;
  slug: string;
  title: string;
  excerpt?: string;
  tldr?: string;
  blocks: BlockNode[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  seoScore?: number;
}

export type { RevisionSnapshot, RevisionSummary, RevisionActor } from "./revisions";
export type { SitePluginRecord, SitePluginPatch } from "./plugins";
