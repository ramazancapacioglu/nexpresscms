import { z } from "zod";
import { BlockNodeSchema } from "@nexpress/core";

/** Tema paketi şemaları (zod). Paket kod çalıştırmaz: yalnızca doğrulanmış veri. */
export const THEME_ID_RE = /^[a-z0-9][a-z0-9-]{1,38}$/;

const colorValue = z
  .string()
  .max(40)
  .regex(/^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([0-9.,%\s/]+\))$/i, "Geçersiz renk");

const cssLength = z
  .string()
  .max(24)
  .regex(/^[0-9.]+(px|rem|em|%|vw|ch)?$/, "Geçersiz uzunluk");

const fontStack = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9 ,'"\-_.]+$/, "Yazı tipi adı yalnızca harf, rakam, boşluk, virgül ve tırnak içerebilir");

const colorSet = z.object({
  primary: colorValue,
  primaryForeground: colorValue,
  secondary: colorValue,
  secondaryForeground: colorValue,
  accent: colorValue,
  accentForeground: colorValue,
  background: colorValue,
  foreground: colorValue,
  muted: colorValue,
  mutedForeground: colorValue,
  border: colorValue,
});

export const TokensSchema = z.object({
  colors: colorSet,
  darkColors: colorSet.partial().optional(),
  typography: z.object({
    headingFont: fontStack,
    bodyFont: fontStack,
    monoFont: fontStack,
    baseSizePx: z.number().min(12).max(22),
    scaleRatio: z.number().min(1.05).max(1.6),
  }),
  geometry: z.object({
    borderRadius: cssLength,
    containerMaxWidth: cssLength,
    sectionSpacingY: cssLength,
    cardShadow: z.enum(["none", "sm", "md", "lg", "glow"]),
  }),
});

export const ThemeJsonSchema = z.object({
  id: z.string().regex(THEME_ID_RE, "Kimlik küçük harf, rakam ve tire olmalı (2–39 karakter)"),
  name: z.string().min(1).max(60),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Sürüm 1.2.3 biçiminde olmalı"),
  author: z.string().max(80).default(""),
  tagline: z.string().max(120).default(""),
  description: z.string().max(300).default(""),
  recommendedProfile: z.enum(["corporate", "ecommerce", "news"]).default("corporate"),
  features: z.array(z.string().max(60)).max(12).default([]),
});

const link = z.object({ label: z.string().max(80), href: z.string().max(300), badge: z.string().max(30).optional() });
const bar = z.object({
  enabled: z.boolean(),
  leftWidgets: z.array(z.string().max(40)).max(8),
  centerWidgets: z.array(z.string().max(40)).max(8),
  rightWidgets: z.array(z.string().max(40)).max(8),
  mobileLeftWidgets: z.array(z.string().max(40)).max(8).optional(),
  mobileCenterWidgets: z.array(z.string().max(40)).max(8).optional(),
  mobileRightWidgets: z.array(z.string().max(40)).max(8).optional(),
});

const headerOptions = z.object({
  ctaStyle: z.enum(["solid", "outline", "ghost"]).optional(),
  secondaryLabel: z.string().max(60).optional(),
  secondaryHref: z.string().max(300).optional(),
  htmlText: z.string().max(160).optional(),
});

const footerRowStyle = z.object({
  background: z.enum(["default", "muted", "primary", "dark", "custom"]).optional(),
  customColor: colorValue.optional(),
  paddingY: z.number().min(8).max(120).optional(),
  divider: z.boolean().optional(),
  width: z.enum(["contained", "full"]).optional(),
});

const footerOptions = z.object({
  main: footerRowStyle.optional(),
  bottom: footerRowStyle
    .extend({
      socials: z
        .object({
          x: z.string().max(300).optional(),
          linkedin: z.string().max(300).optional(),
          instagram: z.string().max(300).optional(),
          youtube: z.string().max(300).optional(),
          github: z.string().max(300).optional(),
          facebook: z.string().max(300).optional(),
        })
        .optional(),
      menuId: z.string().max(60).optional(),
      layout: z.enum(["split", "centered"]).optional(),
      backToTop: z.boolean().optional(),
    })
    .optional(),
  gap: z.enum(["sm", "md", "lg"]).optional(),
});

export const HeaderSchema = z.object({
  options: headerOptions.optional(),
  topBar: bar.extend({ announcementText: z.string().max(200).optional(), contactPhone: z.string().max(40).optional(), contactEmail: z.string().max(120).optional() }),
  mainBar: bar.extend({ sticky: z.boolean().optional(), glassmorphism: z.boolean().optional(), ctaLabel: z.string().max(60).optional(), ctaHref: z.string().max(300).optional() }),
  bottomBar: bar.extend({ links: z.array(z.object({ label: z.string().max(80), href: z.string().max(300) })).max(20).optional() }),
});

export const FooterSchema = z.object({
  layoutPreset: z.enum(["4-equal", "brand-wide-4", "3-equal", "2-asymmetric", "1-centered", "6-equal"]).optional(),
  options: footerOptions.optional(),
  columns: z.array(z.object({ id: z.string().max(40), title: z.string().max(80), colSpan: z.number().int().min(1).max(12), links: z.array(link).max(20) })).max(6),
  showNewsletter: z.boolean(),
  showLocalBusinessCard: z.boolean(),
  copyrightText: z.string().max(300),
  bottomLinks: z.array(z.object({ label: z.string().max(80), href: z.string().max(300) })).max(12),
});

const MAX_BLOCKS = 400;
const countBlocks = (blocks: Array<{ children?: unknown[] }>): number =>
  blocks.reduce((n, b) => n + 1 + (Array.isArray(b.children) ? countBlocks(b.children as Array<{ children?: unknown[] }>) : 0), 0);

export const StarterPageSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,80}$/, "Slug küçük harf, rakam ve tire olmalı"),
    title: z.string().min(1).max(160),
    tldr: z.string().max(400).optional(),
    type: z.enum(["page", "post"]).default("page"),
    blocks: z.array(BlockNodeSchema).max(MAX_BLOCKS),
  })
  .refine((p) => countBlocks(p.blocks as Array<{ children?: unknown[] }>) <= MAX_BLOCKS, { message: `Sayfa başına en çok ${MAX_BLOCKS} blok` });

export type ThemeJson = z.infer<typeof ThemeJsonSchema>;
export type ThemeTokens = z.infer<typeof TokensSchema>;
export type ThemeHeader = z.infer<typeof HeaderSchema>;
export type ThemeFooter = z.infer<typeof FooterSchema>;
export type StarterPage = z.infer<typeof StarterPageSchema>;
