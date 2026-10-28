import React from "react";
import { headers } from "next/headers";
import { getScopedRepository } from "@nexpress/database";
import { MediaStudioClient } from "@/components/admin/media-studio-client";

export default async function AdminMediaPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const mediaAssets = await repo.listMediaAssets();

  return <MediaStudioClient initialMedia={mediaAssets} />;
}
