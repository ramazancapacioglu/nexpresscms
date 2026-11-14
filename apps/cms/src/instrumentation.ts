export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./plugins/register");
    const { hydratePerfornextCache } = await import("./lib/perfornext/hydrate");
    await hydratePerfornextCache();
    try {
      const { runPendingLiveImport } = await import("./instrumentation-node");
      await runPendingLiveImport();
    } catch (error) {
      console.error("[aktarım]", error instanceof Error ? error.message : error);
    }
  }
}
