import { CHOICE_FIELD_TYPES, CONTENT_FIELD_TYPES, field, type FormField, type FormFieldType } from "@nexpress/core";
import { AlignLeft, AtSign, Calendar, CheckSquare, CircleDot, Gauge, Heading, Hash, Link2, List, ListChecks, Minus, Phone, Star, Text, Type, type LucideIcon } from "lucide-react";

export interface FieldKind {
  type: FormFieldType;
  label: string;
  group: "Temel" | "Seçim" | "Değerlendirme" | "Düzen";
  icon: LucideIcon;
}

/** Kurucunun alan paleti. Yeni tür: `core/form-spec.ts` + `rsc-form.tsx` + buraya satır. */
export const FIELD_KINDS: FieldKind[] = [
  { type: "text", label: "Kısa metin", group: "Temel", icon: Type },
  { type: "textarea", label: "Uzun metin", group: "Temel", icon: AlignLeft },
  { type: "email", label: "E-posta", group: "Temel", icon: AtSign },
  { type: "tel", label: "Telefon", group: "Temel", icon: Phone },
  { type: "url", label: "Web adresi", group: "Temel", icon: Link2 },
  { type: "number", label: "Sayı", group: "Temel", icon: Hash },
  { type: "date", label: "Tarih", group: "Temel", icon: Calendar },
  { type: "select", label: "Açılır liste", group: "Seçim", icon: List },
  { type: "radio", label: "Tek seçim", group: "Seçim", icon: CircleDot },
  { type: "checkboxes", label: "Çoklu seçim", group: "Seçim", icon: ListChecks },
  { type: "checkbox", label: "Onay kutusu", group: "Seçim", icon: CheckSquare },
  { type: "rating", label: "Yıldız puanı", group: "Değerlendirme", icon: Star },
  { type: "scale", label: "0–10 ölçeği (NPS)", group: "Değerlendirme", icon: Gauge },
  { type: "heading", label: "Başlık", group: "Düzen", icon: Heading },
  { type: "paragraph", label: "Açıklama metni", group: "Düzen", icon: Text },
];

export const kindOf = (type: FormFieldType): FieldKind => FIELD_KINDS.find((k) => k.type === type) ?? FIELD_KINDS[0]!;
export const DividerIcon = Minus;

const TR = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" } as Record<string, string>;

/** Etiketten güvenli makine adı üretir (`ad_soyad`); `taken` ile çakışmaz. */
export function slugName(label: string, taken: Set<string>, fallback = "alan"): string {
  const base =
    label
      .toLocaleLowerCase("tr")
      .replace(/[çğıöşüâîû]/g, (c) => TR[c] ?? c)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/^[0-9_]+/, "")
      .slice(0, 30) || fallback;
  let name = base === "website" ? "alan_website" : base;
  for (let i = 2; taken.has(name); i++) name = `${base.slice(0, 34)}_${i}`;
  return name;
}

let counter = 0;
export const newId = () => `f_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Paletten yeni alan: türüne uygun etiket/seçenek varsayılanlarıyla. */
export function createField(type: FormFieldType, existing: FormField[]): FormField {
  const kind = kindOf(type);
  const taken = new Set(existing.map((f) => f.name));
  const label = type === "checkbox" ? "Koşulları kabul ediyorum" : kind.label;
  const extra: Partial<FormField> = CHOICE_FIELD_TYPES.has(type) ? { options: ["Seçenek 1", "Seçenek 2", "Seçenek 3"] } : {};
  return field(newId(), slugName(label, taken), label, type, false, extra);
}

export const isContent = (t: FormFieldType) => CONTENT_FIELD_TYPES.has(t);
export const hasOptions = (t: FormFieldType) => CHOICE_FIELD_TYPES.has(t);
/** Alan türü değiştirilebilir gruplar (içerik ve seçmeli türler kendi içinde) */
export function convertibleTypes(t: FormFieldType): FormFieldType[] {
  if (isContent(t)) return ["heading", "paragraph"];
  if (hasOptions(t)) return ["select", "radio", "checkboxes"];
  return ["text", "textarea", "email", "tel", "url", "number", "date"].includes(t) ? ["text", "textarea", "email", "tel", "url", "number", "date"] as FormFieldType[] : [t];
}
