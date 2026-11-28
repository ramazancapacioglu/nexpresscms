import { blockPlainText } from "./inline-html";
import { stripImageDirectives } from "./media";
import type { BlockNode } from "./types";

function catalogBlockToMarkdown(props: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const key of ["title", "text", "summary", "body", "subtitle"] as const) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) {
      lines.push(key === "title" ? `### ${value.trim()}` : value.trim());
    }
  }
  const lists = [props.items, props.slides, props.buttons, props.fields, props.rows];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item === "string") {
        lines.push(`- ${item}`);
        continue;
      }
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const label = record.title ?? record.label ?? record.name ?? record.question ?? record.alt;
      const detail =
        record.text ?? record.body ?? record.description ?? record.excerpt ?? record.answer ?? record.value;
      if (typeof label === "string" && label.trim()) {
        lines.push(
          typeof detail === "string" && detail.trim()
            ? `- **${label.trim()}:** ${detail.trim()}`
            : `- ${label.trim()}`
        );
      }
    }
  }
  return lines.join("\n");
}

/**
 * Görsel Kanvas ve Doküman AST bloklarını (`BlockNode[]`) sıfır kayıplı,
 * AI/LLM dostu saf Markdown metnine derler.
 *
 * Kural 5 gereği:
 * - İçerik kaydedildiği anda `markdownCache` sütununa yazılır.
 * - `?format=md`, `Accept: text/markdown`, `/llms.txt` ve RAG chunking için 0ms CPU maliyeti sağlar.
 */
/** Soru-cevap alanları (`richSchema.qa`): `schema_card` (qa) bloğunun bulunduğu yerde Markdown olarak yazılır. */
export interface QaMarkdownData {
  question?: string;
  shortAnswer?: string;
  detail?: string;
  areaServed?: string;
  audience?: string;
  about?: string;
  serviceType?: string;
  productUrl?: string;
}

export function qaToMarkdown(qa: QaMarkdownData): string {
  const text = (v: unknown) => (typeof v === "string" ? v.replace(/[ \t]+/g, " ").trim() : "");
  const parts: string[] = [];
  if (text(qa.question)) parts.push(`## ${text(qa.question)}`);
  if (text(qa.shortAnswer)) parts.push(`> **Kısa Yanıt (Answer-First):** ${text(qa.shortAnswer)}`);
  const detail = text(qa.detail).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (detail.length > 0) parts.push(detail.join("\n\n"));
  const facts = [
    ["Hizmet bölgesi", qa.areaServed],
    ["Hedef kitle", qa.audience],
    ["Hakkında", qa.about],
    ["Hizmet tipi", qa.serviceType],
  ]
    .filter((row): row is [string, string] => Boolean(text(row[1])))
    .map(([label, value]) => `- **${label}:** ${text(value)}`);
  if (text(qa.productUrl)) facts.push(`- **Ayrıntılı bilgi:** ${text(qa.productUrl)}`);
  if (facts.length > 0) parts.push(facts.join("\n"));
  return parts.join("\n\n");
}

export interface TechMarkdownData {
  level?: string;
  dependencies?: string;
  teaches?: string;
  aboutSoftwareName?: string;
  aboutSoftwareUrl?: string;
  reviewedBy?: string;
  lastReviewed?: string;
  citations?: string;
}

const TECH_LEVEL_TR: Record<string, string> = {
  Beginner: "Başlangıç",
  Intermediate: "Orta",
  Expert: "İleri",
};

export function techToMarkdown(tech: TechMarkdownData): string {
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const lines: string[] = [];
  if (s(tech.level)) lines.push(`- **Uzmanlık Seviyesi:** ${TECH_LEVEL_TR[s(tech.level)] ?? s(tech.level)}`);
  if (s(tech.aboutSoftwareName) || s(tech.aboutSoftwareUrl)) {
    const label = s(tech.aboutSoftwareName) || s(tech.aboutSoftwareUrl);
    lines.push(s(tech.aboutSoftwareUrl) ? `- **İlgili Yazılım:** [${label}](${s(tech.aboutSoftwareUrl)})` : `- **İlgili Yazılım:** ${label}`);
  }
  if (s(tech.dependencies)) lines.push(`- **Ön Koşullar:** ${s(tech.dependencies)}`);
  if (s(tech.reviewedBy)) lines.push(`- **Teknik İnceleme:** ${s(tech.reviewedBy)}${s(tech.lastReviewed) ? ` (${s(tech.lastReviewed)})` : ""}`);
  else if (s(tech.lastReviewed)) lines.push(`- **Son Kontrol Tarihi:** ${s(tech.lastReviewed)}`);
  if (s(tech.teaches)) {
    const items = s(tech.teaches).split(/\r?\n|;/).map((x) => x.trim()).filter(Boolean);
    if (items.length > 0) lines.push(`- **Bu Rehberde Öğrenecekleriniz:** ${items.join(" · ")}`);
  }
  if (s(tech.citations)) {
    const cites = s(tech.citations).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (cites.length > 0) lines.push(`- **Resmî Kaynaklar:** ${cites.join(", ")}`);
  }
  return lines.length > 0 ? `## Teknik Rehber Künyesi\n\n${lines.join("\n")}` : "";
}

