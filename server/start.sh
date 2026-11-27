#!/bin/sh
set -e
node dist/scripts/setup-db.js
if [ -n "$SEED_ADMIN_PHONE" ] && [ -n "$SEED_ADMIN_PASSWORD" ]; then
  node dist/scripts/seed.js
else
  echo "SEED_ADMIN_PHONE or SEED_ADMIN_PASSWORD is not set: skipping the admin"
fi
if [ -n "$SEED_DEMO_PASSWORD" ]; then
  node dist/scripts/seed-demo.js
else
  echo "SEED_DEMO_PASSWORD is not set: skipping the demo data"
fi
exec node dist/index.js
