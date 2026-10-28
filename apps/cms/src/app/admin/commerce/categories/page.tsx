import React from "react";
import { headers } from "next/headers";
import { getCommerceOpsRepository } from "@nexpress/database";
import { CategoryBoard } from "@/components/admin/commerce/category-board";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const categories = await getCommerceOpsRepository(siteId).listCategories();
  return <CategoryBoard categories={categories} />;
}
