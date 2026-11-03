import type { ThemeStoreState } from "./use-theme-store";
import { ThemeStoreControlPanel } from "./theme-store-control-panel";
import { ThemeStorePreviewCanvas } from "./theme-store-preview-canvas";

/** Split Customizer: Sol Kontrol Paneli (Gizlenebilir) & Sağ Canlı Önizleme Kanvası */
export function ThemeStoreCustomizer({ s }: { s: ThemeStoreState }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {!s.hideControlPanel && <ThemeStoreControlPanel s={s} />}
      <ThemeStorePreviewCanvas s={s} />
    </div>
  );
}
