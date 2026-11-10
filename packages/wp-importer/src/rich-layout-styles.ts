/**
 * Sayfa içi `<style>` etiketlerinden satır sütun oranlarını, zemin renklerini,
 * gradyanları ve sütun arka plan görsellerini çıkaran saf çözümleyici.
 */

import { resolveAgainstBase } from "./links";

export interface RowInlineStyle {
  singleColumn?: boolean;
  colRatios?: number[];
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  textColor?: string;
}

export interface ColInlineStyle {
  backgroundImage?: string;
  backgroundColor?: string;
  borderRadius?: string;
  textColor?: string;
}

export interface ParsedInlineStyles {
  palette: Record<string, string>;
  rows: Map<string, RowInlineStyle>;
  cols: Map<string, ColInlineStyle>;
  headings: Map<string, { align?: "left" | "center" | "right"; color?: string }>;
}

const DEFAULT_PALETTE: Record<string, string> = {
  "--global-palette1": "#111827",
  "--global-palette2": "#1d4ed8",
  "--global-palette3": "#0f172a",
  "--global-palette4": "#334155",
  "--global-palette5": "#2563eb",
  "--global-palette6": "#475569",
  "--global-palette7": "#f1f5f9",
  "--global-palette8": "#f8fafc",
  "--global-palette9": "#ffffff",
};

export function resolvePaletteToken(raw: string, palette: Record<string, string>): string {
  const trimmed = raw.trim();
  const varMatch = /var\(\s*(--global-palette\d)\s*(?:,\s*([^)]+))?\)/.exec(trimmed);
  if (varMatch) {
    const key = varMatch[1]!;
    return palette[key] ?? varMatch[2]?.trim() ?? DEFAULT_PALETTE[key] ?? "#ffffff";
  }
  const bareMatch = /^palette(\d)$/i.exec(trimmed);
  if (bareMatch) {
    const key = `--global-palette${bareMatch[1]}`;
    return palette[key] ?? DEFAULT_PALETTE[key] ?? "#ffffff";
  }
  return trimmed;
}

export function isDarkColor(color: string | undefined): boolean {
  if (!color) return false;
  const hex = color.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3,8}$/.test(hex)) {
    return /#0[0-9a-f]{5}|#1[0-9a-f]{5}|rgb\(\s*(?:[0-4]?\d)\s*,/i.test(color);
  }
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.42;
}

function stripMediaQueries(css: string): string {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const mediaIdx = css.indexOf("@media", i);
    if (mediaIdx === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, mediaIdx);
    const openBrace = css.indexOf("{", mediaIdx);
    if (openBrace === -1) break;
    let depth = 1;
    let p = openBrace + 1;
    while (p < css.length && depth > 0) {
      if (css[p] === "{") depth++;
      else if (css[p] === "}") depth--;
      p++;
    }
    i = p;
  }
  return out;
}

function resolveAsset(raw: string, baseUrl: string): string {
  return resolveAgainstBase(raw, baseUrl);
}