let activeQa: QaMarkdownData | null = null;

export function compileBlocksToMarkdown(
  blocks: BlockNode[],
  options?: { title?: string; tldr?: string | null; /** Blokların sonuna eklenen Markdown (ör. özel alan listesi). */ appendix?: string; /** Soru-cevap alanları (schema_card qa bloğu yerinde yazılır). */ qa?: QaMarkdownData | null; /** Teknik makale (`TechArticle`) künye bilgileri. */ tech?: TechMarkdownData | null }
): string {
  const sections: string[] = [];
  activeQa = options?.qa ?? null;

  if (options?.title) {
    sections.push(`# ${options.title.trim()}`);
  }

  if (options?.tldr && options.tldr.trim().length > 0) {
    sections.push(`> **TL;DR (Özet):** ${options.tldr.trim()}`);
  }

  if (options?.tech) {
    const techMd = techToMarkdown(options.tech);
    if (techMd) sections.push(techMd);
  }

  for (const block of blocks) {
    const rendered = renderBlockNodeToMarkdown(block);
    if (rendered.trim().length > 0) {
      sections.push(rendered.trim());
    }
  }
  activeQa = null;

  if (options?.appendix && options.appendix.trim()) sections.push(options.appendix.trim());

  return sections.join("\n\n").trim() + "\n";
}

