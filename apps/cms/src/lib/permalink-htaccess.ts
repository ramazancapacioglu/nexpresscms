import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderPermalinkHtaccess, type PermalinkStructure } from "@nexpress/core/permalinks";

/** Kayıt anında Apache tanısı için `.htaccess` yenilenir. `HTACCESS_PATH` yoksa uygulamanın `public` klasörü. */
export async function writePermalinkHtaccess(structure: PermalinkStructure): Promise<string> {
  const target = process.env.HTACCESS_PATH?.trim() || path.join(process.cwd(), "public", ".htaccess");
  const body = renderPermalinkHtaccess(structure, new Date().toISOString());
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body, "utf8");
  return target;
}
