import path from "node:path";

/**
 * Eski WordPress adreslerinin (`/wp-content/uploads/…`) yaşadığı yer. Belge ve arşiv dosyaları (PDF, ZIP, DOCX…) medya
 * kitaplığının işlediği türlerde olmadığından, özgün adresleriyle burada sunulur; dış bağlantılar ve arama sonuçları kırılmaz.
 */
export function wpUploadsDir(): string {
  return path.resolve(process.cwd(), process.env.WP_UPLOADS_DIR ?? "./data/wp-uploads");
}

/** Yalnızca belge/arşiv uzantıları sunulur. Betik, sayfa ve vektör görseller (`.html`, `.js`, `.svg`, `.php`…) asla. */
export const WP_UPLOAD_TYPES: Record<string, { mime: string; attachment: boolean }> = {
  pdf: { mime: "application/pdf", attachment: false },
  txt: { mime: "text/plain; charset=utf-8", attachment: false },
  csv: { mime: "text/csv; charset=utf-8", attachment: true },
  doc: { mime: "application/msword", attachment: true },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", attachment: true },
  xls: { mime: "application/vnd.ms-excel", attachment: true },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", attachment: true },
  ppt: { mime: "application/vnd.ms-powerpoint", attachment: true },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", attachment: true },
  zip: { mime: "application/zip", attachment: true },
  rar: { mime: "application/vnd.rar", attachment: true },
  "7z": { mime: "application/x-7z-compressed", attachment: true },
};

const SEGMENT = /^[\p{L}\p{N}._() %+-]{1,160}$/u;

/** İstek parçalarını diskteki güvenli yola çevirir; geçersizse `null` (yol gezinmesi, gizli dosya, izinsiz uzantı). */
export function resolveUploadPath(base: string, segments: string[]): { file: string; ext: string; name: string } | null {
  if (segments.length === 0 || segments.length > 6) return null;
  for (const raw of segments) {
    let segment: string;
    try {
      segment = decodeURIComponent(raw);
    } catch {
      return null;
    }
    if (!SEGMENT.test(segment) || segment === "." || segment === ".." || segment.startsWith(".")) return null;
  }
  const decoded = segments.map((segment) => decodeURIComponent(segment));
  const name = decoded[decoded.length - 1] ?? "";
  const ext = name.includes(".") ? (name.split(".").pop() ?? "").toLowerCase() : "";
  if (!WP_UPLOAD_TYPES[ext]) return null;
  const file = path.resolve(base, ...decoded);
  if (!file.startsWith(base + path.sep)) return null;
  return { file, ext, name };
}
