import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSearch, rankAdminSearch, type AdminSearchCandidate } from "../src";

const c = (group: AdminSearchCandidate["group"], id: string, title: string, haystack: string[] = []): AdminSearchCandidate => ({ group, id, title, haystack, subtitle: "", href: `/x/${id}` });

test("normalleştirme: Türkçe harfler ve büyük/küçük harf ('Işık' = 'isik', 'İletişim' = 'iletisim')", () => {
  assert.equal(normalizeSearch("  İLETİŞİM   Formu "), "iletisim formu");
  assert.equal(normalizeSearch("Işık ÇÖZÜM ğ"), "isik cozum g");
});

test("sıralama: tam > önek > sözcük başı > içerir > ek alan; VE mantığı; 2 karakterden kısa sorgu boş", () => {
  const items = [
    c("content", "a", "Hakkımızda"),
    c("content", "b", "Kurumsal hakkında bilgi"),
    c("content", "c", "Ana sayfa", ["hakkimizda-slug"]),
    c("content", "d", "Blog"),
    c("form", "f", "İletişim formu"),
    c("media", "m", "iletisim-banner.png", ["Kapak görseli"]),
  ];
  assert.deepEqual(rankAdminSearch(items, "hakkımızda").map((h) => h.id), ["a", "c"], "tam başlık önde, slug eşleşmesi sonra");
  assert.deepEqual(rankAdminSearch(items, "HAKKINDA").map((h) => h.id), ["b"]);
  assert.deepEqual(rankAdminSearch(items, "kurumsal bilgi").map((h) => h.id), ["b"], "tüm sözcükler gerekli");
  assert.deepEqual(rankAdminSearch(items, "kurumsal yok"), []);
  assert.deepEqual(rankAdminSearch(items, "iletişim").map((h) => `${h.group}:${h.id}`), ["form:f", "media:m"], "gruplara göre sıralı");
  assert.deepEqual(rankAdminSearch(items, "i"), []);
  assert.deepEqual(rankAdminSearch(items, "  "), []);
});

test("grup başına sınır", () => {
  const many = Array.from({ length: 20 }, (_, i) => c("content", `n${i}`, `Makale ${i}`));
  assert.equal(rankAdminSearch(many, "makale", 5).length, 5);
});
