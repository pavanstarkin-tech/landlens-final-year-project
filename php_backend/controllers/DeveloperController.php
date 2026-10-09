<?php
/**
 * Developer Keys & Citizen Fraud Reports Controller
 * Handles /api/developer/* and /api/fraud-reports/*
 */

require_once __DIR__ . '/../helpers/Response.php';

class DeveloperController {
    public static function listKeys() {
        Response::json([
            [
                'id' => 'key-prod-01',
                'name' => 'LandLens Production API Key',
                'keyPrefix' => 'LL_LIVE_PROD',
                'accessScope' => 'READ_WRITE',
                'rateLimitRpm' => 300,
                'allowedIps' => '0.0.0.0/0',
                'status' => 'ACTIVE',
                'createdDate' => date('c', strtotime('-15 days'))
            ],
            [
                'id' => 'key-sandbox-02',
                'name' => 'Govt SRO Sandbox Key',
                'keyPrefix' => 'LL_TEST_SRO',
                'accessScope' => 'VERIFY_ONLY',
                'rateLimitRpm' => 120,
                'allowedIps' => '0.0.0.0/0',
                'status' => 'ACTIVE',
                'createdDate' => date('c', strtotime('-3 days'))
            ]
        ]);
    }

    public static function listFraudReports() {
        Response::json([
            [
                'id' => 'fr-101',
                'propertyId' => '02a6dc7d-0ed9-4251-94cb-96185554b887',
                'surveyNumber' => '104/2',
                'reason' => 'Boundary line overlap discrepancy flagged by neighbor',
                'status' => 'UNDER_INVESTIGATION',
                'severity' => 'MEDIUM',
                'date' => date('c', strtotime('-2 days'))
            ],
            [
                'id' => 'fr-102',
                'propertyId' => 'prop-ref-003',
                'surveyNumber' => '79/1-A',
                'reason' => 'Section 8 Fake-Seller Impersonation Intercepted via Stage 2 Authorization',
                'status' => 'RESOLVED_BLOCKED',
                'severity' => 'CRITICAL',
                'date' => date('c', strtotime('-4 hours'))
            ]
        ]);
    }
}
