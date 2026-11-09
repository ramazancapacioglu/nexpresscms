<?php
/**
 * Paket toplama ve gönderme. E-ticaret türleri alınmaz.
 */

if (!defined("ABSPATH")) {
  exit;
}

final class Nexpress_Bridge_Transfer {
  public static function boot(): void {
    add_action("admin_post_nexpress_bridge_send", [self::class, "send"]);
  }

  public static function send(): void {
    if (!current_user_can("manage_options")) {
      wp_die("Yetki yok.");
    }
    check_admin_referer("nexpress_bridge_send");
    if (function_exists("set_time_limit")) {
      set_time_limit(180);
    }
    $base = untrailingslashit((string) get_option("nexpress_bridge_url", ""));
    $code = (string) get_option("nexpress_bridge_code", "");
    if (!str_starts_with($base, "https://") || $code === "") {
      self::back("NexPress adresi https olmalı ve eşleştirme kodu dolu olmalı.");
    }
    $restart = isset($_POST["nexpress_bridge_restart"]);
    if ($restart) {
      delete_option("nexpress_bridge_job");
    }
    $job = get_option("nexpress_bridge_job", ["page" => 1, "media" => 0, "contentDone" => false]);
    if (!is_array($job)) {
      $job = ["page" => 1, "media" => 0, "contentDone" => false];
    }
    $started = microtime(true);
    $pair = self::post($base . "/api/wp-bridge/v1/pair", ["code" => $code, "origin" => home_url()]);
    if (empty($pair["token"])) {
      self::back(is_string($pair["error"] ?? null) ? $pair["error"] : "Eşleşme olmadı. Panelden yeni kod alın.");
    }
    $token = (string) $pair["token"];
    if ($restart || (int) ($job["page"] ?? 1) <= 1 && empty($job["contentDone"])) {
      $begun = self::push($base, $token, ["kind" => "begin"]);
      if (!empty($begun["error"])) {
        self::back((string) $begun["error"]);
      }
      self::push($base, $token, ["kind" => "site", "title" => get_bloginfo("name"), "tagline" => get_bloginfo("description")]);
      self::push($base, $token, self::design());
      self::push($base, $token, ["kind" => "forms", "items" => self::forms()]);
      self::push($base, $token, self::seo());
      self::push($base, $token, ["kind" => "redirects", "items" => self::redirects()]);
    }
    $notes = [];
    if (empty($job["contentDone"])) {
      $page = max(1, (int) ($job["page"] ?? 1));
      while (microtime(true) - $started < 70) {
        $batch = self::content_batch($page);
        if ($batch === []) {
          $job["contentDone"] = true;
          $notes[] = "İçerik bitti.";
          break;
        }
        $result = self::push($base, $token, ["kind" => "content", "items" => $batch]);
        if (!empty($result["error"])) {
          $job["page"] = $page;
          update_option("nexpress_bridge_job", $job, false);
          self::back((string) $result["error"]);
        }
        $page++;
        $job["page"] = $page;
      }
      if (empty($job["contentDone"])) {
        $notes[] = "İçerik sürüyor. Yeniden basın.";
      }
    }
    $mediaLeft = true;
    $rounds = 0;
    while ($mediaLeft && $rounds < 4 && microtime(true) - $started < 110) {
      $offset = (int) ($job["media"] ?? 0);
      $batch = self::media_batch($offset);
      if ($batch === []) {
        $mediaLeft = false;
        $notes[] = "Görseller bitti.";
        break;
      }
      $result = self::push($base, $token, ["kind" => "media", "items" => $batch]);
      if (!empty($result["error"])) {
        update_option("nexpress_bridge_job", $job, false);
        self::back((string) $result["error"]);
      }
      $job["media"] = $offset + count($batch);
      $rounds++;
      if (count($batch) < 8) {
        $mediaLeft = false;
        $notes[] = "Görseller bitti.";
      }
    }
    if ($mediaLeft) {
      $notes[] = "Görsellerin devamı için yeniden basın.";
    }
    update_option("nexpress_bridge_job", $job, false);
    if (!empty($job["contentDone"]) && !$mediaLeft) {
      delete_option("nexpress_bridge_job");
      $notes[] = "Aktarım turu tamam.";
    }
    self::back(implode(" ", $notes) ?: "Paket gönderildi.");
  }

