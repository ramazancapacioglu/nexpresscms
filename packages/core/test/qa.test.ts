import assert from "node:assert/strict";
import test from "node:test";
import { qaItemId, sanitizeQaState } from "../src/qa";

test("soru durumu bozuk kayıtları atar", () => {
  const state = sanitizeQaState({
    upvotes: 3.8,
    pending: [{ id: "q_ab", question: "kısa", name: "A" }, { id: "<script>", question: "Bu soru yeterince uzun mu acaba", name: "A" }],
    answered: [{ id: "q_ok", question: "E-fatura nasıl kesilir bugün", name: "", answer: "Portal üzerinden.", date: "2026-11-13" }],
  });
  assert.equal(state.upvotes, 3);
  assert.equal(state.pending.length, 0);
  assert.equal(state.answered.length, 1);
  assert.equal(state.answered[0]?.answer, "Portal üzerinden.");
});

test("soru kimliği güvenli önek taşır", () => {
  assert.match(qaItemId("Ab C!"), /^q_[a-z0-9]+_abc$/);
});
