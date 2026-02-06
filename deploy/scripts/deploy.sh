#!/usr/bin/env bash
set -euo pipefail

# Deploy helper for Ubuntu server
# - builds frontend dist/
# - rebuilds api image
# - (re)starts docker compose stack

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
deploy_dir="${repo_root}/deploy"

if [[ ! -f "${deploy_dir}/.env" ]]; then
  echo "Missing ${deploy_dir}/.env. Copy ${deploy_dir}/.env.example to ${deploy_dir}/.env first."
  exit 1
fi

echo "Building frontend..."
cd "${repo_root}"
npm ci
npm run build

echo "Starting stack..."
cd "${deploy_dir}"
docker compose --env-file .env up -d --build db api nginx

echo "Done."
echo "Tip: first time TLS -> run: cd ${deploy_dir} && ./scripts/init_tls.sh"

