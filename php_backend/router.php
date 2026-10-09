<?php
/**
 * PHP CLI Built-in Webserver Router
 * Used when running: php -S localhost:5000 router.php
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve static files directly if they exist
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false;
}

// Forward all other requests to index.php
require_once __DIR__ . '/index.php';
