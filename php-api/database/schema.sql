-- ReactAuthExample Database Schema
-- Create database and users table with encrypted passwords

-- Create database (run this first)
CREATE DATABASE IF NOT EXISTS reactauth_example;
USE reactauth_example;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Insert sample users (passwords are hashed using PHP's password_hash())
-- Sample user 1: email: john@example.com, password: TestPass123!
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe');

-- Sample user 2: email: admin@example.com, password: Admin123!@
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('admin@example.com', '$2y$10$QhZcVw1tn7xyBOPjOJvMjeSv4ub2ygLqM1YOC0qdEa0H1mNJxOQFO', 'Admin', 'User');

-- Sample user 3: email: test@example.com, password: MySecure789#
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('test@example.com', '$2y$10$NhR6p6NPNRHFcdL6CQa5uOwEhzIoU2MHFXg3uGhjDfJKhzWZPGtpm', 'Test', 'User');

-- Show created table structure
DESCRIBE users;

-- Display sample users (without password hashes for security)
SELECT id, email, first_name, last_name, is_active, created_at FROM users;