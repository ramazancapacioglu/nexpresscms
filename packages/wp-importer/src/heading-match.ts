/** Sayfa başlığı ile içerikteki ilk başlığın aynı konuyu söyleyip söylemediği (iki kez başlık basılmasın diye). */
const norm = (value: string) =>
  value
    .toLocaleLowerCase("tr")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);

export function headingRepeatsTitle(title: string, heading: string): boolean {
  const a = new Set(norm(title));
  const b = new Set(norm(heading));
  if (a.size === 0 || b.size === 0) return false;
  const shared = [...a].filter((word) => b.has(word)).length;
  return shared / Math.min(a.size, b.size) >= 0.8;
}
