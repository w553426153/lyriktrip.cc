#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f ".env" ]]; then
  echo "Missing deploy/.env."
  exit 1
fi

echo "Renewing Let's Encrypt certificates (if due)..."
docker compose --env-file .env run --rm --entrypoint "" certbot \
  certbot renew --webroot -w /var/www/certbot

echo "Reloading nginx..."
docker compose --env-file .env exec nginx nginx -s reload