  private static function back(string $message): void {
    update_option("nexpress_bridge_notice", $message, false);
    wp_safe_redirect(admin_url("tools.php?page=nexpress-bridge"));
    exit;
  }

  /** @param array<string, mixed> $body */
  private static function post(string $url, array $body, string $token = ""): array {
    $headers = ["Content-Type" => "application/json; charset=utf-8"];
    if ($token !== "") {
      $headers["Authorization"] = "Bearer " . $token;
    }
    $response = wp_remote_post($url, ["timeout" => 90, "headers" => $headers, "body" => wp_json_encode($body)]);
    if (is_wp_error($response)) {
      return ["error" => $response->get_error_message()];
    }
    $status = (int) wp_remote_retrieve_response_code($response);
    $json = json_decode((string) wp_remote_retrieve_body($response), true);
    if ($status >= 300) {
      return ["error" => is_array($json) && isset($json["error"]) ? (string) $json["error"] : "HTTP " . $status];
    }
    return is_array($json) ? $json : ["error" => "Yanıt okunamadı."];
  }

  /** @param array<string, mixed> $body */
  private static function push(string $base, string $token, array $body): array {
    return self::post($base . "/api/wp-bridge/v1/push", $body, $token);
  }

  /** @return array<int, array<string, mixed>> */
  private static function content_batch(int $page): array {
    $types = get_post_types(["public" => true], "names");
    unset($types["product"], $types["attachment"]);
    $types = array_values(array_filter($types, static fn ($type) => !str_contains((string) $type, "form")));
    $query = new WP_Query([
      "post_type" => $types ?: ["page", "post"],
      "post_status" => ["publish", "draft", "private", "pending", "future"],
      "posts_per_page" => 6,
      "paged" => $page,
      "orderby" => "ID",
      "order" => "ASC",
      "ignore_sticky_posts" => true,
      "no_found_rows" => false,
    ]);
    $front = (int) get_option("page_on_front");
    $items = [];
    foreach ($query->posts as $post) {
      if (!$post instanceof WP_Post) {
        continue;
      }
      $items[] = self::content($post, $front);
    }
    return $items;
  }

  /** @return array<string, mixed> */
  private static function content(WP_Post $post, int $front): array {
    $layout = self::meta_layout((int) $post->ID);
    if ($layout === [] && function_exists("parse_blocks")) {
      $layout = self::blocks_to_layout(parse_blocks((string) $post->post_content));
    }
    $cats = get_the_terms($post, "category");
    $tags = get_the_terms($post, "post_tag");
    $comments = get_comments(["post_id" => $post->ID, "status" => "approve", "number" => 100]);
    return [
      "wpId" => (string) $post->ID,
      "kind" => $post->post_type === "post" ? "post" : ($post->post_type === "page" ? "page" : "other"),
      "status" => (string) $post->post_status,
      "title" => html_entity_decode(get_the_title($post), ENT_QUOTES, "UTF-8"),
      "slug" => (string) $post->post_name,
      "excerpt" => wp_strip_all_tags((string) $post->post_excerpt),
      "date" => (string) $post->post_date_gmt,
      "author" => (string) get_the_author_meta("display_name", (int) $post->post_author),
      "link" => (string) get_permalink($post),
      "featured" => self::abs_url((string) get_the_post_thumbnail_url($post, "full")),
      "front" => $front === (int) $post->ID,
      "categories" => self::terms(is_array($cats) ? $cats : []),
      "tags" => self::terms(is_array($tags) ? $tags : []),
      "seo" => [
        "title" => (string) (get_post_meta($post->ID, "rank_math_title", true) ?: get_post_meta($post->ID, "_yoast_wpseo_title", true)),
        "description" => (string) (get_post_meta($post->ID, "rank_math_description", true) ?: get_post_meta($post->ID, "_yoast_wpseo_metadesc", true)),
        "keyword" => (string) (get_post_meta($post->ID, "rank_math_focus_keyword", true) ?: get_post_meta($post->ID, "_yoast_wpseo_focuskw", true)),
        "canonical" => (string) (get_post_meta($post->ID, "rank_math_canonical_url", true) ?: get_post_meta($post->ID, "_yoast_wpseo_canonical", true)),
        "noindex" => (string) get_post_meta($post->ID, "rank_math_robots", true) === "noindex" || (string) get_post_meta($post->ID, "_yoast_wpseo_meta-robots-noindex", true) === "1",
        "schemaType" => self::schema_type((int) $post->ID),
      ],
      "schema" => self::schema_of((int) $post->ID),
      "layout" => $layout,
      "html" => $layout === [] ? (string) $post->post_content : "",
      "comments" => array_map(static function ($comment) {
        return [
          "wpId" => (string) $comment->comment_ID,
          "author" => (string) $comment->comment_author,
          "email" => (string) $comment->comment_author_email,
          "body" => wp_strip_all_tags((string) $comment->comment_content),
          "date" => (string) $comment->comment_date_gmt,
          "status" => (string) $comment->comment_approved,
          "parentWpId" => (string) $comment->comment_parent,
        ];
      }, is_array($comments) ? $comments : []),
    ];
  }

