# Runtime supervisor image. Runs on the same host as the web service (or
# a sibling host with a shared /var/lib/botik).
FROM node:24-alpine
WORKDIR /app

# Install production deps (libsec + tsx). We use `npm install` not `npm ci`
# because the lockfile was generated with a different Node version.
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund --legacy-peer-deps

# Copy the source we need
COPY src ./src
COPY runtime ./runtime
COPY migrations ./migrations
COPY drizzle.config.ts ./
COPY tsconfig.json ./

ENV NODE_ENV=production
ENV RUNTIME_HOST=0.0.0.0
ENV RUNTIME_PORT=18789
EXPOSE 18789

CMD ["npx", "tsx", "runtime/server.ts"]
