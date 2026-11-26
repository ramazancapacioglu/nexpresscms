import test from "node:test";
import assert from "node:assert/strict";
import { isTurkishCitizenId, sanitizeOrganizationSchema } from "../src/organization-schema";

test("yerel işletme alanları kalır, kimlik ve düğüm göndermeleri atılır", () => {
  const out = sanitizeOrganizationSchema({
    "@type": ["LocalBusiness", "Organization"],
    "@id": "https://x.test/#organization",
    name: "Ezilmemeli",
    url: "https://x.test",
    sameAs: ["https://x.test/a"],
    logo: { "@id": "x" },
    location: { "@id": "https://x.test/#place" },
    telephone: "+902320000000",
    priceRange: "₺₺",
    openingHours: ["Mo,Tu 09:00-17:00"],
    address: { "@type": "PostalAddress", streetAddress: "Sokak 1", addressLocality: "Konak", "@id": "gizli" },
  });
  assert.deepEqual(out, {
    "@type": ["LocalBusiness", "Organization"],
    telephone: "+902320000000",
    priceRange: "₺₺",
    openingHours: ["Mo,Tu 09:00-17:00"],
    address: { "@type": "PostalAddress", streetAddress: "Sokak 1", addressLocality: "Konak" },
  });
});

test("geçersiz tür ve boş girdi undefined olur", () => {
  assert.equal(sanitizeOrganizationSchema(null), undefined);
  assert.equal(sanitizeOrganizationSchema({ "@type": "<script>" }), undefined);
  assert.equal(sanitizeOrganizationSchema({ name: "x" }), undefined);
});

test("T.C. kimlik numarası (şahıs işletmesi vergi no'su) şemaya yazılmaz, 10 haneli VKN kalır", () => {
  // 10000000146: sağlama kuralına uyan, herkesçe bilinen deneme numarası (gerçek kişiye ait değil)
  assert.equal(isTurkishCitizenId("10000000146"), true);
  assert.equal(isTurkishCitizenId(10000000146), true);
  assert.equal(isTurkishCitizenId("100 000 001 46"), true);
  assert.equal(isTurkishCitizenId("10000000147"), false, "sağlama hanesi tutmuyor");
  assert.equal(isTurkishCitizenId("00000000146"), false, "ilk hane 0 olamaz");
  assert.equal(isTurkishCitizenId("1234567890"), false, "10 hane: şirket VKN'si");

  const personal = sanitizeOrganizationSchema({ name: "x", legalName: "Ali Veli", taxID: "10000000146", vatID: "TR10000000146" });
  assert.deepEqual(personal, { legalName: "Ali Veli" });

  const company = sanitizeOrganizationSchema({ legalName: "Örnek A.Ş.", taxID: "1234567890" });
  assert.equal(company?.taxID, "1234567890");
});
