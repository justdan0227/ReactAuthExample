#!/bin/bash
# Emergency lockout script - run from terminal for immediate user lockout

if [ $# -eq 0 ]; then
    echo "Usage: $0 <command> [user_email] [reason]"
    echo ""
    echo "Commands:"
    echo "  emergency-lockout <user_email> [reason]    - Immediately lock out user"
    echo "  terminate-sessions <user_email> [reason]   - Terminate all user sessions"
    echo "  set-password <user_email> <password> [reason] - Set user's password (hashes with PHP password_hash), revoke refresh tokens, deactivate sessions"
    echo "  unlock <user_email>                        - Remove emergency lockout"
    echo "  list-users                                 - List all users with emails"
    echo "  check-status <user_email>                  - Check user lockout status"
    echo ""
    echo "Examples:"
    echo "  $0 emergency-lockout user@example.com 'Suspicious activity'"
    echo "  $0 terminate-sessions user@example.com 'Reported stolen device'"
    echo "  $0 set-password user@example.com 'NewPass123!' 'Reset requested'"
    echo "  $0 unlock user@example.com"
    exit 1
fi

# Database connection details - update these to match your MAMP setup
# Can also be overridden via env vars (e.g. DB_HOST, DB_PORT, ...)
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"8889"}  # Default MAMP MySQL port
DB_NAME=${DB_NAME:-"reactauth_example"}
DB_USER=${DB_USER:-"root"}
DB_PASS=${DB_PASS:-"root"}  # Default MAMP password

# MySQL connection options for MAMP
# Newer mysql clients removed --skip-ssl; prefer --ssl-mode=DISABLED when available.
MYSQL_SSL_OPTS=""
if mysql --help 2>&1 | grep -q -- "--ssl-mode"; then
    MYSQL_SSL_OPTS="--ssl-mode=DISABLED"
elif mysql --help 2>&1 | grep -q -- "--skip-ssl"; then
    MYSQL_SSL_OPTS="--skip-ssl"
fi

# mysql treats --host=localhost as a socket connection by default; MAMP expects TCP on DB_PORT.
MYSQL_PROTOCOL_OPTS=""
if [ "$DB_HOST" = "localhost" ]; then
    MYSQL_PROTOCOL_OPTS="--protocol=TCP"
fi

MYSQL_OPTS="$MYSQL_SSL_OPTS $MYSQL_PROTOCOL_OPTS --host=$DB_HOST --port=$DB_PORT --user=$DB_USER --password=$DB_PASS"

COMMAND=$1
USER_EMAIL=$2
DEFAULT_REASON="Manual terminal action"

case $COMMAND in
    "set-password")
        NEW_PASSWORD=$3
        REASON=${4:-"$DEFAULT_REASON"}

        if [ -z "$USER_EMAIL" ] || [ -z "$NEW_PASSWORD" ]; then
            echo "Error: User email and new password required"
            echo "Usage: $0 set-password <user_email> <password> [reason]"
            exit 1
        fi

        SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
        HASH_HELPER="$SCRIPT_DIR/hash_password.php"

        if [ ! -f "$HASH_HELPER" ]; then
            echo "Error: Hash helper not found at $HASH_HELPER"
            echo "Expected file: php-api/scripts/hash_password.php"
            exit 1
        fi

        PASSWORD_HASH=$(php "$HASH_HELPER" --algo=bcrypt --cost=12 "$NEW_PASSWORD")
        if [ $? -ne 0 ] || [ -z "$PASSWORD_HASH" ]; then
            echo "Error: Failed to generate password hash"
            exit 1
        fi

            echo "🔑 SETTING PASSWORD: User $USER_EMAIL"
        echo "Reason: $REASON"

        mysql $MYSQL_OPTS $DB_NAME << EOF
UPDATE users SET password_hash = '$PASSWORD_HASH' WHERE email = '$USER_EMAIL';

