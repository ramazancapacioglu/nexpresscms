import Module from "node:module";

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
  const { reconstructRichSiteDataset } = await import("../src/lib/wp-bridge/reconstruct");
  const siteId = process.argv[2] || "default";
  const result = await reconstructRichSiteDataset(siteId);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
