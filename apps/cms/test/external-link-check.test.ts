import assert from "node:assert/strict";
import test from "node:test";
import { gateExternalUrl, probeExternalLink, type ExternalProbe } from "../src/lib/external-link-check";

const calls: string[] = [];

function probe(map: Record<string, string[]>, status: Record<string, { status: number; location?: string }>): ExternalProbe {
  return {
    async lookup(host) {
      calls.push(`dns:${host}`);
      if (!(host in map)) throw new Error("yok");
      return map[host]!;
    },
    async request(href, method) {
      calls.push(`${method}:${href}`);
      const hit = status[href];
      if (!hit) return { status: 404, location: null };
      return { status: hit.status, location: hit.location ?? null };
    },
  };
}

test("iç adres, garip kapı ve http olmayan şema istek olmadan kapanır", () => {
  assert.equal("error" in gateExternalUrl("http://127.0.0.1/gizli"), true);
  assert.equal("error" in gateExternalUrl("http://169.254.169.254/latest"), true);
  assert.equal("error" in gateExternalUrl("http://localhost/admin"), true);
  assert.equal("error" in gateExternalUrl("http://ornek.test:22/"), true);
  assert.equal("error" in gateExternalUrl("file:///etc/passwd"), true);
  assert.equal("error" in gateExternalUrl("https://kullanici:sifre@ornek.test/"), true);
});

test("genel adrese 200 sağlam, 404 kırık", async () => {
  calls.length = 0;
  const ok = await probeExternalLink("https://ornek.test/sayfa", probe({ "ornek.test": ["1.1.1.1"] }, { "https://ornek.test/sayfa": { status: 200 } }));
  assert.equal(ok.status, "ok");
  const broken = await probeExternalLink("https://ornek.test/yok", probe({ "ornek.test": ["1.1.1.1"] }, {}));
  assert.equal(broken.status, "broken");
  assert.equal(broken.detail, "404");
});

test("DNS iç adrese düşerse istek atılmaz", async () => {
  calls.length = 0;
  const row = await probeExternalLink("https://gizli.test/a", probe({ "gizli.test": ["10.1.2.3"] }, { "https://gizli.test/a": { status: 200 } }));
  assert.equal(row.status, "blocked");
  assert.equal(calls.some((line) => line.startsWith("HEAD:")), false);
});

test("yönlendirme iç adrese saparsa durur", async () => {
  calls.length = 0;
  const row = await probeExternalLink(
    "https://ornek.test/git",
    probe(
      { "ornek.test": ["1.1.1.1"], "127.0.0.1": ["127.0.0.1"] },
      { "https://ornek.test/git": { status: 302, location: "http://127.0.0.1/icerde" } },
    ),
  );
  assert.equal(row.status, "blocked");
  assert.equal(calls.filter((line) => line.startsWith("HEAD:")).length, 1);
});
