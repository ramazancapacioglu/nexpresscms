import { blockPlainText } from "./inline-html";
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
export function compileBlocksToMarkdown(
  blocks: BlockNode[],
  options?: { title?: string; tldr?: string | null }
): string {
  const sections: string[] = [];

  if (options?.title) {
    sections.push(`# ${options.title.trim()}`);
  }

  if (options?.tldr && options.tldr.trim().length > 0) {
    sections.push(`> **TL;DR (Özet):** ${options.tldr.trim()}`);
  }

  for (const block of blocks) {
    const rendered = renderBlockNodeToMarkdown(block);
    if (rendered.trim().length > 0) {
      sections.push(rendered.trim());
    }
  }

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
      const url = String(p.url ?? "");
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
