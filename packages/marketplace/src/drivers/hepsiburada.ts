import { basicAuth, fail, marketplaceRequest, requireFields } from "../http";
import type { MarketplaceDriver, RemoteMarketplaceOrder } from "../types";

function listingHost(environment: "sandbox" | "production"): string {
  return environment === "sandbox"
    ? "https://listing-external-sit.hepsiburada.com"
    : "https://listing-external.hepsiburada.com";
}

function omsHost(environment: "sandbox" | "production"): string {
  return environment === "sandbox"
    ? "https://oms-external-sit.hepsiburada.com"
    : "https://oms-external.hepsiburada.com";
}

function headers(credentials: Record<string, string>): HeadersInit {
  return {
    Authorization: basicAuth(credentials.username.trim(), credentials.password.trim()),
    "User-Agent": credentials.userAgent.trim(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export const hepsiburadaDriver: MarketplaceDriver = {
  id: "hepsiburada",
  name: "Hepsiburada",
  summary: "Basic Auth ve User-Agent. Listing envanter/fiyat yüklemesi ayrı; sipariş OMS üzerinden.",
  docsUrl: "https://developers.hepsiburada.com/hepsiburada/reference/siparis-entegrasyonu-onemli-bilgiler",
  auth: "basic",
  capabilities: ["test_connection", "push_price_stock", "pull_orders"],
  credentialFields: [
    { key: "merchantId", label: "Merchant ID", required: true, help: "Satıcı GUID." },
    { key: "username", label: "Servis kullanıcı adı", required: true },
    { key: "password", label: "Servis şifresi", required: true, secret: true },
    { key: "userAgent", label: "User-Agent", required: true, placeholder: "nexpress_dev" },
  ],
  async testConnection(environment, credentials) {
    const missing = requireFields(credentials, ["merchantId", "username", "password", "userAgent"]);
    if (missing) return fail(missing);
    const url = `${listingHost(environment)}/listings/merchantid/${credentials.merchantId.trim()}?offset=0&limit=1`;
    const res = await marketplaceRequest(url, { headers: headers(credentials) });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, message: "Hepsiburada listing servisi yanıt verdi." };
    }
    return fail(`Hepsiburada ${res.status}: ${res.text.slice(0, 280)}`);
  },
  async pushPriceStock(environment, credentials, items) {
    const missing = requireFields(credentials, ["merchantId", "username", "password", "userAgent"]);
    if (missing) return fail(missing);
    const merchantId = credentials.merchantId.trim();
    const stockBody = items.map((item) => ({
      merchantSku: item.sku,
      availableStock: item.quantity,
    }));
    const priceBody = items.map((item) => ({
      merchantSku: item.sku,
      price: Number(item.salePrice.toFixed(2)),
    }));
    const stock = await marketplaceRequest(
      `${listingHost(environment)}/listings/merchantid/${merchantId}/inventory-uploads`,
      { method: "POST", headers: headers(credentials), body: JSON.stringify(stockBody) }
    );
    const price = await marketplaceRequest(
      `${listingHost(environment)}/listings/merchantid/${merchantId}/price-uploads`,
      { method: "POST", headers: headers(credentials), body: JSON.stringify(priceBody) }
    );
    if (stock.status >= 200 && stock.status < 300 && price.status >= 200 && price.status < 300) {
      return { ok: true, message: "Stok ve fiyat yüklemeleri kabul edildi.", data: { accepted: items.length } };
    }
    return fail(
      `Hepsiburada stok ${stock.status} / fiyat ${price.status}: ${stock.text.slice(0, 140)} ${price.text.slice(0, 140)}`
    );
  },
  async pullOrders(environment, credentials, since) {
    const missing = requireFields(credentials, ["merchantId", "username", "password", "userAgent"]);
    if (missing) return fail(missing);
    const begin = since.toISOString();
    const url = `${omsHost(environment)}/orders/merchantid/${credentials.merchantId.trim()}?offset=0&limit=50&begindate=${encodeURIComponent(begin)}`;
    const res = await marketplaceRequest(url, { headers: headers(credentials) });
    if (res.status < 200 || res.status >= 300) {
      return fail(`Hepsiburada sipariş ${res.status}: ${res.text.slice(0, 280)}`);
    }
    const list = extractList(res.json);
    return { ok: true, message: `${list.length} sipariş alındı.`, data: list.map(mapHbOrder) };
  },
};

function extractList(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const row = json as Record<string, unknown>;
    if (Array.isArray(row.items)) return row.items;
    if (Array.isArray(row.orders)) return row.orders;
    if (Array.isArray(row.data)) return row.data;
  }
  return [];
}

function mapHbOrder(raw: unknown): RemoteMarketplaceOrder {
  const row = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(row.items)
    ? row.items
    : Array.isArray(row.lineItems)
      ? row.lineItems
      : [];
  const lines = items.map((item) => {
    const l = item as Record<string, unknown>;
    const priceObj = l.totalPrice as { amount?: number } | undefined;
    return {
      sku: String(l.merchantSku ?? l.sku ?? ""),
      title: String(l.productName ?? l.name ?? ""),
      quantity: Number(l.quantity ?? 1),
      unitPrice: Number(priceObj?.amount ?? l.price ?? 0),
    };
  });
  return {
    externalId: String(row.orderNumber ?? row.id ?? ""),
    status: String(row.status ?? "Open"),
    buyerName: String((row.customerName as string) ?? (row.customer as { name?: string } | undefined)?.name ?? "Müşteri"),
    currency: "TRY",
    total: lines.reduce((sum, line) => sum + line.unitPrice, 0),
    orderedAt: row.orderDate ? String(row.orderDate) : null,
    lines,
  };
}
