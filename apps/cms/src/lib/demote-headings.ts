/**
 * Sayfa başlığı zaten `<h1>` ise içerikteki `hero` ve 1. düzey `heading` / `heading_element`
 * bloklarını `<h2>`'ye düşürür; sayfada tek `<h1>` kuralı (SEO ve erişilebilirlik) korunur.
 */
export function demoteHeroTitles<T extends { type: string; props: Record<string, unknown>; children?: T[] }>(
  nodes: T[]
): T[] {
  return nodes.map((node) => ({
    ...node,
    ...(node.type === "hero" ? { props: { ...node.props, demoteTitle: true } } : {}),
    ...((node.type === "heading" || node.type === "heading_element") &&
    /^(h?1)$/i.test(String(node.props.level ?? ""))
      ? { props: { ...node.props, level: typeof node.props.level === "number" ? 2 : "h2" } }
      : {}),
    ...(node.children ? { children: demoteHeroTitles(node.children) } : {}),
  }));
}
