#!/bin/sh
# Compose validates runtime interpolation during build. Use placeholders here;
# real secrets remain runtime-only in Coolify and never become build arguments.
set -eu
# Coolify adds env_file: .env before it writes the runtime file after building.
touch .env
export PG_PASSWORD=build-only-placeholder
export APP_KEYS=build-only-placeholder
export API_TOKEN_SALT=build-only-placeholder
export ADMIN_JWT_SECRET=build-only-placeholder
export TRANSFER_TOKEN_SALT=build-only-placeholder
export ENCRYPTION_KEY=build-only-placeholder
export JWT_SECRET=build-only-placeholder
# Build serially on the shared production host; use Coolify's generated image names.
docker compose --env-file /dev/null -f docker-compose.coolify.yml build strapi
docker compose --env-file /dev/null -f docker-compose.coolify.yml build frontend
