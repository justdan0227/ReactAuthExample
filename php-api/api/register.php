<?php
/**
 * User Registration API for ReactAuthExample
 * Handles new user registration with encrypted passwords
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
    $requiredFields = ['email', 'password', 'first_name', 'last_name'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
            exit();
        }
    }

    $email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
    $password = $input['password'];
    $firstName = trim($input['first_name']);
    $lastName = trim($input['last_name']);

    // Validate email
    if (!$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit();
    }

    // Validate password strength
    $passwordValidation = validatePassword($password);
    if (!$passwordValidation['valid']) {
        http_response_code(400);
        echo json_encode(['error' => 'Password validation failed', 'details' => $passwordValidation['errors']]);
        exit();
    }

    // Connect to database
    $database = new Database();
    $db = $database->getConnection();

    // Check if user already exists
    $checkQuery = "SELECT id FROM users WHERE email = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$email]);
    
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'User with this email already exists']);
        exit();
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $insertQuery = "INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    
    if ($insertStmt->execute([$email, $passwordHash, $firstName, $lastName])) {
        $userId = $db->lastInsertId();
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => [
                'id' => $userId,
                'email' => $email,
                'first_name' => $firstName,
                'last_name' => $lastName
            ]
        ]);
    } else {
        throw new Exception('Failed to create user');
    }

} catch (Exception $e) {
    http_response_code(500);
    if (API_DEBUG) {
        echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    } else {
        echo json_encode(['error' => 'Internal server error']);
    }
}

/**
 * Validate password strength
 */
function validatePassword($password) {
    $errors = [];
    
    if (strlen($password) < PASSWORD_MIN_LENGTH) {
        $errors[] = 'Password must be at least ' . PASSWORD_MIN_LENGTH . ' characters long';
    }
    
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Password must contain at least one uppercase letter';
    }
    
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Password must contain at least one lowercase letter';
    }
    
    if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
        $errors[] = 'Password must contain at least one special character';
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors
    ];
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