import React from "react";
import { headers } from "next/headers";
import { sanitizeQaState } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { QuestionsInbox } from "./inbox";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  await requireUser();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const rows = await getScopedRepository(siteId).listContents({ locale: "tr", type: "ai_prompt" });
  const pending = rows.flatMap((row) => {
    const state = sanitizeQaState((row.schemaAttributes as Record<string, unknown>)._qa);
    return state.pending.map((item) => ({
      contentId: row.id,
      title: row.title,
      slug: row.slug,
      id: item.id,
      question: item.question,
      name: item.name,
      date: item.date,
    }));
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <header>
        <h1 className="text-xl font-bold">Gelen sorular</h1>
        <p className="text-sm text-muted-foreground">Ziyaretçinin soru sayfasında bıraktığı kayıtlar. Cevap, sayfada ve SSS şemasında yayınlanır.</p>
      </header>
      <QuestionsInbox rows={pending} />
    </div>
  );
}
