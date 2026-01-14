<?php
/**
 * Authentication API for ReactAuthExample
 * Handles user login and JWT token generation
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
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    if (empty($input['email']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        exit();
    }

    $email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
    $password = $input['password'];

    if (!$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit();
    }

    // Connect to database
    $database = new Database();
    $db = $database->getConnection();

    // Find user by email
    $query = "SELECT id, email, password_hash, first_name, last_name, is_active, is_locked_out FROM users WHERE email = ? AND is_active = 1";
    $stmt = $db->prepare($query);
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit();
    }

    // Block login immediately when a user is locked out
    if (!empty($user['is_locked_out'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Account has been locked for security reasons']);
        exit();
    }

    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit();
    }

    // Update last login
    $updateQuery = "UPDATE users SET last_login = NOW() WHERE id = ?";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->execute([$user['id']]);

    // Create a user session record if user_sessions is available (enhanced revocation system)
    $sessionId = null;
    try {
        $hasSessionsStmt = $db->query("SHOW TABLES LIKE 'user_sessions'");
        $hasSessions = (bool)($hasSessionsStmt && $hasSessionsStmt->fetch());

        if ($hasSessions) {
            $sessionId = bin2hex(random_bytes(16));
            $deviceInfo = $_SERVER['HTTP_USER_AGENT'] ?? null;
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;

            $stmt = $db->prepare(
                "INSERT INTO user_sessions (user_id, session_id, device_info, ip_address, is_active) VALUES (?, ?, ?, ?, 1)"
            );
            $stmt->execute([$user['id'], $sessionId, $deviceInfo, $ipAddress]);
        }
    } catch (Exception $e) {
        // Session tracking is optional; don't block login if it fails.
        error_log('Failed to create user session: ' . $e->getMessage());
    }

    // Generate JWT token
    $jwt = new SimpleJWT(JWT_SECRET);
    $tokenPayload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'iss' => 'ReactAuthExample', // issuer
        'aud' => 'ReactAuthExample-App' // audience
    ];
    
    // Generate access token (1 hour)
    $accessToken = $jwt->encode($tokenPayload, 3600);
    
    // Generate refresh token (7 days = 604800 seconds)
    $refreshTokenPayload = [
        'user_id' => $user['id'],
        'type' => 'refresh',
        'iss' => 'ReactAuthExample',
        'aud' => 'ReactAuthExample-App'
    ];
    $refreshToken = $jwt->encode($refreshTokenPayload, 604800);
    
    // Try to store refresh token in database
    $refreshTokenStored = false;
    try {
        $refreshExpiresAt = date('Y-m-d H:i:s', time() + 604800); // 7 days from now
        $stmt = $db->prepare("INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$user['id'], $refreshToken, $refreshExpiresAt]);
        $refreshTokenStored = true;
    } catch (Exception $e) {
        // Log error but continue - we'll send access token only
        error_log("Failed to store refresh token: " . $e->getMessage());
    }

    // Return success response (without password hash)
    unset($user['password_hash']);
    
    http_response_code(200);
    $response = [
        'success' => true,
        'message' => 'Login successful',
        'user' => $user,
        'access_token' => $accessToken,
        'token' => $accessToken, // Keep backward compatibility
        'expires_in' => 3600,
        'token_type' => 'Bearer'
    ];

    if ($sessionId) {
        $response['session_id'] = $sessionId;
    }
    
    // Only include refresh token if successfully stored
    if ($refreshTokenStored) {
        $response['refresh_token'] = $refreshToken;
        $response['refresh_expires_in'] = 604800;
    }
    
    echo json_encode($response);

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