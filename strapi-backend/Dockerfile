# Strapi 5 backend — Alpine-based to avoid Debian bookworm GPG expiry
# Alpine's apk doesn't have the GPG key rotation bug present in current Debian 12 images

FROM node:20-alpine AS build

WORKDIR /app

# Build toolchain for native modules (better-sqlite3 optional dep, sharp)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- runtime stage ---
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/config ./config
COPY --from=build /app/src ./src
COPY --from=build /app/types ./types
COPY --from=build /app/favicon.png ./favicon.png
COPY --from=build /app/public ./public

ENV NODE_ENV=production
EXPOSE 1337

CMD ["node", "node_modules/.bin/strapi", "start"]
