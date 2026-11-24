<?php
/**
 * Run WordPress 7.1.5 sanitize_title() on titles from stdin (JSON array).
 * Expects WORDPRESS_ROOT to point at an extracted WordPress 7.1.5 tree.
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
$titles = json_decode(stream_get_contents(STDIN), true);
if (!is_array($titles)) {
  fwrite(STDERR, "stdin must be a JSON array of titles\n");
  exit(1);
}
$out = [];
foreach ($titles as $title) {
  $out[] = sanitize_title($title);
}
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
