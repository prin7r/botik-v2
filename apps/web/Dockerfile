# Multi-stage Next.js build.
# Build (from repo root):  docker build -t botik-v2/web:latest -f apps/web/Dockerfile .
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
RUN cd apps/web && npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
