import { enrichImportedFacts } from "../src/lib/wp-bridge/enrich";

async function main(): Promise<void> {
  const siteId = process.env.NEXPRESS_SITE_ID || "default";
  const file = process.argv[2];
  if (!file) throw new Error("Dosya yolu gerekli");
  const result = await enrichImportedFacts(siteId, file);
  console.log(JSON.stringify(result));
}

main();
