import { normalizeLibraryCategory } from "@nexpress/core";

/** Eski kümelerden yeni Türkçe kategorilere: her örnek tasarım tam bir kategoriye aittir. */
const MAP: Record<string, string> = {
  lib_cr_ticker: "text", lib_cr_poster: "text", lib_cr_story_cards: "cards", lib_cr_timeline: "timeline",
  lib_cr_chat_faq: "accordion", lib_cr_awards: "logos", lib_cr_app_download: "cta", lib_cr_dual_cta: "cta",
  lib_cr_resource_cards: "cards", lib_cr_event: "cta", lib_cr_video_hero: "video_text", lib_cr_metric_hero: "hero",
  lib_mod_announce_pill: "cta", lib_mod_logo_cloud: "logos", lib_mod_testimonials: "testimonials",
  lib_mod_quote_spotlight: "testimonials", lib_mod_team_grid: "people", lib_mod_bento_visual: "cards",
  lib_mod_gradient_icons: "cards", lib_mod_alt_rows: "image_text", lib_mod_device_showcase: "image_text",
  lib_mod_process_steps: "timeline", lib_mod_before_after: "comparison", lib_mod_stat_cards: "stats",
  lib_mod_faq_split: "accordion", lib_mod_pricing_cards: "pricing", lib_mod_mosaic: "gallery", lib_mod_cta_gradient: "cta",
  lib_mod_form_newsletter_strip: "subscribe", lib_layout_tabs_showcase: "tabs", lib_bento_4grid: "cards",
  lib_stats_4col: "stats", lib_pricing_3tier: "pricing", lib_commerce_product_embed: "product",
  lib_aio_tldr_box: "text", lib_aio_howto_steps: "timeline", lib_aio_faq_accordion: "accordion",
  lib_editorial_callout: "text", lib_editorial_cta_banner: "cta", lib_editorial_code: "text", lib_editorial_prose: "text",
  lib_atomic_dynamic_list: "posts", lib_atomic_media_file: "video_text", lib_atomic_image_figure: "image_text",
  lib_atomic_button: "cta", lib_atomic_review_box: "testimonials", lib_studio_row_2col: "text", lib_studio_row_3col: "text",
  lib_editorial_comparison_table: "comparison", lib_sticky_anchor_bar: "list", lib_campaign_hero_countdown: "cta",
  lib_qa_featured_answer: "text", lib_split_story: "image_text", lib_icon_list: "list", lib_toc: "list",
  lib_show_more: "accordion", lib_tabs: "tabs", lib_accordion: "accordion", lib_button_row: "cta", lib_gallery: "gallery",
  lib_overlay: "image_text", lib_slider: "gallery", lib_video: "video_text", lib_vector: "image_text",
  lib_info_box: "cards", lib_portfolio: "gallery", lib_posts: "posts", lib_user: "people", lib_countdown: "cta",
  lib_product_row: "product", lib_form: "contact", lib_form_dialog: "contact", lib_search: "contact", lib_modal: "text",
  lib_progress: "stats", lib_table: "data_table", lib_map: "location", lib_repeater: "list",
};

export function categoryFor(id: string, fallback: string): string {
  return MAP[id] ?? normalizeLibraryCategory(fallback);
}