SET @uid := (SELECT id FROM users WHERE email = '$USER_EMAIL' LIMIT 1);

-- Deactivate sessions (if user_sessions exists)
SET @has_sessions := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'user_sessions'
);
SET @sql_sessions := IF(
    @uid IS NULL,
    "SELECT '❌ User not found; no session changes applied' AS info;",
    IF(
        @has_sessions > 0,
        CONCAT('UPDATE user_sessions SET is_active = 0 WHERE user_id = ', @uid, ';'),
        "SELECT 'ℹ️ user_sessions table not found; skipping session deactivation' AS info;"
    )
);
PREPARE stmt_sessions FROM @sql_sessions;
EXECUTE stmt_sessions;
DEALLOCATE PREPARE stmt_sessions;

-- Revoke refresh tokens (if refresh_tokens exists)
SET @has_refresh := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'refresh_tokens'
);
SET @sql_refresh := IF(
    @uid IS NULL,
    "SELECT '❌ User not found; no refresh tokens revoked' AS info;",
    IF(
        @has_refresh > 0,
        CONCAT('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ', @uid, ';'),
        "SELECT 'ℹ️ refresh_tokens table not found; skipping refresh token revocation' AS info;"
    )
);
PREPARE stmt_refresh FROM @sql_refresh;
EXECUTE stmt_refresh;
DEALLOCATE PREPARE stmt_refresh;

SELECT CONCAT('✅ Password updated for ', email, ' (ID: ', id, ')') as result
FROM users WHERE email = '$USER_EMAIL';

-- Optional summary counts (only when tables exist)
SET @sql_counts_refresh := IF(
    @uid IS NULL,
    "SELECT 'ℹ️ No counts (user not found)' AS info;",
    IF(
        @has_refresh > 0,
        CONCAT('SELECT CONCAT("🔄 Revoked refresh tokens: ", COUNT(*)) AS token_result FROM refresh_tokens WHERE user_id = ', @uid, ' AND is_revoked = TRUE;'),
        "SELECT 'ℹ️ No refresh token counts (table missing)' AS info;"
    )
);
PREPARE stmt_counts_refresh FROM @sql_counts_refresh;
EXECUTE stmt_counts_refresh;
DEALLOCATE PREPARE stmt_counts_refresh;

SET @sql_counts_sessions := IF(
    @uid IS NULL,
    "SELECT 'ℹ️ No counts (user not found)' AS info;",
    IF(
        @has_sessions > 0,
        CONCAT('SELECT CONCAT("📱 Deactivated sessions: ", COUNT(*)) AS session_result FROM user_sessions WHERE user_id = ', @uid, ' AND is_active = 0;'),
        "SELECT 'ℹ️ No session counts (table missing)' AS info;"
    )
);
PREPARE stmt_counts_sessions FROM @sql_counts_sessions;
EXECUTE stmt_counts_sessions;
DEALLOCATE PREPARE stmt_counts_sessions;
EOF
        ;;

    "emergency-lockout")
        if [ -z "$USER_EMAIL" ]; then
            echo "Error: User email required"
            exit 1
        fi

        REASON=${3:-"$DEFAULT_REASON"}
        
        echo "🚨 EMERGENCY LOCKOUT: User $USER_EMAIL"
        echo "Reason: $REASON"
        
        mysql $MYSQL_OPTS $DB_NAME << EOF
UPDATE users SET is_locked_out = 1 WHERE email = '$USER_EMAIL';
SELECT CONCAT('✅ User ', email, ' (ID: ', id, ') has been LOCKED OUT') as result 
FROM users WHERE email = '$USER_EMAIL';
EOF
        
        echo "⚡ User will be locked out on their next API call (immediate effect)"
        ;;
        
    "terminate-sessions")
        if [ -z "$USER_EMAIL" ]; then
            echo "Error: User email required"
            exit 1
        fi

        REASON=${3:-"$DEFAULT_REASON"}
        
        echo "🔄 TERMINATING ALL SESSIONS: User $USER_EMAIL"
        echo "Reason: $REASON"
        
        mysql $MYSQL_OPTS $DB_NAME << EOF
