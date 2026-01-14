#!/usr/bin/env bash
set -euo pipefail

# Builds a deployable zip of the PHP API (including vendor/) for upload to Hostinger.
# Usage:
#   bash scripts/build_hostinger_api_zip.sh

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
api_dir="$repo_root/php-api"
out_zip="$repo_root/reactauth-api-deploy.zip"

if [[ ! -d "$api_dir" ]]; then
  echo "ERROR: Missing php-api/ folder at: $api_dir" >&2
  exit 1
fi

if [[ ! -d "$api_dir/vendor" ]]; then
  echo "ERROR: php-api/vendor is missing. Run composer locally first:" >&2
  echo "  cd php-api && composer install --no-dev --optimize-autoloader" >&2
  exit 1
fi

rm -f "$out_zip"

# Create zip with the folder name expected on the server: reactauth-api/
# Excludes local-only stuff that shouldn't be deployed.
(
  cd "$repo_root"
  zip -r "$out_zip" reactauth-api \
    -x "reactauth-api/config/config.local.php" \
    -x "reactauth-api/scripts/*" \
    -x "reactauth-api/database/*" \
    -x "reactauth-api/.DS_Store" \
    -x "reactauth-api/**/.DS_Store"
)

echo "Created: $out_zip"
echo "Upload it to Hostinger and extract into public_html/"
