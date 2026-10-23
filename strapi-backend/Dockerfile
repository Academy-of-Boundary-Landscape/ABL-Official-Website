# Keep the production Node version; native dependencies build in the same image family.
FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV STRAPI_TELEMETRY_DISABLED=true
RUN npm run build

FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914
WORKDIR /app
COPY --from=build --chown=node:node /app ./
ENV NODE_ENV=production STRAPI_TELEMETRY_DISABLED=true
USER node
EXPOSE 1337
CMD ["node", "node_modules/.bin/strapi", "start"]
