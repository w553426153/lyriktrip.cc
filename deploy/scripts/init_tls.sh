#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f ".env" ]]; then
  echo "Missing deploy/.env. Copy deploy/.env.example to deploy/.env and fill DOMAIN/LETSENCRYPT_EMAIL."
  exit 1
fi

# Load env vars (DOMAIN, LETSENCRYPT_EMAIL)
set -a
source ./.env
set +a

if [[ -z "${DOMAIN:-}" || -z "${LETSENCRYPT_EMAIL:-}" ]]; then
  echo "DOMAIN and LETSENCRYPT_EMAIL must be set in deploy/.env"
  exit 1
fi

echo "Requesting Let's Encrypt certificate for: ${DOMAIN}"
echo "Make sure DNS A record points to this server and port 80 is reachable."

# Ensure nginx is up to serve the acme challenge
docker compose --env-file .env up -d nginx

docker compose --env-file .env run --rm --entrypoint "" certbot \
  certbot certonly --webroot \
  -w /var/www/certbot \
  -d "${DOMAIN}" \
  --email "${LETSENCRYPT_EMAIL}" \
  --agree-tos \
  --no-eff-email

echo "Certificate obtained. Restarting nginx to enable HTTPS..."
docker compose --env-file .env restart nginx
