import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextResponse } from "next/server";
import { strToU8, zipSync } from "fflate";
import { recordAudit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-api";
import { WP_BRIDGE_VERSION } from "@/plugins/wp-bridge";

export const runtime = "nodejs";

/** Depo kökündeki site eklentisi klasörü. Derleme dizininden yukarı doğru aranır. */
async function pluginDir(): Promise<string> {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 12; i += 1) {
    const candidate = path.join(dir, "plugins/wp-bridge/nexpress-bridge");
    try {
      await readdir(candidate);
      return candidate;
    } catch {
      dir = path.dirname(dir);
    }
  }
  throw new Error("Site eklentisi klasörü bulunamadı.");
}

async function collect(dir: string, prefix: string, out: Record<string, Uint8Array>): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = `${prefix}${entry.name}`;
    if (entry.isDirectory()) await collect(abs, `${rel}/`, out);
    else out[rel] = strToU8(await readFile(abs));
  }
}

/** WordPress site eklentisini, panel sürümüyle zip olarak verir. */
export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const files: Record<string, Uint8Array> = {};
  await collect(await pluginDir(), "nexpress-bridge/", files);
  const bytes = zipSync(files, { level: 6 });
  await recordAudit({ id: auth.session.sub, email: auth.session.email }, "wp-bridge.download", {
    detail: WP_BRIDGE_VERSION,
  });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="nexpress-bridge-${WP_BRIDGE_VERSION}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
