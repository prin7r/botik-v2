# Multi-stage Next.js build.
# Build (from repo root):  docker build -t botik-v2/web:latest .
FROM node:24-alpine AS deps
WORKDIR /app
# Copy lock and manifest from the repo root (build context)
COPY package.json package-lock.json* ./
# Use `npm install` not `npm ci` because the lockfile was generated with a
# different Node version than the build image; `ci` would refuse.
RUN npm install --no-audit --no-fund --legacy-peer-deps

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time we have no .env; the route handlers import Env.ts which
# would normally throw. SKIP_ENV_VALIDATION turns that off.
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