  /** Rank Math şema anahtarının tür son eki. */
  private static function schema_type(int $id): string {
    $all = get_post_meta($id);
    if (!is_array($all)) {
      return "";
    }
    foreach ($all as $key => $values) {
      if (is_string($key) && str_starts_with($key, "rank_math_schema_")) {
        return substr($key, strlen("rank_math_schema_"));
      }
    }
    $snippet = (string) get_post_meta($id, "rank_math_rich_snippet", true);
    return $snippet;
  }

  /** @return array<string, mixed> */
  private static function schema_of(int $id): array {
    $type = self::schema_type($id);
    $raw = null;
    $all = get_post_meta($id);
    if (is_array($all)) {
      foreach ($all as $key => $values) {
        if (is_string($key) && str_starts_with($key, "rank_math_schema_")) {
          $raw = maybe_unserialize((string) ($values[0] ?? ""));
          break;
        }
      }
    }
    $faqs = [];
    $name = "";
    $description = "";
    $os = "";
    $category = "";
    $price = "";
    $currency = "";
    if (is_array($raw)) {
      $name = self::schema_text($raw["name"] ?? "");
      $description = self::schema_text($raw["description"] ?? "");
      $os = self::schema_text($raw["operatingSystem"] ?? "");
      $category = self::schema_text($raw["applicationCategory"] ?? "");
      $offers = is_array($raw["offers"] ?? null) ? $raw["offers"] : [];
      $price = self::schema_text($offers["price"] ?? "");
      $currency = self::schema_text($offers["priceCurrency"] ?? "");
      $entities = $raw["mainEntity"] ?? [];
      if (is_array($entities) && isset($entities["name"])) {
        $entities = [$entities];
      }
      if (is_array($entities)) {
        foreach ($entities as $entity) {
          if (!is_array($entity)) {
            continue;
          }
          $answer = is_array($entity["acceptedAnswer"] ?? null) ? $entity["acceptedAnswer"] : [];
          $question = self::schema_text($entity["name"] ?? "");
          $reply = self::schema_text($answer["text"] ?? "");
          if ($question === "" || $reply === "" || str_contains($question, "%") || str_contains($reply, "%")) {
            continue;
          }
          $faqs[] = ["q" => $question, "a" => $reply];
        }
      }
    }
    return [
      "type" => $type,
      "name" => $name,
      "description" => $description,
      "os" => $os,
      "category" => $category,
      "price" => $price,
      "currency" => $currency,
      "faqs" => $faqs,
    ];
  }

  private static function schema_text(mixed $value): string {
    return is_string($value) ? trim(wp_strip_all_tags($value)) : "";
  }

  /** @param WP_Term[] $terms */
  private static function terms(array $terms): array {
    $out = [];
    foreach ($terms as $term) {
      $parent = $term->parent ? get_term($term->parent) : null;
      $out[] = [
        "slug" => (string) $term->slug,
        "name" => (string) $term->name,
        "parent" => $parent instanceof WP_Term ? (string) $parent->slug : "",
      ];
    }
    return $out;
  }

