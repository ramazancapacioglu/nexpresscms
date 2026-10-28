import { createHash } from "node:crypto";
import { strFromU8, strToU8, unzipSync, zipSync, type UnzipFileInfo } from "fflate";
import { sanitizeThemeCss } from "./css";
import { FooterSchema, HeaderSchema, StarterPageSchema, ThemeJsonSchema, TokensSchema, type StarterPage, type ThemeFooter, type ThemeHeader, type ThemeJson, type ThemeTokens } from "./schema";

/** Tema paketi (.nxtheme = zip) okuma/yazma. Paket kod çalıştırmaz; her dosya doğrulanır. */
export const PACKAGE_LIMITS = {
  zipBytes: 8 * 1024 * 1024,
  files: 200,
  totalBytes: 30 * 1024 * 1024,
  jsonBytes: 1024 * 1024,
  imageBytes: 300 * 1024,
  pages: 40,
} as const;

const ALLOWED_EXT = new Set(["json", "css", "webp", "png", "jpg", "jpeg"]);

export interface ParsedTheme {
  theme: ThemeJson;
  tokens: ThemeTokens;
  /** Kapsamlanmış (ön yüze verilecek) CSS */
  css: string;
  /** Özgün CSS (dışa aktarma için) */
  rawCss: string;
  header?: ThemeHeader;
  footer?: ThemeFooter;
  pages: StarterPage[];
  screenshot?: { mime: string; dataUri: string };
  /** Kabul edilen dosyaların SHA-256 özeti (kimlik ve değişiklik tespiti) */
  checksum: string;
  files: string[];
}

export type ParseResult = { ok: true; value: ParsedTheme; warnings: string[] } | { ok: false; errors: string[]; warnings: string[] };

const ext = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/** Geçersizse nedeni; geçerliyse null. Yol gezinmesi, mutlak yol, ters eğik çizgi, sürücü harfi, gizli dosya. */
export function badEntryName(name: string): string | null {
  if (name.includes("\\") || name.startsWith("/") || /^[a-z]:/i.test(name) || name.includes("\0")) return "geçersiz yol";
  if (name.split("/").some((p) => p === ".." || p === ".")) return "yol gezinmesi (..)";
  return null;
}

function magicMime(b: Uint8Array): string | null {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && strFromU8(b.subarray(8, 12)) === "WEBP") return "image/webp";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  return null;
}

const b64 = (b: Uint8Array) => Buffer.from(b).toString("base64");
const issueText = (e: { issues: Array<{ path: PropertyKey[]; message: string }> }, file: string) =>
  e.issues.slice(0, 6).map((i) => `${file}${i.path.length ? ` › ${i.path.join(".")}` : ""}: ${i.message}`);

