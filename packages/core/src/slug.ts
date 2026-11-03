import { termSlug } from "./dynamic-content";

/** Başlıktan sayfa adresi: Türkçe harfler sadeleşir, en çok `max` karakter, kelime sınırında kesilir. Boş sonuç `""` döner. */
export function slugFromTitle(title: string, max = 70): string {
  const full = termSlug(title.slice(0, 300));
  if (full.length <= max) return full;
  const cut = full.slice(0, max);
  const at = cut.lastIndexOf("-");
  return (at > max * 0.5 ? cut.slice(0, at) : cut).replace(/-+$/, "");
}

/** `base` doluysa `base-2`, `base-3`… ilk boş olanı döner (en çok 1000 deneme sonra rastgele sonek). */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; n <= 1000; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
