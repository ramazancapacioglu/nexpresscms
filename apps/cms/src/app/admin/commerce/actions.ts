"use server";

import { requireAdmin, requireUser } from "@/lib/auth/session";
import { assertPlugin, COMMERCE_PLUGIN_ID } from "@/lib/plugin-gate";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getCommerceOpsRepository, getCommerceRepository } from "@nexpress/database";
import {
  parseMoneyInputToCents,
  type CommerceOrderStatus,
  type CommerceProductStatus,
  type CommerceSettings,
  type CommerceStockStatus,
} from "@nexpress/commerce";

async function siteIdFromHeaders(): Promise<string> {
  const reqHeaders = await headers();
  return reqHeaders.get("x-nexpress-site-id") ?? "default";
}

export async function saveCommerceSettingsAction(input: Partial<CommerceSettings>) {
  await assertPlugin(COMMERCE_PLUGIN_ID);
  await requireAdmin("commerce.saveCommerceSettings");
  const repo = getCommerceRepository(await siteIdFromHeaders());
  await repo.saveCommerceSettings(input);
  revalidatePath("/admin/commerce");
  revalidatePath("/tr/magaza");
}

export async function saveCommerceProductAction(input: {
  id?: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription?: string;
  descriptionHtml?: string;
  priceInput: string;
  compareAtInput?: string;
  stockQuantity?: number;
  stockStatus?: CommerceStockStatus;
  status?: CommerceProductStatus;
  imageUrl?: string | null;
  contentId?: string | null;
  productKind?: "simple" | "variable";
  categoryIds?: string[];
}) {
  await assertPlugin(COMMERCE_PLUGIN_ID);
  await requireUser({ audit: "commerce.saveCommerceProduct" });
  const repo = getCommerceRepository(await siteIdFromHeaders());
  const product = await repo.saveProduct({
    id: input.id,
    sku: input.sku,
    slug: input.slug,
    name: input.name,
    shortDescription: input.shortDescription,
    descriptionHtml: input.descriptionHtml,
    priceCents: parseMoneyInputToCents(input.priceInput),
    compareAtCents: input.compareAtInput
      ? parseMoneyInputToCents(input.compareAtInput)
      : null,
    stockQuantity: input.stockQuantity,
    stockStatus: input.stockStatus,
    status: input.status,
    imageUrl: input.imageUrl,
    contentId: input.contentId,
    productKind: input.productKind,
  });
  if (input.categoryIds) {
    await getCommerceOpsRepository(await siteIdFromHeaders()).setProductCategories(
      product.id,
      input.categoryIds
    );
  }
  revalidatePath("/admin/commerce/products");
  revalidatePath(`/admin/commerce/products/${product.id}`);
  revalidatePath("/tr/magaza");
  return product.id;
}

export async function deleteCommerceProductAction(id: string) {
  await assertPlugin(COMMERCE_PLUGIN_ID);
  await requireUser({ audit: "commerce.deleteCommerceProduct" });
  const repo = getCommerceRepository(await siteIdFromHeaders());
  await repo.deleteProduct(id);
  revalidatePath("/admin/commerce/products");
  revalidatePath("/tr/magaza");
}

export async function updateCommerceOrderStatusAction(id: string, status: CommerceOrderStatus) {
  await assertPlugin(COMMERCE_PLUGIN_ID);
  await requireUser({ audit: "commerce.updateCommerceOrderStatus" });
  const repo = getCommerceRepository(await siteIdFromHeaders());
  await repo.updateOrderStatus(id, status);
  revalidatePath("/admin/commerce/orders");
  revalidatePath(`/admin/commerce/orders/${id}`);
}
