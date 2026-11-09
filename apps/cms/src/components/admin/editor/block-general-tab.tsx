"use client";

import { AiComposePanel } from "./ai-compose-panel";
import { AnchorNavFields } from "./anchor-nav-fields";
import { CatalogFields } from "./catalog-fields";
import { DynamicListFields } from "./dynamic-list-fields";
import { IconPickerField } from "./icon-picker-modal";
import { SchemaFields } from "./schema-fields";
import { SectionFields } from "./section-fields";
import { SchemaCardFields } from "./schema-card-fields";
import { CampaignShowcaseFields } from "./campaign-showcase-fields";
import { BlockWidthField } from "./block-width-field";
import { BlockGeneralImageAndMediaFields } from "./block-general-image-fields";
import { COLUMN_LAYOUT_PRESETS } from "./studio-model";
import { useStudioInspector } from "./studio-inspector-context";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

/** Kendi özel alan arayüzü olan (veya düzenlenecek alanı olmayan) bloklar; kalan her blok şema tabanlı alanlarla düzenlenir. */
const DEDICATED_UI = new Set([
  "section",
  "columns",
  "column",
  "paragraph",
  "heading",
  "paragraph_element",
  "heading_element",
  "text_div",
  "quote",
  "tldr_box",
  "divider_spacer",
  "media_file",
  "dynamic_list",
  "schema_card",
  "image_figure",
  "hero",
  "button_element",
  "list_element",
  "anchor_nav",
  "campaign_showcase",
]);

