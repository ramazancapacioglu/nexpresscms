/**
 * Satır içi metin düzenleme eşleştirmesi (saf): bloğun `props` içindeki metinler ile render edilmiş DOM'daki yaprak metin
 * öğeleri eşleştirilir. Render kodu değişmez; eşleşen öğe `contenteditable` yapılır, düzenleme yoluna (`items.0.title`) geri yazılır.
 */
export interface EditableString {
  /** `props` içindeki yol (örn. `["items", 0, "title"]`) */
  path: Array<string | number>;
  value: string;
}

/** Metin olarak görünmeyen/yapısal alanlar: bunlar asla satır içi düzenlenmez. */
const SKIP_KEYS = new Set([
  "id", "html", "href", "url", "src", "image", "icon", "iconSide", "align", "layout", "source", "orderBy", "tone", "styleVariant", "aspectRatio",
  "containerMode", "shape", "direction", "level", "listType", "formId", "action", "kind", "mime", "poster", "targetDate", "query", "alt", "altText",
  "titleText", "bgVideo", "bgPoster", "color", "background", "slug", "category", "tag", "language", "code",
]);

/** Boşlukları tek aralığa indirir (DOM `textContent` ile props karşılaştırması için). */
export const normalizeText = (v: string) => v.replace(/\s+/g, " ").trim();

/** `props` içindeki düzenlenebilir metinleri (sığ ve iç içe, en çok 200) belge sırasıyla toplar. */
export function collectEditableStrings(props: Record<string, unknown> | null | undefined): EditableString[] {
  const out: EditableString[] = [];
  const walk = (node: unknown, path: Array<string | number>, depth: number) => {
    if (out.length >= 200 || depth > 4) return;
    if (typeof node === "string") {
      const value = normalizeText(node);
      const last = path[path.length - 1];
      if (value.length >= 2 && value.length <= 600 && !(typeof last === "string" && SKIP_KEYS.has(last)) && !/^(https?:|\/|#|data:)/i.test(value)) out.push({ path, value });
      return;
    }
    if (Array.isArray(node)) node.forEach((v, i) => walk(v, [...path, i], depth + 1));
    else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) if (!SKIP_KEYS.has(k) || typeof v !== "string") walk(v, [...path, k], depth + 1);
  };
  walk(props ?? {}, [], 0);
  return out;
}

/**
 * Metinleri DOM'daki yaprak metinlere eşler. `texts[i]` = i. yaprak öğenin normalize `textContent`'i (belge sırasıyla).
 * Aynı metin birden çok yerde geçerse, props sırasıyla DOM sırası eşleşir; eşleşmeyenler atlanır.
 * Dönüş: yaprak öğe indeksi → props yolu.
 */
export function assignStringsToTexts(strings: EditableString[], texts: string[]): Map<number, EditableString["path"]> {
  const used = new Set<number>();
  const out = new Map<number, EditableString["path"]>();
  for (const s of strings) {
    const idx = texts.findIndex((t, i) => !used.has(i) && t === s.value);
    if (idx >= 0) {
      used.add(idx);
      out.set(idx, s.path);
    }
  }
  return out;
}

/** Düzenlenen yeni metni yola yazar (kopya döner; ilk üst düzey anahtar ve yeni değeri verir). */
export function patchAtPath(props: Record<string, unknown>, path: EditableString["path"], value: string): { key: string; value: unknown } | null {
  const [head, ...rest] = path;
  if (typeof head !== "string") return null;
  if (rest.length === 0) return { key: head, value };
  const clone = structuredClone(props[head]);
  let cur: any = clone;
  for (let i = 0; i < rest.length - 1; i++) {
    cur = cur?.[rest[i] as never];
    if (cur === undefined || cur === null) return null;
  }
  const last = rest[rest.length - 1] as never;
  if (cur === undefined || cur === null || !(last in Object(cur))) return null;
  cur[last] = value;
  return { key: head, value: clone };
}
