<?php
/**
 * Simple JWT Implementation for ReactAuthExample
 * Based on JWT specification RFC 7519
 */

class SimpleJWT {
    private $secret;
    private $algorithm = 'HS256';
    
    public function __construct($secret) {
        $this->secret = $secret;
    }
    
    /**
     * Generate JWT token
     */
    public function encode($payload, $expiresIn = 3600) {
        // Header
        $header = [
            'typ' => 'JWT',
            'alg' => $this->algorithm
        ];
        
        // Add expiration to payload
        $payload['iat'] = time(); // issued at
        $payload['exp'] = time() + $expiresIn; // expires
        
        // Encode header and payload
        $headerEncoded = $this->base64UrlEncode(json_encode($header));
        $payloadEncoded = $this->base64UrlEncode(json_encode($payload));
        
        // Create signature
        $signature = $this->sign($headerEncoded . '.' . $payloadEncoded);
        
        return $headerEncoded . '.' . $payloadEncoded . '.' . $signature;
    }
    
    /**
     * Decode and verify JWT token
     */
    public function decode($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }
        
        list($headerEncoded, $payloadEncoded, $signatureProvided) = $parts;
        
        // Verify signature
        $expectedSignature = $this->sign($headerEncoded . '.' . $payloadEncoded);
        if (!hash_equals($expectedSignature, $signatureProvided)) {
            throw new Exception('Invalid token signature');
        }
        
        // Decode payload
        $payload = json_decode($this->base64UrlDecode($payloadEncoded), true);
        
        // Check expiration
        if (isset($payload['exp']) && time() > $payload['exp']) {
            throw new Exception('Token has expired');
        }
        
        return $payload;
    }
    
    /**
     * Create signature
     */
    private function sign($data) {
        return $this->base64UrlEncode(hash_hmac('sha256', $data, $this->secret, true));
    }
    
    /**
     * Base64 URL encode
     */
    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64 URL decode
     */
    private function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}
?>