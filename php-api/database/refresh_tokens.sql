-- Add refresh tokens table for stateful JWT refresh token management
-- Run this after the initial schema.sql

-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    device_info VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);

-- Optional: Add indexes for better performance
CREATE INDEX idx_refresh_tokens_user_active ON refresh_tokens (user_id, is_revoked, expires_at);

-- Optional: Clean up expired refresh tokens (can be run periodically)
-- DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE;