/** Medya klasörleri (saf mantık): ad doğrulama, derinlik, döngü denetimi ve ağaç üretimi. */
export const MEDIA_FOLDER_MAX_DEPTH = 3;
export const MEDIA_FOLDER_NAME_MAX = 60;

export interface FolderLite {
  id: string;
  parentId: string | null;
  name: string;
}

export interface FolderNode extends FolderLite {
  depth: number;
  children: FolderNode[];
}

export function normalizeFolderName(raw: string): string {
  return raw.replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, MEDIA_FOLDER_NAME_MAX);
}

/** Kökten klasöre kadar kaç düzey (kök klasör = 1); bozuk/döngülü zincirde Infinity. */
export function folderDepth(folders: FolderLite[], id: string | null): number {
  const byId = new Map(folders.map((f) => [f.id, f]));
  let depth = 0;
  const seen = new Set<string>();
  for (let cur = id ? byId.get(id) : undefined; cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) {
    if (seen.has(cur.id)) return Infinity;
    seen.add(cur.id);
    depth++;
  }
  return depth;
}

/** Bir alt ağacın en derin düzeyi (klasörün kendisi dahil, 1'den başlar). */
function subtreeHeight(folders: FolderLite[], id: string): number {
  const kids = folders.filter((f) => f.parentId === id);
  return 1 + (kids.length ? Math.max(...kids.map((k) => subtreeHeight(folders, k.id))) : 0);
}

export type FolderCheck = { ok: true } | { ok: false; error: string };

/**
 * `id` klasörünü (yeniyse `null`) `parentId` altına koymak geçerli mi?
 * Denetler: üst klasör var mı, kendi alt ağacına taşıma (döngü), en çok 3 düzey, kardeşler arasında aynı ad.
 */
export function checkFolderPlacement(folders: FolderLite[], input: { id: string | null; parentId: string | null; name: string }): FolderCheck {
  const name = normalizeFolderName(input.name);
  if (!name) return { ok: false, error: "Klasör adı boş olamaz." };
  if (input.parentId && !folders.some((f) => f.id === input.parentId)) return { ok: false, error: "Üst klasör bulunamadı." };
  if (input.id) {
    if (input.parentId === input.id) return { ok: false, error: "Klasör kendi içine taşınamaz." };
    let cur = input.parentId ? folders.find((f) => f.id === input.parentId) : undefined;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      if (cur.id === input.id) return { ok: false, error: "Klasör kendi alt klasörüne taşınamaz." };
      seen.add(cur.id);
      cur = cur.parentId ? folders.find((f) => f.id === cur!.parentId) : undefined;
    }
  }
  const above = folderDepth(folders, input.parentId);
  const below = input.id ? subtreeHeight(folders, input.id) : 1;
  if (above + below > MEDIA_FOLDER_MAX_DEPTH) return { ok: false, error: `En çok ${MEDIA_FOLDER_MAX_DEPTH} düzey klasör açılabilir.` };
  const key = name.toLocaleLowerCase("tr");
  if (folders.some((f) => f.id !== input.id && (f.parentId ?? null) === (input.parentId ?? null) && f.name.toLocaleLowerCase("tr") === key)) return { ok: false, error: "Aynı klasörde bu adla başka bir klasör var." };
  return { ok: true };
}

/** Düz listeyi ada göre sıralı ağaca çevirir (bozuk üst başvurusu olanlar köke düşer). */
export function buildFolderTree(folders: FolderLite[]): FolderNode[] {
  const ids = new Set(folders.map((f) => f.id));
  const make = (f: FolderLite, depth: number, seen: Set<string>): FolderNode => ({
    ...f,
    depth,
    children: folders
      .filter((c) => c.parentId === f.id && !seen.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"))
      .map((c) => make(c, depth + 1, new Set([...seen, c.id]))),
  });
  return folders
    .filter((f) => !f.parentId || !ids.has(f.parentId))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"))
    .map((f) => make(f, 1, new Set([f.id])));
}

/** Klasör ve tüm alt klasörlerinin kimlikleri. */
export function folderSubtreeIds(folders: FolderLite[], id: string): string[] {
  const out = [id];
  for (let i = 0; i < out.length; i++) for (const f of folders) if (f.parentId === out[i] && !out.includes(f.id)) out.push(f.id);
  return out;
}
