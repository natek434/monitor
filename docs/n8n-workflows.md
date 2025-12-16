# n8n workflow implementation guide

This guide describes how to connect n8n to the admin monitoring dashboard, pull monitors by category, run checks with the allowed toolset, and push results back safely. It is designed so that AI/chat agents can only request allowed actions and n8n enforces capability boundaries per monitor category.

## Prerequisites
- `N8N_SERVICE_TOKEN` configured in the dashboard environment and copied into the n8n workflow as an HTTP header value.
- Dashboard base URL (e.g., `https://monitor.example.com`).
- Database seeded with monitor categories, capabilities, and at least one monitor record.

## Core API endpoints for n8n
All n8n calls must include `X-Service-Token: $N8N_SERVICE_TOKEN`.

| Purpose | Method + Path | Notes |
| --- | --- | --- |
| Pull enabled monitors for a category | `POST /api/n8n/pull-monitors?category=WEBSITE` | Returns enabled monitors with config; rejects unknown categories. |
| Push run results | `POST /api/n8n/push-run` | Accepts `monitorId`, timestamps, `status` (`OK | WARN | FAIL`), `metrics`, `summary`, optional `raw`. |
| Fetch approved AI commands | `POST /api/n8n/process-commands` | Returns latest APPROVED commands including `category` + `capabilityKey`; use deduping to avoid replay until an update endpoint is added. |

### Payload examples
Pull monitors:
```json
[
  {
    "id": 12,
    "name": "Main site",
    "categoryId": 1,
    "subtype": "WEBSITE_HTTP",
    "enabled": true,
    "scheduleCron": "*/5 * * * *",
    "config": {"url": "https://example.com", "expectedStatus": 200, "timeoutMs": 5000, "method": "GET", "followRedirects": true},
    "ownershipScope": "public"
  }
]
```

Push run:
```json
{
  "monitorId": 12,
  "startedAt": "2024-04-01T10:00:00.000Z",
  "finishedAt": "2024-04-01T10:00:05.100Z",
  "status": "OK",
  "metrics": {"latencyMs": 5100, "httpStatus": 200},
  "summary": "HTTP 200 in 5.1s",
  "raw": {"responseHeaders": {"server": "nginx"}}
}
```

Approved commands:
```json
[
  {
    "id": 4,
    "requestedBy": "chat",
    "categoryId": 1,
    "category": {"id": 1, "key": "WEBSITE", "name": "Websites", "isAiReadable": true, "isAiActionable": true, "createdAt": "...", "updatedAt": "..."},
    "capabilityKey": "HTTP_GET",
    "payload": {"monitorId": 12, "mode": "TEST"},
    "status": "APPROVED",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

## Capability allowlists by category
Use the capability key to pick the right tool inside n8n; never call a tool outside the allowlist.

- WEBSITE: `HTTP_GET`, `TLS_CHECK`
- DOCKER: `DOCKER_API_READ`
- PROXMOX: `PROXMOX_API_READ`
- CEPH: `CEPH_STATUS_READ`
- NETWORK: `ICMP_PING`, `DNS_LOOKUP`
- CLOUDFLARE: `CLOUDFLARE_API_READ`

## Reference workflow skeleton (per category)
Create one workflow per category so tools never cross boundaries.

1. **HTTP Request: Pull monitors**  
   - Method: POST  
   - URL: `{{$env.BASE_URL}}/api/n8n/pull-monitors?category=WEBSITE` (replace category key per workflow)  
   - Headers: `X-Service-Token: {{$env.N8N_SERVICE_TOKEN}}`, `Accept: application/json`  
   - Response: array of monitors.

2. **Split In Batches** over items to process monitors one at a time.

3. **Switch / IF for subtype** (optional if single subtype per category): branch on `{{$json["subtype"]}}` to pick the right check node.

4. **Check node(s) matching capability**  
   Examples:  
   - WEBSITE: HTTP Request node using `config.url`, timeout `config.timeoutMs`, expect status `config.expectedStatus`; optional TLS certificate check with another HTTP node hitting `https://` and reading cert info.  
   - DOCKER: HTTP Request against Docker API or SSH command to Swarm manager to verify `config.swarmServiceName` or `config.containerName` replica counts.  
   - PROXMOX: HTTP Request to Proxmox API using `config.nodeName` / `config.vmId` to read status and resource usage.  
   - CEPH: Command or API call to `ceph status`/`ceph df` for `config.clusterName` and `config.poolName` thresholds.  
   - NETWORK: ICMP ping node to `config.targetHost` for `config.pingCount`; optional DNS lookup to `config.dnsName`; optional HTTP check to `config.gatewayIp`.  
   - CLOUDFLARE: HTTP Request to Cloudflare API to inspect `config.tunnelName` and `config.hostname`, compute `expectedTlsDaysRemaining`.

5. **Set/Function: Build metrics + status**  
   - Determine `status` (`OK`, `WARN`, or `FAIL`) based on thresholds (e.g., latency vs timeout, replicas vs expected, Ceph health, TLS days remaining).  
   - Construct `metrics` JSON (latencyMs, httpStatus, packetLoss, restartCount, health, etc.) and concise `summary`.  
   - Capture `raw` only if needed for debugging; avoid secrets.

6. **HTTP Request: Push run**  
   - Method: POST  
   - URL: `{{$env.BASE_URL}}/api/n8n/push-run`  
   - Body: JSON with `monitorId` (from pulled monitor), `startedAt`, `finishedAt`, `status`, `metrics`, `summary`, optional `raw`.  
   - Headers: `X-Service-Token`, `Content-Type: application/json`.

7. **Loop** to next batch item until all monitors handled.

## Processing AI command queue (optional workflow)
Use a dedicated workflow on a short interval to service approved commands without granting extra privileges.

1. **HTTP Request: Fetch commands**  
   - POST `{{$env.BASE_URL}}/api/n8n/process-commands` with `X-Service-Token` header.  
   - Response: APPROVED commands with `category`, `capabilityKey`, `payload`.

2. **Split In Batches** and **IF by category** to keep commands scoped to the right workflow. Ignore items whose `category.key` does not match the workflow category (or discard in a Code node).

3. **Capability enforcement**  
   - Add a Switch node keyed on `capabilityKey` (e.g., `HTTP_GET` for WEBSITE tests).  
   - Refuse/skip any capability not in the category allowlist; optionally log a WARN run back to `/api/n8n/push-run` for traceability.

4. **Execute the permitted action**  
   - For TEST commands, re-run the same check logic used in the main workflow for the referenced monitor.  
   - Build metrics/summary and push a run via `/api/n8n/push-run`.

5. **Deduplicate**  
   - Until an execute/ack endpoint exists, store processed `command.id` values in n8n (e.g., static data) to avoid reprocessing on the next poll.

## Operational tips
- Keep one workflow per category so environment-specific credentials (Docker API, Proxmox token, Cloudflare token) never mix. Add credentials to n8n nodes directly; they are not stored in the app.
- Do not write secrets into `metrics`, `summary`, or `raw`. Only operational facts should be pushed back.
- Align schedules with `Monitor.scheduleCron`. If a monitor is disabled, it will not be pulled; no extra filtering required.
- For TLS checks, compute remaining days in a Function node and mark WARN/FAIL when below `expectedTlsDaysRemaining`.
- For Swarm/Proxmox/Cloudflare APIs, prefer read-only tokens scoped to the target category to maintain the safety model.
- Log errors as `WARN` or `FAIL` runs instead of throwing to keep visibility inside the dashboard.
