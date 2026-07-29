# Frontend — Vue 3 + Vite SPA
# Stage 1: build the static dist/
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY .npmrc package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
