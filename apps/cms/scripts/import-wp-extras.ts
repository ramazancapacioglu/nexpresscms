import fs from "node:fs";
import path from "node:path";
import Module from "node:module";

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

type Loader = (request: string, parent: unknown, isMain: boolean) => unknown;
const origLoad = (Module as unknown as { _load: Loader })._load;
(Module as unknown as { _load: Loader })._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === "server-only" || request === "next/cache") {
    return { revalidatePath: () => {}, revalidateTag: () => {}, unstable_cache: (fn: unknown) => fn };
  }
  return origLoad.call(this, request, parent, isMain);
};

/**
 * WordPress yöneticisinden yalnızca okuyarak yazar, form, yönlendirme, taslak, yorum tarihi ve medya aktarır.
 * Kimlik bilgisi ortam değişkenindedir (WP_ADMIN_USER, WP_ADMIN_PASS); komut satırına ve günlüğe yazılmaz.
 *   tsx scripts/import-wp-extras.ts --origin https://www.ornek.com [--site default] [--only users,forms,entries] [--dry-run]
 */
async function main() {
  const { importWpExtras } = await import("../src/lib/wp-bridge/extras/run");
  const arg = (name: string) => {
    const at = process.argv.indexOf(name);
    return at >= 0 ? process.argv[at + 1] : undefined;
  };
  const user = process.env.WP_ADMIN_USER ?? "";
  const password = process.env.WP_ADMIN_PASS ?? "";
  if (!user || !password) throw new Error("WP_ADMIN_USER ve WP_ADMIN_PASS gerekli.");
  const result = await importWpExtras(arg("--site") || "default", {
    origin: arg("--origin") || "",
    user,
    password,
    only: arg("--only")?.split(",").filter(Boolean),
    dryRun: process.argv.includes("--dry-run"),
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
