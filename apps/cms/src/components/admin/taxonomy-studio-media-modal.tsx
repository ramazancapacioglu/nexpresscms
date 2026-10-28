import { X } from "lucide-react";
import type { TaxonomyStudioState } from "./use-taxonomy-studio";

/** MEDYA KÜTÜPHANESİ GÖRSEL SEÇİCİ MODAL */
export function TaxonomyStudioMediaModal({ s }: { s: TaxonomyStudioState }) {
  const { initialMediaAssets, items, setImageUrl, mediaModalOpen, setMediaModalOpen, showToast } = s;
  return (
    <>
      {/* MEDYA KÜTÜPHANESİ GÖRSEL SEÇİCİ MODAL */}
      {mediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="font-semibold text-sm">
                Kategori Kapak Görseli Seçin
              </div>
              <button
                type="button"
                onClick={() => setMediaModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto" tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
              {initialMediaAssets.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => {
                    setImageUrl(med.url);
                    setMediaModalOpen(false);
                    showToast(`"${med.filename}" kategori görseli olarak seçildi.`);
                  }}
                  className="rounded-lg border border-border p-2 text-left hover:border-blue-600 transition space-y-1.5"
                >
                  <img
                    src={med.url}
                    alt={med.altText}
                    className="h-24 w-full rounded object-cover bg-muted"
                  />
                  <div className="text-[11px] font-semibold truncate">
                    {med.filename}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
