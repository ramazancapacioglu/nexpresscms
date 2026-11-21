import { registerWorkspacePlugins } from "../src/plugins/register";
import { repairQaPages } from "../src/lib/wp-bridge/qa-pages";

registerWorkspacePlugins();

async function main(): Promise<void> {
  const siteId = process.env.NEXPRESS_SITE_ID || "default";
  const dryRun = process.argv.includes("--dry");
  const origin = process.argv.find((a) => a.startsWith("--origin="))?.slice(9);
  console.log(JSON.stringify(await repairQaPages(siteId, { dryRun, origin }), null, 1));
  process.exit(0);
}

main();
