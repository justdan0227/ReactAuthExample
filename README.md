# ReactAuthExample

A complete React Native CLI application demonstrating **JWT authentication** with secure token persistence, automatic login, and protected API endpoints.

## 🚀 Features

- **JWT Authentication System** with custom PHP backend
- **Automatic Login** - tokens persist across app restarts
- **Protected API Endpoints** with middleware validation
- **Secure Token Expiration** handling
- **Dashboard UI** with user information display
- **Email Caching** for improved UX
- **Password Visibility Toggle**
- **Real-time Token Status** display

## 📱 Architecture

- **Frontend**: React Native 0.73.6 with AsyncStorage for token persistence
- **Backend**: PHP/MySQL with custom JWT implementation
- **Server**: MAMP (Apache/MySQL)
- **Security**: bcrypt password hashing + JWT tokens with configurable expiration

## 🔧 Setup Instructions

### Prerequisites
- React Native CLI environment setup
- MAMP server installed
- iPhone/Android simulator

### Backend Setup (MAMP)
1. **Start MAMP** with document root: `/Users/d0k08gm/Projects/mamp`
2. **Copy API files**: `cp -r php-api /Users/d0k08gm/Projects/mamp/reactauth-api`
3. **Create database**: Import `php-api/database/schema.sql` into `reactauth_example` database
4. **Test API**: Visit `http://localhost:8888/reactauth-api/api/test.php`

### React Native Setup

### React Native Setup

## Step 1: Install Dependencies

```bash
npm install
# Ensure AsyncStorage is linked properly
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

### For Android  
```bash
npx react-native run-android
```

## 🔐 Authentication Flow

1. **Welcome Screen** → Login form with cached email
2. **Login** → JWT token generated (currently **30 seconds** expiration)  
3. **Dashboard** → Shows user info, token status, logout option
4. **Auto-Login** → Valid tokens automatically restore session
5. **Expiration** → Expired tokens redirect to login

## 🛠️ JWT Configuration

**To change token expiration time:**

1. Edit [`php-api/api/login.php`](php-api/api/login.php):
   ```php
   $token = $jwt->encode($tokenPayload, 30); // Change 30 to desired seconds
   'expires_in' => 30, // Update response value too
   ```

2. Copy to MAMP server:
   ```bash
   cp php-api/api/login.php /Users/d0k08gm/Projects/mamp/reactauth-api/api/login.php
   ```

## 📋 API Endpoints

- `POST /api/login.php` - User authentication (returns JWT)
- `POST /api/register.php` - User registration  
- `GET /api/profile.php` - Protected endpoint (requires JWT)
- `GET /api/test.php` - API health check

## 🧪 Testing

**Test Token Expiration:**
1. Login to app → Note dashboard token expiration time
2. Wait for expiration → Restart app → Should show login screen
3. Login again within expiration window → Restart app → Should show dashboard

## 📱 Current Status

✅ **Complete JWT authentication system**  
✅ **Token persistence across app restarts**  
✅ **Automatic expiration handling**  
✅ **Protected API endpoints working**  
✅ **Dashboard UI with user information**  

**Token Expiration**: Currently set to **30 seconds** for testing

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
