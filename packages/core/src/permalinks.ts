/** WordPress kalıcı bağlantı yapıları. `postname` bu uygulamanın varsayılan `/{slug}` adresidir. */
export const PERMALINK_STRUCTURES = ["postname", "plain", "dayname", "monthname", "numeric"] as const;

export type PermalinkStructure = (typeof PERMALINK_STRUCTURES)[number];

export function sanitizePermalinkStructure(value: unknown): PermalinkStructure {
  return PERMALINK_STRUCTURES.includes(value as PermalinkStructure) ? (value as PermalinkStructure) : "postname";
}

function padOk(year: string, month: string, day?: string): boolean {
  const y = Number(year);
  const m = Number(month);
  if (y < 1970 || y > 2100 || m < 1 || m > 12) return false;
  if (day === undefined) return true;
  const d = Number(day);
  return d >= 1 && d <= 31;
}

/**
 * Tarih veya sayısal ön eki düşürür; eşleşmezse yolu olduğu gibi bırakır.
 * Tek dilli `/{yıl}/{ay}/{slug}` ve çok dilli `/{dil}/{yıl}/{ay}/{slug}` ikisini de tanır.
 */
export function stripPermalinkPrefix(pathname: string, structure: PermalinkStructure): string {
  if (structure === "postname" || structure === "plain") return pathname;
  const parts = pathname.split("/");
  const head = parts[1] ?? "";
  const locale = /^[a-z]{2}$/.test(head) ? head : "";
  const restParts = parts.slice(locale ? 2 : 1);
  const rest = `/${restParts.join("/")}`;
  let stripped = rest;
  if (structure === "dayname") {
    const m = rest.match(/^\/(\d{4})\/(\d{2})\/(\d{2})(\/.*)$/);
    if (m && padOk(m[1]!, m[2]!, m[3]!)) stripped = m[4]!;
  } else if (structure === "monthname") {
    const m = rest.match(/^\/(\d{4})\/(\d{2})(\/.*)$/);
    if (m && padOk(m[1]!, m[2]!)) stripped = m[3]!;
  } else if (structure === "numeric") {
    const m = rest.match(/^\/arsiv\/\d+(\/.*)$/);
    if (m) stripped = m[1]!;
  }
  if (stripped === rest) return pathname;
  const body = stripped === "/" ? "" : stripped;
  return locale ? `/${locale}${body}` : body || "/";
}

/** Apache tanısı. `index.php` kuralı yok: olmayan dosyaya düşmek 404 üretir. Nginx bu dosyayı okumaz. */
export function renderPermalinkHtaccess(structure: PermalinkStructure, renewedAt: string): string {
  const samples: Record<PermalinkStructure, string> = {
    postname: "/yazi-adi",
    plain: "/yazi-adi",
    dayname: "/2026/11/10/yazi-adi",
    monthname: "/2026/11/yazi-adi",
    numeric: "/arsiv/123/yazi-adi",
  };
  return `# NexPress kalıcı bağlantı
# yapı: ${structure}
# örnek: ${samples[structure]}
# yenileme: ${renewedAt}
# Apache bu dosyayı okur. Nginx okumaz; 404 sürerse kaynak vekil kuralıdır.
# WordPress index.php kuralı yoktur.
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule .* - [L]
</IfModule>
`;
}
