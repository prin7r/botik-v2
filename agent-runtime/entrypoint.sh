#!/bin/sh
# Render /home/node/.openclaw/openclaw.json from the secret mounted at
# /run/secrets/openclaw.json (HMAC-signed by the supervisor) and start the
# OpenClaw gateway.
set -eu
mkdir -p /home/node/.openclaw
if [ ! -f /run/secrets/openclaw.json ]; then
  echo "[AGENT_RUNTIME] no config at /run/secrets/openclaw.json" >&2
  exit 1
fi
# Verify the HMAC against PROVISIONER_HMAC_SECRET before trusting the config.
node -e '
  const fs = require("fs");
  const c = require("crypto");
  const data = JSON.parse(fs.readFileSync("/run/secrets/openclaw.json", "utf8"));
  const expected = c.createHmac("sha256", process.env.PROVISIONER_HMAC_SECRET).update(JSON.stringify(data.payload)).digest("hex");
  if (expected !== data.sig) { console.error("bad signature"); process.exit(2); }
  fs.writeFileSync("/home/node/.openclaw/openclaw.json", JSON.stringify(data.payload, null, 2));
  fs.chmodSync("/home/node/.openclaw/openclaw.json", 0o600);
'
exec node node_modules/@openclaw/gateway/dist/cli.js serve --port "${OPENCLAW_PORT}" --config /home/node/.openclaw/openclaw.json
