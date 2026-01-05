<?php
/**
 * Authentication API for ReactAuthExample
 * Handles user login and validation
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';

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
    $query = "SELECT id, email, password_hash, first_name, last_name, is_active FROM users WHERE email = ? AND is_active = 1";
    $stmt = $db->prepare($query);
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
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

    // Return success response (without password hash)
    unset($user['password_hash']);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => $user,
        'token' => generateSimpleToken($user['id']) // Simple token for now
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

/**
 * Generate simple token (replace with JWT in production)
 */
function generateSimpleToken($userId) {
    return base64_encode($userId . ':' . time() . ':' . JWT_SECRET);
}
?>