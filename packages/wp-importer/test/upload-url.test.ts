import test from "node:test";
import assert from "node:assert/strict";
import { originalUploadUrl } from "../src/links";

test("boyutlu, ölçeklenmiş ve düzenlenmiş kopya özgün adrese döner", () => {
  assert.equal(originalUploadUrl("https://x.test/wp-content/uploads/2024/05/foto-1024x683.webp"), "https://x.test/wp-content/uploads/2024/05/foto.webp");
  assert.equal(originalUploadUrl("https://x.test/wp-content/uploads/2024/05/foto-scaled.jpg?ver=2"), "https://x.test/wp-content/uploads/2024/05/foto.jpg");
  assert.equal(originalUploadUrl("https://x.test/wp-content/uploads/2022/07/edefter-0906-e1553933907887.jpg"), "https://x.test/wp-content/uploads/2022/07/edefter-0906.jpg");
  assert.equal(originalUploadUrl("https://x.test/wp-content/uploads/2024/05/plain.png"), "https://x.test/wp-content/uploads/2024/05/plain.png");
});
