import type {
  CommerceAddress,
  CommerceCouponDto,
  CommerceOrderDto,
  CommerceOrderItemDto,
  CommerceOrderStatus,
  CommerceProductDto,
} from "@nexpress/commerce";
import type { Tables } from "./dialect";

export function mapProduct(row: Tables["commerceProducts"]["$inferSelect"]): CommerceProductDto {
  return {
    id: row.id,
    siteId: row.siteId,
    contentId: row.contentId,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    descriptionHtml: row.descriptionHtml,
    priceCents: row.priceCents,
    compareAtCents: row.compareAtCents,
    currency: row.currency,
    stockQuantity: row.stockQuantity,
    stockStatus: row.stockStatus as CommerceProductDto["stockStatus"],
    status: row.status as CommerceProductDto["status"],
    imageUrl: row.imageUrl,
    galleryUrls: row.galleryUrls ?? [],
    productKind: row.productKind === "variable" ? "variable" : "simple",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapOrder(row: Tables["commerceOrders"]["$inferSelect"]): CommerceOrderDto {
  return {
    id: row.id,
    siteId: row.siteId,
    orderNumber: row.orderNumber,
    status: row.status as CommerceOrderStatus,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    shippingAddress: row.shippingAddress as unknown as CommerceAddress,
    billingAddress: (row.billingAddress as unknown as CommerceAddress | null) ?? null,
    subtotalCents: row.subtotalCents,
    shippingCents: row.shippingCents,
    taxCents: row.taxCents,
    totalCents: row.totalCents,
    currency: row.currency,
    customerNote: row.customerNote,
    source: row.source === "marketplace" ? "marketplace" : "site",
    channelId: row.channelId,
    customerId: row.customerId,
    couponCode: row.couponCode,
    discountCents: row.discountCents,
    shippingMethodId: row.shippingMethodId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapOrderItem(row: Tables["commerceOrderItems"]["$inferSelect"]): CommerceOrderItemDto {
  return {
    id: row.id,
    siteId: row.siteId,
    orderId: row.orderId,
    productId: row.productId,
    sku: row.sku,
    title: row.title,
    quantity: row.quantity,
    unitPriceCents: row.unitPriceCents,
    lineTotalCents: row.lineTotalCents,
  };
}

export function evaluateCouponQuote(
  coupon: CommerceCouponDto | null | undefined,
  subtotalCents: number,
  customerId?: string | null,
  customerGroupId?: string | null
) {
  if (!coupon) return { discountCents: 0, coupon: null as CommerceCouponDto | null, message: "Kupon bulunamadı." };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { discountCents: 0, coupon, message: "Kupon kullanım limiti doldu." };
  }
  if (coupon.customerId && coupon.customerId !== customerId) {
    return { discountCents: 0, coupon, message: "Kupon bu müşteriye tanımlı değil." };
  }
  if (coupon.groupId && customerId && customerGroupId !== coupon.groupId) {
    return { discountCents: 0, coupon, message: "Kupon bu müşteri grubuna tanımlı değil." };
  }
  const discountCents =
    coupon.discountType === "percent"
      ? Math.round((subtotalCents * coupon.value) / 100)
      : coupon.discountType === "fixed"
        ? coupon.value
        : 0;
  return { discountCents: Math.min(subtotalCents, discountCents), coupon, message: "Kupon uygulandı." };
}
