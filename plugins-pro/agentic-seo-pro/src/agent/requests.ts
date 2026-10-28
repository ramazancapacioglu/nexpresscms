/** Ajan taleplerinin (lead / destek / demo) girdi doğrulaması (saf mantık). */
export type AgentKind = "lead" | "ticket" | "demo";

export interface ValidRequest {
  kind: AgentKind;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  productSlug: string;
  agent: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s().-]{5,24}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,119}$/;

const text = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "";

export const KIND_LABEL: Record<AgentKind, string> = { lead: "Teklif talebi", ticket: "Destek talebi", demo: "Demo randevusu" };

/** Eksik/biçimsiz alanda `error` döner; ajan hatayı okuyup düzeltebilsin diye alan adını söyler. */
export function validateAgentRequest(kind: AgentKind, args: Record<string, unknown>): { ok: true; value: ValidRequest } | { ok: false; error: string } {
  const name = text(args.name ?? args.companyName, 120);
  const email = text(args.email ?? args.contactEmail, 160).toLowerCase();
  const phone = text(args.phone, 30);
  const company = text(args.company ?? args.companyName, 160);
  const message = text(args.message ?? args.subject ?? args.preferredTime, 2000);
  const productSlug = text(args.productSlug ?? args.requestedProductSlug, 120).toLowerCase();
  const agent = text(args.agentName, 60);

  if (!name && !company) return { ok: false, error: "name (veya companyName) gerekli." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "email geçerli bir e-posta olmalı." };
  if (phone && !PHONE_RE.test(phone)) return { ok: false, error: "phone geçersiz biçimde." };
  if (productSlug && !SLUG_RE.test(productSlug)) return { ok: false, error: "productSlug geçersiz biçimde." };
  if (kind === "ticket" && message.length < 10) return { ok: false, error: "message en az 10 karakter olmalı." };
  if (kind === "demo" && !phone && !email) return { ok: false, error: "phone veya email gerekli." };
  return { ok: true, value: { kind, name: name || company, email, phone, company, message, productSlug, agent } };
}
