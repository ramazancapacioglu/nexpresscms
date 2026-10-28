const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "code",
]);

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isSafeHref(href: string): boolean {
  if (href.startsWith("/") || href.startsWith("#") || href.startsWith("mailto:")) {
    return true;
  }
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * TipTap çıktısını ön yüze basmadan önce izinli etiketlere indirger.
 * Stil, script ve olay öznitelikleri atılır.
 */
export function sanitizeInlineHtml(input: string): string {
  const stripped = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");

  return stripped.replace(
    /<\/?([a-z0-9]+)([^>]*)>/gi,
    (full, rawName: string, rawAttrs: string) => {
      const tag = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (full.startsWith("</")) return `</${tag}>`;
      if (tag === "br") return "<br />";
      if (tag === "a") {
        const hrefMatch = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(rawAttrs);
        const href = (hrefMatch?.[1] ?? hrefMatch?.[2] ?? "").trim();
        if (!isSafeHref(href)) return "<a>";
        const targetMatch = /target\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(rawAttrs);
        const relMatch = /rel\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(rawAttrs);
        const newTab = (targetMatch?.[1] ?? targetMatch?.[2] ?? "") === "_blank";
        const relParts = new Set<string>();
        if (/\bnofollow\b/i.test(relMatch?.[1] ?? relMatch?.[2] ?? "")) relParts.add("nofollow");
        if (newTab) {
          relParts.add("noopener");
          relParts.add("noreferrer");
        }
        const rel = relParts.size ? ` rel="${[...relParts].join(" ")}"` : "";
        const target = newTab ? ` target="_blank"` : "";
        return `<a href="${escapeAttr(href)}"${target}${rel}>`;
      }
      return `<${tag}>`;
    }
  );
}

/** Başlık içine tek paragraf sarmalayıcısı konmaz. */
export function markupForHeading(html: string): string {
  const clean = sanitizeInlineHtml(html).trim();
  const match = clean.match(/^<p>([\s\S]*)<\/p>$/i);
  return match?.[1] ?? clean;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

/** İzinli satır içi HTML'i markdownCache için düz metne çevirir. */
export function inlineHtmlToMarkdown(html: string): string {
  let source = sanitizeInlineHtml(html);
  source = source.replace(/<br\s*\/?>/gi, "\n");
  source = source.replace(/<(strong|b)>/gi, "**").replace(/<\/(strong|b)>/gi, "**");
  source = source.replace(/<(em|i)>/gi, "*").replace(/<\/(em|i)>/gi, "*");
  source = source.replace(/<(s|u)>/gi, "").replace(/<\/(s|u)>/gi, "");
  source = source.replace(/<code>/gi, "`").replace(/<\/code>/gi, "`");
  source = source.replace(
    /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_full, href: string, label: string) => `[${label}](${href})`
  );
  source = source.replace(/<li>/gi, "\n- ").replace(/<\/li>/gi, "");
  source = source.replace(/<\/?(ul|ol|p)>/gi, "\n");
  source = source.replace(/<[^>]+>/g, "");
  return decodeEntities(source).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function blockPlainText(props: Record<string, unknown>, fallbackKey: string): string {
  const html = props.html;
  if (typeof html === "string" && html.trim()) return inlineHtmlToMarkdown(html);
  const preferred = props[fallbackKey];
  if (typeof preferred === "string") return preferred;
  return typeof props.text === "string" ? props.text : "";
}
