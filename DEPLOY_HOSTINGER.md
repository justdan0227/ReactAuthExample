# Deploying the PHP API to iclassicnu.com (Hostinger + WordPress)

This repo currently runs locally via MAMP:
- Web dev: `http://localhost:5173`
- API (MAMP): `http://localhost:8888/reactauth-api/api`

This guide deploys the PHP API to your WordPress hosting so mobile/web can point to production.

## Recommended URL layout

Option A (recommended): subdomain
- `https://api.iclassicnu.com/` → points to its own folder (clean separation from WordPress)

Option B: subfolder under WordPress
- `https://www.iclassicnu.com/reactauth-api/api/` (matches the current local path style)

The code supports either; you just need to set the base URL accordingly.

## 1) Create the folder on Hostinger

If using the subfolder approach (Option B):
- In Hostinger File Manager, under `public_html/`, create: `reactauth-api/`
- Inside it, you want this structure:
  - `reactauth-api/api/` (public endpoints)
  - `reactauth-api/config/`
  - `reactauth-api/src/`
  - `reactauth-api/vendor/` (Composer deps)
  - `reactauth-api/composer.json`, `composer.lock`

From this repo, upload the contents of `php-api/` into that `reactauth-api/` folder.

## 2) Install PHP dependencies (firebase/php-jwt)

The API uses Composer (`php-api/composer.json`). You must ensure `vendor/` exists on the server.

Two common ways:

A) If Hostinger provides SSH/Composer:
- `cd public_html/reactauth-api`
- `composer install --no-dev --optimize-autoloader`

B) If no Composer on the server:
- Run `composer install --no-dev --optimize-autoloader` locally inside `php-api/`
- Upload the generated `php-api/vendor/` folder to the server.

## 3) Create the database + import schema

On Hostinger, create a MySQL database + user, then import:
- `php-api/database/schema.sql`
- `php-api/database/refresh_tokens.sql`
- `php-api/database/immediate_revocation.sql`

(Hostinger phpMyAdmin import works fine.)

## 4) Configure production secrets + DB connection

This repo’s PHP config is in `php-api/config/config.php` and now supports environment overrides.

On the server, pick ONE approach:

A) Preferred: set environment variables (via panel / Apache SetEnv)
- `APP_ENV=production`
- `API_DEBUG=false`
- `DB_HOST`, `DB_PORT` (often `3306`), `DB_NAME`, `DB_USER`, `DB_PASS`
- `JWT_SECRET` (use a long random string)
- `ALLOWED_ORIGINS=https://www.iclassicnu.com,https://iclassicnu.com`

B) Simple fallback: create a non-committed override file
- Create `config/config.local.php` on the server (not in git)
- Define the constants there (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS/JWT_SECRET/etc)

Note: do not reuse the dev JWT secret in production.

## 5) Lock down non-public folders

If your server uses Apache, copy the example:
- `php-api/.htaccess.example` → deploy as `reactauth-api/.htaccess`

That blocks direct web access to `config/`, `src/`, etc.

## 6) Smoke test

Once uploaded/configured:
- `https://www.iclassicnu.com/reactauth-api/api/test.php`
  - expect `{ success: true, ... }`

If that works, login/profile/refresh/logout should also work.

## 7) Point the apps at production

React Native (this repo)
- In dev (`__DEV__ === true`): uses MAMP URL
- In release builds: uses `https://www.iclassicnu.com/reactauth-api/api`

Vite web app (optional to deploy)
- Create `web/.env.production` with:
  - `VITE_API_BASE_URL=https://www.iclassicnu.com/reactauth-api/api`

