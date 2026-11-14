import fs from "node:fs";
import path from "node:path";
import Module from "node:module";

/** Kök ve uygulama `.env` dosyasını sürece alır. Dışarıdan gelen değişken durur. */
function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const appDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
loadEnv(path.resolve(appDir, "../../.env"));
loadEnv(path.resolve(appDir, ".env"));

const origLoad = (Module as unknown as { _load: (request: string, parent: unknown, isMain: boolean) => unknown })._load;
(Module as unknown as { _load: (request: string, parent: unknown, isMain: boolean) => unknown })._load = function (
  request: string,
  parent: unknown,
  isMain: boolean
) {
  if (request === "server-only" || request === "next/cache") {
    return { revalidatePath: () => {}, revalidateTag: () => {}, unstable_cache: (fn: unknown) => fn };
  }
  return origLoad.call(this, request, parent, isMain);
};

async function main() {
  const { importLiveAkinsoft } = await import("../src/lib/wp-bridge/live-import");
  const dryRun = process.argv.includes("--dry-run");
  const siteFlag = process.argv.indexOf("--site");
  const siteId = siteFlag >= 0 ? process.argv[siteFlag + 1] || "default" : "default";
  const result = await importLiveAkinsoft(siteId, { dryRun });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
