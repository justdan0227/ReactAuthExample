## Session Notes (Pick up point)

Date: 2026-01-13

## Where we are

Goal: run the same auth system in three places:
- React Native (local dev)
- Vite web app (local dev)
- Production deployment on Hostinger under WordPress

Local dev URLs:
- Vite dev server: `http://localhost:5173`
- MAMP API: `http://localhost:8888/reactauth-api/api`

Production target URL layout (chosen):
- `https://www.iclassicnu.com/reactauth-api/api/`


## What we verified (working)

### 1) API is reachable via MAMP
Command:
```bash
curl -i -H 'Origin: http://localhost:5173' http://localhost:8888/reactauth-api/api/test.php | head -n 40
```
Result: `HTTP/1.1 200 OK` with JSON success message.

### 2) Login works and returns access + refresh tokens
Command:
```bash
curl -i -X POST \
  -H 'Origin: http://localhost:5173' \
  -H 'Content-Type: application/json' \
  http://localhost:8888/reactauth-api/api/login.php \
  --data '{"email":"john@example.com","password":"TestPass123!"}' \
  | head -n 60
```
Result: `HTTP/1.1 200 OK` and JSON includes `access_token` and `refresh_token`.

### 3) Protected profile endpoint works with Authorization header
Command (the one-liner we ran successfully):
```bash
ACCESS=$(curl -s -X POST -H 'Origin: http://localhost:5173' -H 'Content-Type: application/json' http://localhost:8888/reactauth-api/api/login.php --data '{"email":"john@example.com","password":"TestPass123!"}' | python3 -c 'import sys, json; print(json.load(sys.stdin)["access_token"])') && \
  curl -i -H 'Origin: http://localhost:5173' -H "Authorization: Bearer $ACCESS" http://localhost:8888/reactauth-api/api/profile.php | head -n 80
```
Result: `HTTP/1.1 200 OK` and profile JSON.


## What changed since the earlier CORS note

We avoided local browser CORS entirely by using a Vite dev proxy:
- Browser calls `http://localhost:5173/api/...`
- Vite proxies to MAMP at `http://localhost:8888/reactauth-api/api/...`

So local web dev works without needing CORS headers on the MAMP-served copy.


## What code changes were made in THIS repo workspace

Web app + proxy:
- `web/vite.config.ts`: proxies `/api` → `http://localhost:8888/reactauth-api`
- `web/src/lib/env.ts`: defaults to `'/api'`

Backend auth hardening + session tracking:
- `php-api/api/login.php`: enforces `is_locked_out` + creates `user_sessions` (returns `session_id`)
- `php-api/api/refresh.php`: enforces `is_locked_out`
- `php-api/api/logout.php`: supports `session_id`, makes logout idempotent, `logout_all` clears sessions + refresh tokens

Deployment prep (new):
- `php-api/config/config.php`: now supports env-based config + server-side `config/config.local.php`
- `App.js`: React Native uses MAMP in dev, production URL in release builds
- `DEPLOY_HOSTINGER.md`: deployment steps
- `scripts/build_hostinger_api_zip.sh`: zips deployable PHP API (includes `vendor/`)


## End-of-day state

- Local web dev works via Vite proxy (`/api`).
- Local mobile works (tested on iOS simulator).
- Session tracking + emergency lockout are working and validated via DB.
- GitHub push succeeded; latest commits are on `main`.

## Pick up tomorrow — Hostinger deployment checklist

1) On your Mac: build dependencies locally
- `cd php-api && composer install --no-dev --optimize-autoloader`

2) On your Mac: build a single upload zip
- `bash scripts/build_hostinger_api_zip.sh`
  - outputs `reactauth-api-deploy.zip` in the repo root

3) On Hostinger: upload + extract
- Upload `reactauth-api-deploy.zip` to `public_html/`
- Extract so you get: `public_html/reactauth-api/api/test.php`

4) On Hostinger: create MySQL DB + import schema
- Import SQL from `php-api/database/` (schema + refresh tokens + revocation/session tables)

5) On Hostinger: production config
- Create `public_html/reactauth-api/config/config.local.php`
  - set DB creds + `JWT_SECRET`
  - optionally set `API_DEBUG=false`

6) Smoke test
- Visit: `https://www.iclassicnu.com/reactauth-api/api/test.php`

Reference: `DEPLOY_HOSTINGER.md`


## Optional: Refresh-token verification via curl

This tests that refresh works by calling `refresh.php` with the stored refresh token.

1) Get refresh token:
```bash
curl -s -X POST -H 'Content-Type: application/json' http://localhost:8888/reactauth-api/api/login.php --data '{"email":"john@example.com","password":"TestPass123!"}' \
  | python3 -c 'import sys, json; print(json.load(sys.stdin)["refresh_token"])'
```
2) Use it:
```bash
REFRESH=<paste>
curl -i -X POST -H 'Content-Type: application/json' http://localhost:8888/reactauth-api/api/refresh.php --data '{"refresh_token":"'"$REFRESH"'"}' | head -n 60
```

Note: `refresh.php` currently issues a **30-second** access token (by design in this repo version), which is great for testing auto-refresh.


## Resume prompt
When you’re back tonight, tell me:
- “MAMP copy updated” (or not)
- whether the browser UI succeeds or shows a CORS error

Then we’ll either:
- finish syncing MAMP ↔ repo backend changes, or
- move on to improving the web client UX (auto-refresh loop visibility, error handling, etc.).
