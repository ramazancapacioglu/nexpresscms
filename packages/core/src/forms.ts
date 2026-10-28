/** Ziyaretçi formları (saf mantık): alan tanımı, doğrulama, spam sezgisi, CSV. Sunucu tanımı kaynaktır; istemciye güvenilmez. */
export type FormFieldType = "text" | "email" | "textarea" | "tel" | "number";

export interface FormFieldDef {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
}

export const FORM_LIMITS = { maxFields: 20, text: 500, textarea: 5000, totalBytes: 20_000 } as const;
const NAME_RE = /^[a-z][a-z0-9_]{0,39}$/;
const TYPES = new Set<FormFieldType>(["text", "email", "textarea", "tel", "number"]);

export const DEFAULT_FORM_FIELDS: FormFieldDef[] = [
  { name: "ad", label: "Ad soyad", type: "text", required: true },
  { name: "eposta", label: "E-posta", type: "email", required: true },
  { name: "mesaj", label: "Mesaj", type: "textarea", required: true },
];

/** Blok `props.fields`ından güvenli alan tanımı üretir; bozuk/yinelenen adlar atılır, boşsa varsayılan alanlar. */
export function resolveFormFields(raw: unknown): FormFieldDef[] {
  if (!Array.isArray(raw)) return DEFAULT_FORM_FIELDS;
  const seen = new Set<string>();
  const out: FormFieldDef[] = [];
  raw.slice(0, FORM_LIMITS.maxFields).forEach((f, i) => {
    const o = (f && typeof f === "object" ? f : {}) as Record<string, unknown>;
    const name = typeof o.name === "string" && NAME_RE.test(o.name) ? o.name : `alan_${i}`;
    if (seen.has(name)) return;
    seen.add(name);
    const type = TYPES.has(o.type as FormFieldType) ? (o.type as FormFieldType) : "text";
    const label = typeof o.label === "string" && o.label.trim() ? o.label.trim().slice(0, 80) : name;
    out.push({ name, label, type, required: o.required === true });
  });
  return out.length > 0 ? out : DEFAULT_FORM_FIELDS;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL_RE = /^[+\d][\d\s().-]{5,24}$/;
const clean = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim();

export type SubmissionResult =
  | { ok: true; values: Array<{ name: string; label: string; value: string }> }
  | { ok: false; errors: Record<string, string> };

/** Yalnızca tanımlı alanlar okunur (fazlalık yok sayılır); tür, zorunluluk ve uzunluk denetlenir. */
export function validateSubmission(defs: FormFieldDef[], raw: Record<string, unknown>): SubmissionResult {
  const errors: Record<string, string> = {};
  const values: Array<{ name: string; label: string; value: string }> = [];
  let bytes = 0;
  for (const d of defs) {
    const v = clean(typeof raw[d.name] === "string" ? (raw[d.name] as string) : "");
    bytes += v.length;
    if (!v) {
      if (d.required) errors[d.name] = "Zorunlu alan.";
      continue;
    }
    const max = d.type === "textarea" ? FORM_LIMITS.textarea : FORM_LIMITS.text;
    if (v.length > max) errors[d.name] = `En çok ${max} karakter.`;
    else if (d.type === "email" && !EMAIL_RE.test(v)) errors[d.name] = "Geçerli bir e-posta girin.";
    else if (d.type === "tel" && !TEL_RE.test(v)) errors[d.name] = "Geçerli bir telefon girin.";
    else if (d.type === "number" && !Number.isFinite(Number(v))) errors[d.name] = "Sayı girin.";
    else values.push({ name: d.name, label: d.label, value: v });
  }
  if (bytes > FORM_LIMITS.totalBytes) errors._total = "Gönderim çok büyük.";
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values };
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
