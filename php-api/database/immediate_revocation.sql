-- Enhanced revocation system for immediate token invalidation
-- Run this SQL to add immediate revocation support

-- Table to track revoked access tokens (for immediate invalidation)
CREATE TABLE IF NOT EXISTS revoked_access_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_jti VARCHAR(255) NOT NULL UNIQUE, -- JWT ID claim
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_reason VARCHAR(255) DEFAULT NULL,
    INDEX idx_token_jti (token_jti),
    INDEX idx_user_id (user_id),
    INDEX idx_revoked_at (revoked_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add user session tracking for better control
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    device_info TEXT,
    ip_address VARCHAR(45),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_is_active (is_active),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add emergency lockout flag to users table
ALTER TABLE users ADD COLUMN is_locked_out TINYINT(1) DEFAULT 0 AFTER is_active;