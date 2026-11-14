import test from "node:test";
import assert from "node:assert/strict";
import type { BlockNode } from "@nexpress/core";
import { restoreRemoteMedia } from "../src/links";
import { parsePublicHead, pickPageSoftware, plainText } from "../src/public-head";

const html = `<!doctype html><html><head>
<title>Wolvox ERP | Akınsoft İzmir</title>
<meta name="description" content="Wolvox ERP ile stok ve muhasebe." />
<meta name="robots" content="follow, index" />
<script type="application/ld+json">
{
  "@graph": [
    { "@type": "WebSite", "name": "Akınsoft İzmir Ana Bayi", "url": "https://www.akinsoftizmir.com.tr" },
    {
      "@type": ["LocalBusiness", "Organization"],
      "name": "Akınsoft İzmir Ana Bayi",
      "email": "bilgi@akinsoftizmir.com.tr",
      "description": "İzmir ana bayi",
      "logo": { "@type": "ImageObject", "url": "https://www.akinsoftizmir.com.tr/logo.jpg" },
      "sameAs": ["https://www.instagram.com/akinsoftizmirbayi"]
    },
    {
      "@type": "SoftwareApplication",
      "name": "Wolvox ERP",
      "operatingSystem": "Windows",
      "applicationCategory": "BusinessApplication",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TRY" }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Kurulum ne kadar sürer?", "acceptedAnswer": { "@type": "Answer", "text": "Aynı gün." } }
      ]
    }
  ]
}
</script>
</head></html>`;

test("başlık, şema, kuruluş ve soru ayıklanır", () => {
  const head = parsePublicHead(html);
  assert.equal(head.title, "Wolvox ERP | Akınsoft İzmir");
  assert.equal(head.description, "Wolvox ERP ile stok ve muhasebe.");
  assert.equal(head.noindex, false);
  assert.equal(head.siteName, "Akınsoft İzmir Ana Bayi");
  assert.equal(head.organization?.email, "bilgi@akinsoftizmir.com.tr");
  assert.equal(head.organization?.logo, "https://www.akinsoftizmir.com.tr/logo.jpg");
  assert.equal(head.faqs[0]?.q, "Kurulum ne kadar sürer?");
  assert.equal(pickPageSoftware(head.software)?.name, "Wolvox ERP");
  assert.equal(pickPageSoftware(head.software)?.price, "0");
});

test("katalogdaki uzun yazılım listesi sayfa şemasına yazılmaz", () => {
  const many = Array.from({ length: 6 }, (_, i) => ({ name: `Ürün ${i}`, os: "", category: "", price: "", currency: "", description: "" }));
  assert.equal(pickPageSoftware(many), null);
});

test("düz metin etiketi ve varlığı temizler", () => {
  assert.equal(plainText("<p>E-Dönüşüm &amp; ERP</p>"), "E-Dönüşüm & ERP");
});

test("ortam dosyası kaynak sitede kalır, sayfa yolu yerel kalır", () => {
  const blocks: BlockNode[] = [
    { id: "a", type: "image_figure", props: { url: "/wp-content/uploads/erp.webp", href: "/wolvox-erp" } },
  ];
  const restored = restoreRemoteMedia(blocks, "https://www.akinsoftizmir.com.tr");
  assert.equal(restored[0]?.props?.url, "https://www.akinsoftizmir.com.tr/wp-content/uploads/erp.webp");
  assert.equal(restored[0]?.props?.href, "/wolvox-erp");
});
