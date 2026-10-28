import { fail, marketplaceRequest, requireFields } from "../http";
import type { MarketplaceDriver, RemoteMarketplaceOrder } from "../types";

function base(environment: "sandbox" | "production"): string {
  return environment === "sandbox"
    ? "https://sandbox-apis.ciceksepeti.com/api/v1"
    : "https://apis.ciceksepeti.com/api/v1";
}

function headers(credentials: Record<string, string>): HeadersInit {
  const sellerId = credentials.sellerId?.trim() ?? "";
  const integrator = credentials.integratorName?.trim();
  const userAgent = integrator ? `${sellerId}-${integrator}` : sellerId;
  return {
    "x-api-key": credentials.apiKey.trim(),
    "User-Agent": userAgent || "nexpress",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export const ciceksepetiDriver: MarketplaceDriver = {
  id: "ciceksepeti",
  name: "Çiçeksepeti",
  summary: "x-api-key ve User-Agent (satıcı ID). Stok fiyat PUT, siparişler tarih aralığıyla POST.",
  docsUrl: "https://ciceksepeti.dev/",
  auth: "api_key",
  capabilities: ["test_connection", "push_price_stock", "pull_orders"],
  credentialFields: [
    { key: "apiKey", label: "API Key", required: true, secret: true },
    { key: "sellerId", label: "Satıcı ID", required: true, help: "User-Agent olarak gider." },
    { key: "integratorName", label: "Entegratör adı", placeholder: "Boş bırakılabilir" },
  ],
  async testConnection(environment, credentials) {
    const missing = requireFields(credentials, ["apiKey", "sellerId"]);
    if (missing) return fail(missing);
    const res = await marketplaceRequest(`${base(environment)}/Products?Page=1&PageSize=1`, {
      headers: headers(credentials),
    });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, message: "Çiçeksepeti ürün servisi yanıt verdi." };
    }
    return fail(`Çiçeksepeti ${res.status}: ${res.text.slice(0, 280)}`);
  },
  async pushPriceStock(environment, credentials, items) {
    const missing = requireFields(credentials, ["apiKey", "sellerId"]);
    if (missing) return fail(missing);
    const body = {
      items: items.map((item) => ({
        stockCode: item.sku,
        StockQuantity: item.quantity,
        salesPrice: Number(item.salePrice.toFixed(2)),
        listPrice: Number((item.listPrice ?? item.salePrice).toFixed(2)),
      })),
    };
    const res = await marketplaceRequest(`${base(environment)}/Products/price-and-stock`, {
      method: "PUT",
      headers: headers(credentials),
      body: JSON.stringify(body),
    });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, message: "Stok ve fiyat gönderildi.", data: { accepted: items.length } };
    }
    return fail(`Çiçeksepeti stok ${res.status}: ${res.text.slice(0, 280)}`);
  },
  async pullOrders(environment, credentials, since) {
    const missing = requireFields(credentials, ["apiKey", "sellerId"]);
    if (missing) return fail(missing);
    const end = new Date();
    const body = {
      startDate: formatCs(since),
      endDate: formatCs(end),
      pageSize: 50,
      page: 0,
    };
    const res = await marketplaceRequest(`${base(environment)}/Order/GetOrders`, {
      method: "POST",
      headers: headers(credentials),
      body: JSON.stringify(body),
    });
    if (res.status < 200 || res.status >= 300) {
      return fail(`Çiçeksepeti sipariş ${res.status}: ${res.text.slice(0, 280)}`);
    }
    const supplierOrderList = (res.json as { supplierOrderListWithBranch?: unknown[] } | null)
      ?.supplierOrderListWithBranch;
    const list = Array.isArray(supplierOrderList)
      ? supplierOrderList
      : Array.isArray((res.json as { orders?: unknown[] } | null)?.orders)
        ? (res.json as { orders: unknown[] }).orders
        : [];
    return { ok: true, message: `${list.length} sipariş alındı.`, data: list.map(mapCs) };
  },
};

function formatCs(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function mapCs(raw: unknown): RemoteMarketplaceOrder {
  const row = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(row.orderItemList) ? row.orderItemList : Array.isArray(row.items) ? row.items : [];
  const lines = items.map((item) => {
    const l = item as Record<string, unknown>;
    return {
      sku: String(l.code ?? l.stockCode ?? ""),
      title: String(l.name ?? l.productName ?? ""),
      quantity: Number(l.quantity ?? 1),
      unitPrice: Number(l.itemPrice ?? l.price ?? 0),
    };
  });
  return {
    externalId: String(row.orderId ?? row.orderItemId ?? row.id ?? ""),
    status: String(row.orderItemStatusId ?? row.status ?? ""),
    buyerName: String(row.receiverName ?? row.customerName ?? "Müşteri"),
    currency: "TRY",
    total: Number(row.totalPrice ?? lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)),
    orderedAt: row.orderCreateDate ? String(row.orderCreateDate) : null,
    lines,
  };
}
