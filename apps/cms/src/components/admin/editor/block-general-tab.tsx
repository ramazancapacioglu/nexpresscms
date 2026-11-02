"use client";

import { CatalogFields } from "./catalog-fields";
import { COLUMN_LAYOUT_PRESETS } from "./studio-model";
import { useStudioInspector } from "./studio-inspector-context";

export function BlockGeneralTab() {
  const {
    selectedBlock,
    updateSelectedBlockProps,
    handleChangeColumnLayout,
    setMediaPickerTarget,
    title,
  } = useStudioInspector();
  if (!selectedBlock) return null;

  return (
                        <div className="space-y-3">
                          {selectedBlock.type === "columns" && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[11px] font-semibold mb-1.5">
                                  Sütun oranı
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {COLUMN_LAYOUT_PRESETS.map((pr) => (
                                    <button
                                      key={pr.id}
                                      type="button"
                                      onClick={() =>
                                        handleChangeColumnLayout(
                                          selectedBlock.id,
                                          pr.id
                                        )
                                      }
                                      className={`rounded border p-2 text-left text-[11px] ${
                                        selectedBlock.props.layout === pr.id
                                          ? "border-blue-600 bg-blue-500/10 font-bold text-blue-600"
                                          : "border-border hover:bg-muted"
                                      }`}
                                    >
                                      <div>{pr.id}</div>
                                      <div className="text-[10px] text-muted-foreground">
                                        {pr.label}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold mb-1">
                                  Sütunlar Arası Boşluk (Gap)
                                </label>
                                <select aria-label="Sütunlar Arası Boşluk (Gap)"
                                  value={String(selectedBlock.props.gap ?? "24px")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({ gap: e.target.value })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2"
                                >
                                  <option value="12px">Dar (12px)</option>
                                  <option value="20px">Orta (20px)</option>
                                  <option value="24px">Standart (24px)</option>
                                  <option value="32px">Geniş (32px)</option>
                                  <option value="48px">Ultra Geniş (48px)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold mb-1">
                                  Dikey Hizalama
                                </label>
                                <select aria-label="Dikey Hizalama"
                                  value={String(
                                    selectedBlock.props.verticalAlign ?? "stretch"
                                  )}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({
                                      verticalAlign: e.target.value,
                                    })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2"
                                >
                                  <option value="stretch">Eşit Yükseklik (Stretch)</option>
                                  <option value="top">Üste Hizala</option>
                                  <option value="center">Ortala</option>
                                  <option value="bottom">Alta Hizala</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {selectedBlock.type === "hero" && (
                            <div className="space-y-2.5">
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">
                                  Üst Rozet (Badge)
                                </label>
                                <input aria-label="Üst Rozet (Badge)"
                                  type="text"
                                  value={String(selectedBlock.props.badge ?? "")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({ badge: e.target.value })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">
                                  Ana Başlık
                                </label>
                                <input aria-label="Ana Başlık"
                                  type="text"
                                  value={String(selectedBlock.props.title ?? "")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({ title: e.target.value })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">
                                  Alt Açıklama
                                </label>
                                <textarea aria-label="Alt Açıklama"
                                  rows={3}
                                  value={String(selectedBlock.props.subtitle ?? "")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({
                                      subtitle: e.target.value,
                                    })
                                  }
                                  className="w-full rounded border border-border bg-background p-2"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={String(
                                    selectedBlock.props.primaryCtaLabel ?? ""
                                  )}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({
                                      primaryCtaLabel: e.target.value,
                                    })
                                  }
                                  placeholder="Birincil Buton"
                                  className="h-8 rounded border border-border bg-background px-2"
                                />
                                <input
                                  type="text"
                                  value={String(
                                    selectedBlock.props.primaryCtaHref ?? ""
                                  )}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({
                                      primaryCtaHref: e.target.value,
                                    })
                                  }
                                  placeholder="Hedef URL"
                                  className="h-8 rounded border border-border bg-background px-2 font-mono"
                                />
                              </div>
                            </div>
                          )}

                          {selectedBlock.type === "button_element" && (
                            <div className="space-y-2.5">
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">
                                  Buton Etiketi
                                </label>
                                <input aria-label="Buton Etiketi"
                                  type="text"
                                  value={String(selectedBlock.props.label ?? "")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({ label: e.target.value })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">
                                  Hedef Link (Href)
                                </label>
                                <input aria-label="Hedef Link (Href)"
                                  type="text"
                                  value={String(selectedBlock.props.href ?? "")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({ href: e.target.value })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2 font-mono"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={String(
                                    selectedBlock.props.styleVariant ?? "primary"
                                  )}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({
                                      styleVariant: e.target.value,
                                    })
                                  }
                                  className="h-8 rounded border border-border bg-background px-2"
                                >
                                  <option value="primary">Birincil (Primary)</option>
                                  <option value="secondary">İkincil (Dark)</option>
                                  <option value="outline">Çerçeveli (Outline)</option>
                                </select>
                                <select
                                  value={String(selectedBlock.props.align ?? "left")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({ align: e.target.value })
                                  }
                                  className="h-8 rounded border border-border bg-background px-2"
                                >
                                  <option value="left">Sola Hizalı</option>
                                  <option value="center">Ortalı</option>
                                  <option value="right">Sağa Hizalı</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {selectedBlock.type === "media_file" && (
                            <div className="space-y-2.5">
                              <button type="button" onClick={() => setMediaPickerTarget("block_media")} className="w-full rounded-md border border-blue-500/40 bg-blue-500/10 py-1.5 text-xs font-semibold text-blue-600">
                                Kitaplıktan PDF / Video / Ses Seç veya Yükle
                              </button>
                              <p className="text-[11px] text-muted-foreground">
                                {selectedBlock.props.url ? `Seçili: ${String(selectedBlock.props.kind ?? "dosya")} — ${String(selectedBlock.props.url)}` : "Henüz dosya seçilmedi; blok sayfada görünmez."}
                              </p>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">Başlık (bağlantı metni ve şema adı)</label>
                                <input aria-label="Medya başlığı" type="text" value={String(selectedBlock.props.title ?? "")} onChange={(e) => updateSelectedBlockProps({ title: e.target.value })} className="h-8 w-full rounded border border-border bg-background px-2" />
                              </div>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">Açıklama</label>
                                <textarea aria-label="Medya açıklaması" rows={3} value={String(selectedBlock.props.description ?? "")} onChange={(e) => updateSelectedBlockProps({ description: e.target.value })} className="w-full rounded border border-border bg-background p-2" />
                              </div>
                            </div>
                          )}

                          {selectedBlock.type === "image_figure" && (
                            <div className="space-y-2.5">
                              <button
                                type="button"
                                onClick={() => setMediaPickerTarget("block_image")}
                                className="w-full rounded-md border border-blue-500/40 bg-blue-500/10 py-1.5 text-xs font-semibold text-blue-600"
                              >
                                Medya Kütüphanesinden Görsel Seç
                              </button>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">
                                  Görsel URL
                                </label>
                                <input aria-label="Görsel URL"
                                  type="text"
                                  value={String(selectedBlock.props.url ?? "")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({ url: e.target.value })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">
                                  Alt Metni (Zorunlu Görsel SEO)
                                </label>
                                <input aria-label="Alt Metni (Zorunlu Görsel SEO)"
                                  type="text"
                                  value={String(selectedBlock.props.altText ?? "")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({
                                      altText: e.target.value,
                                    })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">Başlık (title özniteliği)</label>
                                <input aria-label="Görsel başlığı (title)" type="text" value={String(selectedBlock.props.titleText ?? "")} onChange={(e) => updateSelectedBlockProps({ titleText: e.target.value })} className="h-8 w-full rounded border border-border bg-background px-2" />
                              </div>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">
                                  Görsel Altı Açıklama (Figcaption)
                                </label>
                                <input aria-label="Görsel Altı Açıklama (Figcaption)"
                                  type="text"
                                  value={String(selectedBlock.props.caption ?? "")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({
                                      caption: e.target.value,
                                    })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2"
                                />
                              </div>
                            </div>
                          )}

                          {selectedBlock.type === "list_element" && (
                            <div className="space-y-2.5">
                              <label className="block text-[11px] font-semibold">
                                Liste Tipi
                              </label>
                              <select aria-label="Liste Tipi"
                                value={String(
                                  selectedBlock.props.listType ?? "check"
                                )}
                                onChange={(e) =>
                                  updateSelectedBlockProps({
                                    listType: e.target.value,
                                  })
                                }
                                className="h-8 w-full rounded border border-border bg-background px-2"
                              >
                                <option value="check">Onay İşaretli (✓)</option>
                                <option value="bullet">Madde İşaretli (•)</option>
                                <option value="numbered">Numaralı (1, 2, 3)</option>
                              </select>
                              <label className="block text-[11px] font-semibold">
                                Maddeler (Her satıra 1 madde)
                              </label>
                              <textarea aria-label="Maddeler (Her satıra 1 madde)"
                                rows={5}
                                value={
                                  Array.isArray(selectedBlock.props.items)
                                    ? selectedBlock.props.items.join("\n")
                                    : ""
                                }
                                onChange={(e) =>
                                  updateSelectedBlockProps({
                                    items: e.target.value
                                      .split("\n")
                                      .filter((x) => x.trim().length > 0),
                                  })
                                }
                                className="w-full rounded border border-border bg-background p-2"
                              />
                            </div>
                          )}
                          <CatalogFields block={selectedBlock} onChange={updateSelectedBlockProps} />
                        </div>
  );
}
