import { normalizeLibraryCategory } from "../library-categories";
import { lintDesign, type DesignContext, type DesignLintResult } from "./lint";
import type { DesignMode } from "./knowledge";

export interface DesignOutput {
  mode: "section" | "page";
  name: string;
  description: string;
  category: string;
  /** Yalnızca sayfa */
  page?: { title: string; slug: string; type: "page"; schemaType: string; tldr: string; metaTitle: string; metaDescription: string };
  lint: DesignLintResult;
}

/** Model yanıtından JSON nesnesini çıkarır (markdown çiti ve önsöz toleranslı). */
export function extractJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const unfenced = text.replace(/```(?:json)?/gi, "").trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start < 0 || end <= start) return { ok: false, error: "Yanıtta JSON nesnesi bulunamadı." };
  try {
    return { ok: true, value: JSON.parse(unfenced.slice(start, end + 1)) };
  } catch {
    return { ok: false, error: "Yanıt geçerli JSON değil." };
  }
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "");

const SCHEMA_TYPES = new Set(["WebPage", "AboutPage", "FAQPage", "Product"]);

export function slugifyTr(input: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return input.toLocaleLowerCase("tr").replace(/[çğıöşü]/g, (c) => map[c] ?? c).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/** Bölüm/sayfa yanıtını doğrular. Tema yanıtı eklenti tarafında doğrulanır (şema `@nexpress/themes` içindedir). */
export function lintDesignOutput(mode: Exclude<DesignMode, "theme">, raw: unknown, ctx: DesignContext = {}): DesignOutput {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const lint = lintDesign(o.blocks, mode, ctx);
  const warnings = lint.warnings;
  if (mode === "section") {
    const category = normalizeLibraryCategory(o.category);
    if (lint.blocks.length > 3) warnings.push("bölüm en çok 3 blok içermeli");
    lint.score = Math.max(0, 100 - lint.errors.length * 25 - warnings.length * 5);
    return { mode, name: str(o.name, 60) || "AI bölümü", description: str(o.description, 200), category, lint };
  }
  const title = str(o.title, 110);
  const slug = slugifyTr(typeof o.slug === "string" && o.slug ? o.slug : title);
  if (!title) lint.errors.push("sayfa başlığı boş");
  if (!slug) lint.errors.push("slug üretilemedi");
  const tldr = str(o.tldr, 300);
  const metaTitle = str(o.metaTitle, 80);
  const metaDescription = str(o.metaDescription, 200);
  if (metaTitle.length > 60) warnings.push(`meta başlık ${metaTitle.length} karakter; en çok 60 önerilir`);
  if (metaDescription && (metaDescription.length < 70 || metaDescription.length > 160)) warnings.push(`meta açıklama ${metaDescription.length} karakter; 70–160 önerilir`);
  if (!metaDescription) warnings.push("meta açıklama yok; TL;DR kullanılır");
  const schemaType = typeof o.schemaType === "string" && SCHEMA_TYPES.has(o.schemaType) ? o.schemaType : "WebPage";
  lint.ok = lint.errors.length === 0;
  lint.score = Math.max(0, 100 - lint.errors.length * 25 - warnings.length * 5);
  return { mode, name: title, description: tldr, category: "page", page: { title, slug, type: "page", schemaType, tldr, metaTitle, metaDescription }, lint };
}
