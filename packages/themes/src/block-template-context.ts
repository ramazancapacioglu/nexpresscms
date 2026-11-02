import type React from "react";
import type { DynamicItem } from "@nexpress/core";

/** Şablon yuva bloklarının (tpl_*) çizilmesi için sayfanın sağladığı veri. Hepsi sunucuda hazırlanır; istemci JS'i yoktur. */
export interface TemplateRenderContext {
  site: { name: string; logoText: string; logoImage: string; tagline?: string | null };
  locale: string;
  copyright: string;
  /** Hazır çizilmiş menü düğümleri (yatay masaüstü + mobil, dikey liste) */
  menu: { horizontal: React.ReactNode; list: React.ReactNode } | null;
  breadcrumbs: Array<{ name: string; href: string }>;
  post?: {
    title: string;
    /** Sayfanın kendi bloklarının çizimi (tpl_post_content yuvasına konur) */
    content: React.ReactNode;
    featuredImage?: { url: string; alt: string; caption?: string } | null;
    date?: string | null;
    author?: string | null;
    categories: Array<{ name: string; href: string }>;
  };
  archive?: {
    title: string;
    description?: string | null;
    kindLabel: string;
    items: DynamicItem[];
    page: number;
    pages: number;
    pageHref: (page: number) => string;
  };
}
