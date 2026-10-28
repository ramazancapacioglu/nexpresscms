import { basicAuth, fail, marketplaceRequest, requireFields } from "../http";
import type { MarketplaceDriver, RemoteMarketplaceOrder, StockPricePushItem } from "../types";

function base(environment: "sandbox" | "production"): string {
  return environment === "sandbox"
    ? "https://stageapigw.trendyol.com"
    : "https://apigw.trendyol.com";
}

function headers(credentials: Record<string, string>): HeadersInit {
  const sellerId = credentials.sellerId.trim();
  return {
    Authorization: basicAuth(credentials.apiKey.trim(), credentials.apiSecret.trim()),
    "User-Agent": `${sellerId} - ${credentials.integratorName?.trim() || "SelfIntegration"}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export const trendyolDriver: MarketplaceDriver = {
  id: "trendyol",
  name: "Trendyol",
  summary: "Basic Auth + zorunlu User-Agent. Stok/fiyat kuyruğa alınır, siparişler v2 paket ucundan çekilir.",
  docsUrl: "https://developers.trendyol.com/docs/2-authorization",
  auth: "basic",
  capabilities: ["test_connection", "push_price_stock", "pull_orders"],
  credentialFields: [
    { key: "sellerId", label: "Satıcı ID", required: true },
    { key: "apiKey", label: "API Key", required: true, secret: true },
    { key: "apiSecret", label: "API Secret", required: true, secret: true },
    {
      key: "integratorName",
      label: "User-Agent entegratör adı",
      placeholder: "SelfIntegration",
      help: "Biçim: {satıcıId} - {ad}. Boşsa SelfIntegration.",
    },
  ],
  async testConnection(environment, credentials) {
    const missing = requireFields(credentials, ["sellerId", "apiKey", "apiSecret"]);
    if (missing) return fail(missing);
    const url = `${base(environment)}/integration/product/sellers/${credentials.sellerId.trim()}/products?page=0&size=1`;
    const res = await marketplaceRequest(url, { headers: headers(credentials) });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, message: "Trendyol bağlantısı doğrulandı." };
    }
    return fail(`Trendyol ${res.status}: ${res.text.slice(0, 280)}`);
  },
  async pushPriceStock(environment, credentials, items) {
    const missing = requireFields(credentials, ["sellerId", "apiKey", "apiSecret"]);
    if (missing) return fail(missing);
    const payload = {
      items: items.slice(0, 1000).map((item) => trendyolItem(item)),
    };
    const url = `${base(environment)}/integration/inventory/sellers/${credentials.sellerId.trim()}/products/price-and-inventory`;
    const res = await marketplaceRequest(url, {
      method: "POST",
      headers: headers(credentials),
      body: JSON.stringify(payload),
    });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, message: "Stok ve fiyat kuyruğa alındı.", data: { accepted: payload.items.length } };
    }
    return fail(`Trendyol stok ${res.status}: ${res.text.slice(0, 280)}`);
  },
  async pullOrders(environment, credentials, since) {
    const missing = requireFields(credentials, ["sellerId", "apiKey", "apiSecret"]);
    if (missing) return fail(missing);
    const start = since.getTime();
    const url = `${base(environment)}/integration/order/sellers/${credentials.sellerId.trim()}/v2/orders?startDate=${start}&size=50&orderByField=PackageLastModifiedDate&orderByDirection=DESC`;
    const res = await marketplaceRequest(url, { headers: headers(credentials) });
    if (res.status < 200 || res.status >= 300) {
      return fail(`Trendyol sipariş ${res.status}: ${res.text.slice(0, 280)}`);
    }
    const content = Array.isArray((res.json as { content?: unknown })?.content)
      ? ((res.json as { content: unknown[] }).content)
      : [];
    return { ok: true, message: `${content.length} paket alındı.`, data: content.map(mapTrendyolOrder) };
  },
};

function trendyolItem(item: StockPricePushItem) {
  const sale = Number(item.salePrice.toFixed(2));
  const list = Number((item.listPrice && item.listPrice > sale ? item.listPrice : sale).toFixed(2));
  return {
    barcode: item.sku,
    quantity: item.quantity,
    salePrice: sale,
    listPrice: list,
  };
}

function mapTrendyolOrder(raw: unknown): RemoteMarketplaceOrder {
  const row = (raw ?? {}) as Record<string, unknown>;
  const linesRaw = Array.isArray(row.lines) ? row.lines : [];
  const lines = linesRaw.map((line) => {
    const l = line as Record<string, unknown>;
    return {
      sku: String(l.barcode ?? l.merchantSku ?? ""),
      title: String(l.productName ?? ""),
      quantity: Number(l.quantity ?? 1),
      unitPrice: Number(l.price ?? l.amount ?? 0),
    };
  });
  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  return {
    externalId: String(row.orderNumber ?? row.shipmentPackageId ?? row.id ?? ""),
    status: String(row.status ?? row.shipmentPackageStatus ?? "Created"),
    buyerName: String((row.customerFirstName ?? "") + " " + (row.customerLastName ?? "")).trim() || "Müşteri",
    currency: String(row.currencyCode ?? "TRY"),
    total,
    orderedAt: row.orderDate ? String(row.orderDate) : null,
    lines,
  };
}
