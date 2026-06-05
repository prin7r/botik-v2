# OpenClaw-based per-user agent runtime image.
# This is the production image that replaces the in-repo stub (runtime/agent.mjs).
#
# Build:   docker build -t botik/agent-runtime:latest agent-runtime/
# Memory:  observed RSS ~60–90MB on alpine + Node 22 + the OpenClaw gateway
# CPU:     0.25 vCPU cap (see provisioner-generated compose)
# Scaling: 2,000 of these on a 64-vCPU / 128GB host with the supervisor from
#          runtime/server.ts is the design target.

FROM node:22-alpine
LABEL org.opencontainers.image.source="https://github.com/ixartz/Next-js-Boilerplate"
LABEL org.opencontainers.image.title="botik/agent-runtime"
LABEL org.opencontainers.image.description="Per-user lightweight OpenClaw gateway"

# OpenClaw ships as an npm package that bundles its own gateway. We install it
# at the version pinned in package.json. The OpenClaw server loop reads
# /home/node/.openclaw/openclaw.json on every request, which is rendered by
# the supervisor at spawn time.
RUN apk add --no-cache tini curl
WORKDIR /home/node
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER node
ENV NODE_ENV=production
ENV OPENCLAW_PORT=7000
EXPOSE 7000
ENTRYPOINT ["/sbin/tini", "--", "/entrypoint.sh"]
