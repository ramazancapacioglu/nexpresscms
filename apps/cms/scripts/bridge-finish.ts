import { registerWorkspacePlugins } from "../src/plugins/register";
import { repairImportedAssets } from "../src/lib/wp-bridge/repair";
import { redrawFlatPages } from "../src/lib/wp-bridge/redraw";

registerWorkspacePlugins();

async function main(): Promise<void> {
  const siteId = process.env.NEXPRESS_SITE_ID || "default";
  const repair = await repairImportedAssets(siteId);
  const draw = await redrawFlatPages(siteId, 4);
  const host = repair.origin ? new URL(repair.origin).host : "";
  console.log(JSON.stringify({ host, pages: repair.pages, split: repair.split, downloaded: repair.downloaded, failed: repair.failed, remapped: repair.remapped, drawn: draw.drawn, skipped: draw.skipped, note: draw.note }));
}

main();
