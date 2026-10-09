<?php
/**
 * Notifications Controller
 * Handles /api/notifications
 */

require_once __DIR__ . '/../helpers/Response.php';

class NotificationController {
    public static function listNotifications() {
        Response::json([
            [
                'id' => 'notif-01',
                'title' => 'LandLens PHP Backend Active',
                'message' => 'Connected directly to Hostinger MySQL Ledger & NVIDIA AI Services.',
                'isRead' => false,
                'type' => 'SYSTEM',
                'createdTime' => date('c', strtotime('-10 minutes'))
            ],
            [
                'id' => 'notif-02',
                'title' => 'Document Verification Passed',
                'message' => 'Survey No. 104/2 Stage 1 Tri-Tier Concordance successfully verified.',
                'isRead' => true,
                'type' => 'VERIFICATION',
                'createdTime' => date('c', strtotime('-2 hours'))
            ]
        ]);
    }
}
