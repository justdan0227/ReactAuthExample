<?php
/**
 * CLI helper to generate password hashes compatible with the API.
 *
 * Usage:
 *   php php-api/scripts/hash_password.php 'PlaintextPassword'
 *   php php-api/scripts/hash_password.php --algo=bcrypt --cost=12 'PlaintextPassword'
 *
 * Notes:
 * - Outputs only the hash (plus a trailing newline).
 * - Use single quotes in your shell if your password contains characters like ! or $.
 */

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from the command line.\n");
    exit(1);
}

$algo = PASSWORD_DEFAULT;
$cost = null;
$password = null;

foreach (array_slice($argv, 1) as $arg) {
    if ($arg === '--help' || $arg === '-h') {
        $password = null;
        break;
    }

    if (str_starts_with($arg, '--algo=')) {
        $value = substr($arg, strlen('--algo='));
        if ($value === 'bcrypt') {
            $algo = PASSWORD_BCRYPT;
        } elseif ($value === 'default') {
            $algo = PASSWORD_DEFAULT;
        } else {
            fwrite(STDERR, "Unknown --algo value: {$value}. Use 'bcrypt' or 'default'.\n");
            exit(2);
        }
        continue;
    }

    if (str_starts_with($arg, '--cost=')) {
        $value = substr($arg, strlen('--cost='));
        if (!ctype_digit($value)) {
            fwrite(STDERR, "Invalid --cost value: {$value}. Must be an integer.\n");
            exit(2);
        }
        $cost = (int)$value;
        continue;
    }

    if ($password === null) {
        $password = $arg;
    } else {
        fwrite(STDERR, "Too many arguments. Provide exactly one password string.\n");
        exit(2);
    }
}

if ($password === null) {
    $script = $argv[0] ?? 'hash_password.php';
    fwrite(STDERR, "Usage:\n");
    fwrite(STDERR, "  php {$script} 'PlaintextPassword'\n");
    fwrite(STDERR, "  php {$script} --algo=bcrypt --cost=12 'PlaintextPassword'\n");
    exit(2);
}

$options = [];
if ($cost !== null) {
    $options['cost'] = $cost;
}

$hash = password_hash($password, $algo, $options);
if ($hash === false) {
    fwrite(STDERR, "Failed to generate password hash.\n");
    exit(1);
}

echo $hash, "\n";
