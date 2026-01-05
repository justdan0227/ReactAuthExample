<?php
/**
 * Token Refresh API for ReactAuthExample
 * Exchanges valid refresh token for new access token
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
    
    // Initialize JWT
    $jwt = new SimpleJWT(JWT_SECRET);
    
    // Decode and verify refresh token
    $payload = $jwt->decode($refreshToken);
    
    // Verify token type
    if (!isset($payload['type']) || $payload['type'] !== 'refresh') {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token type']);
        exit();
    }
    
    $userId = $payload['user_id'];
    
    // Check if refresh token exists and is valid in database
    $stmt = $pdo->prepare("
        SELECT id, expires_at, is_revoked 
        FROM refresh_tokens 
        WHERE token = ? AND user_id = ?
    ");
    $stmt->execute([$refreshToken, $userId]);
    $tokenRecord = $stmt->fetch();
    
    if (!$tokenRecord) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid refresh token']);
        exit();
    }
    
    // Check if token is revoked
    if ($tokenRecord['is_revoked']) {
        http_response_code(401);
        echo json_encode(['error' => 'Token has been revoked']);
        exit();
    }
    
    // Check if token is expired
    if (strtotime($tokenRecord['expires_at']) <= time()) {
        http_response_code(401);
        echo json_encode(['error' => 'Refresh token has expired']);
        exit();
    }
    
    // Get user data
    $stmt = $pdo->prepare("SELECT id, email, first_name, last_name FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'User not found']);
        exit();
    }
    
    // Generate new access token
    $tokenPayload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'iss' => 'ReactAuthExample',
        'aud' => 'ReactAuthExample-App'
    ];
    
    $newAccessToken = $jwt->encode($tokenPayload, 30); // 30 seconds
    
    // Return new access token
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'access_token' => $newAccessToken,
        'expires_in' => 30,
        'token_type' => 'Bearer'
    ]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired refresh token']);
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