export function parseInlineLayoutStyles(html: string, baseUrl = "", seedPalette?: Record<string, string>): ParsedInlineStyles {
  const palette: Record<string, string> = { ...DEFAULT_PALETTE, ...(seedPalette ?? {}) };
  for (const m of html.matchAll(/(--global-palette\d)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) {
    palette[m[1]!] = m[2]!.toLowerCase();
  }

  const rows = new Map<string, RowInlineStyle>();
  const cols = new Map<string, ColInlineStyle>();
  const headings = new Map<string, { align?: "left" | "center" | "right"; color?: string }>();

  const styleChunks: string[] = [];
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (m[1]) styleChunks.push(m[1]);
  }
  const desktopCss = stripMediaQueries(styleChunks.join("\n"));

  const getRow = (id: string): RowInlineStyle => {
    let r = rows.get(id);
    if (!r) {
      r = {};
      rows.set(id, r);
    }
    return r;
  };

  const getCol = (id: string): ColInlineStyle => {
    let c = cols.get(id);
    if (!c) {
      c = {};
      cols.set(id, c);
    }
    return c;
  };

  for (const ruleMatch of desktopCss.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
    const selector = ruleMatch[1]!.trim();
    const body = ruleMatch[2]!.trim();

    const rowIdMatch = /kb-row-layout-id([a-zA-Z0-9_-]+)/.exec(selector);
    if (rowIdMatch) {
      const rowId = `kb-row-layout-id${rowIdMatch[1]!}`;
      const row = getRow(rowId);

      const gridMatch = /grid-template-columns\s*:\s*([^;]+)/i.exec(body);
      if (gridMatch) {
        const gridVal = gridMatch[1]!.trim();
        if (/^minmax\(\s*0\s*,\s*1fr\s*\)$/i.test(gridVal)) {
          row.singleColumn = true;
          row.colRatios = [100];
        } else {
          const rep = /^repeat\(\s*(\d+)\s*,/i.exec(gridVal);
          if (rep) {
            const count = Number(rep[1]);
            if (count === 1) {
              row.singleColumn = true;
              row.colRatios = [100];
            } else if (count > 1 && count <= 6) {
              row.singleColumn = false;
              row.colRatios = Array.from({ length: count }, () => Math.round(100 / count));
            }
          } else {
            const pcts = [...gridVal.matchAll(/(\d+(?:\.\d+)?)%/g)].map((m) => Number(m[1]));
            if (pcts.length >= 2) {
              row.singleColumn = false;
              row.colRatios = pcts;
            }
          }
        }
      }

      if (!selector.includes("kt-row-layout-overlay")) {
        const bgColMatch = /background-color\s*:\s*([^;]+)/i.exec(body);
        if (bgColMatch) {
          const resolved = resolvePaletteToken(bgColMatch[1]!, palette);
          if (resolved && resolved !== "transparent") {
            row.backgroundColor = resolved;
            if (isDarkColor(resolved)) row.textColor = "#ffffff";
          }
        }
      }

      const bgImgMatch = /background-image\s*:\s*([^;]+)/i.exec(body);
      if (bgImgMatch) {
        const val = bgImgMatch[1]!.trim();
        if (/linear-gradient|radial-gradient/i.test(val)) {
          const resolvedGrad = val.replace(/var\(\s*(--global-palette\d)\s*(?:,\s*([^)]+))?\)/g, (_m, k) => palette[k] ?? DEFAULT_PALETTE[k] ?? "#ffffff");
          row.backgroundGradient = resolvedGrad;
          const firstHex = resolvedGrad.match(/#[0-9a-fA-F]{3,8}/)?.[0];
          if (firstHex && isDarkColor(firstHex)) row.textColor = "#ffffff";
        } else {
          const urlMatch = /url\(([^)]+)\)/i.exec(val);
          if (urlMatch) {
            const abs = resolveAsset(urlMatch[1]!, baseUrl);
            if (abs) row.backgroundImage = abs;
          }
        }
      }
    }

    const colIdMatch = /kadence-column([a-zA-Z0-9_-]+)/.exec(selector);
    if (colIdMatch && !selector.includes(":before") && !selector.includes(":after")) {
      const colId = `kadence-column${colIdMatch[1]!}`;
      const col = getCol(colId);
      const bgImgMatch = /background-image\s*:\s*url\(([^)]+)\)/i.exec(body);
      if (bgImgMatch) {
        const abs = resolveAsset(bgImgMatch[1]!, baseUrl);
        if (abs) col.backgroundImage = abs;
      }
      const bgColMatch = /background-color\s*:\s*([^;]+)/i.exec(body);
      if (bgColMatch) {
        const resolved = resolvePaletteToken(bgColMatch[1]!, palette);
        if (resolved && resolved !== "transparent") {
          col.backgroundColor = resolved;
          if (isDarkColor(resolved)) col.textColor = "#ffffff";
        }
      }
    }

    const headIdMatch = /kt-adv-heading([a-zA-Z0-9_-]+)/.exec(selector);
    if (headIdMatch) {
      const hId = `kt-adv-heading${headIdMatch[1]!}`;
      const cur = headings.get(hId) ?? {};
      const alignMatch = /text-align\s*:\s*(left|center|right)/i.exec(body);
      if (alignMatch) cur.align = alignMatch[1]!.toLowerCase() as "left" | "center" | "right";
      const colorMatch = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(body);
      if (colorMatch) cur.color = resolvePaletteToken(colorMatch[1]!, palette);
      headings.set(hId, cur);
    }
  }

  return { palette, rows, cols, headings };
}

