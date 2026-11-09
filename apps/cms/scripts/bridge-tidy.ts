import { tidyImportedCopy } from "../src/lib/wp-bridge/tidy";

async function main(): Promise<void> {
  const siteId = process.env.NEXPRESS_SITE_ID || "default";
  const result = await tidyImportedCopy(siteId);
  console.log(JSON.stringify(result));
}

main();
