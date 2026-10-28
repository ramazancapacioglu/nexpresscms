import test from "node:test";
import assert from "node:assert/strict";
import { buildRobotsTxt, KNOWN_BOTS } from "../src";

test("robots.txt: varsayılan her şeye izin verir, admin ve api kapalı", () => {
  const txt = buildRobotsTxt({ baseUrl: "https://x.test/" });
  assert.match(txt, /User-agent: \*\nAllow: \/\nDisallow: \/admin\nDisallow: \/api/);
  assert.match(txt, /Sitemap: https:\/\/x\.test\/sitemap\.xml/);
  assert.doesNotMatch(txt, /Disallow: \/\n/);
});

test("robots.txt: engellenen botlar kendi grubunda Disallow: / alır", () => {
  const txt = buildRobotsTxt({ baseUrl: "https://x.test", botPolicy: { gptbot: "block", ccbot: "block", claudebot: "allow" } });
  assert.match(txt, /User-agent: GPTBot\nUser-agent: OAI-SearchBot\nUser-agent: ChatGPT-User\nUser-agent: CCBot\nDisallow: \/\n\nUser-agent: \*/);
  assert.doesNotMatch(txt, /ClaudeBot/);
});

test("robots.txt: ek satırlar sona eklenir; her botun simgesi var", () => {
  assert.match(buildRobotsTxt({ baseUrl: "https://x.test", extra: "Crawl-delay: 5" }), /\nCrawl-delay: 5\n$/);
  for (const b of KNOWN_BOTS) assert.ok(b.robotsTokens.length > 0, b.id);
});

import { webmasterVerification } from "../src";

test("webmaster doğrulama: geçerli kodlar eşlenir, bozuk/boş kodlar atılır", () => {
  assert.deepEqual(webmasterVerification({ google: "abc123XYZ_-9", yandex: " yandexcode123 ", bing: "BING1234ABCD" }), {
    google: "abc123XYZ_-9",
    yandex: "yandexcode123",
    other: { "msvalidate.01": "BING1234ABCD" },
  });
  assert.deepEqual(webmasterVerification({ google: '"><script>', bing: "kısa" }), {});
  assert.deepEqual(webmasterVerification(undefined), {});
});
