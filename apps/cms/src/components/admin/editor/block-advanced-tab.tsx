"use client";

import { updateBlockById } from "@nexpress/core";

import { useStudioInspector } from "./studio-inspector-context";

export function BlockAdvancedTab() {
  const {
    selectedBlock,
    setBlocks,
  } = useStudioInspector();
  if (!selectedBlock) return null;

  return (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold mb-1">
                              HTML Çapa (Anchor ID)
                            </label>
                            <input aria-label="HTML Çapa (Anchor ID)"
                              type="text"
                              value={selectedBlock.style?.anchorId ?? ""}
                              onChange={(e) =>
                                setBlocks((prev) =>
                                  updateBlockById(prev, selectedBlock.id, (b) => ({
                                    ...b,
                                    style: {
                                      ...b.style,
                                      anchorId: e.target.value,
                                    },
                                  }))
                                )
                              }
                              placeholder="orn: fiyatlandirma-tablosu"
                              className="h-8 w-full rounded border border-border bg-background px-2 font-mono"
                            />
                          </div>

                          <div className="rounded-lg border border-border p-3 space-y-2">
                            <div className="text-[11px] font-semibold">
                              Cihaz Görünürlüğü (Responsive Gizleme)
                            </div>
                            {(
                              [
                                { k: "desktop", label: "Masaüstünde Gizle" },
                                { k: "tablet", label: "Tablette Gizle" },
                                { k: "mobile", label: "Mobilde Gizle" },
                              ] as const
                            ).map((d) => {
                              const rawHide = selectedBlock.style?.hideOn;
                              const isHidden = Array.isArray(rawHide)
                                ? rawHide.includes(d.k)
                                : Boolean(rawHide?.[d.k]);
                              return (
                                <label
                                  key={d.k}
                                  className="flex items-center justify-between text-xs cursor-pointer"
                                >
                                  <span>{d.label}</span>
                                  <input
                                    type="checkbox"
                                    checked={isHidden}
                                    onChange={(e) =>
                                      setBlocks((prev) =>
                                        updateBlockById(
                                          prev,
                                          selectedBlock.id,
                                          (b) => {
                                            const prevObj = Array.isArray(b.style?.hideOn)
                                              ? {
                                                  desktop: b.style?.hideOn.includes("desktop"),
                                                  tablet: b.style?.hideOn.includes("tablet"),
                                                  mobile: b.style?.hideOn.includes("mobile"),
                                                }
                                              : (b.style?.hideOn ?? {});
                                            return {
                                              ...b,
                                              style: {
                                                ...b.style,
                                                hideOn: {
                                                  ...prevObj,
                                                  [d.k]: e.target.checked,
                                                },
                                              },
                                            };
                                          }
                                        )
                                      )
                                    }
                                    className="rounded border-border"
                                  />
                                </label>
                              );
                            })}
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-1">
                              Blok Özel CSS (<code>selector &#123; ... &#125;</code>)
                            </label>
                            <textarea
                              rows={4}
                              value={selectedBlock.style?.customCss ?? ""}
                              onChange={(e) =>
                                setBlocks((prev) =>
                                  updateBlockById(prev, selectedBlock.id, (b) => ({
                                    ...b,
                                    style: {
                                      ...b.style,
                                      customCss: e.target.value,
                                    },
                                  }))
                                )
                              }
                              placeholder={`selector {\n  backdrop-filter: blur(8px);\n}`}
                              className="w-full rounded border border-border bg-zinc-950 p-2 font-mono text-[11px] text-emerald-300"
                            />
                          </div>
                        </div>
  );
}
