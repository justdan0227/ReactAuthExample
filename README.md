# ReactAuthExample

A complete React Native CLI application demonstrating **JWT authentication** with secure token persistence, automatic login, and protected API endpoints.

## 🚀 Features

- **JWT Authentication System** with custom PHP backend
- **Refresh Token Support** - 7-day seamless sessions with automatic token refresh
- **Automatic Login** - tokens persist across app restarts
- **Protected API Endpoints** with middleware validation
- **Secure Token Expiration** handling (1-hour access tokens, 7-day refresh tokens)
- **Database-Stored Refresh Tokens** with revocation support
- **Dashboard UI** with user information display
- **Email Caching** for improved UX
- **Password Visibility Toggle**
- **Real-time Token Status** display
- **Secure Logout** with server-side token revocation

## 📱 Architecture

- **Frontend**: React Native 0.73.6 with AsyncStorage for token persistence
- **Web**: Vite + React app in `web/` for browser testing
- **Backend**: PHP/MySQL with custom JWT implementation
- **Server**: MAMP (Apache/MySQL)
- **Security**: bcrypt password hashing + JWT tokens with configurable expiration

## 📁 Repo Structure (high level)

- React Native app: repo root (this folder)
- PHP API (source): `php-api/`
- Web app: `web/`
- MAMP-served copy (runtime): `/Users/dankardell/Projects/mamp/reactauth-api/`

## 🔧 Setup Instructions

### Prerequisites
- React Native CLI environment setup
- MAMP server installed
- iPhone/Android simulator

### Backend Setup (MAMP)
1. **Start MAMP** with document root: `/Users/dankardell/Projects/mamp`
2. **Copy API files**: `cp -r php-api /Users/dankardell/Projects/mamp/reactauth-api`
3. **Create database**: Import `php-api/database/schema.sql` into `reactauth_example` database
4. **Import emergency features**: `mysql -u root -proot --port=8889 --host=127.0.0.1 reactauth_example < php-api/database/immediate_revocation.sql`
5. **Test API**: Visit `http://localhost:8888/reactauth-api/api/test.php`

**IMPORTANT:** Always copy updated PHP files to MAMP after changes:
```bash
cp php-api/config/*.php /Users/dankardell/Projects/mamp/reactauth-api/config/
cp php-api/api/*.php /Users/dankardell/Projects/mamp/reactauth-api/api/
cp php-api/.htaccess /Users/dankardell/Projects/mamp/reactauth-api/.htaccess
```

### Web Setup (Vite)

The `web/` folder is a separate Vite project used to test the same auth flow from a browser.

#### Local dev (recommended: use the Vite proxy)

1) Install web deps:
```bash
cd web
npm install
```

2) Start the web dev server:
```bash
npm run dev
```

3) Open:
- `http://localhost:5173`

**Why the proxy matters:** the web app defaults to calling the API via `/api/...` (same-origin).
Vite proxies `/api` → `http://localhost:8888/reactauth-api/api` (configured in `web/vite.config.ts`).
This avoids browser CORS issues during local development.

#### Optional: call MAMP directly (requires correct CORS)

Create `web/.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8888/reactauth-api/api
```
Then ensure the MAMP-served `config/config.php` includes `http://localhost:5173` in `ALLOWED_ORIGINS`.

### React Native Setup

## Step 1: Install Dependencies

```bash
npm install
# Includes testing dependencies: Jest, node-fetch, AsyncStorage mocks
```

## Step 2: Start the Metro Server

```bash
npm start
```

## Step 3: Run the Application

### For iOS
```bash
npx react-native run-ios
```

**iOS Simulator Startup (if needed):**
```bash
# 1. Find the UDID for your desired simulator (e.g., iPhone 17 Pro Max on iOS 26):
xcrun simctl list devices available | grep "iPhone 17 Pro Max"
# Example output: iPhone 17 Pro Max (ABCD1234-5678-90EF-GHIJ-KLMNOPQRSTUV) (Shutdown)

# 2. Shutdown all simulators:
xcrun simctl shutdown all

# 3. Boot your chosen simulator (replace <UDID> with actual value from step 1):
xcrun simctl boot "<UDID>"

# 4. Run the app on that simulator (Metro must be running separately):
npx react-native run-ios --udid "<UDID>" --no-packager
```

> **Tip:** If the simulator runtime or device type is missing, open **Xcode → Settings → Platforms** and install the iOS Simulator runtime you need.

### For Android  
```bash
npx react-native run-android
```

## 🔐 Authentication Flow

1. **Welcome Screen** → Login form with cached email
2. **Login** → Get 1-hour access token + 7-day refresh token  
3. **Dashboard** → Shows user info, token status, logout option
4. **Auto-Refresh** → Access tokens automatically refresh using refresh token
5. **Seamless Experience** → 7 days of uninterrupted access
6. **After 7 days** → Refresh token expires, user must login again
7. **Logout** → Both tokens cleared locally and refresh token revoked on server

## 🛠️ JWT Configuration

**To change token expiration times:**

1. Edit [`php-api/api/login.php`](php-api/api/login.php):
   ```php
   $accessToken = $jwt->encode($tokenPayload, 3600); // Change 3600 to desired seconds (access token)
   $refreshToken = $jwt->encode($refreshTokenPayload, 604800); // Change 604800 to desired seconds (refresh token)
   'expires_in' => 3600, // Update response value for access token
   'refresh_expires_in' => 604800, // Update response value for refresh token
   ```

