<?php
/**
 * Debug endpoint to check what headers are being received
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'all_headers' => getallheaders(),
    'server_vars' => [
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'not set',
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'not set'
    ],
    'method' => $_SERVER['REQUEST_METHOD']
]);
?>