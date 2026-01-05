<?php
/**
 * Enhanced Auth Middleware with immediate revocation checking
 * Checks for token revocation on every API call
 */

require_once 'jwt.php';
require_once 'database.php';

class EnhancedAuthMiddleware {
    private $jwt;
    private $db;
    
    public function __construct() {
        $this->jwt = new SimpleJWT(JWT_SECRET);
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Require authentication with immediate revocation checking
     */
    public function requireAuth() {
        // Get token from Authorization header
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(['error' => 'Authorization token required']);
            exit();
        }
        
        $token = $matches[1];
        
        try {
            // Decode JWT token
            $payload = $this->jwt->decode($token);
            
            // Check if user is locked out (immediate emergency lockout)
            if ($this->isUserLockedOut($payload['user_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Account temporarily locked']);
                exit();
            }
            
            // Check if this specific access token is revoked
            if ($this->isAccessTokenRevoked($payload)) {
                http_response_code(401);
                echo json_encode(['error' => 'Token has been revoked']);
                exit();
            }
            
            // Check if all user sessions are terminated
            if ($this->areAllSessionsTerminated($payload['user_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'All sessions have been terminated']);
                exit();
            }
            
            return $payload;
            
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid token: ' . $e->getMessage()]);
            exit();
        }
    }
    
    /**
     * Check if user has emergency lockout flag
     */
    private function isUserLockedOut($userId) {
        $stmt = $this->db->prepare("SELECT is_locked_out FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        return $user && $user['is_locked_out'] == 1;
    }
    
    /**
     * Check if specific access token is revoked
     */
    private function isAccessTokenRevoked($payload) {
        // Check by JTI (JWT ID) if available
        if (isset($payload['jti'])) {
            $stmt = $this->db->prepare("SELECT id FROM revoked_access_tokens WHERE token_jti = ?");
            $stmt->execute([$payload['jti']]);
            return $stmt->fetch() !== false;
        }
        
        return false;
    }
    
    /**
     * Check if all user sessions are terminated
     */
    private function areAllSessionsTerminated($userId) {
        $stmt = $this->db->prepare("SELECT COUNT(*) as active_count FROM user_sessions WHERE user_id = ? AND is_active = 1");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        
        return $result['active_count'] == 0;
    }
    
    /**
     * Revoke specific access token immediately
     */
    public function revokeAccessToken($jti, $userId, $reason = null) {
        $stmt = $this->db->prepare("INSERT INTO revoked_access_tokens (user_id, token_jti, revoked_reason) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE revoked_reason = VALUES(revoked_reason)");
        return $stmt->execute([$userId, $jti, $reason]);
    }
    
    /**
     * Emergency lockout user (immediate effect)
     */
    public function emergencyLockoutUser($userId, $reason = null) {
        $stmt = $this->db->prepare("UPDATE users SET is_locked_out = 1 WHERE id = ?");
        $result = $stmt->execute([$userId]);
        
        // Log the lockout
        $this->logLockoutAction($userId, 'emergency_lockout', $reason);
        
        return $result;
    }
    
    /**
     * Terminate all sessions for user
     */
    public function terminateAllSessions($userId, $reason = null) {
        $stmt = $this->db->prepare("UPDATE user_sessions SET is_active = 0 WHERE user_id = ?");
        $result = $stmt->execute([$userId]);
        
        // Also revoke all refresh tokens
        $stmt = $this->db->prepare("UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        $this->logLockoutAction($userId, 'terminate_all_sessions', $reason);
        
        return $result;
    }
    
    /**
     * Log security actions
     */
    private function logLockoutAction($userId, $action, $reason) {
        // This could write to a security_log table
        error_log("SECURITY ACTION: $action for user $userId. Reason: $reason");
    }
}
?>