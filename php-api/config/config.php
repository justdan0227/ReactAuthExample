<?php

function getEnvString(string $key, ?string $default = null): ?string {
    $value = $_ENV[$key] ?? getenv($key);
    if ($value === false || $value === null) {
        return $default;
    }
    $trimmed = trim((string)$value);
    return $trimmed === '' ? $default : $trimmed;
}

function getEnvBool(string $key, ?bool $default = null): ?bool {
    $raw = $_ENV[$key] ?? getenv($key);
    if ($raw === false || $raw === null) {
        return $default;
    }
    $parsed = filter_var($raw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    return $parsed === null ? $default : $parsed;
}

function getEnvInt(string $key, ?int $default = null): ?int {
    $raw = getEnvString($key);
    if ($raw === null) {
        return $default;
    }
    $parsed = filter_var($raw, FILTER_VALIDATE_INT);
    return $parsed === false ? $default : (int)$parsed;
}

function getEnvList(string $key, array $default = []): array {
    $raw = getEnvString($key);
    if ($raw === null) {
        return $default;
    }
    $parts = array_map('trim', explode(',', $raw));
    $parts = array_values(array_filter($parts, fn($p) => $p !== ''));
    return $parts;
}

$localOverride = __DIR__ . '/config.local.php';
if (file_exists($localOverride)) {
    require_once $localOverride;
}

$appEnv = getEnvString('APP_ENV', 'local');

define('DB_HOST', getEnvString('DB_HOST', defined('DB_HOST') ? DB_HOST : 'localhost'));
define('DB_PORT', getEnvString('DB_PORT', defined('DB_PORT') ? DB_PORT : '8889'));
define('DB_NAME', getEnvString('DB_NAME', defined('DB_NAME') ? DB_NAME : 'reactauth_example'));
define('DB_USER', getEnvString('DB_USER', defined('DB_USER') ? DB_USER : 'root'));
define('DB_PASS', getEnvString('DB_PASS', defined('DB_PASS') ? DB_PASS : 'root'));

define('API_VERSION', getEnvString('API_VERSION', defined('API_VERSION') ? API_VERSION : '1.0'));
define('API_DEBUG', getEnvBool('API_DEBUG', defined('API_DEBUG') ? API_DEBUG : ($appEnv !== 'production')));

define('JWT_SECRET', getEnvString(
    'JWT_SECRET',
    defined('JWT_SECRET') ? JWT_SECRET : 'your-super-secret-jwt-key-change-in-production-fixed-secret'
));
define('JWT_EXPIRATION', getEnvInt('JWT_EXPIRATION', defined('JWT_EXPIRATION') ? JWT_EXPIRATION : 3600));
define('PASSWORD_MIN_LENGTH', getEnvInt('PASSWORD_MIN_LENGTH', defined('PASSWORD_MIN_LENGTH') ? PASSWORD_MIN_LENGTH : 8));

define('ALLOWED_ORIGINS', getEnvList(
    'ALLOWED_ORIGINS',
    defined('ALLOWED_ORIGINS') ? ALLOWED_ORIGINS : [
        'http://localhost:8081',
        'http://localhost:19006',
        'http://10.0.2.2:8081',
        'http://localhost:5173',
        'https://www.iclassicnu.com',
        'https://iclassicnu.com',
    ]
));

if (API_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

date_default_timezone_set(getEnvString('TZ', 'America/New_York') ?? 'America/New_York');

?>