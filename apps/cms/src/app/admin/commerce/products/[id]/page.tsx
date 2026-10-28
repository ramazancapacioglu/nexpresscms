import React from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCommerceOpsRepository, getCommerceRepository } from "@nexpress/database";
import { CommerceProductEditor } from "@/components/admin/commerce/commerce-product-editor";

export const dynamic = "force-dynamic";

export default async function AdminCommerceProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getCommerceRepository(siteId);
  const ops = getCommerceOpsRepository(siteId);
  const [categories, attributes] = await Promise.all([ops.listCategories(), ops.listAttributes()]);

  if (id === "yeni") {
    return <CommerceProductEditor product={null} categories={categories} attributes={attributes} />;
  }

  const product = await repo.getProductById(id);
  if (!product) notFound();
  const [variants, categoryIds] = await Promise.all([
    ops.listVariants(product.id),
    ops.productCategoryIds(product.id),
  ]);

  return (
    <CommerceProductEditor
      product={product}
      categories={categories}
      attributes={attributes}
      variants={variants}
      initialCategoryIds={categoryIds}
    />
  );
}