  /** @return array<int, array<string, mixed>> */
  private static function blocks_to_layout(array $blocks): array {
    $out = [];
    foreach ($blocks as $block) {
      if (!is_array($block)) {
        continue;
      }
      $name = strtolower((string) ($block["blockName"] ?? ""));
      $attrs = is_array($block["attrs"] ?? null) ? $block["attrs"] : [];
      $inner = is_array($block["innerBlocks"] ?? null) ? $block["innerBlocks"] : [];
      $html = (string) ($block["innerHTML"] ?? "");
      if ($name === "") {
        $text = trim(wp_strip_all_tags($html));
        if ($text !== "") {
          $out[] = ["type" => "paragraph", "text" => $text];
        }
        continue;
      }
      if (self::has($name, "column") && !self::has($name, "columns") && !self::has($name, "row")) {
        $out[] = ["type" => "column", "level" => self::span($attrs), "children" => self::blocks_to_layout($inner)];
        continue;
      }
      if (self::has($name, "columns") || self::has($name, "row")) {
        $out[] = ["type" => "columns", "children" => self::blocks_to_layout($inner)];
        continue;
      }
      if (self::has($name, "heading")) {
        $text = self::plain($attrs, $html);
        $asParagraph = str_starts_with(ltrim($html), "<p") || mb_strlen($text) > 90;
        if ($asParagraph) {
          $safe = wp_kses_post($html);
          $out[] = ["type" => "paragraph", "html" => $safe !== "" ? $safe : $text];
        } else {
          $out[] = ["type" => "heading", "level" => (int) ($attrs["level"] ?? 2), "text" => $text];
        }
        continue;
      }
      if (self::has($name, "paragraph") || self::has($name, "text")) {
        $out[] = ["type" => "paragraph", "html" => wp_kses_post($html)];
        continue;
      }
      if (self::has($name, "image")) {
        $out[] = ["type" => "image", "url" => self::abs_url((string) ($attrs["url"] ?? self::src($html))), "alt" => (string) ($attrs["alt"] ?? "")];
        continue;
      }
      if (self::has($name, "button")) {
        $out[] = ["type" => "button", "label" => self::plain($attrs, $html), "href" => (string) ($attrs["url"] ?? $attrs["href"] ?? self::href($html))];
        continue;
      }
      if (self::has($name, "list")) {
        $out[] = ["type" => "list", "ordered" => ($attrs["ordered"] ?? false) === true, "items" => self::list_items($html)];
        continue;
      }
      if (self::has($name, "cover") || self::has($name, "group") || self::has($name, "section")) {
        $out[] = [
          "type" => self::has($name, "cover") ? "cover" : "section",
          "full" => ($attrs["align"] ?? "") === "full",
          "background" => self::color($attrs),
          "children" => self::blocks_to_layout($inner),
        ];
        continue;
      }
      if ($inner !== []) {
        $out[] = ["type" => "section", "children" => self::blocks_to_layout($inner)];
        continue;
      }
      if (trim(wp_strip_all_tags($html)) !== "") {
        $out[] = ["type" => "html", "html" => $html];
      }
    }
    return $out;
  }

  /** @return array<int, array<string, mixed>> */
  private static function meta_layout(int $id): array {
    foreach (get_post_meta($id) as $values) {
      $raw = is_array($values) ? (string) ($values[0] ?? "") : (string) $values;
      if ($raw === "" || $raw[0] !== "[") {
        continue;
      }
      $decoded = json_decode($raw, true);
      if (is_array($decoded) && isset($decoded[0]["elType"])) {
        return self::elements_to_layout($decoded);
      }
    }
    return [];
  }

