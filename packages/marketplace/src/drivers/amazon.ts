import { fail, marketplaceRequest, requireFields } from "../http";
import type { MarketplaceDriver, MarketplaceEnvironment, RemoteMarketplaceOrder } from "../types";

const ENDPOINTS: Record<string, { prod: string; sandbox: string; lwa: string }> = {
  eu: {
    prod: "https://sellingpartnerapi-eu.amazon.com",
    sandbox: "https://sandbox.sellingpartnerapi-eu.amazon.com",
    lwa: "https://api.amazon.com/auth/o2/token",
  },
  na: {
    prod: "https://sellingpartnerapi-na.amazon.com",
    sandbox: "https://sandbox.sellingpartnerapi-na.amazon.com",
    lwa: "https://api.amazon.com/auth/o2/token",
  },
  fe: {
    prod: "https://sellingpartnerapi-fe.amazon.com",
    sandbox: "https://sandbox.sellingpartnerapi-fe.amazon.com",
    lwa: "https://api.amazon.co.jp/auth/o2/token",
  },
};

async function accessToken(credentials: Record<string, string>): Promise<DriverToken> {
  const region = credentials.region?.trim() || "eu";
  const host = ENDPOINTS[region] ?? ENDPOINTS.eu;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: credentials.refreshToken.trim(),
    client_id: credentials.clientId.trim(),
    client_secret: credentials.clientSecret.trim(),
  });
  const res = await marketplaceRequest(host.lwa, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const token = (res.json as { access_token?: string } | null)?.access_token;
  if (!token) {
    return { ok: false, message: `LWA ${res.status}: ${res.text.slice(0, 240)}` };
  }
  return { ok: true, token, host: credentials.environmentHost ?? "" };
}

type DriverToken = { ok: true; token: string; host: string } | { ok: false; message: string };

function spHost(environment: MarketplaceEnvironment, credentials: Record<string, string>): string {
  const region = credentials.region?.trim() || "eu";
  const host = ENDPOINTS[region] ?? ENDPOINTS.eu;
  return environment === "sandbox" ? host.sandbox : host.prod;
}

export const amazonDriver: MarketplaceDriver = {
  id: "amazon",
  name: "Amazon",
  summary: "Selling Partner API. LWA refresh token ile erişim jetonu; sipariş Orders v0, stok Listings Items yaması.",
  docsUrl: "https://developer-docs.amazon.com/sp-api/docs/connecting-to-the-selling-partner-api",
  auth: "lwa",
  capabilities: ["test_connection", "push_price_stock", "pull_orders"],
  credentialFields: [
    { key: "sellerId", label: "Seller ID", required: true },
    { key: "marketplaceId", label: "Marketplace ID", required: true, placeholder: "A33AVAJ2PDY3EV", help: "Amazon.com.tr varsayılanı." },
    { key: "region", label: "Bölge (eu, na, fe)", required: true, placeholder: "eu" },
    { key: "clientId", label: "LWA Client ID", required: true },
    { key: "clientSecret", label: "LWA Client Secret", required: true, secret: true },
    { key: "refreshToken", label: "LWA Refresh Token", required: true, secret: true },
  ],
  async testConnection(environment, credentials) {
    const missing = requireFields(credentials, [
      "sellerId",
      "marketplaceId",
      "clientId",
      "clientSecret",
      "refreshToken",
    ]);
    if (missing) return fail(missing);
    const token = await accessToken(credentials);
    if (!token.ok) return token;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const url = `${spHost(environment, credentials)}/orders/v0/orders?MarketplaceIds=${encodeURIComponent(credentials.marketplaceId.trim())}&CreatedAfter=${encodeURIComponent(since)}&MaxResultsPerPage=1`;
    const res = await marketplaceRequest(url, {
      headers: {
        "x-amz-access-token": token.token,
        Accept: "application/json",
      },
    });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, message: "Amazon SP-API erişimi doğrulandı." };
    }
    return fail(`Amazon ${res.status}: ${res.text.slice(0, 280)}`);
  },
  async pushPriceStock(environment, credentials, items) {
    const missing = requireFields(credentials, [
      "sellerId",
      "marketplaceId",
      "clientId",
      "clientSecret",
      "refreshToken",
    ]);
    if (missing) return fail(missing);
    const token = await accessToken(credentials);
    if (!token.ok) return token;
    let accepted = 0;
    const errors: string[] = [];
    for (const item of items.slice(0, 20)) {
      const url = `${spHost(environment, credentials)}/listings/2021-08-01/items/${encodeURIComponent(credentials.sellerId.trim())}/${encodeURIComponent(item.sku)}?marketplaceIds=${encodeURIComponent(credentials.marketplaceId.trim())}`;
      const res = await marketplaceRequest(url, {
        method: "PATCH",
        headers: {
          "x-amz-access-token": token.token,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          productType: "PRODUCT",
          patches: [
            {
              op: "replace",
              path: "/attributes/fulfillment_availability",
              value: [{ fulfillment_channel_code: "DEFAULT", quantity: item.quantity }],
            },
            {
              op: "replace",
              path: "/attributes/purchasable_offer",
              value: [
                {
                  marketplace_id: credentials.marketplaceId.trim(),
                  currency: item.currency,
                  our_price: [{ schedule: [{ value_with_tax: Number(item.salePrice.toFixed(2)) }] }],
                },
              ],
            },
          ],
        }),
      });
      if (res.status >= 200 && res.status < 300) accepted += 1;
      else errors.push(`${item.sku}: ${res.status}`);
    }
    if (accepted === 0) return fail(errors.join("; ").slice(0, 280) || "Amazon stok güncellenemedi.");
    return {
      ok: errors.length === 0,
      message: errors.length ? `Kısmi: ${errors.join("; ")}` : "Listeler güncellendi.",
      data: { accepted },
    };
  },
  async pullOrders(environment, credentials, since) {
    const missing = requireFields(credentials, [
      "marketplaceId",
      "clientId",
      "clientSecret",
      "refreshToken",
    ]);
    if (missing) return fail(missing);
    const token = await accessToken(credentials);
    if (!token.ok) return token;
    const url = `${spHost(environment, credentials)}/orders/v0/orders?MarketplaceIds=${encodeURIComponent(credentials.marketplaceId.trim())}&CreatedAfter=${encodeURIComponent(since.toISOString())}&MaxResultsPerPage=50`;
    const res = await marketplaceRequest(url, {
      headers: { "x-amz-access-token": token.token, Accept: "application/json" },
    });
    if (res.status < 200 || res.status >= 300) {
      return fail(`Amazon sipariş ${res.status}: ${res.text.slice(0, 280)}`);
    }
    const orders = ((res.json as { payload?: { Orders?: unknown[] } })?.payload?.Orders ?? []) as unknown[];
    return { ok: true, message: `${orders.length} sipariş alındı.`, data: orders.map(mapAmazon) };
  },
};

function mapAmazon(raw: unknown): RemoteMarketplaceOrder {
  const row = (raw ?? {}) as Record<string, unknown>;
  const total = row.OrderTotal as { Amount?: string; CurrencyCode?: string } | undefined;
  return {
    externalId: String(row.AmazonOrderId ?? ""),
    status: String(row.OrderStatus ?? ""),
    buyerName: String(row.BuyerInfo ? "Alıcı" : "Alıcı"),
    currency: total?.CurrencyCode ?? "TRY",
    total: Number(total?.Amount ?? 0),
    orderedAt: row.PurchaseDate ? String(row.PurchaseDate) : null,
    lines: [],
  };
}
