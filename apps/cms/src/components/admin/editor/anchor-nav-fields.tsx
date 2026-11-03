"use client";

import type { BlockNode } from "@nexpress/core";
import { ArrowDown, ArrowUp, Link2, Plus, Sparkles, Trash2 } from "lucide-react";
import { IconPickerField } from "./icon-picker-modal";
import { ANCHOR_ID_PRESETS } from "./section-fields";
import { BLOCK_TYPE_LABELS } from "./studio-model";
import { useStudioInspector } from "./studio-inspector-context";

interface AnchorItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
}

function slugifyAnchor(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function extractBlockHeading(block: BlockNode): string {
  const p = block.props ?? {};
  if (typeof p.title === "string" && p.title.trim()) return p.title.trim();
  if (typeof p.text === "string" && (block.type === "heading" || block.type === "heading_element") && p.text.trim()) {
    return p.text.trim();
  }
  for (const child of block.children ?? []) {
    const found = extractBlockHeading(child);
    if (found) return found;
  }
  return BLOCK_TYPE_LABELS[block.type] ?? block.type;
}

export function AnchorNavFields() {
  const { selectedBlock, blocks, setBlocks, updateSelectedBlockProps } = useStudioInspector();
  if (!selectedBlock || selectedBlock.type !== "anchor_nav") return null;

  const p = selectedBlock.props ?? {};
  const items: AnchorItem[] = Array.isArray(p.items)
    ? p.items.map((it) => {
        const rec = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
        return {
          label: String(rec.label ?? "Bölüm"),
          href: String(rec.href ?? "#genel-bakis"),
          icon: typeof rec.icon === "string" ? rec.icon : undefined,
          badge: typeof rec.badge === "string" ? rec.badge : undefined,
        };
      })
    : [];

  const updateItems = (next: AnchorItem[]) => {
    updateSelectedBlockProps({ items: next });
  };

  const handleAutoPopulateFromPage = () => {
    const generatedItems: AnchorItem[] = [];
    const usedIds = new Set<string>();

    const nextBlocks = blocks.map((blk, idx) => {
      if (blk.id === selectedBlock.id || blk.type === "hero" || blk.type === "anchor_nav" || blk.type === "divider_spacer") {
        return blk;
      }
      const heading = extractBlockHeading(blk);
      const existingAnchor = blk.style?.anchorId?.trim();
      let anchor = existingAnchor || slugifyAnchor(heading) || `bolum-${idx + 1}`;
      if (usedIds.has(anchor)) {
        anchor = `${anchor}-${idx + 1}`;
      }
      usedIds.add(anchor);

      generatedItems.push({
        label: heading.length > 32 ? `${heading.slice(0, 30)}…` : heading,
        href: `#${anchor}`,
        icon:
          blk.type === "faq_accordion"
            ? "help-circle"
            : blk.type === "comparison_table" || blk.type === "pricing_table"
              ? "bar-chart"
              : blk.type === "testimonial_grid"
                ? "award"
                : blk.type === "form_block"
                  ? "send"
                  : "sparkles",
      });

      if (existingAnchor === anchor) return blk;
      return {
        ...blk,
        style: {
          ...(blk.style ?? {}),
          anchorId: anchor,
        },
      };
    });

    if (generatedItems.length > 0) {
      const updatedWithNav = nextBlocks.map((b) =>
        b.id === selectedBlock.id
          ? { ...b, props: { ...b.props, items: generatedItems } }
          : b
      );
      setBlocks(updatedWithNav, true);
    }
  };

  // Sayfadaki mevcut #anchorId'li blokları bul
  const pageAnchors = blocks
    .filter((b) => b.id !== selectedBlock.id && b.style?.anchorId?.trim())
    .map((b) => ({
      id: b.style!.anchorId!.trim(),
      label: extractBlockHeading(b),
    }));

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-foreground">
            Yapışkan HTML Çapa Gezgini
          </span>
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
            0-KB Saf CSS
          </span>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Sayfa aşağı kaydırıldığında üstte sabit kalır ve tıklandığında ilgili{" "}
          <code className="font-mono font-bold text-foreground">#çapa-id</code> bölümüne yumuşak kaydırma yapar.
        </p>
        <button
          type="button"
          onClick={handleAutoPopulateFromPage}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-blue-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Sayfadaki Bölümlerden Çapaları Otomatik Oluştur</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold">Sol Başlık (Opsiyonel)</label>
          <input
            type="text"
            value={String(p.title ?? "")}
            placeholder="Bölümler"
            onChange={(e) => updateSelectedBlockProps({ title: e.target.value })}
            className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold">Sekme Görünümü</label>
          <select
            value={String(p.styleVariant ?? "underline")}
            onChange={(e) => updateSelectedBlockProps({ styleVariant: e.target.value })}
            className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
          >
            <option value="underline">Alt Çizgili (Kurumsal)</option>
            <option value="pills">Kapsül Sekmeler (Pills)</option>
            <option value="boxed">Çerçeveli Kutu (Boxed)</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 rounded border border-border bg-muted/30 px-2.5 py-1.5 text-[11px] font-medium">
        <input
          type="checkbox"
          checked={p.sticky !== false}
          onChange={(e) => updateSelectedBlockProps({ sticky: e.target.checked })}
        />
        <span>Kaydırırken ekranın üstünde yapışkan (sticky) kalsın</span>
      </label>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-2.5">
        <div className="col-span-2 text-[11px] font-semibold">Sağ Aksiyon Butonu (Opsiyonel)</div>
        <input
          type="text"
          value={String(p.ctaLabel ?? "")}
          placeholder="Teklif İste"
          onChange={(e) => updateSelectedBlockProps({ ctaLabel: e.target.value })}
          className="h-8 rounded border border-border bg-background px-2 text-xs"
        />
        <input
          type="text"
          value={String(p.ctaHref ?? "")}
          placeholder="#teklif-formu"
          onChange={(e) => updateSelectedBlockProps({ ctaHref: e.target.value })}
          className="h-8 rounded border border-border bg-background px-2 font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold">Çapa Bağlantıları ({items.length})</span>
          <button
            type="button"
            onClick={() =>
              updateItems([
                ...items,
                {
                  label: `Bölüm ${items.length + 1}`,
                  href: `#bolum-${items.length + 1}`,
                  icon: "sparkles",
                },
              ])
            }
            className="inline-flex items-center gap-1 rounded border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-500/20"
          >
            <Plus className="h-3 w-3" />
            <span>Çapa Ekle</span>
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="space-y-2 rounded-lg border border-border bg-card p-2.5 shadow-2xs">
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-bold text-muted-foreground">
                  #{idx + 1} • {item.href}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const next = [...items];
                      [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
                      updateItems(next);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    title="Yukarı taşı"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => {
                      const next = [...items];
                      [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
                      updateItems(next);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    title="Aşağı taşı"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateItems(items.filter((_, i) => i !== idx))}
                    className="rounded p-1 text-red-500 hover:bg-red-500/10"
                    title="Sil"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted-foreground">Sekme Adı</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, label: e.target.value };
                      updateItems(next);
                    }}
                    className="h-7 w-full rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted-foreground">Hedef Çapa (#id)</label>
                  <div className="flex items-center rounded border border-border bg-background px-1.5">
                    <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const formatted = raw.startsWith("#") || raw.startsWith("/") || raw.startsWith("http") ? raw : `#${raw}`;
                        const next = [...items];
                        next[idx] = { ...item, href: formatted };
                        updateItems(next);
                      }}
                      className="h-7 w-full bg-transparent px-1 font-mono text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_96px] gap-1.5">
                <IconPickerField
                  value={item.icon ?? ""}
                  onChange={(icon) => {
                    const next = [...items];
                    next[idx] = { ...item, icon: icon || undefined };
                    updateItems(next);
                  }}
                  allowEmpty
                  label="Sekme Simgesi"
                  placeholder="Simge seç…"
                />
                <div>
                  <input
                    type="text"
                    value={item.badge ?? ""}
                    placeholder="Rozet (Yeni)"
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, badge: e.target.value || undefined };
                      updateItems(next);
                    }}
                    className="h-8 w-full rounded border border-border bg-background px-2 text-[11px]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1 pt-0.5">
                {(pageAnchors.length > 0 ? pageAnchors : ANCHOR_ID_PRESETS).map((preset) => {
                  const targetHref = `#${preset.id}`;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        const next = [...items];
                        next[idx] = {
                          ...item,
                          href: targetHref,
                          label: item.label.startsWith("Bölüm ") ? preset.label : item.label,
                        };
                        updateItems(next);
                      }}
                      className={`rounded px-1.5 py-0.5 font-mono text-[9px] transition ${
                        item.href === targetHref
                          ? "bg-blue-600 font-bold text-white"
                          : "border border-border bg-muted/40 text-muted-foreground hover:border-blue-500 hover:text-foreground"
                      }`}
                    >
                      {targetHref}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

