<?php
/**
 * Database Connection Class
 */

require_once 'config.php';

class Database {
    private $host = DB_HOST;
    private $port = DB_PORT;
    private $dbName = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $pdo;

    /**
     * Get database connection
     */
    public function getConnection() {
        $this->pdo = null;

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->dbName};charset=utf8mb4";
            $this->pdo = new PDO($dsn, $this->username, $this->password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            if (API_DEBUG) {
                echo "Connection error: " . $exception->getMessage();
            }
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit();
        }

        return $this->pdo;
    }
}
?>