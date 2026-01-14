re# Session Notes (Pick up point)

Date: 2026-01-12

## Where we are

Goal: get the new `web/` Vite React app talking to the PHP API (MAMP) with the same access-token + refresh-token flow.

You confirmed MAMP is serving the API from:
- `/Applications/MAMP/htdocs/reactauth-api` (Finder screenshot)

That implies the API base URL (from the browser / Vite) should be:
- `http://localhost:8888/reactauth-api/api`

Vite dev server runs at:
- `http://localhost:5173`


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


## Important caveat (likely next blocker)

In the curl output headers, we did **not** see:
- `Access-Control-Allow-Origin: http://localhost:5173`

Curl doesn’t care, but the browser does.

Reason: we edited the PHP files in this repo workspace (`ReactAuthExample/php-api/...`), but MAMP is currently executing the copied version under `/Applications/MAMP/htdocs/reactauth-api/...`.

So the browser may fail until the **MAMP-served copy** has the same CORS allowlist update.


## What code changes were made in THIS repo workspace

Backend CORS updates:
- Added `http://localhost:5173` to `ALLOWED_ORIGINS` in `php-api/config/config.php`
- Updated `php-api/api/refresh.php` and `php-api/api/logout.php` to use `ALLOWED_ORIGINS` (they were hard-coded before)

Web app added/updated:
- `web/src/lib/api.ts` – fetch wrapper + login/profile/refresh/logout
- `web/src/lib/env.ts` – reads `VITE_API_BASE_URL` with a default
- `web/src/lib/tokens.ts` – localStorage token helpers
- `web/src/App.tsx` – minimal UI to login + profile + logout
- `web/.env.example` – example env var


## Next steps tonight (exact order)

### Step A — Update the MAMP-served copy’s CORS allowlist
Edit the MAMP-served config file (NOT this repo copy):
- `/Applications/MAMP/htdocs/reactauth-api/config/config.php`

Add this to its `ALLOWED_ORIGINS`:
- `http://localhost:5173`

Also ensure the MAMP-served `api/refresh.php` and `api/logout.php` use `ALLOWED_ORIGINS` (same change we made in this repo).

Then rerun:
```bash
curl -i -H 'Origin: http://localhost:5173' http://localhost:8888/reactauth-api/api/test.php | head -n 40
```
You should now see an `Access-Control-Allow-Origin: http://localhost:5173` header.

### Step B — Point Vite to the correct API base URL
Create `web/.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8888/reactauth-api/api
```
Restart Vite:
```bash
cd web
npm run dev
```

### Step C — Validate from the browser
Open:
- `http://localhost:5173`

Use the UI:
- Click **Login**
- Click **Get Profile (auto-refresh)**


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
