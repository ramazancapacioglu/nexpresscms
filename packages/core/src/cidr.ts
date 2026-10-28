/** IP/CIDR eşleştirme (IPv4 + IPv6, saf mantık). Bozuk girdi hiçbir zaman eşleşmez. */
function parseIPv4(ip: string): bigint | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0n;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) > 255) return null;
    n = (n << 8n) | BigInt(Number(p));
  }
  return n;
}

function parseIPv6(ip: string): bigint | null {
  let s = ip.toLowerCase().split("%")[0]!;
  // IPv4 eşlemeli son 32 bit (::ffff:1.2.3.4)
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const n = parseIPv4(v4[1]!);
    if (n === null) return null;
    s = s.replace(v4[1]!, `${((n >> 16n) & 0xffffn).toString(16)}:${(n & 0xffffn).toString(16)}`);
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 1) return null;
  const groups = halves.length === 1 ? head : [...head, ...Array(missing).fill("0"), ...tail];
  let n = 0n;
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    n = (n << 16n) | BigInt(parseInt(g, 16));
  }
  return n;
}

export interface ParsedCidr {
  v6: boolean;
  base: bigint;
  bits: number;
}

export function parseCidr(cidr: string): ParsedCidr | null {
  const [addr, len] = cidr.trim().split("/");
  if (!addr) return null;
  const v6 = addr.includes(":");
  const base = v6 ? parseIPv6(addr) : parseIPv4(addr);
  if (base === null) return null;
  const max = v6 ? 128 : 32;
  const bits = len === undefined ? max : Number(len);
  if (!Number.isInteger(bits) || bits < 0 || bits > max) return null;
  return { v6, base, bits };
}

export function ipInCidr(ip: string, cidr: ParsedCidr): boolean {
  const addr = cidr.v6 ? parseIPv6(ip) : parseIPv4(ip);
  if (addr === null || (ip.includes(":") !== cidr.v6)) return false;
  const max = cidr.v6 ? 128 : 32;
  const shift = BigInt(max - cidr.bits);
  return addr >> shift === cidr.base >> shift;
}

/** `{prefixes:[{ipv4Prefix|ipv6Prefix}]}` biçimindeki yayımlanmış listeyi ayrıştırır (OpenAI, Perplexity). */
export function parsePublishedRanges(json: unknown): ParsedCidr[] {
  const prefixes = (json as { prefixes?: unknown })?.prefixes;
  if (!Array.isArray(prefixes)) return [];
  return prefixes.flatMap((p) => {
    const v = (p as { ipv4Prefix?: string; ipv6Prefix?: string })?.ipv4Prefix ?? (p as { ipv6Prefix?: string })?.ipv6Prefix;
    const c = typeof v === "string" ? parseCidr(v) : null;
    return c ? [c] : [];
  });
}

export function ipInRanges(ip: string, ranges: ParsedCidr[]): boolean {
  return ranges.some((r) => ipInCidr(ip, r));
}
