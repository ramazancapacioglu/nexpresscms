import { cmsHooks } from "@nexpress/core";
import { providerFromEnv, type EmbeddingProvider } from "./providers";
import { indexContent } from "./service";

const PLUGIN_ID = "@nexpress/rag";
let registered = false;

export interface RagHookOptions {
  /** İsteğin yanıtından sonra çalıştırıcı (Next `after`). Kayıt akışını gömme gecikmesiyle bekletmez. */
  runAfterResponse?: (task: () => Promise<void>) => void;
  provider?: () => EmbeddingProvider;
}

/** Yayında içeriği dizinler. Başarısızlık yayını asla bozmaz (günlüğe yazılır). */
export function registerRagIndexing(options: RagHookOptions = {}): void {
  if (registered) return;
  registered = true;
  const run =
    options.runAfterResponse ??
    ((task) => {
      void task();
    });
  cmsHooks.registerAction("content:afterPublish", PLUGIN_ID, ({ siteId, contentId, locale }) => {
    const task = async () => {
      try {
        await indexContent(siteId, contentId, locale, (options.provider ?? providerFromEnv)());
      } catch (error) {
        console.warn("[rag] dizinleme başarısız:", error instanceof Error ? error.message : error);
      }
    };
    try {
      run(task);
    } catch {
      // `after` istek kapsamı dışında (betik, seed) çağrılırsa doğrudan çalıştır
      void task();
    }
  });
}
