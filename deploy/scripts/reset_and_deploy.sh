#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="lyriktripcn"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_DIR="${REPO_ROOT}/deploy"

if [[ ! -f "${DEPLOY_DIR}/.env" ]]; then
  echo "Missing ${DEPLOY_DIR}/.env. Copy ${DEPLOY_DIR}/.env.example to ${DEPLOY_DIR}/.env first."
  exit 1
fi

echo "Using COMPOSE_PROJECT_NAME=${PROJECT_NAME}"

cd "${DEPLOY_DIR}"
COMPOSE_PROJECT_NAME="${PROJECT_NAME}" docker compose --env-file .env down -v

cd "${REPO_ROOT}"
echo "Building frontend..."
npm ci
npm run build

cd "${DEPLOY_DIR}"
echo "Starting stack..."
COMPOSE_PROJECT_NAME="${PROJECT_NAME}" docker compose --env-file .env up -d --build db api nginx

echo "Seeding data from CSV/JSON..."
COMPOSE_PROJECT_NAME="${PROJECT_NAME}" docker compose --env-file .env run --rm api node scripts/seed.js

echo "Done."
echo "Visit: http://<server-ip>:8080/"
