/** Ziyaretçi formları: eski satır içi alan tanımı, spam sezgisi, CSV. Alan modeli ve doğrulama `form-spec.ts`tedir. */
import { DEFAULT_FORM_FIELDS, normalizeFields, type FormField } from "./form-spec";

/** Eski `form_block` `props.fields` biçimi (satır içi) için: güvenli alan listesi, boşsa varsayılan alanlar. */
export function resolveFormFields(raw: unknown): FormField[] {
  return normalizeFields(raw, DEFAULT_FORM_FIELDS);
}

/** Basit spam sezgisi: çok bağlantı veya BBCode bağlantısı. Gerçek gönderimi reddetmez, "spam" olarak işaretlenir. */
export function spamReasons(values: Array<{ value: string }>): string[] {
  const text = values.map((v) => v.value).join("\n");
  const reasons: string[] = [];
  const links = (text.match(/https?:\/\/|www\./gi) ?? []).length;
  if (links > 2) reasons.push(`${links} bağlantı`);
  if (/\[url=|<a\s+href/i.test(text)) reasons.push("bağlantı işaretlemesi");
  return reasons;
}

/** CSV hücresi: tırnaklar çiftlenir; formül enjeksiyonuna (=,+,-,@,sekme) karşı başa `'` konur. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: string[][]): string {
  return `﻿${rows.map((r) => r.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

/** Blok ağacındaki `form_block` bloklarının bağlı olduğu form kimlikleri (`props.formId`). */
export function collectFormIds(blocks: Array<{ type: string; props?: unknown; children?: unknown }>, into: Set<string> = new Set()): Set<string> {
  for (const b of blocks) {
    const id = b.type === "form_block" ? (b.props as { formId?: unknown } | undefined)?.formId : undefined;
    if (typeof id === "string" && /^frm_[a-z0-9]{3,40}$/.test(id)) into.add(id);
    if (Array.isArray(b.children)) collectFormIds(b.children as never, into);
  }
  return into;
}