2. Copy to MAMP server:
   ```bash
   cp php-api/api/login.php /Users/dankardell/Projects/mamp/reactauth-api/api/login.php
   ```

**Current Settings:**
- **Access Token**: 1 hour (3600 seconds)
- **Refresh Token**: 7 days (604800 seconds)

## 📋 API Endpoints

- `POST /api/login.php` - User authentication (returns access + refresh tokens)
- `POST /api/register.php` - User registration  
- `GET /api/profile.php` - Protected endpoint (requires JWT)
- `POST /api/refresh.php` - Exchange refresh token for new access token
- `POST /api/logout.php` - Revoke refresh tokens (logout from device/all devices)
- `GET /api/test.php` - API health check

## 🧪 Testing

### Comprehensive Test Suite
Run the full authentication test suite with:
```bash
npm test
```

**What the test suite validates:**
- ✅ **App Rendering** - Component structure and stability
- ✅ **User Registration** - Creates test user with proper validation
- ✅ **Login Flow** - Authentication with valid/invalid credentials
- ✅ **Profile Access** - Protected endpoint security
- ✅ **Token Refresh** - Automatic token renewal system
- ✅ **Logout Process** - Proper token revocation
- ✅ **Security Validation** - Invalid token rejection
- ✅ **Password Requirements** - Strong password enforcement
- ✅ **Duplicate Prevention** - Email uniqueness validation

**Test Features:**
- 🔄 **Automatic cleanup** - Creates and removes test users
- 🎯 **End-to-end testing** - Full authentication workflow
- ⚡ **Fast execution** - ~1.5 seconds total runtime
- 📊 **11 test cases** - Comprehensive coverage

**Manual Token Expiration Testing:**
1. Login to app → Note dashboard token expiration time
2. Wait for expiration → Restart app → Should show login screen
3. Login again within expiration window → Restart app → Should show dashboard

## 📱 Current Status

✅ **Complete JWT authentication with refresh token system**  
✅ **7-day seamless sessions with automatic token refresh**  
✅ **Token persistence across app restarts**  
✅ **Database-stored refresh tokens with revocation**  
✅ **Protected API endpoints working**  
✅ **Dashboard UI with user information**  
✅ **Secure logout with server-side token cleanup**  
✅ **Apache authorization header support (.htaccess)**  
✅ **Fixed JWT secret consistency issue**  
✅ **Emergency lockout system with immediate user control**  
✅ **Enhanced authentication middleware**  
✅ **Terminal-based user management scripts**

**Token System**: 1-hour access tokens + 7-day refresh tokens

## 🚨 Emergency User Control

**New security features for immediate user lockout:**

### Database Schema
```bash
# Import emergency lockout tables
mysql -u root -proot --port=8889 --host=127.0.0.1 reactauth_example < php-api/database/immediate_revocation.sql
```

### Terminal Commands
```bash
# Emergency lockout (immediate effect on next API call)
./php-api/scripts/token_util.sh emergency-lockout user@example.com "reason"

# Terminate all user sessions (forced re-login after token expiry)  
./php-api/scripts/token_util.sh terminate-sessions user@example.com "reason"

# Check user status and active sessions
./php-api/scripts/token_util.sh check-status user@example.com

# List all users with current status
./php-api/scripts/token_util.sh list-users

# Unlock user
./php-api/scripts/token_util.sh unlock user@example.com
```

#### Notes

- **Emergency lockout** blocks new logins and refreshes and will cause protected calls (e.g. profile) to fail immediately.
- Logins create a `user_sessions` row when the table exists and return a `session_id` to help track/deactivate a specific session.

### 🎯 Testing Emergency Lockout
```bash
# 1. Lock out john@example.com
./php-api/scripts/token_util.sh emergency-lockout john@example.com

# 2. List all users with their lockout status  
./php-api/scripts/token_util.sh list-users

# 3. Check specific user status (optional)
./php-api/scripts/token_util.sh check-status john@example.com

# 4. Re-enable john@example.com
./php-api/scripts/token_util.sh unlock john@example.com
```

**Test Flow:**
1. Login as john@example.com in simulator
2. Press FETCH PROFILE → Success popup + profile card shows
3. Run lockout command → Profile card disappears + redirect to login on next API call
4. Check status → Verify user is locked out
5. Unlock user → Restore access

### Direct Database Control
```sql
-- Emergency lockout (immediate effect)
UPDATE users SET is_locked_out = 1 WHERE email = 'user@example.com';

-- Revoke all refresh tokens (forced re-login)
UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = 1;
```

## 🔧 Technical Fixes Applied

### Apache Configuration
- **Added `.htaccess`** - Fixes Authorization header not reaching PHP
- **CORS support** - Proper handling for React Native requests

### JWT Authentication  
- **Fixed JWT secret consistency** - Removed `time()` from secret generation
- **Enhanced token validation** - Better error handling and debugging
- **Immediate revocation support** - Server-side token blacklisting

### Database Enhancements
- **`revoked_access_tokens`** - Immediate access token revocation
- **`user_sessions`** - Session tracking and management  
- **Emergency lockout flags** - Instant user access control

---

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
