import { AppearanceNav } from "@/components/admin/section-tabs";
import React from "react";
import { getDesignLibraryRepository } from "@nexpress/database";
import { isPluginModuleEnabled } from "@nexpress/core";
import "@/plugins/register";
import { requireUser } from "@/lib/auth/session";
import { DesignLibraryClient, type LibraryItem } from "./design-library-client";

export const dynamic = "force-dynamic";

export default async function DesignLibraryPage() {
  const me = await requireUser();
  const items = await getDesignLibraryRepository(me.siteId).list();
  const pluginOn = await isPluginModuleEnabled(me.siteId, "@nexpress-pro/ai-design", "generator");
  return (
    <div className="space-y-4">
    <AppearanceNav />
    <DesignLibraryClient
      items={items.map((i): LibraryItem => ({ id: i.id, kind: i.kind, name: i.name, description: i.description, category: i.category, source: i.source, prompt: i.prompt, placeholderData: i.placeholderData, score: Number((i.report as { score?: number }).score ?? 0), createdAt: i.createdAt.toISOString(), payload: i.payload }))}
      aiReady={Boolean(process.env.OPENAI_API_KEY?.trim())}
      pluginOn={pluginOn}
    />
    </div>
  );
}
