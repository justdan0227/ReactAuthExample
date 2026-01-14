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
    $sessionId = $input['session_id'] ?? null; // Optional: deactivate a specific tracked session
    
    // Initialize JWT
    $jwt = new SimpleJWT(JWT_SECRET);
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Decode refresh token to get user_id
    // Note: if decoding fails, fall back to DB lookup so logout can remain idempotent.
    $userId = null;
    try {
        $payload = $jwt->decode($refreshToken);
        $userId = $payload['user_id'] ?? null;
    } catch (Exception $e) {
        $userId = null;
    }

    if (!$userId) {
        try {
            $stmt = $db->prepare("SELECT user_id FROM refresh_tokens WHERE token = ? LIMIT 1");
            $stmt->execute([$refreshToken]);
            $row = $stmt->fetch();
            if ($row && isset($row['user_id'])) {
                $userId = (int)$row['user_id'];
            }
        } catch (Exception $e) {
            error_log('Failed to resolve user_id from refresh token: ' . $e->getMessage());
        }
    }

    if (!$userId) {
        // If we can't tie this refresh token to a user, treat logout as a no-op.
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
        exit();
    }
    
    if ($logoutAll) {
        // Logout from all devices - revoke all refresh tokens for this user
        $stmt = $db->prepare("UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?");
        $stmt->execute([$userId]);
        $revokedCount = $stmt->rowCount();

        // Also deactivate all user sessions when available
        try {
            $hasSessionsStmt = $db->query("SHOW TABLES LIKE 'user_sessions'");
            $hasSessions = (bool)($hasSessionsStmt && $hasSessionsStmt->fetch());
            if ($hasSessions) {
                $stmt = $db->prepare("UPDATE user_sessions SET is_active = 0 WHERE user_id = ?");
                $stmt->execute([$userId]);
            }
        } catch (Exception $e) {
            error_log('Failed to deactivate user sessions (logout_all): ' . $e->getMessage());
        }
        
        $message = "Logged out from all devices ($revokedCount tokens revoked)";
    } else {
        // Logout from current device only - revoke this specific refresh token
        $stmt = $db->prepare("UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = ? AND user_id = ?");
        $stmt->execute([$refreshToken, $userId]);
        $revokedCount = $stmt->rowCount();

        // Make logout idempotent: if the token was already revoked/missing, still return success.
        $message = $revokedCount === 0 ? 'Already logged out' : 'Logged out successfully';

        // If the client provided a session_id, deactivate that tracked session when available
        if ($sessionId) {
            try {
                $hasSessionsStmt = $db->query("SHOW TABLES LIKE 'user_sessions'");
                $hasSessions = (bool)($hasSessionsStmt && $hasSessionsStmt->fetch());
                if ($hasSessions) {
                    $stmt = $db->prepare("UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND session_id = ?");
                    $stmt->execute([$userId, $sessionId]);
                }
            } catch (Exception $e) {
                error_log('Failed to deactivate user session (logout): ' . $e->getMessage());
            }
        }
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

    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}
?>