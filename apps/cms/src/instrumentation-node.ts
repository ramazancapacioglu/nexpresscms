import fs from "node:fs";
import path from "node:path";

/**
 * İşaret dosyası duruyorsa akinsoftizmir aktarımını bir kez çalıştırır.
 * Yalnızca Node süreci yükler. SQLite, derleme ve eksik Postgres adresi girmez.
 */
export async function runPendingLiveImport(): Promise<void> {
  if (process.env.DB_DIALECT === "sqlite") return;
  if (!process.env.DATABASE_URL?.startsWith("postgres")) return;
  if (process.env.NEXT_PHASE?.includes("build") || process.env.npm_lifecycle_event === "build") return;
  let dir = path.resolve(process.cwd());
  let marker: string | null = null;
  for (let i = 0; i < 4; i += 1) {
    const candidate = path.join(dir, "scripts", "import-akinsoft-izmir.once");
    if (fs.existsSync(candidate)) {
      marker = candidate;
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  if (!marker) return;
  const flag = path.resolve(process.cwd(), process.env.MEDIA_DIR || "data/media", ".import-akinsoft-done");
  if (fs.existsSync(flag)) return;
  const { importLiveAkinsoft } = await import("./lib/wp-bridge/live-import");
  const result = await importLiveAkinsoft("default");
  console.log("[aktarım]", JSON.stringify(result));
  if (!result.ok) return;
  fs.mkdirSync(path.dirname(flag), { recursive: true });
  fs.writeFileSync(flag, `${JSON.stringify(result)}\n`);
}
