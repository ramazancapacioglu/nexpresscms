import test from "node:test";
import assert from "node:assert/strict";
import { evaluateEnv, evaluateIndex } from "../src";

const level = (checks: ReturnType<typeof evaluateEnv>, id: string) => checks.find((c) => c.id === id)!.level;

test("ortam denetimi: yer tutucu/kısa/eksik sır, üretimde http, anahtar varlığı", () => {
  const good = "x".repeat(40);
  assert.equal(level(evaluateEnv({ AUTH_SECRET: good, NEXT_PUBLIC_APP_URL: "https://a.test", DB_DIALECT: "sqlite" }, true), "auth-secret"), "ok");
  assert.equal(level(evaluateEnv({}, true), "auth-secret"), "fail");
  assert.equal(level(evaluateEnv({}, false), "auth-secret"), "warn");
  assert.equal(level(evaluateEnv({ AUTH_SECRET: "kisa" }, false), "auth-secret"), "warn");
  assert.equal(level(evaluateEnv({ AUTH_SECRET: "nexpress-super-secret-jwt-key-change-in-production-2026" }, true), "auth-secret"), "fail");
  assert.equal(level(evaluateEnv({ NEXT_PUBLIC_APP_URL: "http://a.test" }, true), "app-url"), "warn");
  assert.equal(level(evaluateEnv({ OPENAI_API_KEY: "sk-x" }, false), "openai"), "ok");
  assert.equal(level(evaluateEnv({}, false), "openai"), "info");
  assert.equal(level(evaluateEnv({ DB_DIALECT: "postgresql" }, false), "database-url"), "fail");
});

test("ortam denetimi çıktısı hiçbir sır değerini içermez", () => {
  const env = { AUTH_SECRET: "gizli-deger-".repeat(5), OPENAI_API_KEY: "sk-GIZLI123", MCP_AGENT_KEY: "agent-GIZLI", CRON_SECRET: "cron-GIZLI", INDEXNOW_API_KEY: "ix-GIZLI" };
  const text = JSON.stringify(evaluateEnv(env, true));
  for (const v of Object.values(env)) assert.equal(text.includes(v), false);
});

test("dizin sağlığı: yok, eksik, tam, eski model", () => {
  const m = (model: string, chunks: number) => ({ model, chunks });
  assert.equal(evaluateIndex({ published: 0, indexedContents: 0, activeModel: "a", models: [] }).level, "info");
  assert.equal(evaluateIndex({ published: 5, indexedContents: 0, activeModel: "a", models: [m("b", 10)] }).level, "warn");
  assert.equal(evaluateIndex({ published: 5, indexedContents: 3, activeModel: "a", models: [m("a", 9)] }).level, "warn");
  assert.equal(evaluateIndex({ published: 5, indexedContents: 5, activeModel: "a", models: [m("a", 9)] }).level, "ok");
  assert.equal(evaluateIndex({ published: 5, indexedContents: 5, activeModel: "a", models: [m("a", 9), m("b", 4)] }).level, "info");
});
