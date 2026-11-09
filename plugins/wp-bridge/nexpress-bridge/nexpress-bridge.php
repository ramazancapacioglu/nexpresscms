<?php
/**
 * Plugin Name: NexPress Aktarım
 * Description: Sayfa, yazı, yorum, form, şema, medya ve yerleşimi NexPress sitesine gönderir. E-ticaret kapsam dışıdır.
 * Version: 0.2.3
 * Author: NexPress
 * License: GPL-2.0-or-later
 * Text Domain: nexpress-bridge
 */

if (!defined("ABSPATH")) {
  exit;
}

define("NEXPRESS_BRIDGE_VERSION", "0.2.3");
define("NEXPRESS_BRIDGE_FILE", __FILE__);

require_once __DIR__ . "/includes/class-nexpress-admin.php";
require_once __DIR__ . "/includes/class-nexpress-transfer.php";

add_action("plugins_loaded", static function () {
  Nexpress_Bridge_Admin::boot();
  Nexpress_Bridge_Transfer::boot();
});
