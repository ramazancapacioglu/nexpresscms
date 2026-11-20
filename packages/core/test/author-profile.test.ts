import assert from "node:assert/strict";
import test from "node:test";
import { authorProfileFromRow, authorProfileToRow, hasAuthorProfile, sanitizeAuthorProfile } from "../src/author-profile";

test("yazar profili: HTML temizlenir, uzunluklar kısılır, yalnızca https bağlantılar ve yerel medya kalır", () => {
  const p = sanitizeAuthorProfile({
    jobTitle: "  <b>Yazılım   Uzmanı</b> ",
    bio: "Merhaba <script>alert(1)</script> dünya",
    expertise: "ERP, e-Fatura,, ERP\nMuhasebe",
    sameAs: ["https://www.linkedin.com/in/ornek", "http://eski.test/x", "javascript:alert(1)", "https://u:p@x.test/", "https://www.linkedin.com/in/ornek"],
    avatarUrl: "/media/med_abc-1/1280.webp",
  });
  assert.equal(p.jobTitle, "Yazılım Uzmanı");
  assert.ok(!p.bio.includes("<"));
  assert.deepEqual(p.expertise, ["ERP", "e-Fatura", "Muhasebe"]);
  assert.deepEqual(p.sameAs, ["https://www.linkedin.com/in/ornek"]);
  assert.equal(p.avatarUrl, "/media/med_abc-1/1280.webp");
  assert.equal(sanitizeAuthorProfile({ avatarUrl: "/etc/passwd" }).avatarUrl, "");
  assert.equal(sanitizeAuthorProfile({ avatarUrl: "http://x.test/a.png" }).avatarUrl, "");
  assert.equal(sanitizeAuthorProfile({ bio: "x".repeat(900) }).bio.length, 600);
});

test("yazar profili: satır dönüşümü gidiş-dönüşte aynı; bozuk JSON ve boş satır güvenli", () => {
  const p = sanitizeAuthorProfile({ jobTitle: "Editör", expertise: ["SEO"], sameAs: ["https://x.com/ornek"] });
  assert.deepEqual(authorProfileFromRow(authorProfileToRow(p)), p);
  assert.deepEqual(authorProfileToRow(sanitizeAuthorProfile({})), { jobTitle: null, bio: null, expertise: null, sameAs: null, avatarUrl: null });
  assert.equal(authorProfileFromRow({ sameAs: "{bozuk" }).sameAs.length, 0);
  assert.equal(authorProfileFromRow({}).bio, "");
  assert.equal(hasAuthorProfile(authorProfileFromRow({})), false);
  assert.equal(hasAuthorProfile(p), true);
});