  /** @param array<int, mixed> $nodes */
  private static function elements_to_layout(array $nodes): array {
    $out = [];
    foreach ($nodes as $node) {
      if (!is_array($node)) {
        continue;
      }
      $el = (string) ($node["elType"] ?? "");
      $settings = is_array($node["settings"] ?? null) ? $node["settings"] : [];
      $children = is_array($node["elements"] ?? null) ? $node["elements"] : [];
      if ($el === "section" || $el === "container") {
        $pad = is_array($settings["padding"] ?? null) ? (int) ($settings["padding"]["top"] ?? 0) : 0;
        $out[] = [
          "type" => "section",
          "full" => ($settings["content_width"] ?? "") === "full" || ($settings["layout"] ?? "") === "full_width",
          "background" => (string) ($settings["background_color"] ?? ""),
          "padding" => $pad,
          "children" => self::elements_to_layout($children),
        ];
      } elseif ($el === "column") {
        $out[] = ["type" => "column", "level" => (int) ($settings["_inline_size"] ?? 1), "children" => self::elements_to_layout($children)];
      } elseif ($el === "widget") {
        $widget = self::widget((string) ($node["widgetType"] ?? ""), $settings);
        if ($widget !== []) {
          $out[] = $widget;
        }
      }
    }
    return $out;
  }

  /** @param array<string, mixed> $settings */
  private static function widget(string $type, array $settings): array {
    $name = strtolower($type);
    if (self::has($name, "heading")) {
      return ["type" => "heading", "level" => (int) ($settings["header_size"] ?? 2), "text" => wp_strip_all_tags((string) ($settings["title"] ?? ""))];
    }
    if (self::has($name, "text") || self::has($name, "editor")) {
      return ["type" => "paragraph", "html" => wp_kses_post((string) ($settings["editor"] ?? $settings["text"] ?? ""))];
    }
    if (self::has($name, "image")) {
      $url = is_array($settings["image"] ?? null) ? (string) ($settings["image"]["url"] ?? "") : (string) ($settings["url"] ?? "");
      return ["type" => "image", "url" => self::abs_url($url), "alt" => (string) ($settings["image_alt"] ?? $settings["alt"] ?? "")];
    }
    if (self::has($name, "button")) {
      return ["type" => "button", "label" => (string) ($settings["text"] ?? $settings["title"] ?? ""), "href" => (string) ($settings["link"]["url"] ?? $settings["url"] ?? "")];
    }
    if (self::has($name, "accordion")) {
      $items = [];
      foreach ((array) ($settings["tabs"] ?? $settings["items"] ?? []) as $tab) {
        if (!is_array($tab)) {
          continue;
        }
        $items[] = ["title" => (string) ($tab["tab_title"] ?? $tab["title"] ?? ""), "text" => wp_strip_all_tags((string) ($tab["tab_content"] ?? $tab["content"] ?? ""))];
      }
      return ["type" => "accordion", "items" => $items];
    }
    if (self::has($name, "icon-box") || self::has($name, "infobox") || self::has($name, "info-box")) {
      return [
        "type" => "card",
        "text" => (string) ($settings["title_text"] ?? $settings["title"] ?? ""),
        "html" => wp_strip_all_tags((string) ($settings["description_text"] ?? $settings["description"] ?? "")),
        "href" => (string) ($settings["link"]["url"] ?? ""),
        "url" => self::abs_url(is_array($settings["image"] ?? null) ? (string) ($settings["image"]["url"] ?? "") : ""),
      ];
    }
    return [];
  }

  /** @return array<string, mixed> */
  private static function design(): array {
    $locations = get_nav_menu_locations();
    $menus = [];
    foreach (wp_get_nav_menus() as $menu) {
      $location = "";
      foreach ($locations as $key => $id) {
        if ((int) $id === (int) $menu->term_id) {
          $location = (string) $key;
        }
      }
      $rows = wp_get_nav_menu_items($menu->term_id);
      $menus[] = ["name" => (string) $menu->name, "location" => $location, "items" => self::menu_tree(is_array($rows) ? $rows : [])];
    }
    return ["kind" => "design", "menus" => $menus];
  }

