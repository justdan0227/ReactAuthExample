<?php
/**
 * Database Configuration for ReactAuthExample
 * Update these settings to match your MAMP setup
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_PORT', '8889'); // Default MAMP MySQL port
define('DB_NAME', 'reactauth_example');
define('DB_USER', 'root');
define('DB_PASS', 'root'); // Default MAMP password

// API configuration
define('API_DEBUG', true); // Set to false in production
define('API_VERSION', '1.0');

// Security configuration
define('JWT_SECRET', 'your-secret-key-change-in-production'); // Change this!
define('PASSWORD_MIN_LENGTH', 8);

// CORS configuration for React Native
define('ALLOWED_ORIGINS', [
    'http://localhost:8081', // Metro bundler
    'http://localhost:19006', // Expo dev server (if needed)
    'http://10.0.2.2:8081', // Android emulator
]);

// Error reporting (disable in production)
if (API_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Set timezone
date_default_timezone_set('America/New_York');
?>