<?php
/**
 * Logout API for ReactAuthExample
 * Revokes refresh tokens (logout from current device or all devices)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/config.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    setCorsHeaders();
    http_response_code(200);
    exit();
}

// Set CORS headers
setCorsHeaders();

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['refresh_token'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Refresh token is required']);
        exit();
    }

    $refreshToken = $input['refresh_token'];
    $logoutAll = $input['logout_all'] ?? false; // Optional: logout from all devices
    
    // Initialize JWT
    $jwt = new SimpleJWT(JWT_SECRET);
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Decode refresh token to get user_id
    $payload = $jwt->decode($refreshToken);
    $userId = $payload['user_id'];
    
    if ($logoutAll) {
        // Logout from all devices - revoke all refresh tokens for this user
        $stmt = $db->prepare("UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?");
        $stmt->execute([$userId]);
        $revokedCount = $stmt->rowCount();
        
        $message = "Logged out from all devices ($revokedCount tokens revoked)";
    } else {
        // Logout from current device only - revoke this specific refresh token
        $stmt = $db->prepare("UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = ? AND user_id = ?");
        $stmt->execute([$refreshToken, $userId]);
        $revokedCount = $stmt->rowCount();
        
        if ($revokedCount === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Refresh token not found']);
            exit();
        }
        
        $message = "Logged out successfully";
    }
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $message
    ]);

} catch (Exception $e) {
    // Even if token is invalid, we can still try to logout
    // This prevents issues when tokens are already expired
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
}

/**
 * Set CORS headers for React Native
 */
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Allow requests from React Native Metro bundler and common development ports
    $allowedOrigins = [
        'http://localhost:8081', // Metro bundler
        'http://localhost:19006', // Expo dev server (if needed)
        'http://10.0.2.2:8081', // Android emulator
    ];
    
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}
?>