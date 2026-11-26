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
  assert.equal(sanitizeAuthorProfile({ bio: "x".repeat(1500) }).bio.length, 1200);
});

test("yazar profili: satır dönüşümü gidiş-dönüşte aynı; kurumsal yazar, belgeler ve bozuk JSON güvenli", () => {
  const p = sanitizeAuthorProfile({
    authorType: "Organization",
    jobTitle: "Yetkili Çözüm Merkezi",
    expertise: ["SEO"],
    credentials: "Akınsoft İzmir Ana Bayi\nYetkili Eğitim Merkezi",
    sameAs: ["https://x.com/ornek"],
  });
  assert.equal(p.authorType, "Organization");
  assert.deepEqual(p.credentials, ["Akınsoft İzmir Ana Bayi", "Yetkili Eğitim Merkezi"]);
  assert.deepEqual(authorProfileFromRow(authorProfileToRow(p)), p);
  assert.deepEqual(authorProfileToRow(sanitizeAuthorProfile({})), {
    authorType: null,
    jobTitle: null,
    bio: null,
    expertise: null,
    credentials: null,
    sameAs: null,
    avatarUrl: null,
  });
  assert.equal(authorProfileFromRow({ sameAs: "{bozuk" }).sameAs.length, 0);
  assert.equal(authorProfileFromRow({}).bio, "");
  assert.equal(hasAuthorProfile(authorProfileFromRow({})), false);
  assert.equal(hasAuthorProfile(p), true);
});

import { friendlyImagePath, parseFriendlyImageFile, parseVariantFile, seoImageName } from "../src/media";

test("anlamlı görsel adı: dosya adından türer; sayısal/anlamsız ad 1280.webp'e düşer; sayısal türev adı karışmaz", () => {
  assert.equal(seoImageName("Wolvox Restoran Kampanyası_10-2026.webp"), "wolvox-restoran-kampanyasi-10-2026");
  assert.equal(seoImageName("C:\\resimler\\Mobil Satış.PNG"), "mobil-satis");
  assert.equal(seoImageName("1280.webp"), null);
  assert.equal(seoImageName(""), null);
  assert.equal(friendlyImagePath("med_abc123", "wolvox-restoran-kampanyasi-10-2026.webp"), "/media/med_abc123/wolvox-restoran-kampanyasi-10-2026.webp");
  assert.equal(friendlyImagePath("med_abc123", "123.png"), "/media/med_abc123/1280.webp");
  assert.deepEqual(parseFriendlyImageFile("mobil-satis.webp"), { name: "mobil-satis", format: "webp" });
  assert.equal(parseFriendlyImageFile("1280.webp"), null);
  assert.equal(parseFriendlyImageFile("belge.pdf"), null);
  assert.ok(parseVariantFile("1280.webp"));
  assert.equal(parseVariantFile("mobil-satis.webp"), null);
});
