#!/bin/bash
# Emergency lockout script - run from terminal for immediate user lockout

if [ $# -eq 0 ]; then
    echo "Usage: $0 <command> [user_email] [reason]"
    echo ""
    echo "Commands:"
    echo "  emergency-lockout <user_email> [reason]    - Immediately lock out user"
    echo "  terminate-sessions <user_email> [reason]   - Terminate all user sessions"
    echo "  unlock <user_email>                        - Remove emergency lockout"
    echo "  list-users                                 - List all users with emails"
    echo "  check-status <user_email>                  - Check user lockout status"
    echo ""
    echo "Examples:"
    echo "  $0 emergency-lockout user@example.com 'Suspicious activity'"
    echo "  $0 terminate-sessions user@example.com 'Reported stolen device'"
    echo "  $0 unlock user@example.com"
    exit 1
fi

# Database connection details - update these to match your MAMP setup
DB_HOST="localhost"
DB_PORT="8889"  # Default MAMP MySQL port
DB_NAME="reactauth_example"
DB_USER="root"
DB_PASS="root"  # Default MAMP password

# MySQL connection options for MAMP (disable SSL)
MYSQL_OPTS="--skip-ssl --host=$DB_HOST --port=$DB_PORT --user=$DB_USER --password=$DB_PASS"

COMMAND=$1
USER_EMAIL=$2
REASON=${3:-"Manual terminal action"}

case $COMMAND in
    "emergency-lockout")
        if [ -z "$USER_EMAIL" ]; then
            echo "Error: User email required"
            exit 1
        fi
        
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