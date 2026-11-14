/**
 * RFC 9116 `security.txt`. İletişim adresi yoksa belge üretilmez (404); uydurma adres yazılmaz.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `mailto:` ya da `https://` iletişim adresi. Düz e-posta `mailto:` olur. Geçersizse `null`. */
export function normalizeSecurityContact(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  if (!value || value.length > 200) return null;
  if (/^mailto:/i.test(value)) {
    const email = value.slice(7);
    return EMAIL.test(email) ? `mailto:${email}` : null;
  }
  if (/^https:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.username || url.password) return null;
      return url.toString();
    } catch {
      return null;
    }
  }
  return EMAIL.test(value) ? `mailto:${value}` : null;
}

export interface SecurityTxtInput {
  /** Ortam (`SECURITY_CONTACT`) ya da site iletişim e-postası. */
  contact: string | undefined | null;
  /** Belgenin kendi adresi. */
  canonical: string;
  expires: Date;
  languages?: string;
}

/** Geçerli iletişim yoksa `null`. */
export function buildSecurityTxt(input: SecurityTxtInput): string | null {
  const contact = normalizeSecurityContact(input.contact);
  if (!contact || Number.isNaN(input.expires.getTime())) return null;
  let canonical: string;
  try {
    const url = new URL(input.canonical.trim());
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) return null;
    canonical = url.toString();
  } catch {
    return null;
  }
  const languages = (input.languages ?? "tr, en").replace(/[^\w,\- ]/g, "").trim() || "tr, en";
  const expires = input.expires.toISOString().replace(/\.\d{3}Z$/, "Z");
  return `Contact: ${contact}\nExpires: ${expires}\nCanonical: ${canonical}\nPreferred-Languages: ${languages}\n`;
}
