# Builds the static site and exposes only the built files (the `export` stage), so
#   docker buildx build --target export -o <dir> --build-arg VITE_API_BASE_URL=... .
# writes dist/ straight into <dir>. Caddy on the VPS serves that directory; no Node runtime in production.
# VITE_* values are baked in at build time — never put secrets here.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
RUN npm run build

FROM scratch AS export
COPY --from=build /app/dist /