function renderBlockNodeToMarkdown(block: BlockNode): string {
  const p = block.props ?? {};

  switch (block.type) {
    case "hero": {
      const badge = typeof p.badge === "string" && p.badge ? `[${p.badge}]\n` : "";
      const title = typeof p.title === "string" ? `## ${p.title}` : "";
      const subtitle = typeof p.subtitle === "string" ? `\n${p.subtitle}` : "";
      const cta =
        typeof p.primaryCtaLabel === "string" && typeof p.primaryCtaHref === "string"
          ? `\n\n- **${p.primaryCtaLabel}:** ${p.primaryCtaHref}`
          : "";
      return `${badge}${title}${subtitle}${cta}`;
    }

    case "heading":
    case "heading_element": {
      const level = Math.min(Math.max(Number(p.level ?? 2), 1), 6);
      const hashes = "#".repeat(level);
      return `${hashes} ${blockPlainText(p, "text")}`;
    }

    case "paragraph":
    case "paragraph_element":
    case "text_div": {
      return blockPlainText(p, "text");
    }

    case "button_element": {
      const label = String(p.label ?? "İncele");
      const href = String(p.href ?? "#");
      const sub = p.subtext ? ` — _${String(p.subtext)}_` : "";
      return `[**${label}**](${href})${sub}`;
    }

    case "image_figure": {
      const alt = String(p.altText ?? p.alt ?? "Görsel");
      const url = stripImageDirectives(String(p.url ?? ""));
      const caption = p.caption ? `\n*${String(p.caption)}*` : "";
      return `![${alt}](${url})${caption}`;
    }

    case "media_file": {
      const url = String(p.url ?? "");
      if (!url) return "";
      const title = String(p.title ?? "").trim() || "Dosya";
      const desc = p.description ? ` — ${String(p.description)}` : "";
      return `[${title}](${url})${desc}`;
    }

    case "divider_spacer": {
      return p.style === "space" ? "" : `---`;
    }

    case "review_box": {
      const itemName = String(p.itemName ?? "Değerlendirme");
      const rating = String(p.rating ?? "4.9");
      const pros = Array.isArray(p.pros) ? p.pros : [];
      const cons = Array.isArray(p.cons) ? p.cons : [];
      const prosLines = pros.map((pr: any) => `  + ${String(pr)}`).join("\n");
      const consLines = cons.map((cn: any) => `  - ${String(cn)}`).join("\n");
      return `### ⭐ ${itemName} — İnceleme Skoru: ${rating} / 5.0\n${String(p.verdict ?? "")}\n${prosLines}\n${consLines}`.trim();
    }

    case "tldr_box": {
      const summary = blockPlainText(p, "summary");
      return `> **Kısa Yanıt (Answer-First):** ${summary}`;
    }

    case "bento_features": {
      const heading = typeof p.title === "string" ? `## ${p.title}\n\n` : "";
      const items = Array.isArray(p.items) ? p.items : [];
      const lines = items.map((item: any) => {
        const itemTitle = String(item?.title ?? "");
        const itemDesc = String(item?.description ?? "");
        return `- **${itemTitle}:** ${itemDesc}`;
      });
      return `${heading}${lines.join("\n")}`;
    }

    case "stats_strip": {
      const stats = Array.isArray(p.stats) ? p.stats : [];
      const lines = stats.map(
        (s: any) => `- **${String(s?.value ?? "")}**: ${String(s?.label ?? "")}`
      );
      return lines.join("\n");
    }

    case "faq_accordion": {
      const heading = typeof p.title === "string" ? `## ${p.title}\n\n` : "## Sıkça Sorulan Sorular\n\n";
      const items = Array.isArray(p.items) ? p.items : [];
      const qas = items.map((item: any) => {
        const q = String(item?.question ?? "");
        const a = String(item?.answer ?? "");
        return `### ${q}\n${a}`;
      });
      return `${heading}${qas.join("\n\n")}`;
    }

    case "howto_steps": {
      const heading = typeof p.title === "string" ? `## ${p.title}\n\n` : "";
      const steps = Array.isArray(p.steps) ? p.steps : [];
      const formatted = steps.map((step: any, idx: number) => {
        const sTitle = String(step?.title ?? `Adım ${idx + 1}`);
        const sText = String(step?.description ?? "");
        return `${idx + 1}. **${sTitle}:** ${sText}`;
      });
      return `${heading}${formatted.join("\n")}`;
    }

    case "pricing_table": {
      const heading = typeof p.title === "string" ? `## ${p.title}\n\n` : "";
      const plans = Array.isArray(p.plans) ? p.plans : [];
      const formatted = plans.map((plan: any) => {
        const name = String(plan?.name ?? "");
        const price = String(plan?.price ?? "");
        const desc = String(plan?.description ?? "");
        return `### ${name} (${price})\n${desc}`;
      });
      return `${heading}${formatted.join("\n\n")}`;
    }

    case "product_embed": {
      const name = String(p.productName ?? "Ürün");
      const sku = p.sku ? ` (SKU: ${String(p.sku)})` : "";
      const price = p.price ? ` — Fiyat: ${String(p.price)}` : "";
      const summary = p.summary ? `\n  ${String(p.summary)}` : "";
      return `- **Öne Çıkan Ürün:** ${name}${sku}${price}${summary}`;
    }

    case "callout": {
      const tone = String(p.tone ?? "NOTE").toUpperCase();
      const title = p.title ? `**${String(p.title)}:** ` : "";
      const text = String(p.text ?? "");
      return `> [!${tone}]\n> ${title}${text}`;
    }

    case "code_block": {
      const lang = String(p.language ?? "typescript");
      const code = String(p.code ?? "");
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case "cta_banner": {
      const title = String(p.title ?? "");
      const subtitle = p.subtitle ? `\n${String(p.subtitle)}` : "";
      const button =
        p.buttonLabel && p.buttonHref
          ? `\n[${String(p.buttonLabel)}](${String(p.buttonHref)})`
          : "";
      return `### ${title}${subtitle}${button}`;
    }

    case "quote": {
      const body = blockPlainText(p, "quote");
      const text = body
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
      const cite = p.author
        ? `\n> — ${String(p.author)}${p.role ? `, ${String(p.role)}` : ""}`
        : p.cite
          ? `\n> — ${String(p.cite)}`
          : "";
      return `${text}${cite}`;
    }

    case "list_element": {
      const items = Array.isArray(p.items) ? p.items : [];
      const ordered = p.ordered === true;
      return items
        .map((it: unknown, i: number) => `${ordered ? `${i + 1}.` : "-"} ${String(it)}`)
        .join("\n");
    }

    case "video_embed": {
      const title = String(p.title ?? "Video");
      return `[▶ ${title}](${String(p.url ?? "")})`;
    }

    case "anchor_nav": {
      const title = typeof p.title === "string" && p.title.trim() ? `**${p.title.trim()}:** ` : "";
      const items = Array.isArray(p.items) ? p.items : [];
      const links = items
        .map((it) => {
          if (!it || typeof it !== "object") return "";
          const rec = it as Record<string, unknown>;
          const label = typeof rec.label === "string" ? rec.label.trim() : "";
          const href = typeof rec.href === "string" ? rec.href.trim() : "#";
          return label ? `[${label}](${href})` : "";
        })
        .filter(Boolean);
      return links.length > 0 ? `${title}${links.join(" • ")}` : "";
    }

    case "tabs": {
      const heading = typeof p.title === "string" && p.title.trim() ? `## ${p.title.trim()}\n\n` : "";
      const items = Array.isArray(p.items) ? p.items : [];
      const panes = Array.isArray(block.children) ? block.children : [];
      const count = Math.max(items.length, panes.length);
      const out: string[] = [];
      for (let i = 0; i < count; i++) {
        const pane = panes[i];
        const item = (items[i] ?? {}) as Record<string, unknown>;
        const label =
          (typeof pane?.props?.label === "string" && pane.props.label.trim()) ||
          (typeof item.label === "string" && item.label.trim()) ||
          `Sekme ${i + 1}`;
        const childMd =
          pane?.children && pane.children.length > 0
            ? pane.children.map((c) => renderBlockNodeToMarkdown(c)).filter(Boolean).join("\n\n")
            : typeof item.body === "string"
              ? item.body.trim()
              : "";
        out.push(`### ${label}\n${childMd}`.trim());
      }
      return `${heading}${out.join("\n\n")}`.trim();
    }

    case "schema_card": {
      return p.schema === "qa" && activeQa ? qaToMarkdown(activeQa) : "";
    }

    case "software_product_card": {
      const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
      const parseOpt = (v: unknown): number | null => {
        if (v === null || v === undefined || v === "") return null;
        if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? v : null;
        if (typeof v === "string") {
          const cleaned = v.trim().replace(/[^\d.,-]/g, "");
          if (!cleaned) return null;
          const norm =
            cleaned.includes(",") && cleaned.includes(".")
              ? cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
                ? cleaned.replace(/\./g, "").replace(",", ".")
                : cleaned.replace(/,/g, "")
              : cleaned.includes(",")
                ? cleaned.replace(",", ".")
                : cleaned;
          const n = Number(norm);
          return Number.isFinite(n) && n >= 0 ? n : null;
        }
        return null;
      };
      const curCode = (s(p.currency) || "TRY").toUpperCase();
      const curSym = curCode === "TRY" ? "TL" : curCode;
      const fmtMoney = (n: number) => {
        const isWhole = Math.abs(n - Math.round(n)) < 1e-9;
        return `${n.toLocaleString("tr-TR", { minimumFractionDigits: isWhole ? 0 : 2, maximumFractionDigits: isWhole ? 0 : 2 })} ${curSym}`;
      };
      const lines: string[] = [];
      const name = s(p.name) || "Yazılım Ürünü";
      lines.push(`## ${name}`);
      if (s(p.tagline)) lines.push(`*${s(p.tagline)}*`);
      if (s(p.shortDescription)) lines.push("", s(p.shortDescription));

      const priceNum = parseOpt(p.price) ?? 0;
      const listPriceNum = parseOpt(p.listPrice) ?? 0;
      const pricingMode = s(p.pricingMode) || "quote";
      const meta: string[] = [];
      if (s(p.version)) meta.push(`- **Güncel Sürüm:** ${s(p.version)}`);
      if (s(p.releaseDate)) meta.push(`- **Sürüm Tarihi:** ${s(p.releaseDate)}`);
      if (s(p.sku)) meta.push(`- **Ürün Kodu:** ${s(p.sku)}`);
      if (s(p.vendor)) meta.push(`- **Yazılım Üreticisi:** ${s(p.vendor)}`);
      if (s(p.seller)) meta.push(`- **Yetkili Satış & Destek:** ${s(p.seller)}`);
      if (s(p.campaignBadge)) meta.push(`- **Kampanya:** ${s(p.campaignBadge)}`);
      if ((pricingMode === "fixed" || pricingMode === "starting") && priceNum > 0) {
        const listPart = listPriceNum > priceNum ? ` (Liste Fiyatı: ${fmtMoney(listPriceNum)})` : "";
        const vatPart = s(p.vatNote) ? ` ${s(p.vatNote)}` : "";
        meta.push(`- **${pricingMode === "starting" ? "Başlangıç Kampanya Fiyatı" : "Lisans Fiyatı"}:** ${fmtMoney(priceNum)}${vatPart}${listPart}`);
      }
      if (s(p.priceLabel)) {
        meta.push(`- **Fiyat / Ödeme Notu:** ${s(p.priceLabel)}`);
      }
      if (s(p.priceValidUntil)) meta.push(`- **Fiyat Geçerlilik Tarihi:** ${s(p.priceValidUntil)}`);
      if (s(p.operatingSystem)) meta.push(`- **Platform / İşletim Sistemi:** ${s(p.operatingSystem)}`);
      if (s(p.database)) meta.push(`- **Veritabanı:** ${s(p.database)}`);
      if (s(p.deployment)) meta.push(`- **Kurulum Modeli:** ${s(p.deployment)}`);
      if (s(p.licenseModel)) meta.push(`- **Lisanslama Modeli:** ${s(p.licenseModel)}`);
      if (s(p.supportSla)) meta.push(`- **Destek & Kurulum:** ${s(p.supportSla)}`);
      if (s(p.downloadUrl)) meta.push(`- **İndirme / Demo Bağlantısı:** ${s(p.downloadUrl)}`);
      if (s(p.brochureUrl)) meta.push(`- **Resmî Fiyat Kaynağı:** ${s(p.brochureUrl)}`);
      if (s(p.lastVerified)) meta.push(`- **Son Doğrulama Tarihi:** ${s(p.lastVerified)}`);
      if (meta.length > 0) lines.push("", ...meta);

      const priceList = Array.isArray(p.priceList) ? p.priceList : [];
      if (priceList.length > 0) {
        const vatPart = s(p.vatNote) ? ` · ${s(p.vatNote)}` : "";
        lines.push("", "### Güncel Liste ve Kampanya Fiyatları", "", `*Para birimi: ${curSym}${vatPart}*`, "", "| Paket / Modül | Kategori | Liste Fiyatı | Kampanya Fiyatı |", "| --- | --- | --- | --- |");
        for (const row of priceList) {
          if (!row || typeof row !== "object") continue;
          const r = row as Record<string, unknown>;
          const rName = s(r.name);
          if (!rName) continue;
          const rGroup = s(r.group) || (s(r.code) ? `Kod: ${s(r.code)}` : "Modül");
          const lp = parseOpt(r.listPrice);
          const cp = parseOpt(r.campaignPrice);
          const pct = lp !== null && cp !== null && lp > 0 && cp > 0 && cp < lp ? ` (%${Math.round(((lp - cp) / lp) * 100)} indirim)` : "";
          const notePart = s(r.note) ? ` — ${s(r.note)}` : "";
          const lpCell = lp !== null && lp > 0 ? fmtMoney(lp) : lp === 0 ? "Dahil" : "—";
          const cpCell = cp !== null && cp > 0 ? `${fmtMoney(cp)}${pct}` : cp === 0 ? "Ücretsiz / Dahil" : "Teklif alınız";
          lines.push(`| ${rName}${notePart} | ${rGroup} | ${lpCell} | ${cpCell} |`);
        }
        if (s(p.priceFootNote)) lines.push("", `*${s(p.priceFootNote)}*`);
      }

      const packages = Array.isArray(p.packages) ? p.packages : [];
      if (packages.length > 0) {
        lines.push("", "### Hazır Paket ve Lisans Seçenekleri");
        for (const pk of packages) {
          if (!pk || typeof pk !== "object") continue;
          const r = pk as Record<string, unknown>;
          const pkName = s(r.name);
          if (!pkName) continue;
          const pkPrice = s(r.price) ? ` — **${s(r.price)}**${s(r.period) ? ` (${s(r.period)})` : ""}` : "";
          const pkList = s(r.listPrice) ? ` (Liste: ${s(r.listPrice)})` : "";
          lines.push("", `#### ${pkName}${pkPrice}${pkList}`);
          if (s(r.description)) lines.push(s(r.description));
          if (Array.isArray(r.highlights)) {
            for (const h of r.highlights) if (s(h)) lines.push(`- ${s(h)}`);
          }
        }
      }

      const highlights = Array.isArray(p.highlights) ? p.highlights.map(s).filter(Boolean) : [];
      if (highlights.length > 0) {
        lines.push("", "### Öne Çıkan Özellikler", ...highlights.map((h) => `- ${h}`));
      }

      const modules = Array.isArray(p.modules) ? p.modules.map(s).filter(Boolean) : [];
      if (modules.length > 0) {
        lines.push("", "### Modüller", ...modules.map((m) => `- ${m}`));
      }

      const reqs = Array.isArray(p.requirements) ? p.requirements : [];
      if (reqs.length > 0) {
        const reqLines = reqs
          .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object"))
          .map((r) => (s(r.label) && s(r.value) ? `- **${s(r.label)}:** ${s(r.value)}` : ""))
          .filter(Boolean);
        if (reqLines.length > 0) lines.push("", "### Sistem Gereksinimleri", ...reqLines);
      }

      const integrations = Array.isArray(p.integrations) ? p.integrations.map(s).filter(Boolean) : [];
      if (integrations.length > 0) {
        lines.push("", "### Uyumlu Entegrasyonlar", ...integrations.map((i) => `- ${i}`));
      }

      return lines.join("\n").trim();
    }

    case "sectors_grid": {
      const title = typeof p.title === "string" && p.title.trim() ? p.title.trim() : "Hangi Sektörler İçin Uygundur?";
      const subtitle = typeof p.subtitle === "string" && p.subtitle.trim() ? `\n${p.subtitle.trim()}` : "";
      const items = Array.isArray(p.items) ? p.items : [];
      const rows = items
        .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
        .map((x) => {
          const name = typeof x.name === "string" ? x.name.trim() : "";
          const summary = typeof x.summary === "string" ? x.summary.trim() : "";
          if (!name) return "";
          const badge = typeof x.badge === "string" && x.badge.trim() ? ` (${x.badge.trim()})` : "";
          const uses = Array.isArray(x.useCases)
            ? x.useCases.map((u) => (typeof u === "string" ? u.trim() : "")).filter(Boolean)
            : [];
          const usePart = uses.length > 0 ? ` — Kullanım: ${uses.join(", ")}` : "";
          return `- **${name}${badge}:** ${summary}${usePart}`;
        })
        .filter(Boolean);
      return rows.length > 0 ? `## ${title}${subtitle}\n\n${rows.join("\n")}` : "";
    }

    case "comparison_table":
    case "data_table": {
      const title = typeof p.title === "string" && p.title.trim() ? `## ${p.title.trim()}\n\n` : "";
      const rawCols = Array.isArray(p.headers) && p.headers.length > 0 ? p.headers : Array.isArray(p.columns) ? p.columns : [];
      const cols = rawCols.map((c) => String(c ?? "").trim()).filter(Boolean);
      const rows = Array.isArray(p.rows) ? p.rows : [];
      if (cols.length === 0 && rows.length === 0) return "";
      const out: string[] = [];
      if (cols.length > 0) {
        out.push(`| ${cols.join(" | ")} |`, `| ${cols.map(() => "---").join(" | ")} |`);
      }
      for (const r of rows) {
        if (Array.isArray(r)) {
          out.push(`| ${r.map((cell) => String(cell ?? "").replace(/\r?\n/g, " ").trim()).join(" | ")} |`);
        }
      }
      return `${title}${out.join("\n")}`.trim();
    }

    case "section":
    case "columns":
    case "column":
    case "grid_section": {
      if (!block.children || block.children.length === 0) return "";
      return block.children
        .map((child) => renderBlockNodeToMarkdown(child))
        .filter(Boolean)
        .join("\n\n");
    }

    default: {
      const catalog = catalogBlockToMarkdown(p);
      if (catalog) return catalog;
      if (typeof p.text === "string") return p.text;
      if (block.children && block.children.length > 0) {
        return block.children
          .map((child) => renderBlockNodeToMarkdown(child))
          .filter(Boolean)
          .join("\n\n");
      }
      return "";
    }
  }
}
