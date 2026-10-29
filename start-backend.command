#!/bin/sh
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22.12 or newer is required. Install it from https://nodejs.org/"
  exit 1
fi
exec node backend/server.js
