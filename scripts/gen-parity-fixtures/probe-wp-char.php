<?php
/**
 * Helper for probe-wp-lists.py. Reads a JSON array of characters from stdin
 * and writes remove_accents and wrap-slug results. It calls the WordPress
 * 7.1.5 library; it does not print or copy its internal tables.
 */
$root = getenv("WORDPRESS_ROOT");
if (!$root) {
  fwrite(STDERR, "WORDPRESS_ROOT is not set\n");
  exit(1);
}
$root = rtrim($root, "/") . "/";
define("ABSPATH", $root);
define("WPINC", "wp-includes");
if (!function_exists("get_locale")) {
  function get_locale() { return "en_US"; }
}
if (!function_exists("is_admin")) {
  function is_admin() { return false; }
}
foreach (["compat.php", "class-wp-error.php", "functions.php", "plugin.php", "utf8.php", "formatting.php"] as $file) {
  require ABSPATH . WPINC . "/" . $file;
}
add_filter("sanitize_title", "sanitize_title_with_dashes", 10, 3);
$chars = json_decode(stream_get_contents(STDIN), true);
if (!is_array($chars)) {
  fwrite(STDERR, "stdin must be a JSON array of characters or strings\n");
  exit(1);
}
$out = [];
foreach ($chars as $ch) {
  $out[] = [
    "input" => $ch,
    "remove_accents" => remove_accents($ch),
    "slug" => sanitize_title("xx" . $ch . "yy"),
    "slug_raw" => sanitize_title($ch),
  ];
}
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
