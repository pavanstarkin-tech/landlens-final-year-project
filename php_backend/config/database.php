<?php
/**
 * LandLens PHP Backend - Database Configuration
 * Connects to Hostinger MySQL Database (srv1117.hstgr.io)
 */

class Database {
    private static $host = 'srv1117.hstgr.io';
    private static $db_name = 'u833088220_Priya_teamlead';
    private static $username = 'u833088220_Priya_teamlead';
    private static $password = 'Priya_teamlead@1234567';
    private static $port = 3306;
    private static $conn = null;

    public static function getConnection() {
        if (self::$conn !== null) {
            return self::$conn;
        }

        try {
            $dsn = "mysql:host=" . self::$host . ";port=" . self::$port . ";dbname=" . self::$db_name . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5
            ];
            self::$conn = new PDO($dsn, self::$username, self::$password, $options);
            return self::$conn;
        } catch (PDOException $e) {
            error_log("[LandLens PHP DB Error] " . $e->getMessage());
            return null;
        }
    }
}
