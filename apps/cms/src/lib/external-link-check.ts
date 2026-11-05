import { lookup } from "node:dns/promises";
import { isPublicIp } from "@nexpress/wp-importer";

/**
 * Dış bağlantı yoklaması. İç ağ, meta veri ve kimlik bilgili adreslere istek gitmez.
 * Her yönlendirmede adres ve DNS yeniden denetlenir.
 */

export type ExternalLinkStatus = "ok" | "broken" | "blocked" | "timeout";

export interface ExternalLinkResult {
  url: string;
  status: ExternalLinkStatus;
  detail: string;
}

export interface ExternalProbe {
  lookup(host: string): Promise<string[]>;
  request(href: string, method: "HEAD" | "GET"): Promise<{ status: number; location: string | null }>;
}

const MAX_URLS = 30;
const MAX_HOPS = 2;

function looksLikeIp(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

/** Ağ çağrısından önce adresin genel http(s) olup olmadığı. Hata metni ya da hedef. */
export function gateExternalUrl(raw: string): { href: string; host: string } | { error: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { error: "adres okunamadı" };
  }
  if (url.username || url.password) return { error: "kimlik bilgili adres" };
  if (url.protocol !== "http:" && url.protocol !== "https:") return { error: "yalnızca http(s)" };
  if (url.port && url.port !== "80" && url.port !== "443") return { error: "izin verilmeyen kapı" };
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "metadata.google.internal" ||
    host === "metadata"
  ) {
    return { error: "iç adres" };
  }
  if (looksLikeIp(host) && !isPublicIp(host)) return { error: "iç adres" };
  url.hash = "";
  return { href: url.toString(), host };
}

async function addressesArePublic(host: string, probe: ExternalProbe): Promise<"public" | "private" | "unresolved"> {
  try {
    const ips = looksLikeIp(host) ? [host] : await probe.lookup(host);
    if (ips.length === 0 || ips.some((ip) => !isPublicIp(ip))) return "private";
    return "public";
  } catch {
    return "unresolved";
  }
}

/** Tek dış adres. Kırık, zaman aşımı veya iç adrese düşen yönlendirme burada ayrılır. */
export async function probeExternalLink(raw: string, probe: ExternalProbe): Promise<ExternalLinkResult> {
  let current = raw;
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const gated = gateExternalUrl(current);
    if ("error" in gated) return { url: raw, status: "blocked", detail: gated.error };
    const visibility = await addressesArePublic(gated.host, probe);
    if (visibility === "unresolved") return { url: raw, status: "broken", detail: "ad çözülemedi" };
    if (visibility === "private") return { url: raw, status: "blocked", detail: "iç adrese çözülüyor" };
    let response: { status: number; location: string | null };
    try {
      response = await probe.request(gated.href, "HEAD");
      if (response.status === 405 || response.status === 501) response = await probe.request(gated.href, "GET");
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      const timedOut = name === "TimeoutError" || name === "AbortError";
      return { url: raw, status: timedOut ? "timeout" : "broken", detail: timedOut ? "zaman aşımı" : "yanıt yok" };
    }
    if (response.status >= 300 && response.status < 400 && response.location) {
      if (hop === MAX_HOPS) return { url: raw, status: "broken", detail: "yönlendirme zinciri" };
      try {
        current = new URL(response.location, gated.href).toString();
      } catch {
        return { url: raw, status: "broken", detail: "yönlendirme adresi bozuk" };
      }
      continue;
    }
    if ((response.status >= 200 && response.status < 300) || response.status === 401 || response.status === 403) {
      return { url: raw, status: "ok", detail: String(response.status) };
    }
    return { url: raw, status: "broken", detail: String(response.status) || "yanıt yok" };
  }
  return { url: raw, status: "broken", detail: "yönlendirme zinciri" };
}

export function liveExternalProbe(): ExternalProbe {
  return {
    async lookup(host) {
      const records = await lookup(host, { all: true, verbatim: true });
      return records.map((row) => row.address);
    },
    async request(href, method) {
      const res = await fetch(href, {
        method,
        redirect: "manual",
        signal: AbortSignal.timeout(4000),
        headers: { "user-agent": "NexPressLinkAudit/1.0" },
      });
      if (method === "GET") await res.body?.cancel();
      return { status: res.status, location: res.headers.get("location") };
    },
  };
}

/** En çok 30 benzersiz adres, dört eşzamanlı yoklama. */
export async function probeExternalLinks(urls: string[], probe: ExternalProbe = liveExternalProbe()): Promise<ExternalLinkResult[]> {
  const unique = [...new Set(urls)].slice(0, MAX_URLS);
  const out: ExternalLinkResult[] = new Array(unique.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < unique.length) {
      const index = cursor++;
      out[index] = await probeExternalLink(unique[index]!, probe);
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, unique.length) }, () => worker()));
  return out;
}
