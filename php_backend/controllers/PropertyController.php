<?php
/**
 * Property Management Controller
 * Handles /api/properties/* and visit scheduling
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';

class PropertyController {
    public static function listProperties() {
        $status = $_GET['status'] ?? null;
        $category = $_GET['category'] ?? null;
        $district = $_GET['district'] ?? null;

        $conn = Database::getConnection();
        if (!$conn) {
            Response::json([]);
        }

        try {
            $sql = "SELECT id, property_code as propertyCode, title, category, area, price, 
                           description, survey_number as surveyNumber, address, latitude, longitude, 
                           district, village, state, pincode, three_sixty_image_url as threeSixtyImageUrl, 
                           status, provider_id as providerId, is_active as isActive, created_at as createdAt 
                    FROM properties 
                    WHERE is_active = 1";
            $params = [];

            if ($status) {
                $sql .= " AND status = :status";
                $params[':status'] = $status;
            }
            if ($category) {
                $sql .= " AND category = :category";
                $params[':category'] = $category;
            }
            if ($district) {
                $sql .= " AND district = :district";
                $params[':district'] = $district;
            }

            $sql .= " ORDER BY created_at DESC LIMIT 60";
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            // Format numerical values properly
            $formatted = array_map(function($r) {
                $r['area'] = (float)$r['area'];
                $r['price'] = (float)$r['price'];
                $r['latitude'] = (float)$r['latitude'];
                $r['longitude'] = (float)$r['longitude'];
                $r['isActive'] = (bool)$r['isActive'];
                return $r;
            }, $rows);

            Response::json($formatted);
        } catch (Exception $e) {
            error_log("[PropertyController::listProperties Error] " . $e->getMessage());
            Response::json([]);
        }
    }

    public static function getPropertyById($id) {
        $conn = Database::getConnection();
        if (!$conn) {
            Response::error('Database unavailable', 503);
        }

        try {
            $stmt = $conn->prepare("
                SELECT id, property_code as propertyCode, title, category, area, price, 
                       description, survey_number as surveyNumber, address, latitude, longitude, 
                       district, village, state, pincode, three_sixty_image_url as threeSixtyImageUrl, 
                       status, provider_id as providerId, is_active as isActive, created_at as createdAt 
                FROM properties 
                WHERE id = :id 
                LIMIT 1
            ");
            $stmt->execute([':id' => $id]);
            $prop = $stmt->fetch();

            if ($prop) {
                $prop['area'] = (float)$prop['area'];
                $prop['price'] = (float)$prop['price'];
                $prop['latitude'] = (float)$prop['latitude'];
                $prop['longitude'] = (float)$prop['longitude'];
                $prop['isActive'] = (bool)$prop['isActive'];
                Response::json($prop);
            } else {
                Response::error('Property not found', 404);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function createProperty() {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $conn = Database::getConnection();
        if (!$conn) {
            Response::error('Database unavailable', 503);
        }

        $id = 'prop-' . bin2hex(random_bytes(8));
        $code = $input['propertyCode'] ?? ('LL-' . strtoupper(substr($input['state'] ?? 'IND', 0, 3)) . '-' . rand(100, 999));

        try {
            $stmt = $conn->prepare("
                INSERT INTO properties (
                    id, property_code, title, category, area, price, description, survey_number,
                    address, latitude, longitude, district, village, state, pincode,
                    three_sixty_image_url, status, provider_id, is_active, created_at, updated_at
                ) VALUES (
                    :id, :code, :title, :category, :area, :price, :desc, :survey,
                    :address, :lat, :lng, :district, :village, :state, :pincode,
                    :img, :status, :provider, 1, NOW(), NOW()
                )
            ");
            $stmt->execute([
                ':id' => $id,
                ':code' => $code,
                ':title' => $input['title'] ?? 'New Land Parcel',
                ':category' => $input['category'] ?? 'AGRICULTURAL',
                ':area' => (float)($input['area'] ?? 1.0),
                ':price' => (float)($input['price'] ?? 1000000),
                ':desc' => $input['description'] ?? '',
                ':survey' => $input['surveyNumber'] ?? 'N/A',
                ':address' => $input['address'] ?? '',
                ':lat' => (float)($input['latitude'] ?? 17.3850),
                ':lng' => (float)($input['longitude'] ?? 78.4867),
                ':district' => $input['district'] ?? 'Hyderabad',
                ':village' => $input['village'] ?? '',
                ':state' => $input['state'] ?? 'Telangana',
                ':pincode' => $input['pincode'] ?? '500001',
                ':img' => $input['threeSixtyImageUrl'] ?? null,
                ':status' => $input['status'] ?? 'PENDING',
                ':provider' => $input['providerId'] ?? '078068ad-a896-4207-8476-53278c91dc42'
            ]);

            Response::json([
                'id' => $id,
                'propertyCode' => $code,
                'status' => 'PENDING',
                'message' => 'Property registered successfully'
            ], 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function scheduleVisit($propertyId) {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $visitId = 'vst-' . round(microtime(true) * 1000);
        $conn = Database::getConnection();

        if ($conn) {
            try {
                $stmt = $conn->prepare("
                    INSERT INTO property_visits (id, property_id, buyer_id, visit_date, visit_time, status, is_active, created_at, updated_at)
                    VALUES (:id, :propId, :buyerId, :vdate, :vtime, 'SCHEDULED', 1, NOW(), NOW())
                ");
                $stmt->execute([
                    ':id' => $visitId,
                    ':propId' => $propertyId,
                    ':buyerId' => $input['buyerId'] ?? '078068ad-a896-4207-8476-53278c91dc42',
                    ':vdate' => $input['visitDate'] ?? date('Y-m-d', strtotime('+3 days')),
                    ':vtime' => $input['visitTime'] ?? '10:00:00'
                ]);
            } catch (Exception $e) {
                error_log("[PropertyController::scheduleVisit Error] " . $e->getMessage());
            }
        }

        Response::json([
            'id' => $visitId,
            'propertyId' => $propertyId,
            'visitDate' => $input['visitDate'] ?? date('Y-m-d', strtotime('+3 days')),
            'visitTime' => $input['visitTime'] ?? '10:00:00',
            'status' => 'SCHEDULED'
        ]);
    }

    public static function listVisits() {
        $conn = Database::getConnection();
        if ($conn) {
            try {
                $stmt = $conn->query("
                    SELECT pv.id, pv.visit_date as visitDate, pv.visit_time as visitTime, pv.status, pv.created_at as createdAt,
                           p.id as prop_id, p.title as prop_title, p.price as prop_price, p.area as prop_area, 
                           p.village as prop_village, p.district as prop_district
                    FROM property_visits pv
                    LEFT JOIN properties p ON pv.property_id = p.id
                    WHERE pv.is_active = 1
                    ORDER BY pv.visit_date ASC, pv.visit_time ASC
                ");
                $rows = $stmt->fetchAll();

                $formatted = array_map(function($r) {
                    return [
                        'id' => $r['id'],
                        'visitDate' => $r['visitDate'],
                        'visitTime' => $r['visitTime'],
                        'status' => $r['status'] ?: 'SCHEDULED',
                        'property' => [
                            'id' => $r['prop_id'],
                            'title' => $r['prop_title'] ?: 'Scheduled Land Parcel',
                            'price' => (float)$r['prop_price'],
                            'area' => (float)$r['prop_area'],
                            'village' => $r['prop_village'],
                            'district' => $r['prop_district']
                        ]
                    ];
                }, $rows);

                Response::json($formatted);
            } catch (Exception $e) {
                error_log("[PropertyController::listVisits Error] " . $e->getMessage());
            }
        }
        Response::json([]);
    }

    public static function listSavedProperties() {
        Response::json([]);
    }
}
