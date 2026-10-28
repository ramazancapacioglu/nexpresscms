"use server";

import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getCommerceOpsRepository } from "@nexpress/database";
import { parseMoneyInputToCents, type CommerceDiscountType, type CommerceReturnKind, type CommerceReturnStatus } from "@nexpress/commerce";

async function siteId() {
  return (await headers()).get("x-nexpress-site-id") ?? "default";
}

function touch() {
  revalidatePath("/admin/commerce", "layout");
}

export async function saveCategoryAction(input: { id?: string; parentId?: string; name: string; slug: string }) {
  await requireUser({ audit: "commerce.saveCategory" });
  const id = await getCommerceOpsRepository(await siteId()).saveCategory(input);
  touch();
  return id;
}

export async function deleteCategoryAction(id: string) {
  await requireUser({ audit: "commerce.deleteCategory" });
  await getCommerceOpsRepository(await siteId()).deleteCategory(id);
  touch();
}

export async function saveAttributeAction(input: { id?: string; name: string; slug: string; labels: string }) {
  await requireUser({ audit: "commerce.saveAttribute" });
  const id = await getCommerceOpsRepository(await siteId()).saveAttribute({
    ...input,
    labels: input.labels.split(",").map((item) => item.trim()).filter(Boolean),
  });
  touch();
  return id;
}

export async function saveVariantsAction(input: {
  productId: string;
  variants: Array<{ sku: string; priceInput: string; stockQuantity: number; valueIds: string[] }>;
}) {
  await requireUser({ audit: "commerce.saveVariants" });
  await getCommerceOpsRepository(await siteId()).replaceVariants(
    input.productId,
    input.variants.map((variant) => ({
      sku: variant.sku,
      priceCents: parseMoneyInputToCents(variant.priceInput),
      compareAtCents: null,
      stockQuantity: variant.stockQuantity,
      valueIds: variant.valueIds,
      imageUrl: null,
    }))
  );
  touch();
}

export async function setProductCategoriesAction(productId: string, categoryIds: string[]) {
  await requireUser({ audit: "commerce.setProductCategories" });
  await getCommerceOpsRepository(await siteId()).setProductCategories(productId, categoryIds);
  touch();
}

export async function saveCustomerGroupAction(input: { id?: string; name: string; description?: string }) {
  await requireUser({ audit: "commerce.saveCustomerGroup" });
  const id = await getCommerceOpsRepository(await siteId()).saveGroup(input);
  touch();
  return id;
}

export async function saveCustomerAction(input: {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  groupId?: string;
  source: "site" | "marketplace";
}) {
  await requireUser({ audit: "commerce.saveCustomer" });
  const id = await getCommerceOpsRepository(await siteId()).saveCustomer(input);
  touch();
  return id;
}

export async function addLoyaltyAction(customerId: string, points: number, reason: string) {
  await requireUser({ audit: "commerce.addLoyalty" });
  await getCommerceOpsRepository(await siteId()).addLoyalty(customerId, points, reason);
  touch();
}

export async function saveCampaignAction(input: {
  id?: string;
  name: string;
  discountType: CommerceDiscountType;
  value: number;
  audience: "all" | "group" | "customer";
  groupId?: string;
  customerId?: string;
  active: boolean;
}) {
  await requireUser({ audit: "commerce.saveCampaign" });
  const id = await getCommerceOpsRepository(await siteId()).saveCampaign({
    ...input,
    groupId: input.groupId || null,
    customerId: input.customerId || null,
    startsAt: null,
    endsAt: null,
  });
  touch();
  return id;
}

export async function saveCouponAction(input: {
  code: string;
  discountType: CommerceDiscountType;
  value: number;
  customerId?: string;
  groupId?: string;
  usageLimit?: number;
  active: boolean;
}) {
  await requireUser({ audit: "commerce.saveCoupon" });
  const id = await getCommerceOpsRepository(await siteId()).saveCoupon({
    campaignId: null,
    code: input.code,
    discountType: input.discountType,
    value: input.value,
    customerId: input.customerId || null,
    groupId: input.groupId || null,
    usageLimit: input.usageLimit ?? null,
    active: input.active,
  });
  touch();
  return id;
}

export async function saveReturnAction(input: {
  source: "site" | "marketplace";
  orderId: string;
  orderNumber: string;
  kind: CommerceReturnKind;
  reason: string;
}) {
  await requireUser({ audit: "commerce.saveReturn" });
  const id = await getCommerceOpsRepository(await siteId()).saveReturn({
    ...input,
    status: "requested",
    note: "",
  });
  touch();
  return id;
}

export async function updateReturnStatusAction(id: string, status: CommerceReturnStatus) {
  await requireUser({ audit: "commerce.updateReturnStatus" });
  await getCommerceOpsRepository(await siteId()).updateReturnStatus(id, status);
  touch();
}

export async function saveShippingAction(input: {
  id?: string;
  name: string;
  carrier: string;
  flatRateInput: string;
  freeThresholdInput: string;
  enabled: boolean;
}) {
  await requireUser({ audit: "commerce.saveShipping" });
  const id = await getCommerceOpsRepository(await siteId()).saveShipping({
    name: input.name,
    carrier: input.carrier,
    flatRateCents: parseMoneyInputToCents(input.flatRateInput),
    freeThresholdCents: parseMoneyInputToCents(input.freeThresholdInput),
    enabled: input.enabled,
    id: input.id,
  });
  touch();
  return id;
}
