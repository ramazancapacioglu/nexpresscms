export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./plugins/register");
    const { hydratePerfornextCache } = await import("./lib/perfornext/hydrate");
    await hydratePerfornextCache();
  }
}
