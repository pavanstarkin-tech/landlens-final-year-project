<?php
/**
 * AI & Valuation Services Controller
 * Handles /api/ai/* endpoints
 */

require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/NvidiaAI.php';

class AiController {
    public static function chat() {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $prompt = $input['prompt'] ?? $input['content'] ?? $input['message'] ?? 'What is a Patta document?';
        $systemContext = $input['systemContext'] ?? 'You are LandLens AI Assistant for government land verification.';
        $history = $input['history'] ?? $input['messages'] ?? [];

        $result = NvidiaAI::chat($prompt, $systemContext, $history);
        Response::json($result);
    }

    public static function estimatePrice() {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $area = (float)($input['area'] ?? 2.0);
        $district = $input['district'] ?? 'Hyderabad';

        $baseRate = 950000;
        if (stripos($district, 'Bangalore') !== false) $baseRate = 1800000;
        elseif (stripos($district, 'Pune') !== false) $baseRate = 1400000;
        elseif (stripos($district, 'Medchal') !== false) $baseRate = 1100000;

        $estPrice = $area * $baseRate;

        Response::json([
            'estimatedPrice' => $estPrice,
            'ratePerSqFt' => round($baseRate / 435.6),
            'confidenceScore' => 0.94,
            'valuationRange' => [
                'min' => round($estPrice * 0.92),
                'max' => round($estPrice * 1.08)
            ],
            'districtBenchmark' => $district,
            'timestamp' => date('c')
        ]);
    }

    public static function getConversations() {
        Response::json([]);
    }
}
