import test from "node:test";
import assert from "node:assert/strict";
import { detectAiReferrer, ipInCidr, ipInRanges, normalizeReferralPath, parseCidr, parsePublishedRanges } from "../src";

const inC = (ip: string, c: string) => ipInCidr(ip, parseCidr(c)!);

test("CIDR: IPv4 sınırları, /32, IPv6, bozuk girdi", () => {
  assert.equal(inC("20.125.66.85", "20.125.66.80/28"), true);
  assert.equal(inC("20.125.66.96", "20.125.66.80/28"), false);
  assert.equal(inC("3.224.62.45", "3.224.62.45/32"), true);
  assert.equal(inC("3.224.62.46", "3.224.62.45/32"), false);
  assert.equal(inC("2a03:2880::1", "2a03:2880::/32"), true);
  assert.equal(inC("2a03:2881::1", "2a03:2880::/32"), false);
  assert.equal(inC("::ffff:1.2.3.4", "::ffff:1.2.3.0/120"), true);
  assert.equal(inC("1.2.3.4", "2a03:2880::/32"), false, "v4 adres v6 aralığına girmez");
  assert.equal(parseCidr("999.1.1.1/8"), null);
  assert.equal(parseCidr("1.2.3.4/33"), null);
  assert.equal(ipInCidr("not-an-ip", parseCidr("1.2.3.0/24")!), false);
});

test("yayımlanmış liste ayrıştırma: bozuk girdiler atılır", () => {
  const r = parsePublishedRanges({ prefixes: [{ ipv4Prefix: "10.0.0.0/8" }, { ipv6Prefix: "2001:db8::/32" }, { ipv4Prefix: "bozuk" }, {}] });
  assert.equal(r.length, 2);
  assert.equal(ipInRanges("10.9.9.9", r), true);
  assert.equal(ipInRanges("11.0.0.1", r), false);
  assert.deepEqual(parsePublishedRanges(null), []);
});

test("AI yönlendirme: utm önce, alt alan adı, tanınmayan null; yol normalleştirme", () => {
  assert.equal(detectAiReferrer("https://www.google.com/", "chatgpt.com")?.id, "chatgpt");
  assert.equal(detectAiReferrer("https://chatgpt.com/")?.id, "chatgpt");
  assert.equal(detectAiReferrer("https://www.perplexity.ai/search/x")?.id, "perplexity");
  assert.equal(detectAiReferrer("https://evilchatgpt.com/"), null);
  assert.equal(detectAiReferrer("https://www.google.com/"), null);
  assert.equal(detectAiReferrer("bozuk", ""), null);
  assert.equal(detectAiReferrer(null, null), null);
  assert.equal(normalizeReferralPath("/tr/a?x=1#h"), "/tr/a");
  assert.equal(normalizeReferralPath("x"), "/x");
});
