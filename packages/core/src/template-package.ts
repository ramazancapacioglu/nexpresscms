import { BlockNodeSchema, type BlockNode } from "./types";
import { isTemplateKind, type TemplateKind } from "./templates";
import { fnv1a64 } from "./chunker";

/**
 * Şablon paketi (`.nxtemplates.json`): şablonları siteler arasında taşımak/dağıtmak için. Paket yalnızca VERİDİR (kod yok);
 * içe aktarmada her şey yeniden doğrulanır: bilinen blok türleri, güvenli adresler, CSS temizliği, boyut sınırları.
 * İçe aktarılan şablon her zaman yeni kimlikli, taslak ve varsayılan DEĞİLDİR.
 */
export const TEMPLATE_PACKAGE_FORMAT = "nexpress-templates";
export const TEMPLATE_PACKAGE_VERSION = 1;
export const PACKAGE_LIMITS = { bytes: 2 * 1024 * 1024, templates: 50, nodes: 600, depth: 12, string: 20_000, name: 80 } as const;

export interface TemplatePackageItem {
  name: string;
  description: string;
  kind: TemplateKind;
  blocks: BlockNode[];
}

export interface TemplatePackage {
  format: typeof TEMPLATE_PACKAGE_FORMAT;
  version: number;
  createdAt: string;
  /** Üreten site/kaynak adı (bilgi) */
  source: string;
  templates: TemplatePackageItem[];
  /** İçerik özeti: dosya bozulmasını yakalar (güvenlik imzası değildir) */
  checksum: string;
}

const checksumOf = (templates: TemplatePackageItem[]) => fnv1a64(JSON.stringify(templates));
const UNSAFE_SCHEME = /^\s*(javascript|data|vbscript):/i;
const UNSAFE_CSS = /(@import|expression\s*\(|javascript:|behavior\s*:|-moz-binding|url\s*\(\s*['"]?\s*(?!https?:|\/(?!\/))[^)'"\s])/i;

export interface PackageReport { removedMedia: number; removedUnsafe: number; removedCss: number }

function walkValue(v: unknown, report: PackageReport, mode: "export" | "import"): unknown {
  if (typeof v === "string") {
    if (mode === "export" && /^\/media\//.test(v)) {
      report.removedMedia++;
      return "";
    }
    if (UNSAFE_SCHEME.test(v)) {
      report.removedUnsafe++;
      return "";
    }
    return v;
  }
  if (Array.isArray(v)) return v.map((x) => walkValue(x, report, mode));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walkValue(x, report, mode)]));
  return v;
}

function cleanStyle(style: unknown, report: PackageReport): BlockNode["style"] | undefined {
  if (!style || typeof style !== "object") return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(style as Record<string, unknown>)) {
    if (k === "customCss") {
      if (typeof v === "string" && v.trim()) report.removedCss++;
      continue; // özel CSS paketten alınmaz (kod gibi davranabilir)
    }
    if (k === "tablet" || k === "mobile") {
      out[k] = cleanStyle(v, report);
      continue;
    }
    if (typeof v === "string" && (UNSAFE_CSS.test(v) || UNSAFE_SCHEME.test(v))) {
      report.removedCss++;
      continue;
    }
    out[k] = v;
  }
  return out as BlockNode["style"];
}

function sanitizeNode(n: BlockNode, seed: string, report: PackageReport, mode: "export" | "import"): BlockNode {
  return {
    ...n,
    id: mode === "import" ? `${n.id}_${seed}` : n.id,
    props: walkValue(n.props, report, mode) as Record<string, unknown>,
    ...(n.style ? { style: cleanStyle(n.style, report) } : {}),
    ...(Array.isArray(n.children) ? { children: n.children.map((c) => sanitizeNode(c, seed, report, mode)) } : {}),
  } as BlockNode;
}

function nodeStats(blocks: BlockNode[], depth = 1): { nodes: number; depth: number } {
  return blocks.reduce((a, b) => {
    const c = Array.isArray(b.children) ? nodeStats(b.children, depth + 1) : { nodes: 0, depth };
    return { nodes: a.nodes + 1 + c.nodes, depth: Math.max(a.depth, depth, c.depth) };
  }, { nodes: 0, depth });
}

/** Dışa aktarma: yerel medya başvuruları (`/media/…`) başka sitede çalışmaz, boşaltılır ve sayılır. */
export function buildTemplatePackage(items: TemplatePackageItem[], opts: { source: string; now?: Date }): { json: string; report: PackageReport } {
  const report: PackageReport = { removedMedia: 0, removedUnsafe: 0, removedCss: 0 };
  const templates = items.slice(0, PACKAGE_LIMITS.templates).map((t) => ({ name: t.name.slice(0, PACKAGE_LIMITS.name), description: t.description.slice(0, 300), kind: t.kind, blocks: t.blocks.map((b) => sanitizeNode(b, "", report, "export")) }));
  const pkg: TemplatePackage = { format: TEMPLATE_PACKAGE_FORMAT, version: TEMPLATE_PACKAGE_VERSION, createdAt: (opts.now ?? new Date()).toISOString(), source: opts.source.slice(0, 80), templates, checksum: checksumOf(templates) };
  return { json: JSON.stringify(pkg, null, 2), report };
}

