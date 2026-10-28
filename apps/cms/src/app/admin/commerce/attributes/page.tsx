import React from "react";
import { headers } from "next/headers";
import { getCommerceOpsRepository } from "@nexpress/database";
import { AttributeBoard } from "@/components/admin/commerce/attribute-board";

export const dynamic = "force-dynamic";

export default async function AttributesPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const attributes = await getCommerceOpsRepository(siteId).listAttributes();
  return <AttributeBoard attributes={attributes} />;
}
