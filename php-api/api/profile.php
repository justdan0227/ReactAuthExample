<?php
/**
 * Protected Profile API endpoint
 * Requires valid JWT token
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../config/auth.php';

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    setCorsHeaders();
    http_response_code(200);
    exit();
}

// Set CORS headers
setCorsHeaders();

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Validate JWT token (using original auth for now)
    $auth = new AuthMiddleware();
    $userData = $auth->requireAuth();
    
    // Connect to database to get fresh user data
    $database = new Database();
    $db = $database->getConnection();
    
    // Get user details
    $query = "SELECT id, email, first_name, last_name, is_active, created_at, last_login FROM users WHERE id = ? AND is_active = 1";
    $stmt = $db->prepare($query);
    $stmt->execute([$userData['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit();
    }
    
    // Return user profile
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Profile retrieved successfully',
        'user' => $user,
        'token_info' => [
            'user_id' => $userData['user_id'],
            'email' => $userData['email'],
            'issued_at' => date('Y-m-d H:i:s', $userData['iat']),
            'expires_at' => date('Y-m-d H:i:s', $userData['exp'])
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    if (API_DEBUG) {
        echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    } else {
        echo json_encode(['error' => 'Internal server error']);
    }
}

/**
 * Set CORS headers for React Native
 */
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}
?>