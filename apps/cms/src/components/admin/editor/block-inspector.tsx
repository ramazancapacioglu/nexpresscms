"use client";

import { TemplateTab } from "./template-tab";
import { BLOCK_TYPE_LABELS } from "./studio-model";
import { useStudioInspector } from "./studio-inspector-context";

import { BlockAdvancedTab } from "./block-advanced-tab";
import { BlockGeneralTab } from "./block-general-tab";
import { BlockStyleTab } from "./block-style-tab";
import { EngageTab } from "./engage-tab";
import { PublishTab } from "./publish-tab";
import { SeoTab } from "./seo-tab";

export function BlockInspector() {
  const {
    rightSidebarOpen,
    setRightSidebarOpen,
    rightTab,
    setRightTab,
    blockInspectorSubTab,
    setBlockInspectorSubTab,
    selectedBlock,
    selectedLocation,
    setSelectedBlockId,
    seoAnalysis,
    templateKind,
  } = useStudioInspector();

  return (
    <>
        {/* 3. SAĞ DENETÇİ */}
        {rightSidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-hidden="true" onClick={() => setRightSidebarOpen(false)} />}
        {rightSidebarOpen && (
          <aside aria-label="Denetçi paneli" className="fixed inset-y-0 right-0 z-40 flex w-[22rem] max-w-[92vw] shrink-0 flex-col shadow-xl lg:static lg:z-auto lg:w-72 lg:max-w-none lg:shadow-none xl:w-80 border-l border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#111317] h-full overflow-hidden">
            {/* Yapışkan Üst Sekme Başlıkları */}
            <div className={`grid ${templateKind ? "grid-cols-2" : "grid-cols-4"} border-b border-border bg-muted/30 p-1 text-[11px] font-semibold shrink-0`}>
              {(templateKind
                ? ([{ id: "block", label: "Blok & Stil" }, { id: "template", label: "Şablon" }] as const)
                : ([
                    { id: "block", label: "Blok & Stil" },
                    { id: "publish", label: "Yayın & Kat." },
                    { id: "seo", label: `SEO (${seoAnalysis.score})` },
                    { id: "engage", label: "Medya & Etk." },
                  ] as const)
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRightTab(t.id)}
                  className={`rounded py-1.5 transition ${
                    rightTab === t.id
                      ? "bg-background text-blue-600 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sekme İçeriği (Bağımsız Dikey Kaydırma) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs" tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
              {/* BLOK DENETÇİSİ */}
              {rightTab === "template" && templateKind && <TemplateTab />}
              {rightTab === "block" && (
                <div className="space-y-4">
                  {!selectedBlock ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
                      Düzenlemek için kanvastan veya sol Yapı Gezgininden bir blok, satır ya da sütun seçin.
                    </div>
                  ) : (
                    <>
                      {/* Seçili Blok Başlığı & Üst Ebeveyn (Parent) Gezinmesi */}
                      <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {BLOCK_TYPE_LABELS[selectedBlock.type] ??
                              selectedBlock.type}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            #{selectedBlock.id.slice(-6)}
                          </span>
                        </div>
                        {selectedLocation?.parentId && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedBlockId(selectedLocation.parentId)
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                          >
                            ↑ Üst Kapsayıcıyı ( Sütun / Satır ) Seç
                          </button>
                        )}
                      </div>

                      {/* Genel, stil ve gelişmiş */}
                      <div className="grid grid-cols-3 rounded-lg border border-border bg-muted/40 p-0.5 text-[11px] font-semibold">
                        {(
                          [
                            { id: "general", label: "Genel" },
                            { id: "style", label: "Stil (CSS)" },
                            { id: "advanced", label: "Gelişmiş" },
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setBlockInspectorSubTab(st.id)}
                            className={`rounded py-1 transition ${
                              blockInspectorSubTab === st.id
                                ? "bg-background text-foreground shadow-2xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>

                      {/* ALT SEKME A: GENEL (İÇERİK & DÜZEN AYARLARI) */}
                      {blockInspectorSubTab === "general" && <BlockGeneralTab />}

                      {/* Stil: aygıt bazlı boşluk, renk ve tipografi */}
                      {blockInspectorSubTab === "style" && <BlockStyleTab />}

                      {/* ALT SEKME C: GELİŞMİŞ (CİHAZ GÖRÜNÜRLÜĞÜ, ÇAPA ID & ÖZEL CSS) */}
                      {blockInspectorSubTab === "advanced" && <BlockAdvancedTab />}
                    </>
                  )}
                </div>
              )}

              {/* SEKME 2: YAYIN DURUMU & AĞAÇ KATEGORİ / ETİKET YÖNETİMİ */}
              {rightTab === "publish" && <PublishTab />}

              {/* SEKME 3: ÇEKİRDEK 17-NOKTALI CANLI SEO & GEO MOTORU */}
              {rightTab === "seo" && <SeoTab />}

              {/* SEKME 4: ÖNE ÇIKAN GÖRSEL (IMAGE SEO) & ETKİLEŞİM AYARLARI */}
              {rightTab === "engage" && <EngageTab />}
            </div>
          </aside>
        )}
    </>
  );
}
