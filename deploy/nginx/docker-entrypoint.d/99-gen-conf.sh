#!/usr/bin/env sh
set -eu

# This runs automatically on nginx official image startup.
# We generate /etc/nginx/conf.d/site.conf based on whether TLS certs exist.

: "${DOMAIN:?DOMAIN env var is required}"
: "${API_PORT:?API_PORT env var is required}"

cert="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

http_template="/opt/nginx-templates/site.http.conf.template"
https_template="/opt/nginx-templates/site.https.conf.template"
out="/etc/nginx/conf.d/site.conf"

if [ -f "${cert}" ]; then
  echo "TLS cert found for ${DOMAIN}; enabling HTTPS + 80->443 redirect."
  if [ ! -f "${https_template}" ]; then
    echo "Missing template: ${https_template}" >&2
    exit 1
  fi
  envsubst '${DOMAIN} ${API_PORT}' < "${https_template}" > "${out}"
else
  echo "TLS cert not found for ${DOMAIN}; starting in HTTP-only mode."
  if [ ! -f "${http_template}" ]; then
    echo "Missing template: ${http_template}" >&2
    exit 1
  fi
  envsubst '${DOMAIN} ${API_PORT}' < "${http_template}" > "${out}"
fi

echo "Generated ${out}:"
nginx -t
