export type CommerceProductStatus = "draft" | "published";
export type CommerceStockStatus = "instock" | "outofstock" | "onbackorder";
export type CommerceOrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled";

export interface CommerceSettings {
  enabled: boolean;
  currency: string;
  /** Örn. `magaza` → `/{locale}/magaza` */
  shopBasePath: string;
  flatShippingCents: number;
  freeShippingThresholdCents: number;
  checkoutNotificationEmail: string;
  allowGuestCheckout: boolean;
}

export interface CommerceProductDto {
  id: string;
  siteId: string;
  contentId: string | null;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string;
  descriptionHtml: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  stockQuantity: number;
  stockStatus: CommerceStockStatus;
  status: CommerceProductStatus;
  imageUrl: string | null;
  galleryUrls: string[];
  productKind: "simple" | "variable";
  createdAt: Date;
  updatedAt: Date;
}

export interface CommerceOrderItemDto {
  id: string;
  siteId: string;
  orderId: string;
  productId: string;
  sku: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface CommerceOrderDto {
  id: string;
  siteId: string;
  orderNumber: string;
  status: CommerceOrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: CommerceAddress;
  billingAddress: CommerceAddress | null;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  customerNote: string | null;
  source: "site" | "marketplace";
  channelId: string | null;
  customerId: string | null;
  couponCode: string | null;
  discountCents: number;
  shippingMethodId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: CommerceOrderItemDto[];
}

export interface CommerceAddress {
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
}

export interface SaveCommerceProductInput {
  id?: string;
  contentId?: string | null;
  sku: string;
  slug: string;
  name: string;
  shortDescription?: string;
  descriptionHtml?: string;
  priceCents: number;
  compareAtCents?: number | null;
  currency?: string;
  stockQuantity?: number;
  stockStatus?: CommerceStockStatus;
  status?: CommerceProductStatus;
  imageUrl?: string | null;
  galleryUrls?: string[];
  productKind?: "simple" | "variable";
}

export interface CreateCommerceOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: CommerceAddress;
  billingAddress?: CommerceAddress | null;
  customerNote?: string;
  couponCode?: string;
  shippingMethodId?: string;
  customerId?: string;
  discountCents?: number;
  shippingCents?: number;
  lines: { productId: string; variantId?: string; quantity: number }[];
}

export interface CartLine {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CartSnapshot {
  lines: CartLine[];
}
