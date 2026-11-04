"use client";

import { AiComposePanel } from "./ai-compose-panel";
import { AnchorNavFields } from "./anchor-nav-fields";
import { CatalogFields } from "./catalog-fields";
import { DynamicListFields } from "./dynamic-list-fields";
import { IconPickerField } from "./icon-picker-modal";
import { SchemaFields } from "./schema-fields";
import { QuickAnchorIdField, SectionFields } from "./section-fields";
import { SchemaCardFields } from "./schema-card-fields";
import { CampaignShowcaseFields } from "./campaign-showcase-fields";

/** Kendi özel alan arayüzü olan (veya düzenlenecek alanı olmayan) bloklar; kalan her blok şema tabanlı alanlarla düzenlenir. */
const DEDICATED_UI = new Set(["section", "columns", "column", "paragraph", "heading", "paragraph_element", "heading_element", "text_div", "divider_spacer", "media_file", "dynamic_list", "schema_card", "image_figure", "hero", "button_element", "list_element", "anchor_nav", "campaign_showcase"]);
import { COLUMN_LAYOUT_PRESETS } from "./studio-model";
import { useStudioInspector } from "./studio-inspector-context";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Link2,
  Image as ImageIcon,
} from "lucide-react";

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
                          {(selectedBlock.type === "paragraph" || selectedBlock.type === "heading" || selectedBlock.type === "paragraph_element" || selectedBlock.type === "heading_element") && <AiComposePanel />}
                          {selectedBlock.type === "dynamic_list" && <DynamicListFields />}
                          {selectedBlock.type === "campaign_showcase" && <CampaignShowcaseFields />}
                          {selectedBlock.type === "schema_card" && <SchemaCardFields />}
                          {selectedBlock.type === "section" && <SectionFields />}
                          {selectedBlock.type === "anchor_nav" && <AnchorNavFields />}
                          {selectedBlock.type !== "section" &&
                            selectedBlock.type !== "column" &&
                            selectedBlock.type !== "anchor_nav" &&
                            selectedBlock.type !== "divider_spacer" && <QuickAnchorIdField />}

                          {selectedBlock.type === "column" && (
                            <div className="space-y-4">
                              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
                                <div className="text-[11px] font-bold text-foreground">
                                  Sütun Genişliği (Yüzdelik)
                                </div>

                                {/* Hızlı Yüzde Butonları */}
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Hızlı Genişlik Seçimi
                                  </label>
                                  <div className="grid grid-cols-4 gap-1">
                                    {([20, 25, 33, 50, 66, 75, 80, 100] as const).map((pct) => {
                                      const currentPct = Number(selectedBlock.props.widthPct ?? 50);
                                      const isActive = Math.round(currentPct) === pct;
                                      return (
                                        <button
                                          key={pct}
                                          type="button"
                                          onClick={() => updateSelectedBlockProps({ widthPct: pct })}
                                          className={`rounded py-1 text-xs font-bold transition ${
                                            isActive
                                              ? "bg-blue-600 text-white shadow-xs"
                                              : "border border-border bg-background text-muted-foreground hover:text-foreground"
                                          }`}
                                        >
                                          %{pct}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Genişlik Slider'ı */}
                                <div>
                                  <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>Genişlik Oranı</span>
                                    <span className="font-mono font-bold text-blue-600 text-xs">
                                      %{Number(selectedBlock.props.widthPct ?? 50)}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="1"
                                    value={Number(selectedBlock.props.widthPct ?? 50)}
                                    onChange={(e) =>
                                      updateSelectedBlockProps({ widthPct: Number(e.target.value) })
                                    }
                                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-border accent-blue-600"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

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

                              {/* Sütunların Genişlik Dağılımı */}
                              {(selectedBlock.children ?? []).length > 1 && (
                                <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-[11px] font-bold text-foreground">
                                      Sütun Genişlikleri Dağılımı
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const count = selectedBlock.children!.length;
                                        handleChangeColumnLayout(
                                          selectedBlock.id,
                                          count === 2 ? "6+6" : count === 3 ? "4+4+4" : "3+3+3+3"
                                        );
                                      }}
                                      className="text-[10px] text-blue-600 hover:underline font-semibold"
                                    >
                                      Eşit Dağıt
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {selectedBlock.children!.map((col, idx) => {
                                      const pct = Number(
                                        col.props?.widthPct ??
                                          Math.round(100 / selectedBlock.children!.length)
                                      );
                                      return (
                                        <div key={col.id} className="space-y-1">
                                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                            <span>{idx + 1}. Sütun</span>
                                            <span className="font-mono font-bold text-foreground">
                                              %{pct}
                                            </span>
                                          </div>
                                          <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                                            <div
                                              className="h-full bg-blue-600 rounded-full transition-all"
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
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
                              <div>
                                <label className="block text-[11px] font-semibold mb-1">Alt alta geçiş</label>
                                <select aria-label="Alt alta geçiş" value={String(selectedBlock.props.stackAt ?? "mobile")} onChange={(e) => updateSelectedBlockProps({ stackAt: e.target.value })} className="h-8 w-full rounded border border-border bg-background px-2">
                                  <option value="mobile">Mobilde (768px altı)</option>
                                  <option value="tablet">Tablette de (1024px altı)</option>
                                </select>
                              </div>
                              <label className="flex items-center gap-2 text-[11px]">
                                <input type="checkbox" checked={Boolean(selectedBlock.props.mobileReverse)} onChange={(e) => updateSelectedBlockProps({ mobileReverse: e.target.checked || undefined })} />
                                Alt alta geçince sütun sırasını tersine çevir
                              </label>
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
                              <div className="space-y-1.5">
                                <label className="block text-[11px] text-muted-foreground">
                                  Buton Simgesi & Yönü
                                </label>
                                <div className="grid grid-cols-[1fr_92px] gap-2">
                                  <IconPickerField
                                    value={String(selectedBlock.props.icon ?? "")}
                                    onChange={(next) =>
                                      updateSelectedBlockProps({ icon: next || undefined })
                                    }
                                    allowEmpty
                                    label="Düğme simgesi"
                                    placeholder="Simge seç…"
                                  />
                                  <select aria-label="Simge yönü" value={String(selectedBlock.props.iconSide ?? "right")} onChange={(e) => updateSelectedBlockProps({ iconSide: e.target.value })} className="h-8 rounded border border-border bg-background px-2 text-xs">
                                    <option value="right">Sağda</option>
                                    <option value="left">Solda</option>
                                  </select>
                                </div>
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
                            <div className="space-y-4">
                              {/* Medya Seçici Butonu */}
                              <button
                                type="button"
                                onClick={() => setMediaPickerTarget("block_image")}
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-500/20"
                              >
                                <ImageIcon className="h-4 w-4" />
                                <span>Medya Kütüphanesinden Görsel Seç</span>
                              </button>

                              {/* KADENCE STİLİ GÖRSEL ÖLÇEKLENDİRME & BOYUT */}
                              <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                                <div className="text-[11px] font-bold text-foreground">
                                  Görsel Ölçeklendirme & Boyut
                                </div>

                                {/* Hızlı Yüzde Butonları */}
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Hızlı Ölçek
                                  </label>
                                  <div className="grid grid-cols-4 gap-1">
                                    {(["25%", "50%", "75%", "100%"] as const).map((pct) => {
                                      const currentWidth = String(selectedBlock.props.width ?? "100%");
                                      const isActive = currentWidth === pct;
                                      return (
                                        <button
                                          key={pct}
                                          type="button"
                                          onClick={() => updateSelectedBlockProps({ width: pct })}
                                          className={`rounded py-1 text-xs font-bold transition ${
                                            isActive
                                              ? "bg-blue-600 text-white shadow-xs"
                                              : "border border-border bg-background text-muted-foreground hover:text-foreground"
                                          }`}
                                        >
                                          {pct}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Genişlik Slider'ı */}
                                <div>
                                  <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>Özel Genişlik</span>
                                    <span className="font-mono font-bold text-foreground">
                                      {String(selectedBlock.props.width ?? "100%")}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="5"
                                    value={
                                      String(selectedBlock.props.width ?? "100%").endsWith("%")
                                        ? parseInt(String(selectedBlock.props.width ?? "100%"), 10) || 100
                                        : 100
                                    }
                                    onChange={(e) =>
                                      updateSelectedBlockProps({ width: `${e.target.value}%` })
                                    }
                                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-border accent-blue-600"
                                  />
                                </div>

                                {/* Hizalama */}
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Hizalama
                                  </label>
                                  <div className="grid grid-cols-4 gap-1">
                                    {(
                                      [
                                        ["left", "Sol", AlignLeft],
                                        ["center", "Orta", AlignCenter],
                                        ["right", "Sağ", AlignRight],
                                        ["full", "Tam", Maximize2],
                                      ] as const
                                    ).map(([a, label, Icon]) => {
                                      const currentAlign = String(selectedBlock.props.align ?? "left");
                                      const isActive = currentAlign === a;
                                      return (
                                        <button
                                          key={a}
                                          type="button"
                                          onClick={() => {
                                            updateSelectedBlockProps({ align: a });
                                            if (a === "full") updateSelectedBlockProps({ width: "100%" });
                                          }}
                                          className={`flex items-center justify-center gap-1 rounded py-1 text-[11px] font-semibold transition ${
                                            isActive
                                              ? "bg-blue-600 text-white shadow-xs"
                                              : "border border-border bg-background text-muted-foreground hover:text-foreground"
                                          }`}
                                        >
                                          <Icon className="h-3 w-3" />
                                          <span>{label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* En-Boy Oranı (Aspect Ratio) */}
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    En-Boy Oranı (Aspect Ratio)
                                  </label>
                                  <select
                                    aria-label="En-boy oranı"
                                    value={String(selectedBlock.props.aspectRatio ?? "auto")}
                                    onChange={(e) =>
                                      updateSelectedBlockProps({ aspectRatio: e.target.value })
                                    }
                                    className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                                  >
                                    <option value="auto">Orijinal (Otomatik En-Boy)</option>
                                    <option value="1:1">1:1 (Kare Görsel)</option>
                                    <option value="4:3">4:3 (Standart Fotoğraf)</option>
                                    <option value="16:9">16:9 (Geniş Ekran Sinema)</option>
                                    <option value="3:2">3:2 (Klasik Kadraj)</option>
                                    <option value="21:9">21:9 (Ultra Geniş)</option>
                                    <option value="9:16">9:16 (Dikey Story / Reels)</option>
                                  </select>
                                </div>

                                {/* Nesne Sığdırma (Object Fit) */}
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Sığdırma Modu (Object Fit)
                                  </label>
                                  <select
                                    aria-label="Sığdırma modu"
                                    value={String(selectedBlock.props.objectFit ?? "cover")}
                                    onChange={(e) =>
                                      updateSelectedBlockProps({ objectFit: e.target.value })
                                    }
                                    className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                                  >
                                    <option value="cover">Alanı Doldur & Kırp (cover)</option>
                                    <option value="contain">Bozmadan Tam Sığdır (contain)</option>
                                    <option value="fill">Alana Yay / Uzat (fill)</option>
                                    <option value="scale-down">Gerekirse Küçült (scale-down)</option>
                                    <option value="none">Orijinal Boyut (none)</option>
                                  </select>
                                </div>

                                {/* Köşe Yuvarlama (Border Radius) */}
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Köşe Yuvarlama
                                  </label>
                                  <div className="grid grid-cols-5 gap-1">
                                    {(
                                      [
                                        ["none", "0"],
                                        ["sm", "Hafif"],
                                        ["md", "Orta"],
                                        ["lg", "Geniş"],
                                        ["full", "Oval"],
                                      ] as const
                                    ).map(([r, label]) => {
                                      const currentRadius = String(selectedBlock.props.borderRadius ?? "md");
                                      const isActive = currentRadius === r;
                                      return (
                                        <button
                                          key={r}
                                          type="button"
                                          onClick={() => updateSelectedBlockProps({ borderRadius: r })}
                                          className={`rounded py-1 text-[10px] font-semibold transition ${
                                            isActive
                                              ? "bg-blue-600 text-white shadow-xs"
                                              : "border border-border bg-background text-muted-foreground hover:text-foreground"
                                          }`}
                                        >
                                          {label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Gölge */}
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Gölge
                                  </label>
                                  <div className="grid grid-cols-4 gap-1">
                                    {(
                                      [
                                        ["none", "Yok"],
                                        ["sm", "Hafif"],
                                        ["md", "Orta"],
                                        ["lg", "Belirgin"],
                                      ] as const
                                    ).map(([sh, label]) => {
                                      const currentShadow = String(selectedBlock.props.shadow ?? "none");
                                      const isActive = currentShadow === sh;
                                      return (
                                        <button
                                          key={sh}
                                          type="button"
                                          onClick={() => updateSelectedBlockProps({ shadow: sh })}
                                          className={`rounded py-1 text-[10px] font-semibold transition ${
                                            isActive
                                              ? "bg-blue-600 text-white shadow-xs"
                                              : "border border-border bg-background text-muted-foreground hover:text-foreground"
                                          }`}
                                        >
                                          {label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Tıklama Bağlantısı (Link) */}
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Görsel Bağlantısı (URL)
                                  </label>
                                  <div className="relative">
                                    <Link2 className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                                    <input
                                      type="text"
                                      placeholder="https://... veya /sayfa"
                                      value={String(selectedBlock.props.link ?? "")}
                                      onChange={(e) =>
                                        updateSelectedBlockProps({ link: e.target.value })
                                      }
                                      className="h-8 w-full rounded border border-border bg-background pl-7 pr-2 text-xs"
                                    />
                                  </div>
                                  {Boolean(selectedBlock.props.link) && (
                                    <label className="mt-1.5 flex items-center gap-1.5 cursor-pointer text-[10px] text-muted-foreground">
                                      <input
                                        type="checkbox"
                                        checked={selectedBlock.props.linkTarget === "_blank"}
                                        onChange={(e) =>
                                          updateSelectedBlockProps({
                                            linkTarget: e.target.checked ? "_blank" : "_self",
                                          })
                                        }
                                        className="rounded border-border text-blue-600"
                                      />
                                      <span>Yeni sekmede aç</span>
                                    </label>
                                  )}
                                </div>
                              </div>

                              {/* SEO & METADATA ALANLARI */}
                              <div className="space-y-2.5 rounded-xl border border-border bg-muted/10 p-3">
                                <div className="text-[11px] font-bold text-foreground">
                                  Görsel SEO & Erişilebilirlik
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Görsel URL
                                  </label>
                                  <input
                                    aria-label="Görsel URL"
                                    type="text"
                                    value={String(selectedBlock.props.url ?? "")}
                                    onChange={(e) =>
                                      updateSelectedBlockProps({ url: e.target.value })
                                    }
                                    className="h-8 w-full rounded border border-border bg-background px-2 font-mono text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Alt Metni (Zorunlu Görsel SEO)
                                  </label>
                                  <input
                                    aria-label="Alt Metni (Zorunlu Görsel SEO)"
                                    type="text"
                                    value={String(selectedBlock.props.altText ?? "")}
                                    onChange={(e) =>
                                      updateSelectedBlockProps({
                                        altText: e.target.value,
                                      })
                                    }
                                    className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Başlık (title özniteliği)
                                  </label>
                                  <input
                                    aria-label="Görsel başlığı (title)"
                                    type="text"
                                    value={String(selectedBlock.props.titleText ?? "")}
                                    onChange={(e) =>
                                      updateSelectedBlockProps({ titleText: e.target.value })
                                    }
                                    className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] text-muted-foreground">
                                    Görsel Altı Açıklama (Figcaption)
                                  </label>
                                  <input
                                    aria-label="Görsel Altı Açıklama (Figcaption)"
                                    type="text"
                                    value={String(selectedBlock.props.caption ?? "")}
                                    onChange={(e) =>
                                      updateSelectedBlockProps({
                                        caption: e.target.value,
                                      })
                                    }
                                    className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                                  />
                                </div>
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
                          {selectedBlock.type === "tabs" && (
                            <div className="space-y-2.5 rounded-lg border border-border bg-muted/20 p-2.5">
                              <div>
                                <label className="block text-[11px] font-semibold mb-1">
                                  Sekme Çubuğu Görünümü
                                </label>
                                <select
                                  aria-label="Sekme Çubuğu Görünümü"
                                  value={String(selectedBlock.props.tabStyle ?? "pills")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({ tabStyle: e.target.value })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                                >
                                  <option value="pills">Kapsül Butonlar (Pills)</option>
                                  <option value="underline">Alt Çizgili (Underline)</option>
                                  <option value="boxed">Kutu Sekmeler (Boxed)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold mb-1">
                                  Sekme Hizalaması
                                </label>
                                <select
                                  aria-label="Sekme Hizalaması"
                                  value={String(selectedBlock.props.align ?? "left")}
                                  onChange={(e) =>
                                    updateSelectedBlockProps({ align: e.target.value })
                                  }
                                  className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                                >
                                  <option value="left">Sola Hizalı</option>
                                  <option value="center">Ortalı</option>
                                  <option value="stretch">Tam Genişlik (Eşit Dağıt)</option>
                                </select>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">
                                💡 Kanvas üzerinde sekmelere tıklayarak aktif sekmeyi değiştirebilir, her sekmenin içine doğrudan <strong>Satır / Sütun</strong>, <strong>Görsel</strong> veya istediğiniz bloğu ekleyebilirsiniz.
                              </p>
                            </div>
                          )}

                          {selectedBlock.type === "form_block" ? (
                            <CatalogFields block={selectedBlock} onChange={updateSelectedBlockProps} />
                          ) : DEDICATED_UI.has(selectedBlock.type) ? null : (
                            <SchemaFields type={selectedBlock.type} props={selectedBlock.props ?? {}} onChange={updateSelectedBlockProps} />
                          )}
                        </div>
  );
}