export function parseThemePackage(bytes: Uint8Array): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (bytes.length === 0) return { ok: false, errors: ["Dosya boş."], warnings };
  if (bytes.length > PACKAGE_LIMITS.zipBytes) return { ok: false, errors: [`Paket ${PACKAGE_LIMITS.zipBytes / 1024 / 1024} MB sınırını aşıyor.`], warnings };

  // 1) Dosyaları şişirmeden önce listele ve sınırları denetle (zip bombası)
  const entries: UnzipFileInfo[] = [];
  try {
    unzipSync(bytes, {
      filter: (f) => {
        entries.push(f);
        return false;
      },
    });
  } catch {
    return { ok: false, errors: ["Geçerli bir zip dosyası değil."], warnings };
  }
  const files = entries.filter((e) => !e.name.endsWith("/"));
  if (files.length > PACKAGE_LIMITS.files) return { ok: false, errors: [`En çok ${PACKAGE_LIMITS.files} dosya olabilir (${files.length}).`], warnings };
  const total = files.reduce((n, f) => n + f.originalSize, 0);
  if (total > PACKAGE_LIMITS.totalBytes) return { ok: false, errors: [`Açılmış boyut ${PACKAGE_LIMITS.totalBytes / 1024 / 1024} MB sınırını aşıyor (zip bombası koruması).`], warnings };

  // 2) Yollar: tek üst klasör sarmalayıcısı atılır
  const names = files.map((f) => f.name).filter((n) => !n.startsWith("__MACOSX/") && !n.endsWith(".DS_Store"));
  for (const n of names) {
    const bad = badEntryName(n);
    if (bad) return { ok: false, errors: [`Güvenli olmayan dosya adı "${n}": ${bad}.`], warnings };
  }
  const top = new Set(names.map((n) => n.split("/")[0]));
  const strip = top.size === 1 && names.every((n) => n.includes("/")) && ![...top].some((t) => t === "chrome" || t === "pages") ? `${[...top][0]}/` : "";
  const rel = new Map(names.map((n) => [n, strip ? n.slice(strip.length) : n]));

  const accepted: string[] = [];
  for (const [orig, name] of rel) {
    if (!ALLOWED_EXT.has(ext(name))) {
      errors.push(`İzin verilmeyen dosya türü: ${name} (yalnızca json, css, webp, png, jpg).`);
      continue;
    }
    accepted.push(orig);
  }
  if (errors.length) return { ok: false, errors, warnings };

  const sizeOf = new Map(files.map((f) => [f.name, f.originalSize]));
  for (const orig of accepted) {
    const name = rel.get(orig)!;
    const size = sizeOf.get(orig) ?? 0;
    const limit = ext(name) === "json" || ext(name) === "css" ? PACKAGE_LIMITS.jsonBytes : PACKAGE_LIMITS.imageBytes;
    if (size > limit) errors.push(`${name} çok büyük (${Math.round(size / 1024)} KB; sınır ${Math.round(limit / 1024)} KB).`);
  }
  if (errors.length) return { ok: false, errors, warnings };

  // 3) Yalnızca kabul edilenleri aç
  const keep = new Set(accepted);
  let raw: Record<string, Uint8Array>;
  try {
    raw = unzipSync(bytes, { filter: (f) => keep.has(f.name) });
  } catch {
    return { ok: false, errors: ["Zip açılamadı (bozuk olabilir)."], warnings };
  }
  const data = new Map<string, Uint8Array>(Object.entries(raw).map(([k, v]) => [rel.get(k)!, v]));

  const json = (name: string): { ok: true; value: unknown } | { ok: false; error: string } | null => {
    const b = data.get(name);
    if (!b) return null;
    try {
      return { ok: true, value: JSON.parse(strFromU8(b)) };
    } catch {
      return { ok: false, error: `${name}: geçerli JSON değil.` };
    }
  };

  // theme.json ve tokens.json zorunlu
  let theme: ThemeJson | undefined;
  let tokens: ThemeTokens | undefined;
  for (const [file, schema] of [["theme.json", ThemeJsonSchema], ["tokens.json", TokensSchema]] as const) {
    const j = json(file);
    if (!j) errors.push(`${file} eksik.`);
    else if (!j.ok) errors.push(j.error);
    else {
      const r = schema.safeParse(j.value);
      if (!r.success) errors.push(...issueText(r.error, file));
      else if (file === "theme.json") theme = r.data as ThemeJson;
      else tokens = r.data as ThemeTokens;
    }
  }

  let header: ThemeHeader | undefined;
  let footer: ThemeFooter | undefined;
  for (const [file, schema] of [["chrome/header.json", HeaderSchema], ["chrome/footer.json", FooterSchema]] as const) {
    const j = json(file);
    if (!j) continue;
    if (!j.ok) errors.push(j.error);
    else {
      const r = schema.safeParse(j.value);
      if (!r.success) errors.push(...issueText(r.error, file));
      else if (file.endsWith("header.json")) header = r.data as ThemeHeader;
      else footer = r.data as ThemeFooter;
    }
  }

  const pageFiles = [...data.keys()].filter((n) => /^pages\/[^/]+\.json$/.test(n)).sort();
  if (pageFiles.length > PACKAGE_LIMITS.pages) errors.push(`En çok ${PACKAGE_LIMITS.pages} başlangıç sayfası olabilir.`);
  const pages: StarterPage[] = [];
  for (const file of pageFiles.slice(0, PACKAGE_LIMITS.pages)) {
    const j = json(file)!;
    if (!j.ok) errors.push(j.error);
    else {
      const r = StarterPageSchema.safeParse(j.value);
      if (!r.success) errors.push(...issueText(r.error, file));
      else pages.push(r.data as StarterPage);
    }
  }
  if (new Set(pages.map((p) => p.slug)).size !== pages.length) errors.push("Başlangıç sayfalarının slug'ları benzersiz olmalı.");

  let css = "";
  let rawCss = "";
  const cssBytes = data.get("skins.css");
  if (cssBytes && theme) {
    const res = sanitizeThemeCss(strFromU8(cssBytes), theme.id);
    if (!res.ok) errors.push(...res.errors.map((e) => `skins.css: ${e}`));
    else {
      css = res.css;
      rawCss = strFromU8(cssBytes);
    }
    warnings.push(...res.warnings.map((w) => `skins.css: ${w}`));
  }

  let screenshot: ParsedTheme["screenshot"];
  const shotName = [...data.keys()].find((n) => /^screenshot\.(webp|png|jpe?g)$/.test(n));
  if (shotName) {
    const b = data.get(shotName)!;
    const mime = magicMime(b);
    if (!mime) errors.push(`${shotName}: dosya içeriği bir görsel değil.`);
    else screenshot = { mime, dataUri: `data:${mime};base64,${b64(b)}` };
  }

  const known = new Set(["theme.json", "tokens.json", "skins.css", "chrome/header.json", "chrome/footer.json", ...pageFiles, ...(shotName ? [shotName] : [])]);
  for (const n of data.keys()) if (!known.has(n)) warnings.push(`${n}: tanınmayan dosya, yok sayıldı.`);

  if (errors.length || !theme || !tokens) return { ok: false, errors: errors.length ? errors : ["Paket doğrulanamadı."], warnings };

  const hash = createHash("sha256");
  for (const n of [...known].sort()) {
    hash.update(n);
    hash.update(data.get(n) ?? new Uint8Array());
  }
  return { ok: true, warnings, value: { theme, tokens, css, rawCss, header, footer, pages, screenshot, checksum: hash.digest("hex"), files: [...known].sort() } };
}

