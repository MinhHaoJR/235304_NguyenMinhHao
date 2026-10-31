#!/bin/sh
set -eu

API_BASE_URL="${API_BASE_URL:-${VITE_API_BASE_URL:-http://localhost:3000}}"

case "$API_BASE_URL" in
  http://*|https://*) ;;
  *)
    echo "API_BASE_URL must be an absolute http(s) URL." >&2
    exit 1
    ;;
esac

printf 'window.__APP_CONFIG__ = { API_BASE_URL: "%s" };\n' "$API_BASE_URL" \
  > /usr/share/nginx/html/runtime-config.js

exec "$@"
