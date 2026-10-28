import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyRequestKind, detectBot, hostMatchesSuffix } from "../src/ai-bots";

test("bilinen botları UA'dan tanır, insanları ve boşu tanımaz", () => {
  assert.equal(detectBot("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)")?.id, "gptbot");
  assert.equal(detectBot("Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)")?.id, "claudebot");
  assert.equal(detectBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")?.id, "googlebot");
  assert.equal(detectBot("Mozilla/5.0 (compatible; bingbot/2.0)")?.id, "bingbot");
  assert.equal(detectBot("Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0 Safari/537.36"), null);
  assert.equal(detectBot(""), null);
  assert.equal(detectBot(null), null);
});

test("ters DNS soneki: nokta ve büyük harf toleransı, benzer alan adı reddi", () => {
  const g = [".googlebot.com", ".google.com"];
  assert.equal(hostMatchesSuffix("crawl-66-249-66-1.googlebot.com.", g), true);
  assert.equal(hostMatchesSuffix("CRAWL.GOOGLE.COM", g), true);
  assert.equal(hostMatchesSuffix("evil-googlebot.com", g), false, "nokta sınırı zorunlu");
  assert.equal(hostMatchesSuffix("googlebot.com.evil.net", g), false);
  assert.equal(hostMatchesSuffix("x.example.com", []), false);
});

test("istek türü sınıflandırması", () => {
  assert.equal(classifyRequestKind("/tr/hakkimizda"), "page");
  assert.equal(classifyRequestKind("/tr/hakkimizda", true), "markdown");
  assert.equal(classifyRequestKind("/llms.txt"), "llms");
  assert.equal(classifyRequestKind("/llms-full.txt"), "llms");
  assert.equal(classifyRequestKind("/sitemap.xml"), "sitemap");
  assert.equal(classifyRequestKind("/sitemaps/page-1.xml"), "sitemap");
  assert.equal(classifyRequestKind("/ai-sitemap.json"), "ai-sitemap");
  assert.equal(classifyRequestKind("/api/mcp"), "mcp");
  assert.equal(classifyRequestKind("/robots.txt"), "robots");
});
