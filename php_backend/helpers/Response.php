<?php
/**
 * Standard HTTP JSON Response & CORS Handler
 */

class Response {
    public static function setCorsHeaders() {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key, Accept, Origin, X-Requested-With");
        header("Content-Type: application/json; charset=UTF-8");
    }

    public static function json($data, $statusCode = 200) {
        self::setCorsHeaders();
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit();
    }

    public static function error($message, $statusCode = 400, $details = null) {
        $payload = [
            'success' => false,
            'error' => $message,
            'timestamp' => date('c')
        ];
        if ($details !== null) {
            $payload['details'] = $details;
        }
        self::json($payload, $statusCode);
    }

    public static function success($data, $message = 'Success', $statusCode = 200) {
        if (is_array($data) && array_keys($data) === range(0, count($data) - 1)) {
            // Raw list
            self::json($data, $statusCode);
        } else {
            self::json($data, $statusCode);
        }
    }
}
