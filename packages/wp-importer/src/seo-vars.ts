/** Rank Math / Yoast şablon değişkenlerini düz metne çevirir. `%40` gibi gerçek yüzdeye dokunmaz. */
export function expandSeoTemplate(
  template: string,
  vars: { title: string; siteName: string; description?: string; category?: string }
): string {
  if (!/%(?:title|sep|sitename|sitedesc|currentyear|page|primary_category|category)%/i.test(template)) return template.trim();
  const map: Record<string, string> = {
    title: vars.title,
    sep: "|",
    sitename: vars.siteName,
    sitedesc: vars.description ?? "",
    currentyear: String(new Date().getFullYear()),
    page: "",
    primary_category: vars.category ?? "",
    category: vars.category ?? "",
  };
  return template
    .replace(/%([a-z_]+)%/gi, (full, key: string) => map[key.toLowerCase()] ?? full)
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\|\s*$/g, "")
    .trim();
}

export interface BridgeSchemaInput {
  kind: "page" | "post";
  schemaType: string;
  name: string;
  description: string;
  os: string;
  category: string;
  price: string;
  currency: string;
  faqs: Array<{ q: string; a: string }>;
  slug?: string;
}

const SCHEMA = new Set([
  "WebPage",
  "Article",
  "AboutPage",
  "FAQPage",
  "ContactPage",
  "Organization",
  "SoftwareApplication",
  "BlogPosting",
  "QAPage",
  "Service",
]);

/** Kaynak şema türünü sayfa türüne ve gelişmiş şema kartına bağlar. */
export function schemaFromBridge(input: BridgeSchemaInput): { schemaType: string; richSchema?: Record<string, unknown> } {
  const faqs = input.faqs.filter((item) => item.q && item.a).slice(0, 20);
  let type = input.schemaType.trim();
  if (type === "QAPage" || (faqs.length > 0 && (type === "" || type === "FAQPage" || type === "QAPage"))) type = "FAQPage";
  else if (type === "Article" && input.kind === "post") type = "BlogPosting";
  else if (!SCHEMA.has(type)) {
    if (input.kind === "post") type = "BlogPosting";
    else if (/hakkimizda|about/i.test(input.slug ?? "")) type = "AboutPage";
    else if (/iletisim|contact/i.test(input.slug ?? "")) type = "ContactPage";
    else type = "WebPage";
  }
  const rich: Record<string, unknown> = {};
  if (type === "SoftwareApplication" && (input.name || input.os || input.category || input.price)) {
    rich.software = {
      name: input.name,
      os: input.os,
      category: input.category,
      price: input.price,
      currency: input.currency || "TRY",
    };
  }
  if (type === "FAQPage" && faqs.length > 0) {
    rich.qa = {
      enabled: true,
      shortAnswer: faqs[0]?.a ?? "",
      faqList: faqs.map((item) => ({ question: item.q, answer: item.a })),
    };
  }
  return { schemaType: type, ...(Object.keys(rich).length > 0 ? { richSchema: rich } : {}) };
}
