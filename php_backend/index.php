<?php
/**
 * LandLens PHP REST API Engine & Central Router
 * Fully compatible with Spring Boot / Node.js API endpoints
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/helpers/AuthHelper.php';

// Controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/PropertyController.php';
require_once __DIR__ . '/controllers/VerificationController.php';
require_once __DIR__ . '/controllers/AiController.php';
require_once __DIR__ . '/controllers/AnalyticsController.php';
require_once __DIR__ . '/controllers/NotificationController.php';
require_once __DIR__ . '/controllers/DeveloperController.php';

// Set standard CORS headers for all incoming requests
Response::setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Handle CORS Preflight
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Parse requested URI path
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$parsedUrl = parse_url($requestUri);
$path = rtrim($parsedUrl['path'] ?? '/', '/');
if (empty($path)) $path = '/';

// Optional: strip subfolder if served from subfolder (e.g. /php_backend/api -> /api)
if (str_starts_with($path, '/php_backend')) {
    $path = substr($path, strlen('/php_backend'));
    if (empty($path)) $path = '/';
}

// =========================================================================
// 1. HEALTH & ACTUATOR ENDPOINTS
// =========================================================================
if ($path === '/' || $path === '/api/health' || $path === '/actuator/health') {
    $dbOk = (Database::getConnection() !== null);
    Response::json([
        'status' => 'UP',
        'service' => 'LandLens PHP REST Backend Engine',
        'version' => '2.5.0-PHP',
        'databaseConnected' => $dbOk,
        'aiProvider' => 'NVIDIA NIM (meta/llama-3.2-11b-vision-instruct)',
        'timestamp' => date('c'),
        'environment' => 'Production'
    ]);
}

// =========================================================================
// 2. AUTH & USER ENDPOINTS
// =========================================================================
if ($path === '/api/auth/login' && $method === 'POST') {
    AuthController::login();
}

if ($path === '/api/auth/register' && $method === 'POST') {
    AuthController::register();
}

if ($path === '/api/auth/logout' && $method === 'POST') {
    Response::json(['message' => 'Logged out successfully', 'success' => true]);
}

if ($path === '/api/auth/refresh' && $method === 'POST') {
    AuthController::login();
}

if ($path === '/api/users/me' || $path === '/api/users/profile') {
    AuthController::getProfile();
}

if ($path === '/api/users' && $method === 'GET') {
    AuthController::listUsers();
}

// =========================================================================
// 3. PROPERTY ENDPOINTS
// =========================================================================
if (preg_match('#^/api/properties/([^/]+)/visit$#', $path, $matches) && $method === 'POST') {
    PropertyController::scheduleVisit($matches[1]);
}

if ($path === '/api/properties/visits') {
    PropertyController::listVisits();
}

if ($path === '/api/properties/saved') {
    PropertyController::listSavedProperties();
}

if ($path === '/api/properties' && $method === 'GET') {
    PropertyController::listProperties();
}

if ($path === '/api/properties' && $method === 'POST') {
    PropertyController::createProperty();
}

if (preg_match('#^/api/properties/([^/]+)$#', $path, $matches) && $method === 'GET') {
    PropertyController::getPropertyById($matches[1]);
}

// =========================================================================
// 4. VERIFICATION & I3B ENDPOINTS
// =========================================================================
if ($path === '/api/verify/document' && $method === 'POST') {
    VerificationController::verifyDocument();
}

if ($path === '/api/verify/trigger-owner-verification' && $method === 'POST') {
    VerificationController::triggerOwnerVerification();
}

if ($path === '/api/verify/owner-action') {
    VerificationController::handleOwnerAction();
}

if ($path === '/api/verification/timeline' || $path === '/api/verify/timeline') {
    VerificationController::getTimeline();
}

if ($path === '/api/government-verify' || $path === '/api/verify/government') {
    VerificationController::governmentVerify();
}

if ($path === '/api/ai-verification' || $path === '/api/verify/ai') {
    VerificationController::aiVerification();
}

// =========================================================================
// 5. AI SERVICES & VALUATION ENDPOINTS
// =========================================================================
if ($path === '/api/ai/chat' || $path === '/api/ai/message') {
    AiController::chat();
}

if ($path === '/api/ai/conversations') {
    AiController::getConversations();
}

if ($path === '/api/ai/estimate-price') {
    AiController::estimatePrice();
}

// =========================================================================
// 6. ANALYTICS & DASHBOARD ENDPOINTS
// =========================================================================
if ($path === '/api/analytics' || $path === '/api/analytics/dashboard') {
    AnalyticsController::getDashboardMetrics();
}

// =========================================================================
// 7. DEVELOPER KEYS, FRAUD REPORTS & NOTIFICATIONS
// =========================================================================
if ($path === '/api/developer/keys') {
    DeveloperController::listKeys();
}

if ($path === '/api/fraud-reports' || $path === '/api/fraud/reports') {
    DeveloperController::listFraudReports();
}

if ($path === '/api/notifications') {
    NotificationController::listNotifications();
}

// Fallback 404
Response::error("Endpoint not found: [$method] $path", 404);