export interface BuildInput {
  theme: ThemeJson;
  tokens: ThemeTokens;
  /** Ham (kapsamlanmamış) CSS */
  css?: string;
  header?: ThemeHeader;
  footer?: ThemeFooter;
  pages?: StarterPage[];
  screenshot?: { mime: string; dataUri: string };
}

const pretty = (v: unknown) => strToU8(`${JSON.stringify(v, null, 2)}\n`);

/** Paketi yazar (dışa aktarma). Aynı girdi her zaman aynı baytları üretir (sabit zaman damgası). */
export function buildThemePackage(input: BuildInput): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "theme.json": pretty(input.theme),
    "tokens.json": pretty(input.tokens),
  };
  if (input.css?.trim()) files["skins.css"] = strToU8(input.css);
  if (input.header) files["chrome/header.json"] = pretty(input.header);
  if (input.footer) files["chrome/footer.json"] = pretty(input.footer);
  for (const p of input.pages ?? []) files[`pages/${p.slug}.json`] = pretty(p);
  if (input.screenshot) {
    const ext2 = input.screenshot.mime === "image/webp" ? "webp" : input.screenshot.mime === "image/png" ? "png" : "jpg";
    const m = input.screenshot.dataUri.match(/^data:[^;]+;base64,(.+)$/);
    if (m) files[`screenshot.${ext2}`] = new Uint8Array(Buffer.from(m[1]!, "base64"));
  }
  const withMtime: Record<string, [Uint8Array, { mtime: number }]> = {};
  for (const [k, v] of Object.entries(files)) withMtime[k] = [v, { mtime: Date.UTC(2020, 0, 1) }];
  return zipSync(withMtime, { level: 6 });
}
