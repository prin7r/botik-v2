# Runtime supervisor image. Runs on the same host as the web service (or
# a sibling host with a shared /var/lib/botik).
FROM node:24-alpine
WORKDIR /app

# Install production deps for the web + runtime. We pull in the
# entire repo (small, monorepo) and run the supervisor with tsx.
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy the runtime source and tsx (dev dep, needed to run TS files)
COPY package.json package-lock.json* ./
RUN npm install --save-dev tsx --no-audit --no-fund

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
