export type MarketplaceEnvironment = "sandbox" | "production";

export type MarketplaceCapability =
  | "test_connection"
  | "push_price_stock"
  | "pull_orders";

export interface CredentialField {
  key: string;
  label: string;
  secret?: boolean;
  required?: boolean;
  placeholder?: string;
  help?: string;
}

export interface MarketplaceDriverMeta {
  id: string;
  name: string;
  summary: string;
  docsUrl: string;
  auth: "basic" | "api_key" | "app_key" | "lwa";
  credentialFields: CredentialField[];
  capabilities: MarketplaceCapability[];
}

export interface StockPricePushItem {
  sku: string;
  quantity: number;
  /** Ana birim (ör. 149.90), kuruş değil. */
  salePrice: number;
  listPrice?: number;
  currency: string;
}

export interface RemoteMarketplaceOrder {
  externalId: string;
  status: string;
  buyerName: string;
  currency: string;
  total: number;
  orderedAt: string | null;
  lines: Array<{ sku: string; title: string; quantity: number; unitPrice: number }>;
}

export interface DriverResult<T> {
  ok: boolean;
  message: string;
  data?: T;
}

export interface MarketplaceDriver extends MarketplaceDriverMeta {
  testConnection(
    environment: MarketplaceEnvironment,
    credentials: Record<string, string>
  ): Promise<DriverResult<{ detail?: string }>>;
  pushPriceStock(
    environment: MarketplaceEnvironment,
    credentials: Record<string, string>,
    items: StockPricePushItem[]
  ): Promise<DriverResult<{ accepted: number }>>;
  pullOrders(
    environment: MarketplaceEnvironment,
    credentials: Record<string, string>,
    since: Date
  ): Promise<DriverResult<RemoteMarketplaceOrder[]>>;
}