  /** @param WP_Post[] $rows */
  private static function menu_tree(array $rows, int $parent = 0): array {
    $out = [];
    foreach ($rows as $row) {
      if ((int) $row->menu_item_parent !== $parent) {
        continue;
      }
      $out[] = [
        "label" => html_entity_decode((string) $row->title, ENT_QUOTES, "UTF-8"),
        "href" => (string) $row->url,
        "children" => self::menu_tree($rows, (int) $row->ID),
      ];
    }
    return $out;
  }

  /** @return array<int, array<string, mixed>> */
  private static function forms(): array {
    $out = [];
    foreach (get_post_types([], "names") as $type) {
      if (!str_contains((string) $type, "form")) {
        continue;
      }
      $posts = get_posts(["post_type" => $type, "post_status" => "any", "numberposts" => 20]);
      foreach ($posts as $post) {
        $fields = self::form_fields((string) $post->post_content);
        if ($fields === []) {
          foreach (get_post_meta($post->ID) as $values) {
            $raw = is_array($values) ? (string) ($values[0] ?? "") : (string) $values;
            if ($raw === "" || ($raw[0] !== "{" && $raw[0] !== "[")) {
              continue;
            }
            $fields = self::form_fields($raw);
            if ($fields !== []) {
              break;
            }
          }
        }
        if ($fields === []) {
          continue;
        }
        $out[] = ["wpId" => (string) $post->ID, "name" => html_entity_decode(get_the_title($post), ENT_QUOTES, "UTF-8"), "fields" => $fields];
      }
    }
    return $out;
  }

  /** @return array<int, array<string, mixed>> */
  private static function form_fields(string $raw): array {
    $json = json_decode($raw, true);
    $source = is_array($json["fields"] ?? null) ? $json["fields"] : (is_array($json["form_fields"] ?? null) ? $json["form_fields"] : (is_array($json) ? $json : []));
    $fields = [];
    foreach ($source as $field) {
      if (!is_array($field) || empty($field["label"])) {
        continue;
      }
      $options = [];
      foreach ((array) ($field["choices"] ?? $field["options"] ?? []) as $choice) {
        $options[] = is_array($choice) ? (string) ($choice["label"] ?? $choice["text"] ?? "") : (string) $choice;
      }
      $fields[] = [
        "label" => (string) $field["label"],
        "type" => (string) ($field["type"] ?? "text"),
        "required" => !empty($field["required"]),
        "options" => array_values(array_filter($options)),
      ];
    }
    if ($fields !== []) {
      return $fields;
    }
    if (preg_match_all('/\[(text|email|tel|url|textarea|select|checkbox)\*?([^\]]*)\]/', $raw, $matches, PREG_SET_ORDER)) {
      foreach ($matches as $match) {
        $fields[] = ["label" => trim($match[2]) !== "" ? trim($match[2]) : $match[1], "type" => $match[1], "required" => str_contains($match[0], "*"), "options" => []];
      }
    }
    return $fields;
  }

  /** @return array<string, mixed> */
  private static function seo(): array {
    $rm = get_option("rank-math-options-titles");
    $yo = get_option("wpseo_titles");
    $title = is_array($rm) ? (string) ($rm["homepage_title"] ?? "") : "";
    if ($title === "" && is_array($yo)) {
      $title = (string) ($yo["title-home-wpseo"] ?? "");
    }
    $description = is_array($rm) ? (string) ($rm["homepage_description"] ?? "") : "";
    if ($description === "" && is_array($yo)) {
      $description = (string) ($yo["metadesc-home-wpseo"] ?? "");
    }
    $logo = "";
    $logoId = (int) get_theme_mod("custom_logo");
    if ($logoId) {
      $logo = (string) wp_get_attachment_url($logoId);
    }
    return [
      "kind" => "seo",
      "titleTemplate" => $title,
      "description" => $description !== "" ? $description : (string) get_bloginfo("description"),
      "organizationName" => (string) get_bloginfo("name"),
      "organizationLogo" => $logo,
    ];
  }

