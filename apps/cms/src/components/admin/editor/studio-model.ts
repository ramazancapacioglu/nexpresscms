import type { BlockNode, DesignTokens } from "@nexpress/core";

export const DEFAULT_STUDIO_TOKENS: DesignTokens = {
  colors: {
    primary: "#2563eb",
    primaryForeground: "#ffffff",
    secondary: "#0f172a",
    secondaryForeground: "#f8fafc",
    accent: "#4f46e5",
    accentForeground: "#ffffff",
    background: "#ffffff",
    foreground: "#09090b",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    border: "#e2e8f0",
  },
  typography: {
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "JetBrains Mono, monospace",
    baseSizePx: 16,
    scaleRatio: 1.25,
  },
  geometry: {
    borderRadius: "0.75rem",
    containerMaxWidth: "1200px",
    sectionSpacingY: "4rem",
    cardShadow: "md",
  },
};

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  section: "Kapsayıcı bölüm",
  columns: "Satır",
  column: "Sütun",
  hero: "Vitrin",
  tldr_box: "Kısa yanıt",
  stats_strip: "İstatistik şeridi",
  bento_features: "Özellik ızgarası",
  pricing_table: "Fiyatlandırma",
  product_embed: "Ürün kartı",
  howto_steps: "Adım adım",
  faq_accordion: "SSS",
  callout: "Not kutusu",
  cta_banner: "Çağrı şeridi",
  comparison_table: "Karşılaştırma",
  testimonial_grid: "Referanslar",
  review_box: "İnceleme kutusu",
  heading: "Başlık",
  heading_element: "Başlık",
  paragraph: "Paragraf",
  paragraph_element: "Paragraf",
  text_div: "Div",
  button_element: "Buton",
  image_figure: "Görsel",
  divider_spacer: "Ayırıcı",
  quote: "Alıntı",
  list_element: "Liste",
  video_embed: "Video",
  code_block: "Kod",
  info_box: "Bilgi kutusu",
  icon_list: "İkonlu liste",
  tabs: "Sekmeler",
  accordion: "Akordeon",
  toc: "İçindekiler",
  show_more: "Devamını göster",
  button_row: "Buton grubu",
  gallery: "Galeri",
  image_overlay: "Görsel kapak",
  video_popup: "Video bağlantısı",
  slider: "Slayt şeridi",
  countdown: "Geri sayım",
  progress_bar: "İlerleme",
  form_block: "Form",
  data_table: "Veri tablosu",
  map_embed: "Konum",
  search_box: "Arama",
  post_grid: "Yazı ızgarası",
  modal_panel: "Açılır not",
  split_content: "Bölünmüş içerik",
  portfolio_grid: "Çalışma ızgarası",
  product_row: "Ürün şeridi",
  user_card: "Kişi kartı",
  repeater: "Tekrarlayan kayıt",
  vector_mark: "Vektör işaret",
  single_icon: "Simge",
  countup: "Sayaç",
  marquee: "Kayan yazı şeridi",
  shape_divider: "Şekil ayırıcı",
};

export interface ColumnLayoutPreset {
  id: string;
  label: string;
  cols: number[];
}

/** NexPress yerleşim oranları. Satır, sütun yüzdelerine çözülür. */
export const COLUMN_LAYOUT_PRESETS: ColumnLayoutPreset[] = [
  { id: "12", label: "Tek sütun", cols: [100] },
  { id: "6+6", label: "İki eşit sütun", cols: [50, 50] },
  { id: "4+8", label: "Dar ve geniş", cols: [33.33, 66.67] },
  { id: "8+4", label: "Geniş ve dar", cols: [66.67, 33.33] },
  { id: "4+4+4", label: "Üç eşit sütun", cols: [33.33, 33.33, 33.33] },
  { id: "3+6+3", label: "Orta vurgulu üç sütun", cols: [25, 50, 25] },
  { id: "3+3+3+3", label: "Dört eşit sütun", cols: [25, 25, 25, 25] },
];

export function cloneBlockWithFreshIds(
  block: Omit<BlockNode, "id"> | BlockNode
): BlockNode {
  const copy = structuredClone(block) as BlockNode;
  let serial = 0;
  const walk = (node: BlockNode): BlockNode => ({
    ...node,
    id: `blk_${node.type}_${Date.now().toString(36)}_${(serial++).toString(36)}`,
    children: node.children?.map((child) => walk(child)),
  });

  return walk({ ...copy, id: copy.id ?? "root" });
}
