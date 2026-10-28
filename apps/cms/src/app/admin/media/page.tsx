import React from "react";
import { headers } from "next/headers";
import { getMediaAdminRepository, getMediaFolderRepository, getScopedRepository } from "@nexpress/database";
import { MediaStudioClient } from "@/components/admin/media-studio-client";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const [mediaAssets, folders, unusedIds] = await Promise.all([
    getScopedRepository(siteId).listMediaAssets(),
    getMediaFolderRepository(siteId).list(),
    getMediaAdminRepository(siteId).findUnusedIds(),
  ]);
  return <MediaStudioClient initialMedia={mediaAssets} initialFolders={folders} initialUnusedIds={unusedIds} />;
}
