<?php
/**
 * Authentication and Token Helper
 */

class AuthHelper {
    public static function getBearerToken() {
        $headers = null;
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    public static function decodeToken($token) {
        if (!$token) return null;
        
        try {
            // Check custom Base64 token
            if (str_starts_with($token, 'll-b64-')) {
                $raw = substr($token, 7);
                $decoded = json_decode(base64_decode($raw), true);
                if ($decoded) return $decoded;
            }

            // Check JWT standard format (header.payload.sig)
            if (str_contains($token, '.')) {
                $parts = explode('.', $token);
                if (count($parts) >= 2) {
                    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                    if ($payload) return $payload;
                }
            }
        } catch (Exception $e) {}

        return null;
    }

    public static function generateToken($userPayload) {
        $json = json_encode($userPayload);
        return 'll-b64-' . base64_encode($json);
    }
}
