import { fail, marketplaceRequest, requireFields } from "../http";
import type { MarketplaceDriver, RemoteMarketplaceOrder } from "../types";

const HOST = "https://api.n11.com";

function headers(credentials: Record<string, string>): HeadersInit {
  return {
    appkey: credentials.appKey.trim(),
    appsecret: credentials.appSecret.trim(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export const n11Driver: MarketplaceDriver = {
  id: "n11",
  name: "n11",
  summary: "REST appkey/appsecret başlıkları. Ürün SOAP stok servisleri kapatıldı; fiyat-stok task ucu kullanılır.",
  docsUrl: "https://developer.n11.com/documentation/n11-siparis-entegrasyonu/siparis-listeleme-servisi/",
  auth: "app_key",
  capabilities: ["test_connection", "push_price_stock", "pull_orders"],
  credentialFields: [
    { key: "appKey", label: "App Key", required: true },
    { key: "appSecret", label: "App Secret", required: true, secret: true },
    { key: "integrator", label: "Entegratör adı", required: true, placeholder: "NexPress" },
  ],
  async testConnection(_environment, credentials) {
    const missing = requireFields(credentials, ["appKey", "appSecret"]);
    if (missing) return fail(missing);
    const url = `${HOST}/rest/delivery/v1/shipmentPackages?status=Created&page=0&size=1`;
    const res = await marketplaceRequest(url, { headers: headers(credentials) });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, message: "n11 sipariş servisi yanıt verdi." };
    }
    return fail(`n11 ${res.status}: ${res.text.slice(0, 280)}`);
  },
  async pushPriceStock(_environment, credentials, items) {
    const missing = requireFields(credentials, ["appKey", "appSecret", "integrator"]);
    if (missing) return fail(missing);
    const body = {
      integrator: credentials.integrator.trim(),
      skus: items.slice(0, 1000).map((item) => {
        const sale = Number(item.salePrice.toFixed(2));
        const list = Number((item.listPrice && item.listPrice >= sale ? item.listPrice : sale).toFixed(2));
        return {
          stockCode: item.sku,
          quantity: item.quantity,
          salePrice: sale,
          listPrice: list,
          currencyType: item.currency === "TRY" ? "TL" : item.currency,
        };
      }),
    };
    const res = await marketplaceRequest(`${HOST}/ms/product/tasks/price-stock-update`, {
      method: "POST",
      headers: headers(credentials),
      body: JSON.stringify(body),
    });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, message: "n11 fiyat-stok görevi kuyruğa alındı.", data: { accepted: items.length } };
    }
    return fail(`n11 stok ${res.status}: ${res.text.slice(0, 280)}`);
  },
  async pullOrders(_environment, credentials, since) {
    const missing = requireFields(credentials, ["appKey", "appSecret"]);
    if (missing) return fail(missing);
    const url = `${HOST}/rest/delivery/v1/shipmentPackages?status=Created&page=0&size=50&startDate=${since.getTime()}&orderByDirection=DESC`;
    const res = await marketplaceRequest(url, { headers: headers(credentials) });
    if (res.status < 200 || res.status >= 300) {
      return fail(`n11 sipariş ${res.status}: ${res.text.slice(0, 280)}`);
    }
    const content = Array.isArray((res.json as { content?: unknown })?.content)
      ? (res.json as { content: unknown[] }).content
      : [];
    return { ok: true, message: `${content.length} paket alındı.`, data: content.map(mapN11) };
  },
};

function mapN11(raw: unknown): RemoteMarketplaceOrder {
  const row = (raw ?? {}) as Record<string, unknown>;
  const linesRaw = Array.isArray(row.lines) ? row.lines : [];
  const lines = linesRaw.map((line) => {
    const l = line as Record<string, unknown>;
    return {
      sku: String(l.stockCode ?? l.productSellerCode ?? ""),
      title: String(l.productName ?? ""),
      quantity: Number(l.quantity ?? 1),
      unitPrice: Number(l.price ?? 0),
    };
  });
  return {
    externalId: String(row.orderNumber ?? row.id ?? ""),
    status: String(row.shipmentPackageStatus ?? row.status ?? "Created"),
    buyerName: String(row.customerfullName ?? row.customerFullName ?? "Müşteri"),
    currency: "TRY",
    total: Number(row.totalAmount ?? lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)),
    orderedAt: row.lastModifiedDate ? String(row.lastModifiedDate) : null,
    lines,
  };
}
