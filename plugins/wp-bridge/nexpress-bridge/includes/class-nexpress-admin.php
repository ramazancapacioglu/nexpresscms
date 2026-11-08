<?php
/**
 * Ayar ekranı. Kod NexPress panelinde üretilir; buradan yapıştırılır.
 */

if (!defined("ABSPATH")) {
  exit;
}

final class Nexpress_Bridge_Admin {
  public static function boot(): void {
    if (!is_admin()) {
      return;
    }
    add_action("admin_menu", [self::class, "menu"]);
    add_action("admin_init", [self::class, "register"]);
  }

  public static function menu(): void {
    add_management_page(
      "NexPress Aktarım",
      "NexPress Aktarım",
      "manage_options",
      "nexpress-bridge",
      [self::class, "render"]
    );
  }

  public static function register(): void {
    register_setting("nexpress_bridge", "nexpress_bridge_url", [
      "type" => "string",
      "sanitize_callback" => [self::class, "clean_url"],
      "default" => "",
    ]);
    register_setting("nexpress_bridge", "nexpress_bridge_code", [
      "type" => "string",
      "sanitize_callback" => [self::class, "clean_code"],
      "default" => "",
    ]);
  }

  public static function clean_url($value): string {
    $url = esc_url_raw(trim((string) $value));
    return str_starts_with($url, "https://") ? untrailingslashit($url) : "";
  }

  public static function clean_code($value): string {
    $code = strtoupper(preg_replace("/[^A-Z0-9]/", "", (string) $value) ?? "");
    return substr($code, 0, 32);
  }

  public static function render(): void {
    if (!current_user_can("manage_options")) {
      return;
    }
    echo '<div class="wrap">';
    echo "<h1>NexPress Aktarım</h1>";
    $notice = (string) get_option("nexpress_bridge_notice", "");
    if ($notice !== "") {
      delete_option("nexpress_bridge_notice");
      echo '<div class="notice notice-info"><p>' . esc_html($notice) . "</p></div>";
    }
    echo "<p>Sürüm " . esc_html(NEXPRESS_BRIDGE_VERSION) . ". E-ticaret (ürün, stok, sipariş) gönderilmez.</p>";
    echo "<p>Kodu NexPress panelinde, WordPress Köprüsü ekranından üretin. Adres bu NexPress sitesinin https adresi olsun. Kaydettikten sonra aktarımı başlatın. Süre yetmezse aynı düğme kaldığı yerden sürer.</p>";
    echo '<form method="post" action="options.php">';
    settings_fields("nexpress_bridge");
    echo '<table class="form-table"><tbody>';
    echo "<tr><th scope=\"row\"><label for=\"nexpress_bridge_url\">NexPress adresi</label></th><td>";
    echo '<input name="nexpress_bridge_url" id="nexpress_bridge_url" type="url" class="regular-text" value="' . esc_attr((string) get_option("nexpress_bridge_url", "")) . '" placeholder="https://site.example" /></td></tr>';
    echo "<tr><th scope=\"row\"><label for=\"nexpress_bridge_code\">Eşleştirme kodu</label></th><td>";
    echo '<input name="nexpress_bridge_code" id="nexpress_bridge_code" type="text" class="regular-text" value="' . esc_attr((string) get_option("nexpress_bridge_code", "")) . '" autocomplete="off" /></td></tr>';
    echo "</tbody></table>";
    submit_button("Kaydet");
    echo "</form>";
    echo '<form method="post" action="' . esc_url(admin_url("admin-post.php")) . '">';
    echo '<input type="hidden" name="action" value="nexpress_bridge_send" />';
    wp_nonce_field("nexpress_bridge_send");
    echo '<p><label><input type="checkbox" name="nexpress_bridge_restart" value="1" /> Baştan al</label></p>';
    submit_button("Aktarımı başlat", "primary", "submit", false);
    echo "</form></div>";
  }
}
