import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeOrganizationSchema } from "../src/organization-schema";

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
