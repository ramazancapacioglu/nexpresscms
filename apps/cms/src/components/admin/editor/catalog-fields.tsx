"use client";

import type { BlockNode } from "@nexpress/core";
import { FormBlockPicker } from "./form-block-picker";

const CATALOG_TYPES = new Set([
  "info_box",
  "icon_list",
  "tabs",
  "accordion",
  "toc",
  "show_more",
  "button_row",
  "gallery",
  "image_overlay",
  "video_popup",
  "slider",
  "countdown",
  "progress_bar",
  "form_block",
  "data_table",
  "map_embed",
  "search_box",
  "post_grid",
  "modal_panel",
  "split_content",
  "portfolio_grid",
  "product_row",
  "user_card",
  "repeater",
  "vector_mark",
  "single_icon",
  "countup",
  "marquee",
  "shape_divider",
]);

const LABELS: Record<string, string> = {
  title: "Başlık",
  text: "Metin",
  subtitle: "Alt metin",
  summary: "Özet",
  body: "Gövde",
  kicker: "Üst etiket",
  label: "Etiket",
  href: "Bağlantı",
  linkLabel: "Bağlantı yazısı",
  url: "Adres",
  image: "Görsel adresi",
  alt: "Alt metin",
  trigger: "Tetik metni",
  placeholder: "Yer tutucu",
  submitLabel: "Gönder yazısı",
  action: "Form adresi",
  targetDate: "Hedef tarih",
  query: "Konum",
  name: "Ad",
  role: "Görev",
  since: "Katılım",
  value: "Değer",
};

function itemLine(item: unknown): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";
  const record = item as Record<string, unknown>;
  const headKey = ["title", "label", "name", "question", "alt"].find((key) => key in record) ?? "title";
  const tailKey =
    ["text", "body", "description", "excerpt", "answer", "href", "url", "value", "price"].find(
      (key) => key in record && key !== headKey
    ) ?? "text";
  const head = String(record[headKey] ?? "");
  const tail = String(record[tailKey] ?? "");
  return tail ? `${head} | ${tail}` : head;
}

function parseItems(raw: string, sample: unknown): unknown[] {
  const record = sample && typeof sample === "object" ? (sample as Record<string, unknown>) : null;
  const headKey = record
    ? ["title", "label", "name", "question", "alt"].find((key) => key in record) ?? "title"
    : "title";
  const tailKey = record
    ? ["text", "body", "description", "excerpt", "answer", "href", "url", "value", "price"].find(
        (key) => key in record && key !== headKey
      ) ?? "text"
    : "text";
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (!record) return line;
      const [head, ...rest] = line.split("|");
      return { [headKey]: head.trim(), [tailKey]: rest.join("|").trim() };
    });
}

export function CatalogFields({
  block,
  onChange,
}: {
  block: BlockNode;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  if (!CATALOG_TYPES.has(block.type)) return null;
  const props = block.props ?? {};
  const bound = block.type === "form_block" && typeof props.formId === "string" && props.formId !== "";
  const scalars = Object.entries(props).filter(
    ([key, value]) =>
      (typeof value === "string" || typeof value === "number" || typeof value === "boolean") &&
      key !== "formId" &&
      !(bound && (key === "action" || key === "submitLabel")) // bağlı formda düğme metni ve adres kurucudan gelir
  );
  const listKey = bound ? undefined : (["items", "slides", "buttons", "fields"] as const).find((key) => Array.isArray(props[key]));
  const list = listKey ? (props[listKey] as unknown[]) : null;

  return (
    <div className="space-y-2">
      {block.type === "form_block" ? <FormBlockPicker value={typeof props.formId === "string" ? props.formId : ""} onChange={(formId) => onChange({ formId })} /> : null}
      {scalars.map(([key, value]) => (
        <label key={key} className="block space-y-1">
          <span className="text-[11px] font-semibold">{LABELS[key] ?? key}</span>
          <input
            value={String(value)}
            onChange={(event) => {
              const next = event.target.value;
              onChange({
                [key]: typeof value === "number" ? Number(next) : key === "reverse" ? next === "true" : next,
              });
            }}
            className="h-8 w-full rounded border border-border bg-background px-2"
          />
        </label>
      ))}
      {listKey && list ? (
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold">Öğeler (satır: başlık | açıklama)</span>
          <textarea
            rows={5}
            value={list.map(itemLine).join("\n")}
            onChange={(event) => onChange({ [listKey]: parseItems(event.target.value, list[0]) })}
            className="w-full rounded border border-border bg-background p-2"
          />
        </label>
      ) : null}
    </div>
  );
}
