import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getDesignLibraryRepository } from "@nexpress/database";
import { AppearanceNav } from "@/components/admin/section-tabs";
import { StudioClient, type StudioLibraryItem } from "./studio-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kütüphane & Yapay Zekâ | NexPress CMS",
  description: "AI destekli bölüm, sayfa ve tema jetonu üretimi ile kayıtlı tasarım kütüphanesi.",
};

export default async function AdminStudioPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const libraryRepo = getDesignLibraryRepository(siteId);

  const rawLibrary = await libraryRepo.list();
  const library: StudioLibraryItem[] = rawLibrary.map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    category: item.category,
    description: item.description,
    source: item.source,
    blocksCount: Array.isArray((item.payload as Record<string, unknown> | undefined)?.blocks)
      ? ((item.payload as Record<string, unknown>).blocks as unknown[]).length
      : 0,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <AppearanceNav />
      <StudioClient initialLibrary={library} />
    </div>
  );
}
