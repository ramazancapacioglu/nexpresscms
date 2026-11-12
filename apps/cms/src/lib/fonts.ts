import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { catalogEntry, fontFileName, isFontFileName, keepFaces, parseGoogleFontCss, type InstalledFont, type InstalledFontFace } from "@nexpress/core";
import { mediaRoot } from "./media/storage";

/**
 * Seçilen Google yazı tipini sunucuya indirir (yalnızca `latin` + `latin-ext`) ve kiracı klasörüne yazar:
 * `{MEDIA_DIR}/{siteId}/fonts/{ad}-{özet}.woff2`. Ziyaretçi dosyayı `/api/fonts/{dosya}` ile kendi alan adımızdan alır.
 * Yalnızca sabit iki sunucuya gidilir (fonts.googleapis.com ve fonts.gstatic.com); aile adı katalogdan doğrulanır.
 */
const SITE_RE = /^[a-z0-9_-]{1,64}$/;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_FILE_BYTES = 600_000;
/** Ağırlık denemeleri: ailede olmayan ağırlık Google'dan 400 döndürür, bir alt kümeyle yeniden denenir. */
const WEIGHT_TRIES = ["400;600;700", "400;700", "400"];

function fontsDir(siteId: string): string {
  if (!SITE_RE.test(siteId)) throw new Error("Geçersiz kiracı.");
  return path.join(mediaRoot(), siteId, "fonts");
}

async function fetchText(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
  return res.ok ? res.text() : null;
}

async function fetchCss(family: string): Promise<string> {
  for (const weights of WEIGHT_TRIES) {
    const css = await fetchText(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weights}&display=swap`);
    if (css) return css;
  }
  throw new Error("Yazı tipi Google Fonts'ta bulunamadı.");
}

export async function installGoogleFont(siteId: string, family: string): Promise<InstalledFont> {
  if (!catalogEntry(family)) throw new Error("Bu yazı tipi listede yok.");
  const parsed = keepFaces(parseGoogleFontCss(await fetchCss(family)));
  if (parsed.length === 0) throw new Error("Yazı tipi dosyası bulunamadı.");
  const dir = fontsDir(siteId);
  await fs.mkdir(dir, { recursive: true });

  const faces: InstalledFontFace[] = [];
  const byUrl = new Map<string, string>();
  for (const face of parsed) {
    const url = new URL(face.url);
    if (url.protocol !== "https:" || url.hostname !== "fonts.gstatic.com") throw new Error("Beklenmeyen yazı tipi kaynağı.");
    let file = byUrl.get(face.url);
    if (!file) {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15_000), cache: "no-store" });
      if (!res.ok) throw new Error("Yazı tipi dosyası indirilemedi.");
      const data = Buffer.from(await res.arrayBuffer());
      if (data.length === 0 || data.length > MAX_FILE_BYTES || data.subarray(0, 4).toString("latin1") !== "wOF2") throw new Error("Geçersiz yazı tipi dosyası.");
      file = fontFileName(family, crypto.createHash("sha256").update(data).digest("hex").slice(0, 8));
      await fs.writeFile(path.join(dir, file), data);
      byUrl.set(face.url, file);
    }
    faces.push({ weight: face.weight, subset: face.subset as "latin" | "latin-ext", file, unicodeRange: face.unicodeRange });
  }
  return { family, faces };
}

export async function readFontFile(siteId: string, file: string): Promise<Buffer | null> {
  if (!isFontFileName(file)) return null;
  try {
    return await fs.readFile(path.join(fontsDir(siteId), file));
  } catch {
    return null;
  }
}