export type ParsedPackage =
  | { ok: true; items: TemplatePackageItem[]; warnings: string[]; source: string }
  | { ok: false; errors: string[] };

/** İçe aktarma: tüm doğrulamalar; geçersiz şablon atlanır (uyarı), yapısal bozukluk tümünü reddeder. */
export function parseTemplatePackage(text: string, seed: string = Math.random().toString(36).slice(2, 7)): ParsedPackage {
  if (!text.trim()) return { ok: false, errors: ["Dosya boş."] };
  if (text.length > PACKAGE_LIMITS.bytes) return { ok: false, errors: ["Dosya 2 MB sınırını aşıyor."] };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["Geçerli bir JSON dosyası değil."] };
  }
  const pkg = raw as Partial<TemplatePackage>;
  if (!pkg || pkg.format !== TEMPLATE_PACKAGE_FORMAT) return { ok: false, errors: ["Bu bir NexPress şablon paketi değil."] };
  if (!Number.isInteger(pkg.version) || (pkg.version as number) > TEMPLATE_PACKAGE_VERSION) return { ok: false, errors: [`Paket sürümü (${String(pkg.version)}) bu uygulamadan yeni; uygulamayı güncelleyin.`] };
  if (!Array.isArray(pkg.templates) || pkg.templates.length === 0) return { ok: false, errors: ["Pakette şablon yok."] };
  if (pkg.templates.length > PACKAGE_LIMITS.templates) return { ok: false, errors: [`En çok ${PACKAGE_LIMITS.templates} şablon içe aktarılabilir.`] };
  if (typeof pkg.checksum === "string" && pkg.checksum !== checksumOf(pkg.templates as TemplatePackageItem[])) return { ok: false, errors: ["Paket bozuk ya da elle değiştirilmiş (özet uyuşmuyor)."] };

  const warnings: string[] = [];
  const items: TemplatePackageItem[] = [];
  pkg.templates.forEach((t, i) => {
    const label = `Şablon ${i + 1}`;
    const name = typeof t?.name === "string" ? t.name.trim().slice(0, PACKAGE_LIMITS.name) : "";
    if (!name) return warnings.push(`${label}: ad yok, atlandı.`);
    if (!isTemplateKind(t.kind)) return warnings.push(`"${name}": bilinmeyen tür, atlandı.`);
    if (!Array.isArray(t.blocks) || t.blocks.length === 0) return warnings.push(`"${name}": blok yok, atlandı.`);
    const parsed = t.blocks.map((b) => BlockNodeSchema.safeParse(b));
    const bad = parsed.findIndex((p) => !p.success);
    if (bad >= 0) return warnings.push(`"${name}": ${bad + 1}. blok geçersiz (bilinmeyen tür veya bozuk yapı), atlandı.`);
    const blocks = parsed.map((p) => (p as { data: BlockNode }).data);
    const stats = nodeStats(blocks);
    if (stats.nodes > PACKAGE_LIMITS.nodes || stats.depth > PACKAGE_LIMITS.depth) return warnings.push(`"${name}": çok büyük/derin (en çok ${PACKAGE_LIMITS.nodes} blok, ${PACKAGE_LIMITS.depth} düzey), atlandı.`);
    if (JSON.stringify(blocks).length > 400_000 || /"[^"]{20001,}"/.test(JSON.stringify(blocks))) return warnings.push(`"${name}": aşırı büyük içerik, atlandı.`);
    const report: PackageReport = { removedMedia: 0, removedUnsafe: 0, removedCss: 0 };
    const clean = blocks.map((b) => sanitizeNode(b, seed + i, report, "import"));
    if (report.removedUnsafe) warnings.push(`"${name}": ${report.removedUnsafe} güvensiz adres (javascript:/data:) kaldırıldı.`);
    if (report.removedCss) warnings.push(`"${name}": ${report.removedCss} özel/güvensiz CSS kaldırıldı.`);
    items.push({ name, description: typeof t.description === "string" ? t.description.slice(0, 300) : "", kind: t.kind, blocks: clean });
  });
  if (items.length === 0) return { ok: false, errors: ["İçe aktarılabilir şablon bulunamadı.", ...warnings] };
  return { ok: true, items, warnings, source: typeof pkg.source === "string" ? pkg.source.slice(0, 80) : "" };
}
