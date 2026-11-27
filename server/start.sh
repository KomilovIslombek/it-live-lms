#!/bin/sh
set -e
node dist/scripts/setup-db.js
node dist/scripts/seed.js
if [ -n "$SEED_DEMO_PASSWORD" ]; then
  node dist/scripts/seed-demo.js
fi
exec node dist/index.js
