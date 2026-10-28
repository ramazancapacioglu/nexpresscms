"use client";

import { useStudioInspector } from "./studio-inspector-context";

export function BlockStyleTab() {
  const {
    styleDevice,
    setStyleDevice,
    updateSelectedBlockStyle,
    getActiveStyleValue,
  } = useStudioInspector();

  return (
                        <div className="space-y-4">
                          {/* Cihaz Seçici */}
                          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
                            <span className="text-[11px] font-semibold">
                              Duyarlı Cihaz Kuralı:
                            </span>
                            <div className="inline-flex items-center gap-1">
                              {(["desktop", "tablet", "mobile"] as const).map(
                                (dev) => (
                                  <button
                                    key={dev}
                                    type="button"
                                    onClick={() => setStyleDevice(dev)}
                                    className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                      styleDevice === dev
                                        ? "bg-blue-600 text-white"
                                        : "bg-background text-muted-foreground"
                                    }`}
                                  >
                                    {dev}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Renk & Arka Plan */}
                          <div className="space-y-2.5 rounded-lg border border-border p-3">
                            <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                              Renk & Arka Plan
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-muted-foreground mb-1">
                                  Arka Plan Rengi
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={
                                      getActiveStyleValue("backgroundColor") ||
                                      "#ffffff"
                                    }
                                    onChange={(e) =>
                                      updateSelectedBlockStyle({
                                        backgroundColor: e.target.value,
                                      })
                                    }
                                    className="h-7 w-8 rounded border border-border cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={
                                      getActiveStyleValue("backgroundColor") ?? ""
                                    }
                                    onChange={(e) =>
                                      updateSelectedBlockStyle({
                                        backgroundColor: e.target.value,
                                      })
                                    }
                                    placeholder="#f8fafc"
                                    className="h-7 w-full rounded border border-border bg-background px-1.5 font-mono text-[11px]"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] text-muted-foreground mb-1">
                                  Metin Rengi
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={
                                      getActiveStyleValue("textColor") || "#09090b"
                                    }
                                    onChange={(e) =>
                                      updateSelectedBlockStyle({
                                        textColor: e.target.value,
                                      })
                                    }
                                    className="h-7 w-8 rounded border border-border cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={getActiveStyleValue("textColor") ?? ""}
                                    onChange={(e) =>
                                      updateSelectedBlockStyle({
                                        textColor: e.target.value,
                                      })
                                    }
                                    placeholder="#09090b"
                                    className="h-7 w-full rounded border border-border bg-background px-1.5 font-mono text-[11px]"
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-muted-foreground mb-1">
                                CSS Gradyan (İsteğe Bağlı)
                              </label>
                              <input aria-label="CSS Gradyan (İsteğe Bağlı)"
                                type="text"
                                value={
                                  getActiveStyleValue("backgroundGradient") ?? ""
                                }
                                onChange={(e) =>
                                  updateSelectedBlockStyle({
                                    backgroundGradient: e.target.value,
                                  })
                                }
                                placeholder="linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)"
                                className="h-7 w-full rounded border border-border bg-background px-2 font-mono text-[10px]"
                              />
                            </div>
                          </div>

                          {/* İç Boşluk (Padding) & Dış Boşluk (Margin) */}
                          <div className="space-y-2.5 rounded-lg border border-border p-3">
                            <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                              İç Boşluk (Padding — {styleDevice})
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {(
                                [
                                  { k: "paddingTop", l: "Üst" },
                                  { k: "paddingRight", l: "Sağ" },
                                  { k: "paddingBottom", l: "Alt" },
                                  { k: "paddingLeft", l: "Sol" },
                                ] as const
                              ).map((side) => (
                                <div key={side.k}>
                                  <label className="block text-[10px] text-muted-foreground text-center mb-0.5">
                                    {side.l}
                                  </label>
                                  <input
                                    type="text"
                                    value={getActiveStyleValue(side.k) ?? ""}
                                    onChange={(e) =>
                                      updateSelectedBlockStyle({
                                        [side.k]: e.target.value,
                                      })
                                    }
                                    placeholder="20px"
                                    className="h-7 w-full rounded border border-border bg-background px-1.5 text-center font-mono text-[11px]"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground pt-2">
                              Dış Boşluk (Margin Üst / Alt)
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={getActiveStyleValue("marginTop") ?? ""}
                                onChange={(e) =>
                                  updateSelectedBlockStyle({
                                    marginTop: e.target.value,
                                  })
                                }
                                placeholder="Üst (0px)"
                                className="h-7 rounded border border-border bg-background px-2 font-mono text-[11px]"
                              />
                              <input
                                type="text"
                                value={getActiveStyleValue("marginBottom") ?? ""}
                                onChange={(e) =>
                                  updateSelectedBlockStyle({
                                    marginBottom: e.target.value,
                                  })
                                }
                                placeholder="Alt (24px)"
                                className="h-7 rounded border border-border bg-background px-2 font-mono text-[11px]"
                              />
                            </div>
                          </div>

                          {/* Kenarlık & Köşe Yuvarlaklığı & Gölge */}
                          <div className="space-y-2.5 rounded-lg border border-border p-3">
                            <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                              Kenarlık (Border) & Gölge
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div>
                                <label className="block text-[10px] text-muted-foreground mb-0.5">
                                  Kalınlık
                                </label>
                                <input aria-label="Kalınlık"
                                  type="text"
                                  value={getActiveStyleValue("borderWidth") ?? ""}
                                  onChange={(e) =>
                                    updateSelectedBlockStyle({
                                      borderWidth: e.target.value,
                                    })
                                  }
                                  placeholder="1px"
                                  className="h-7 w-full rounded border border-border bg-background px-1.5 font-mono text-[11px]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-muted-foreground mb-0.5">
                                  Köşe (Radius)
                                </label>
                                <input aria-label="Köşe (Radius)"
                                  type="text"
                                  value={getActiveStyleValue("borderRadius") ?? ""}
                                  onChange={(e) =>
                                    updateSelectedBlockStyle({
                                      borderRadius: e.target.value,
                                    })
                                  }
                                  placeholder="12px"
                                  className="h-7 w-full rounded border border-border bg-background px-1.5 font-mono text-[11px]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-muted-foreground mb-0.5">
                                  Gölge
                                </label>
                                <select aria-label="Gölge"
                                  value={
                                    getActiveStyleValue("boxShadow") ?? "none"
                                  }
                                  onChange={(e) =>
                                    updateSelectedBlockStyle({
                                      boxShadow: e.target.value as any,
                                    })
                                  }
                                  className="h-7 w-full rounded border border-border bg-background px-1 text-[11px]"
                                >
                                  <option value="none">Yok</option>
                                  <option value="sm">Hafif (SM)</option>
                                  <option value="md">Orta (MD)</option>
                                  <option value="lg">Derin (LG)</option>
                                  <option value="xl">Sinematik (XL)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
  );
}