  /** @return array<int, array<string, string>> */
  private static function redirects(): array {
    global $wpdb;
    $table = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $wpdb->esc_like($wpdb->prefix) . "%redirections"));
    if (!is_string($table) || $table === "") {
      return [];
    }
    $cols = $wpdb->get_col("SHOW COLUMNS FROM `{$table}`", 0);
    if (!is_array($cols) || !in_array("url_to", $cols, true) || !in_array("sources", $cols, true)) {
      return [];
    }
    $rows = $wpdb->get_results("SELECT sources, url_to FROM `{$table}` LIMIT 50", ARRAY_A);
    $items = [];
    foreach (is_array($rows) ? $rows : [] as $row) {
      $sources = maybe_unserialize((string) ($row["sources"] ?? ""));
      if (!is_array($sources)) {
        continue;
      }
      foreach ($sources as $source) {
        $pattern = is_array($source) ? (string) ($source["pattern"] ?? "") : "";
        if (str_starts_with($pattern, "/")) {
          $items[] = ["from" => $pattern, "to" => (string) ($row["url_to"] ?? "")];
        }
      }
    }
    return $items;
  }

  /** @return array<int, array<string, string>> */
  private static function media_batch(int $offset): array {
    $query = new WP_Query([
      "post_type" => "attachment",
      "post_status" => "inherit",
      "post_mime_type" => "image",
      "posts_per_page" => 8,
      "offset" => $offset,
      "orderby" => "ID",
      "order" => "ASC",
      "fields" => "ids",
    ]);
    $items = [];
    foreach ($query->posts as $id) {
      $url = wp_get_attachment_url((int) $id);
      if (!is_string($url) || !str_starts_with($url, "http")) {
        continue;
      }
      $attachment = get_post((int) $id);
      $items[] = [
        "url" => $url,
        "alt" => (string) get_post_meta((int) $id, "_wp_attachment_image_alt", true),
        "title" => $attachment instanceof WP_Post ? html_entity_decode((string) $attachment->post_title, ENT_QUOTES, "UTF-8") : "",
        "caption" => $attachment instanceof WP_Post ? wp_strip_all_tags((string) $attachment->post_excerpt) : "",
        "description" => $attachment instanceof WP_Post ? wp_strip_all_tags((string) $attachment->post_content) : "",
      ];
    }
    return $items;
  }

  /** @param array<string, mixed> $attrs */
  private static function plain(array $attrs, string $html): string {
    $text = (string) ($attrs["content"] ?? $attrs["title"] ?? "");
    return $text !== "" ? wp_strip_all_tags($text) : trim(wp_strip_all_tags($html));
  }

  /** @param array<string, mixed> $attrs */
  private static function span(array $attrs): int {
    foreach (["width", "columnWidth", "span"] as $key) {
      if (isset($attrs[$key]) && is_numeric($attrs[$key])) {
        return (int) $attrs[$key];
      }
    }
    return 1;
  }

  /** @param array<string, mixed> $attrs */
  private static function color(array $attrs): string {
    $style = is_array($attrs["style"] ?? null) ? $attrs["style"] : [];
    $color = is_array($style["color"] ?? null) ? $style["color"] : [];
    return (string) ($color["background"] ?? $attrs["backgroundColor"] ?? "");
  }

  private static function abs_url(string $url): string {
    $url = trim($url);
    if ($url === "" || str_starts_with($url, "data:")) {
      return $url;
    }
    if (str_starts_with($url, "http://") || str_starts_with($url, "https://")) {
      return $url;
    }
    if (str_starts_with($url, "//")) {
      return "https:" . $url;
    }
    if (str_starts_with($url, "/")) {
      return home_url($url);
    }
    return $url;
  }

  private static function src(string $html): string {
    return preg_match('/src=["\']([^"\']+)["\']/', $html, $m) ? self::abs_url($m[1]) : "";
  }

  private static function href(string $html): string {
    return preg_match('/href=["\']([^"\']+)["\']/', $html, $m) ? $m[1] : "";
  }

  /** @return string[] */
  private static function list_items(string $html): array {
    preg_match_all("/<li[^>]*>(.*?)<\\/li>/si", $html, $m);
    return array_values(array_filter(array_map(static fn ($item) => trim(wp_strip_all_tags($item)), $m[1] ?? [])));
  }

  private static function has(string $hay, string $needle): bool {
    return str_contains($hay, $needle);
  }
}