export function BlockGeneralTab() {
  const {
    selectedBlock,
    updateSelectedBlockProps,
    updateSelectedBlockStyle,
    handleChangeColumnLayout,
    convertTextBlock,
  } = useStudioInspector();

  if (!selectedBlock) return null;

  const isConvertibleText =
    selectedBlock.type === "paragraph" ||
    selectedBlock.type === "heading" ||
    selectedBlock.type === "paragraph_element" ||
    selectedBlock.type === "heading_element" ||
    selectedBlock.type === "text_div";

  const isProseOrAiBlock =
    isConvertibleText ||
    selectedBlock.type === "quote" ||
    selectedBlock.type === "tldr_box";

  const currentTag =
    selectedBlock.type === "heading" ||
    selectedBlock.type === "heading_element"
      ? (`h${Number(selectedBlock.props.level ?? 2)}` as
          | "h1"
          | "h2"
          | "h3"
          | "h4")
      : selectedBlock.type === "text_div"
        ? "div"
        : "p";

  const currentAlign = String(
    selectedBlock.props.align ?? selectedBlock.style?.textAlign ?? "left"
  );

  return (
    <div className="space-y-3">
      <BlockWidthField />

      {/* Metin Blokları: Birleşik HTML Etiketi, Hizalama ve AI Yaz/Düzenle */}
      {isProseOrAiBlock && (
        <div className="space-y-3">
          {isConvertibleText && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">
                  Metin Etiketi & Başlık Seviyesi
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {(
                    [
                      ["p", "P"],
                      ["h1", "H1"],
                      ["h2", "H2"],
                      ["h3", "H3"],
                      ["h4", "H4"],
                      ["div", "Div"],
                    ] as const
                  ).map(([tag, label]) => {
                    const active = currentTag === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (tag === "p") {
                            convertTextBlock(selectedBlock.id, "paragraph");
                          } else if (tag === "div") {
                            convertTextBlock(selectedBlock.id, "div");
                          } else {
                            const lvl = Number(tag.slice(1));
                            if (
                              selectedBlock.type === "heading" ||
                              selectedBlock.type === "heading_element"
                            ) {
                              updateSelectedBlockProps({ level: lvl });
                            } else {
                              convertTextBlock(
                                selectedBlock.id,
                                "heading",
                                lvl
                              );
                            }
                          }
                        }}
                        className={`rounded py-1 text-[11px] font-bold transition ${
                          active
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

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">
                  Metin Hizalaması
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      ["left", "Sol", AlignLeft],
                      ["center", "Orta", AlignCenter],
                      ["right", "Sağ", AlignRight],
                    ] as const
                  ).map(([a, label, Icon]) => {
                    const active = currentAlign === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          updateSelectedBlockProps({ align: a });
                          updateSelectedBlockStyle({ textAlign: a });
                        }}
                        className={`flex items-center justify-center gap-1 rounded py-1 text-[11px] font-semibold transition ${
                          active
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
            </div>
          )}

          <AiComposePanel />
        </div>
      )}

      {selectedBlock.type === "dynamic_list" && <DynamicListFields />}
      {selectedBlock.type === "campaign_showcase" && <CampaignShowcaseFields />}
      {selectedBlock.type === "schema_card" && <SchemaCardFields />}
      {selectedBlock.type === "section" && <SectionFields />}
      {selectedBlock.type === "anchor_nav" && <AnchorNavFields />}
      {(selectedBlock.type === "media_file" ||
        selectedBlock.type === "image_figure") && (
        <BlockGeneralImageAndMediaFields />
      )}

      {selectedBlock.type === "column" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
            <div className="text-[11px] font-bold text-foreground">
              Sütun Genişliği (Yüzdelik)
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">
                Hızlı Genişlik Seçimi
              </label>
              <div className="grid grid-cols-4 gap-1">
                {([20, 25, 33, 50, 66, 75, 80, 100] as const).map((pct) => {
                  const currentPct = Number(
                    selectedBlock.props.widthPct ?? 50
                  );
                  const isActive = Math.round(currentPct) === pct;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        updateSelectedBlockProps({ widthPct: pct })
                      }
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
                    handleChangeColumnLayout(selectedBlock.id, pr.id)
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
                      count === 2
                        ? "6+6"
                        : count === 3
                          ? "4+4+4"
                          : "3+3+3+3"
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
            <select
              aria-label="Sütunlar Arası Boşluk (Gap)"
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
            <select
              aria-label="Dikey Hizalama"
              value={String(selectedBlock.props.verticalAlign ?? "stretch")}
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
            <label className="block text-[11px] font-semibold mb-1">
              Alt alta geçiş
            </label>
            <select
              aria-label="Alt alta geçiş"
              value={String(selectedBlock.props.stackAt ?? "mobile")}
              onChange={(e) =>
                updateSelectedBlockProps({ stackAt: e.target.value })
              }
              className="h-8 w-full rounded border border-border bg-background px-2"
            >
              <option value="mobile">Mobilde (768px altı)</option>
              <option value="tablet">Tablette de (1024px altı)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-[11px]">
            <input
              type="checkbox"
              checked={Boolean(selectedBlock.props.mobileReverse)}
              onChange={(e) =>
                updateSelectedBlockProps({
                  mobileReverse: e.target.checked || undefined,
                })
              }
            />
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
            <input
              aria-label="Üst Rozet (Badge)"
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
            <input
              aria-label="Ana Başlık"
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
            <textarea
              aria-label="Alt Açıklama"
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
              value={String(selectedBlock.props.primaryCtaLabel ?? "")}
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
              value={String(selectedBlock.props.primaryCtaHref ?? "")}
              onChange={(e) =>
                updateSelectedBlockProps({
                  primaryCtaHref: e.target.value,
                })
              }
              placeholder="Hedef URL"
              className="h-8 rounded border border-border bg-background px-2 font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="İkincil buton yazısı"
              type="text"
              value={String(selectedBlock.props.secondaryCtaLabel ?? "")}
              onChange={(e) =>
                updateSelectedBlockProps({
                  secondaryCtaLabel: e.target.value || undefined,
                })
              }
              placeholder="İkincil Buton"
              className="h-8 rounded border border-border bg-background px-2"
            />
            <input
              aria-label="İkincil buton adresi"
              type="text"
              value={String(selectedBlock.props.secondaryCtaHref ?? "")}
              onChange={(e) =>
                updateSelectedBlockProps({
                  secondaryCtaHref: e.target.value || undefined,
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
            <input
              aria-label="Buton Etiketi"
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
            <input
              aria-label="Hedef Link (Href)"
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
              <select
                aria-label="Simge yönü"
                value={String(selectedBlock.props.iconSide ?? "right")}
                onChange={(e) =>
                  updateSelectedBlockProps({ iconSide: e.target.value })
                }
                className="h-8 rounded border border-border bg-background px-2 text-xs"
              >
                <option value="right">Sağda</option>
                <option value="left">Solda</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={String(selectedBlock.props.styleVariant ?? "primary")}
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

      {selectedBlock.type === "list_element" && (
        <div className="space-y-2.5">
          <label className="block text-[11px] font-semibold">Liste Tipi</label>
          <select
            aria-label="Liste Tipi"
            value={String(selectedBlock.props.listType ?? "check")}
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
          <textarea
            aria-label="Maddeler (Her satıra 1 madde)"
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

      {(selectedBlock.type === "accordion" ||
        selectedBlock.type === "faq_accordion") && (
        <div className="space-y-2.5 rounded-lg border border-border bg-muted/20 p-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1">
              Akordeon Görünümü
            </label>
            <select
              aria-label="Akordeon Görünümü"
              value={String(
                selectedBlock.props.accordionStyle ??
                  (selectedBlock.type === "faq_accordion" ? "" : "classic")
              )}
              onChange={(e) =>
                updateSelectedBlockProps({ accordionStyle: e.target.value })
              }
              className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
            >
              {selectedBlock.type === "faq_accordion" ? (
                <option value="">Varsayılan</option>
              ) : null}
              <option value="classic">Klasik (kutulu)</option>
              <option value="cards">Gölgeli Kartlar</option>
              <option value="flush">Çizgili (sade)</option>
              <option value="filled">Dolgulu</option>
              <option value="accent">Sol Vurgulu</option>
              <option value="numbered">Numaralı</option>
              <option value="pills">Kapsül Başlık</option>
              <option value="bold">Büyük Başlık</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">
              Simge
            </label>
            <select
              aria-label="Akordeon simgesi"
              value={String(selectedBlock.props.icon ?? "chevron")}
              onChange={(e) =>
                updateSelectedBlockProps({ icon: e.target.value })
              }
              className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
            >
              <option value="chevron">Ok</option>
              <option value="plus">Artı / eksi</option>
              <option value="none">Yok</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">
              Açılışta
            </label>
            <select
              aria-label="Akordeon açılış durumu"
              value={String(
                selectedBlock.props.openMode ??
                  (selectedBlock.props.openFirst === false ? "none" : "first")
              )}
              onChange={(e) =>
                updateSelectedBlockProps({ openMode: e.target.value })
              }
              className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
            >
              <option value="first">İlk madde açık</option>
              <option value="none">Hepsi kapalı</option>
              <option value="all">Hepsi açık</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-[11px] font-semibold">
            <input
              type="checkbox"
              checked={selectedBlock.props.exclusive === true}
              onChange={(e) =>
                updateSelectedBlockProps({ exclusive: e.target.checked })
              }
            />
            Biri açılınca diğerleri kapansın
          </label>
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
              <option value="segmented">Segment (iOS tipi)</option>
              <option value="vertical">Dikey (yan menü)</option>
              <option value="cards">Kart Sekmeler</option>
              <option value="steps">Numaralı Adımlar</option>
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
            💡 Kanvas üzerinde sekmelere tıklayarak aktif sekmeyi
            değiştirebilir, her sekmenin içine doğrudan{" "}
            <strong>Satır / Sütun</strong>, <strong>Görsel</strong> veya
            istediğiniz bloğu ekleyebilirsiniz.
          </p>
        </div>
      )}

      {selectedBlock.type === "form_block" ? (
        <CatalogFields
          block={selectedBlock}
          onChange={updateSelectedBlockProps}
        />
      ) : DEDICATED_UI.has(selectedBlock.type) ? null : (
        <SchemaFields
          type={selectedBlock.type}
          props={selectedBlock.props ?? {}}
          onChange={updateSelectedBlockProps}
        />
      )}
    </div>
  );
}
