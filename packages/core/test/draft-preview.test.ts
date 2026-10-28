import test from "node:test";
import assert from "node:assert/strict";
import { createDraftPreviewToken, verifyDraftPreviewToken } from "../src/draft-preview";

const S = "gizli-anahtar-0123456789-0123456789";
const NOW = Date.UTC(2026, 9, 28);

test("taslak önizleme belirteci: geçerli, süresi dolan, başka site/anahtar/içerik, kurcalanmış ve sınır dışı süre", () => {
  const t = createDraftPreviewToken(S, "default", "cnt_abc", 7, NOW);
  assert.equal(verifyDraftPreviewToken(S, "default", t, NOW + 86_400_000), "cnt_abc");
  assert.equal(verifyDraftPreviewToken(S, "default", t, NOW + 8 * 86_400_000), null, "süre doldu");
  assert.equal(verifyDraftPreviewToken(S, "baska", t, NOW), null, "başka kiracı");
  assert.equal(verifyDraftPreviewToken("baska-anahtar", "default", t, NOW), null, "başka anahtar");
  const [, exp, mac] = t.split(".");
  assert.equal(verifyDraftPreviewToken(S, "default", `cnt_xyz.${exp}.${mac}`, NOW), null, "başka içerik");
  assert.equal(verifyDraftPreviewToken(S, "default", `cnt_abc.${Number(exp) + 86_400}.${mac}`, NOW), null, "süre uzatma");
  for (const bad of ["", "a.b", "cnt_abc..x", "cnt abc.1.x", `${t}.fazla`]) assert.equal(verifyDraftPreviewToken(S, "default", bad, NOW), null);
  // 30 günden uzun istenirse 30'a kırpılır
  const long = createDraftPreviewToken(S, "default", "cnt_abc", 999, NOW);
  assert.equal(verifyDraftPreviewToken(S, "default", long, NOW + 29 * 86_400_000), "cnt_abc");
  assert.equal(verifyDraftPreviewToken(S, "default", long, NOW + 31 * 86_400_000), null);
  assert.throws(() => createDraftPreviewToken(S, "default", "../x", 1, NOW));
});
