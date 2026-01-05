# MAMP Setup & Deployment Guide

## 🚀 Quick Setup Steps

### 1. Database Setup (phpMyAdmin or MySQL Command Line)

#### Option A: Using phpMyAdmin
1. Open MAMP and start Apache & MySQL
2. Go to `http://localhost:8888/phpMyAdmin/` (or your MAMP port)
3. Click "Import" tab
4. Choose file: `php-api/database/schema.sql`
5. Click "Go" to execute

#### Option B: Using MySQL Command Line
```bash
# Connect to MAMP MySQL
mysql -u root -p -h 127.0.0.1 -P 8889

# Run the schema file
source /Users/d0k08gm/Projects/ReactNative/ReactAuthExample/php-api/database/schema.sql
```

### 2. Deploy PHP API to MAMP

#### Copy files to MAMP htdocs
```bash
# Navigate to your MAMP htdocs directory (default path)
cd /Applications/MAMP/htdocs

# Create project folder
mkdir reactauth-api

# Copy our PHP files
cp -r /Users/d0k08gm/Projects/ReactNative/ReactAuthExample/php-api/* reactauth-api/
```

### 3. Test API Endpoints

#### Test basic connectivity:
```bash
curl http://localhost:8888/reactauth-api/api/test.php
```

#### Test login with sample user:
```bash
curl -X POST http://localhost:8888/reactauth-api/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"TestPass123!"}'
```

## 🔧 Configuration

### MAMP Settings to Check:
- **Apache Port**: Usually 8888 (check MAMP preferences)
- **MySQL Port**: Usually 8889 (check MAMP preferences)
- **PHP Version**: 7.4+ recommended

### Update config.php if needed:
- Change `DB_PORT` if your MySQL port is different
- Update `ALLOWED_ORIGINS` to include your React Native development server

## 📊 Sample Users Created

| Email | Password | Name |
|-------|----------|------|
| john@example.com | TestPass123! | John Doe |
| admin@example.com | Admin123!@ | Admin User |
| test@example.com | MySecure789# | Test User |

## 🔗 API Endpoints

### Base URL: `http://localhost:8888/reactauth-api/api/`

- **GET** `/test.php` - Test API connectivity
- **POST** `/login.php` - User authentication
- **POST** `/register.php` - User registration

### Login Request Example:
```json
POST /login.php
{
  "email": "john@example.com",
  "password": "TestPass123!"
}
```

### Login Response Example:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true
  },
  "token": "base64-encoded-token"
}
```

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your React Native app is calling from an allowed origin
2. **Database Connection**: Check MAMP MySQL is running on correct port
3. **File Permissions**: Ensure PHP files have read permissions
4. **JSON Errors**: Make sure Content-Type header is set correctly

### Debug Mode:
- Set `API_DEBUG = true` in config.php for detailed error messages
- Check MAMP logs in `/Applications/MAMP/logs/`

## 🔄 Development Workflow

1. **Edit files** in your ReactAuthExample workspace (`php-api/` folder)
2. **Copy to MAMP** when ready to test:
   ```bash
   cp -r php-api/* /Applications/MAMP/htdocs/reactauth-api/
   ```
3. **Test** with React Native app or curl
4. **Commit** changes to git for version control

## 🔐 Security Notes

- Sample passwords are hashed with PHP's `password_hash()`
- Change `JWT_SECRET` in production
- Set `API_DEBUG = false` in production
- Use HTTPS in production
- Validate all inputs thoroughly