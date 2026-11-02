import { useEffect, useRef, useState } from "react";
import {
  draftStorageKey,
  parseStoredDraft,
  recoveryDecision,
  snapshotToDraftFields,
  type EditorDraftFields,
  type SnapshotLike,
  type StoredDraft,
} from "@nexpress/core";
import type { ContentStatus } from "@nexpress/core";
import type { useDualModeEditorSave } from "./use-dual-mode-editor-save";

const DRAFT_DEBOUNCE_MS = 1200;

/** useDualModeEditor — aşama 7: Safety (çıkış uyarısı, Ctrl+S, yerel taslak, kurtarma, revizyon yükleme) */
export function useDualModeEditorSafety(p: ReturnType<typeof useDualModeEditorSave>) {
  const { siteId, contentId, lockedType, initialDoc, isDirty, docSignature, draftFields, handleSave, status } = p;
  const storageKey = draftStorageKey(siteId, contentId ?? initialDoc?.contentId, lockedType, p.locale);
  const docUpdatedAtMs = initialDoc?.updatedAt ? new Date(initialDoc.updatedAt).getTime() : 0;
  const [recovery, setRecovery] = useState<StoredDraft | null>(null);
  const checkedRef = useRef(false);

  const applyFields = (f: EditorDraftFields) => {
    p.setTitle(f.title);
    p.setSlug(f.slug);
    p.setTldr(f.tldr);
    p.setBlocks(f.blocks as never);
    p.setProseSyncToken((v: number) => v + 1);
    p.setMetaTitle(f.metaTitle);
    p.setMetaDescription(f.metaDescription);
    p.setCanonicalUrl(f.canonicalUrl);
    p.setRichSchema((f.richSchema ?? {}) as never);
    p.setNoIndex(f.noIndex);
    p.setSchemaType(f.schemaType);
    p.setImportanceScore(f.importanceScore);
    p.setFeaturedImageUrl(f.featuredImageUrl);
    p.setFeaturedImageAlt(f.featuredImageAlt);
    p.setFeaturedImageCaption(f.featuredImageCaption);
    p.setFocusKeyword(f.focusKeyword);
    p.setVisibility(f.visibility as never);
    p.setScheduledAt(f.scheduledAt);
    p.setSelectedCategories(f.categories);
    p.setSelectedTags(f.tags);
    p.setAllowComments(f.allowComments);
    p.setAllowReviews(f.allowReviews);
    p.setShowShareButtons(f.showShareButtons);
  };

  // Açılışta: kaydedilmemiş yerel taslak var mı?
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    try {
      const stored = parseStoredDraft(localStorage.getItem(storageKey));
      const decision = recoveryDecision(stored, docSignature, docUpdatedAtMs);
      if (decision === "offer") setRecovery(stored);
      else if (decision === "discard") localStorage.removeItem(storageKey);
    } catch {
      /* depo kapalı olabilir */
    }
    // yalnızca ilk render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Değişiklik varken yerel taslağı yaz; kayıttan sonra temizle
  useEffect(() => {
    if (recovery) return; // karar verilene dek eski taslağı ezme
    const t = setTimeout(() => {
      try {
        if (isDirty) {
          const draft: StoredDraft = { v: 1, signature: docSignature, at: Date.now(), baseUpdatedAt: docUpdatedAtMs, fields: draftFields };
          localStorage.setItem(storageKey, JSON.stringify(draft));
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        /* kota/gizli mod */
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [isDirty, docSignature, recovery, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sekmeyi kapatırken uyar
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // Ctrl/Cmd+S
  const saveRef = useRef<() => void>(() => {});
  saveRef.current = () => handleSave(status === "published" ? ("published" as ContentStatus) : ("draft" as ContentStatus));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const restoreRecovery = () => {
    if (!recovery) return;
    applyFields(recovery.fields);
    setRecovery(null);
    p.showToast("Yerel taslak geri yüklendi. Kaydetmek için Kaydet'e basın.");
  };
  const dismissRecovery = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* yok say */
    }
    setRecovery(null);
  };
  const applyRevision = (snapshot: SnapshotLike) => {
    applyFields(snapshotToDraftFields(snapshot));
    p.showToast("Sürüm yüklendi. Kaydetmek için Kaydet'e basın.");
  };

  return { ...p, recovery, restoreRecovery, dismissRecovery, applyRevision, inspectorApi: { ...p.inspectorApi, applyRevision } };
}
