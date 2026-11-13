"use server";

import { revalidatePath } from "@/lib/cache";
import { requireUser } from "@/lib/auth/session";
import { answerPending, readQa, writeQa } from "@/lib/qa-store";
import { getScopedRepository } from "@nexpress/database";

async function touch(siteId: string, contentId: string) {
  const row = await getScopedRepository(siteId).getContentById(contentId, "tr");
  if (row?.slug) {
    await revalidatePath(`/${row.slug}`);
    await revalidatePath("/sorular");
  }
}

export async function answerQuestionAction(formData: FormData): Promise<void> {
  const session = await requireUser({ audit: "qa.answer" });
  const contentId = String(formData.get("contentId") ?? "");
  const id = String(formData.get("id") ?? "");
  const answer = String(formData.get("answer") ?? "");
  if (answer.replace(/\s+/g, " ").trim().length < 2) return;
  const state = await readQa(session.siteId, contentId);
  const next = answerPending(state, id, answer);
  if (next === state) return;
  await writeQa(session.siteId, contentId, next);
  await touch(session.siteId, contentId);
}

export async function dismissQuestionAction(formData: FormData): Promise<void> {
  const session = await requireUser({ audit: "qa.dismiss" });
  const contentId = String(formData.get("contentId") ?? "");
  const id = String(formData.get("id") ?? "");
  const state = await readQa(session.siteId, contentId);
  const next = { ...state, pending: state.pending.filter((row) => row.id !== id) };
  await writeQa(session.siteId, contentId, next);
  await touch(session.siteId, contentId);
}