-- Terminate all active sessions
UPDATE user_sessions SET is_active = 0 WHERE user_id = (SELECT id FROM users WHERE email = '$USER_EMAIL');

-- Revoke all refresh tokens
UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = (SELECT id FROM users WHERE email = '$USER_EMAIL');

-- Show result
SELECT CONCAT('✅ All sessions terminated for ', email, ' (ID: ', id, ')') as result 
FROM users WHERE email = '$USER_EMAIL';

SELECT CONCAT('🔄 Revoked ', COUNT(*), ' refresh tokens') as token_result
FROM refresh_tokens WHERE user_id = (SELECT id FROM users WHERE email = '$USER_EMAIL') AND is_revoked = TRUE;
EOF
        
        echo "⚡ User will be forced to login again after current access token expires (max 1 hour)"
        ;;
        
    "unlock")
        if [ -z "$USER_EMAIL" ]; then
            echo "Error: User email required"
            exit 1
        fi
        
        echo "🔓 UNLOCKING: User $USER_EMAIL"
        
        mysql $MYSQL_OPTS $DB_NAME << EOF
UPDATE users SET is_locked_out = 0 WHERE email = '$USER_EMAIL';
SELECT CONCAT('✅ User ', email, ' (ID: ', id, ') has been UNLOCKED') as result 
FROM users WHERE email = '$USER_EMAIL';
EOF
        ;;
        
    "list-users")
        echo "📋 ALL USERS:"
        printf "%-8s%-24s%-16s%-16s%s\n" "ID" "EMAIL" "NAME" "STATUS" "CREATED"
        mysql $MYSQL_OPTS $DB_NAME -N << EOF
SELECT 
    id,
    email,
    CONCAT(first_name, ' ', last_name),
    CASE 
        WHEN is_locked_out = 1 THEN '🔒 LOCKED'
        WHEN is_active = 0 THEN '❌ INACTIVE' 
        ELSE '✅ ACTIVE'
    END,
    created_at
FROM users 
ORDER BY id;
EOF
        ;;
        
    "check-status")
        if [ -z "$USER_EMAIL" ]; then
            echo "Error: User email required"
            exit 1
        fi
        
        echo "🔍 USER STATUS: $USER_EMAIL"
        echo ""
        printf "%-8s%-24s%-16s%s\n" "ID" "EMAIL" "NAME" "STATUS"
        printf "%-8s%-24s%-16s%s\n" "---" "-----" "----" "------"
        mysql $MYSQL_OPTS $DB_NAME -N << EOF
SELECT 
    id,
    email,
    CONCAT(first_name, ' ', last_name),
    CASE 
        WHEN is_locked_out = 1 THEN '🔒 LOCKED'
        WHEN is_active = 0 THEN '❌ INACTIVE' 
        ELSE '✅ ACTIVE'
    END
FROM users WHERE email = '$USER_EMAIL';
EOF

        echo ""
        echo "📊 SESSION DETAILS:"
        mysql $MYSQL_OPTS $DB_NAME << EOF
SELECT CONCAT('🔄 Active refresh tokens: ', COUNT(*)) as refresh_tokens
FROM refresh_tokens WHERE user_id = (SELECT id FROM users WHERE email = '$USER_EMAIL') AND is_revoked = FALSE;

SELECT CONCAT('📱 Active sessions: ', COUNT(*)) as active_sessions
FROM user_sessions WHERE user_id = (SELECT id FROM users WHERE email = '$USER_EMAIL') AND is_active = 1;
EOF
        ;;
        
    *)
        echo "❌ Unknown command: $COMMAND"
        echo "Run $0 without arguments to see usage"
        exit 1
        ;;
esac