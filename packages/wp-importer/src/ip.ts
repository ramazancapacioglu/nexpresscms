/**
 * Dış adresten görsel indirirken sunucu tarafı istek sahteciliğine (SSRF) karşı: adres genel internete mi ait?
 * Saf mantık; IPv4, IPv6 (sıkıştırılmış ve IPv4 gömülü biçimler dahil). Ayrıştırılamayan her şey "genel değil" sayılır.
 */
function parseV4(s: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  return o.every((n) => n <= 255) ? o : null;
}

function parseV6(input: string): number[] | null {
  let s = input.toLowerCase().split("%")[0]!; // bölge kimliği (fe80::1%eth0)
  const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (tail) {
    const v4 = parseV4(tail[1]!);
    if (!v4) return null;
    s = s.slice(0, -tail[1]!.length) + ((v4[0]! << 8) | v4[1]!).toString(16) + ":" + ((v4[2]! << 8) | v4[3]!).toString(16);
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill("0"), ...rest];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.map((g) => parseInt(g, 16));
}

function publicV4([a, b, c]: number[]): boolean {
  if (a === 0 || a === 10 || a === 127 || a! >= 224) return false;
  if (a === 100 && b! >= 64 && b! <= 127) return false; // CGNAT
  if (a === 169 && b === 254) return false; // bağlantı yerel / bulut meta verisi
  if (a === 172 && b! >= 16 && b! <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if ((a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)) return false; // belgeleme
  return true;
}

export function isPublicIp(ip: string): boolean {
  const v4 = parseV4(ip);
  if (v4) return publicV4(v4);
  const g = parseV6(ip);
  if (!g) return false;
  if (g.every((x) => x === 0) || (g.slice(0, 7).every((x) => x === 0) && g[7] === 1)) return false; // :: ve ::1
  if ((g[0]! & 0xfe00) === 0xfc00 || (g[0]! & 0xffc0) === 0xfe80 || (g[0]! & 0xff00) === 0xff00) return false; // ULA, bağlantı yerel, çok noktaya
  if (g[0] === 0x2001 && g[1] === 0x0db8) return false;
  const embedded = (hi: number, lo: number) => [hi >> 8, hi & 255, lo >> 8, lo & 255];
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return publicV4(embedded(g[6]!, g[7]!)); // ::ffff:a.b.c.d
  if (g[0] === 0x64 && g[1] === 0xff9b) return publicV4(embedded(g[6]!, g[7]!)); // NAT64
  if (g[0] === 0x2002) return publicV4(embedded(g[1]!, g[2]!)); // 6to4
  return true;
}
