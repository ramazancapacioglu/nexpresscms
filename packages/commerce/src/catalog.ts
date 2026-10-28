export type CommerceAudience = "all" | "group" | "customer";
export type CommerceDiscountType = "percent" | "fixed" | "free_shipping";
export type CommerceReturnKind = "return" | "exchange";
export type CommerceReturnStatus = "requested" | "approved" | "received" | "completed" | "rejected";
export type CommerceCustomerSource = "site" | "marketplace";

export interface CommerceCategoryDto {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface CommerceAttributeValueDto {
  id: string;
  attributeId: string;
  label: string;
  sortOrder: number;
}

export interface CommerceAttributeDto {
  id: string;
  name: string;
  slug: string;
  values: CommerceAttributeValueDto[];
}

export interface CommerceVariantDto {
  id: string;
  productId: string;
  sku: string;
  priceCents: number;
  compareAtCents: number | null;
  stockQuantity: number;
  valueIds: string[];
  imageUrl: string | null;
}

export interface CommerceCustomerGroupDto {
  id: string;
  name: string;
  description: string;
}

export interface CommerceCustomerDto {
  id: string;
  source: CommerceCustomerSource;
  channelId: string | null;
  externalKey: string | null;
  name: string;
  email: string;
  phone: string | null;
  groupId: string | null;
  loyaltyPoints: number;
  createdAt: Date;
}

export interface CommerceLoyaltyEntryDto {
  id: string;
  customerId: string;
  points: number;
  reason: string;
  createdAt: Date;
}

export interface CommerceCampaignDto {
  id: string;
  name: string;
  discountType: CommerceDiscountType;
  value: number;
  audience: CommerceAudience;
  groupId: string | null;
  customerId: string | null;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}

export interface CommerceCouponDto {
  id: string;
  campaignId: string | null;
  code: string;
  discountType: CommerceDiscountType;
  value: number;
  customerId: string | null;
  groupId: string | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
}

export interface CommerceReturnDto {
  id: string;
  source: CommerceCustomerSource;
  orderId: string;
  orderNumber: string;
  kind: CommerceReturnKind;
  status: CommerceReturnStatus;
  reason: string;
  note: string;
  createdAt: Date;
}

export interface CommerceShippingMethodDto {
  id: string;
  name: string;
  carrier: string;
  flatRateCents: number;
  freeThresholdCents: number;
  enabled: boolean;
}
