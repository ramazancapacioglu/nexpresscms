"use client";

import { useEffect } from "react";

const KEY = "nx-chunk-reload";

/** Yeni derleme açılınca eski parça adları düşer. Başarılı panel bu işareti temizler. */
export function ClearChunkReload() {
  useEffect(() => {
    sessionStorage.removeItem(KEY);
  }, []);
  return null;
}

/** Eksik JavaScript parçası HTML 404 döndüyse belgeyi bir kez yeniler. */
export function reloadIfStaleChunk(error: Error): boolean {
  const stale =
    error.name === "ChunkLoadError" ||
    /Loading chunk|Failed to fetch dynamically imported module|ChunkLoadError/i.test(error.message);
  if (!stale) return false;
  try {
    if (sessionStorage.getItem(KEY) === "1") return false;
    sessionStorage.setItem(KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
