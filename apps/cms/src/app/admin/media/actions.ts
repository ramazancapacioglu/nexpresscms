"use server";

import { getMediaAdminRepository, getMediaFolderRepository, type MediaFolderDto } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { revalidatePath } from "@/lib/cache";
import { removeAsset } from "@/lib/media/storage";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const refresh = () => revalidatePath("/admin/media");

export async function createMediaFolderAction(input: { name: string; parentId: string | null }): Promise<Result<{ folder: MediaFolderDto }>> {
  const me = await requireUser({ audit: "media.folder-create" });
  const r = await getMediaFolderRepository(me.siteId).create(input.name, input.parentId);
  if (!r.ok) return r;
  await refresh();
  return { ok: true, folder: r.folder };
}

export async function updateMediaFolderAction(input: { id: string; name?: string; parentId?: string | null }): Promise<Result<{ folder: MediaFolderDto }>> {
  const me = await requireUser({ audit: "media.folder-update" });
  const r = await getMediaFolderRepository(me.siteId).update(input.id, { name: input.name, parentId: input.parentId });
  if (!r.ok) return r;
  await refresh();
  return { ok: true, folder: r.folder };
}

/** Klasörü siler; dosyalar ve alt klasörler üst klasöre çıkar, hiçbir dosya silinmez. */
export async function deleteMediaFolderAction(input: { id: string }): Promise<Result> {
  const me = await requireUser({ audit: "media.folder-delete" });
  const ok = await getMediaFolderRepository(me.siteId).remove(input.id);
  if (!ok) return { ok: false, error: "Klasör bulunamadı." };
  await recordAudit({ id: me.sub, email: me.email }, "media.folder-delete", { detail: input.id });
  await refresh();
  return { ok: true };
}

export async function moveMediaAction(input: { ids: string[]; folderId: string | null }): Promise<Result<{ moved: number }>> {
  const me = await requireUser({ audit: "media.move" });
  const ids = input.ids.filter((i) => typeof i === "string").slice(0, 500);
  const moved = await getMediaFolderRepository(me.siteId).moveAssets(ids, input.folderId);
  if (moved === 0 && ids.length > 0) return { ok: false, error: "Taşınamadı: klasör bulunamadı." };
  await refresh();
  return { ok: true, moved };
}

/**
 * Kullanılmayan medyaları toplu siler (yalnızca yönetici).
 * Sunucu tarafında `findUnusedIds()` yeniden doğrulanır; kullanımda olan hiçbir dosya silinmez.
 */
export async function bulkDeleteUnusedMediaAction(input: {
  ids: string[];
}): Promise<Result<{ deletedIds: string[]; skippedInUse: number }>> {
  const me = await requireAdmin("media.bulk-delete");
  const requested = Array.from(new Set(input.ids.filter((i) => typeof i === "string" && i.trim()))).slice(0, 500);
  if (requested.length === 0) return { ok: false, error: "Silinecek dosya seçilmedi." };

  const media = getMediaAdminRepository(me.siteId);
  const unusedSet = new Set(await media.findUnusedIds());
  const deletedIds: string[] = [];
  let skippedInUse = 0;

  for (const id of requested) {
    if (!unusedSet.has(id)) {
      skippedInUse++;
      continue;
    }
    const removed = await media.deleteAsset(id);
    if (removed) {
      await removeAsset(me.siteId, id);
      deletedIds.push(id);
    }
  }

  await recordAudit(
    { id: me.sub, email: me.email },
    "media.bulk-delete",
    { detail: `${deletedIds.length} kullanılmayan dosya silindi${skippedInUse ? `, ${skippedInUse} kullanımda atlandı` : ""}` }
  );
  await refresh();
  return { ok: true, deletedIds, skippedInUse };
}
