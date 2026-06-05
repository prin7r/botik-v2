# Scaling

Design target: 2,000 personal agents on a single host. Observed agent RSS
on Alpine + Node 22 + the OpenClaw gateway: **60–90MB**.

## Per-agent footprint

| Resource | Cap (production) | Observed (p50) |
| -------- | ---------------- | -------------- |
| RSS      | 256MB            | 80MB           |
| vCPU     | 0.25             | ~0.05 active, 0 idle |
| Disk     | 1GB workspace    | 5–50MB         |
| Network  | 1Mbps avg        | <100Kbps       |

The Docker compose for each agent (rendered by the supervisor at spawn
time) uses the standard rlimits pattern:

```yaml
services:
  agent:
    image: botik/agent-runtime:latest
    read_only: true
    tmpfs: [/tmp:size=32m]
    ulimits:
      nproc: 256
      nofile: 1024
    security_opt: [no-new-privileges:true]
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
```

## Single-host math

Assume a 64-vCPU / 128GB host (server 144).

- 2,000 agents × 256MB = 512GB worst-case, but with 0.25 vCPU caps only ~64
  agents run concurrently.
- Realistic steady-state RSS ~80MB → 160GB working set, which fits.
- 2,000 agents × 1Mbps = 2Gbps peak. A 10Gbps NIC is plenty.

**Comfortable headroom**: ~1,200 hot agents. Beyond that, idle agents are
`docker pause`'d by the supervisor (a paused container holds its memory but
uses zero CPU). That pushes us to ~1,800–2,000.

## Horizontal scaling

When sustained active count exceeds ~1,000, add a second host. The changes
are local to the host and the load balancer — no application change.

1. Deploy the same image to the new host.
2. Add `BOTIK_HOST_ID` to its env (e.g. `host=2`).
3. The supervisor on host 2 only provisions users where
   `userId % NUM_HOSTS == 2`. The web/api side already round-robins
   provisioning across hosts via a `hosts` table.
4. Traefik on the new host gets a copy of the wildcard cert and routes
   `/api/agent/logs/stream` to the host that owns the user. In practice the
   web side reads `agents.hostId` and 302s to the right host.

## Why no Kubernetes

We considered it. We rejected it. The supervisor is ~250 lines of TS and
reconciles containers to a Postgres-backed desired state every 5s. K8s adds
150MB of control-plane per node and an entire ecosystem of CRDs to learn
for an operator who just wants to ship a $1/mo product.

If we ever cross 10k agents we'll revisit. Until then: Postgres + a small
reconciler.
