<?php
/**
 * JWT Authentication Middleware
 * Validates JWT tokens for protected endpoints
 */

require_once '../config/jwt.php';

class AuthMiddleware {
    private $jwt;
    
    public function __construct() {
        $this->jwt = new SimpleJWT(JWT_SECRET);
    }
    
    /**
     * Validate JWT token from Authorization header
     * Returns user data if valid, throws exception if invalid
     */
    public function validateToken() {
        // Get Authorization header - try multiple methods
        $authHeader = '';
        
        // Method 1: getallheaders
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }
        
        // Method 2: Apache/Nginx specific
        if (empty($authHeader)) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        }
        
        // Method 3: CGI/FastCGI
        if (empty($authHeader)) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        }
        
        if (empty($authHeader)) {
            throw new Exception('Missing Authorization header');
        }
        
        // Extract Bearer token
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            throw new Exception('Invalid Authorization header format. Use: Bearer <token>');
        }
        
        $token = $matches[1];
        
        try {
            // Decode and validate token
            $payload = $this->jwt->decode($token);
            return $payload;
        } catch (Exception $e) {
            throw new Exception('Invalid or expired token: ' . $e->getMessage());
        }
    }
    
    /**
     * Middleware function to protect endpoints
     */
    public function requireAuth() {
        try {
            $user = $this->validateToken();
            return $user;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                'error' => 'Unauthorized',
                'message' => $e->getMessage()
            ]);
            exit();
        }
    }
}

/**
 * Helper function to get all headers (for compatibility)
 */
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
?>