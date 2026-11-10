import type { BlockNode } from "@nexpress/core";

/** Yerel görsel dosya adını blok adreslerindeki `url`, `src` ve `image` alanlarına yazar. */
export function remapDatasetImageUrls(blocks: BlockNode[], localFiles: Set<string>): BlockNode[] {
  const mapUrl = (url: unknown): unknown => {
    if (typeof url !== "string" || !url) return url;
    const clean = url.split("?")[0] ?? url;
    const base = clean.split("/").pop() ?? "";
    if (base && localFiles.has(base)) return `/images/${base}`;
    return url;
  };
  const mapItem = (item: unknown): unknown => {
    if (!item || typeof item !== "object") return item;
    const row = item as Record<string, unknown>;
    return {
      ...row,
      ...("image" in row ? { image: mapUrl(row.image) } : {}),
      ...("src" in row ? { src: mapUrl(row.src) } : {}),
      ...("url" in row ? { url: mapUrl(row.url) } : {}),
      ...("backgroundImage" in row ? { backgroundImage: mapUrl(row.backgroundImage) } : {}),
    };
  };
  return blocks.map((node) => {
    const props = { ...(node.props ?? {}) };
    for (const key of ["src", "image", "url", "backgroundImage"] as const) {
      if (key in props) props[key] = mapUrl(props[key]);
    }
    if (Array.isArray(props.items)) props.items = props.items.map(mapItem);
    if (Array.isArray(props.buttons)) props.buttons = props.buttons.map(mapItem);
    return {
      ...node,
      props,
      children: node.children ? remapDatasetImageUrls(node.children, localFiles) : undefined,
    };
  });
}

/** Öne çıkan görsel adresini yerel dosyayla değiştirir. */
export function remapDatasetAsset(url: string | null | undefined, localFiles: Set<string>): string | null {
  if (!url) return null;
  const mapped = remapDatasetImageUrls([{ id: "x", type: "image_figure", props: { url } }], localFiles)[0]?.props?.url;
  return typeof mapped === "string" ? mapped : url;
}

const CAMPAIGN_ANCHOR = "akinsoft-kampanyalar";

/** Kampanya çapasına yazı listesi ekler. Derleyici bu siteye özel blok üretmez. */
export function appendDatasetLists(blocks: BlockNode[]): BlockNode[] {
  return blocks.map((node) => {
    const children = node.children ? appendDatasetLists(node.children) : undefined;
    const anchor = String(node.props?.anchorId ?? node.style?.anchorId ?? "");
    if (node.type === "section" && anchor === CAMPAIGN_ANCHOR) {
      const kids = children ?? [];
      if (!kids.some((child) => child.type === "dynamic_list" || child.type === "post_grid")) {
        return {
          ...node,
          children: [
            ...kids,
            {
              id: `wp_list_${node.id}`,
              type: "dynamic_list",
              props: {
                source: "posts",
                categorySlug: CAMPAIGN_ANCHOR,
                limit: 3,
                columns: 3,
                layout: "cards",
                showImage: true,
                showExcerpt: true,
                showDate: false,
              },
            },
          ],
        };
      }
    }
    return children ? { ...node, children } : node;
  });
}
