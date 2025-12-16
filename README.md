# Homelab Admin Monitoring Dashboard

A Next.js + Prisma admin console that keeps monitors, runs, and AI/n8n integrations safe-by-design for homelab infrastructure (websites, Docker Swarm, Proxmox, Ceph, network, Cloudflare tunnels).

## Tech stack
- Next.js (App Router), React, TypeScript, TailwindCSS
- Next.js API routes (server actions) backed by Prisma + Postgres
- Simple admin cookie auth (`ADMIN_SECRET`) and n8n service token (`N8N_SERVICE_TOKEN`)

## Safety model
- Each `MonitorCategory` owns an allowlisted toolset via `ToolCapability` and `CategoryCapability` joins.
- `Monitor.subtype` is validated with Zod by category-specific schemas before writing configs.
- AI-readable projections use Postgres views (`ai_readable_monitors`, `ai_readable_runs`) and Prisma projections so chat never sees secrets or `raw` payloads.
- `AiCommandQueue` enforces category/capability pairing; `/api/ai/command` rejects mismatches. n8n only processes `APPROVED` items via `/api/n8n/process-commands`.
- Secrets live in the `Secret` table with encrypted values and are never returned by API/chat endpoints.

## Data model
Defined in `prisma/schema.prisma` with initial SQL in `prisma/migrations/0001_init/migration.sql`.
Core entities:
- `MonitorCategory` (WEBSITE, DOCKER, PROXMOX, CEPH, NETWORK, CLOUDFLARE) with AI readability/action flags and capabilities.
- `Monitor` typed by `subtype`, `config` JSONB, cron, ownership scope, enabled flag.
- `MonitorRun` metrics + summary; `raw` remains n8n-only.
- `ToolCapability` + `CategoryCapability` join.
- `AiCommandQueue` for AI/chat requests gated by capabilities.
- `Secret` with encrypted values (placeholder column).
- Views: `AiReadableMonitor`, `AiReadableRun` map to sanitized DB views.

## API surface
- `GET /api/monitors` (admin)
- `POST /api/monitors` (admin, validates subtype)
- `PATCH /api/monitors/:id` (admin)
- `POST /api/monitors/:id/test` (admin → queues APPROVED test command)
- `GET /api/runs?monitorId=` (admin)
- `POST /api/n8n/pull-monitors?category=` (service token)
- `POST /api/n8n/push-run` (service token)
- `POST /api/n8n/process-commands` (service token, fetch APPROVED commands)
- `POST /api/ai/command` (admin/chat → PENDING request validated against allowlist)
- `POST /api/chat` (admin-only for now; read-only projections + draft monitor creation)

## UI pages
- `/admin/overview`: status cards + latest failures
- `/admin/monitors`: table, filters, add/edit, queue tests
- `/admin/monitors/[id]`: detail with run history chart
- `/admin/chat`: chat UI with suggested prompts and safety note

## n8n workflow guidance
See [`docs/n8n-workflows.md`](docs/n8n-workflows.md) for a full, step-by-step walkthrough on wiring n8n to the dashboard, including payload examples, category-specific tool choices, and command queue handling.

## Adding categories/subtypes safely
1. Add a Zod schema in `lib/monitorSchemas.ts` and subtype key.
2. Extend `capabilityByCategory` in `lib/capabilities.ts` and seed the capability in the migration or via Prisma.
3. Update Prisma schema/migration with category + capability mapping.
4. Expose any UI form changes in `components/MonitorFormFields.tsx`.
5. Ensure chat endpoints only expose AI-readable projections and never touch `Secret`.

## Running locally
Set environment variables:
```
ADMIN_SECRET=dev-admin
N8N_SERVICE_TOKEN=dev-service
DATABASE_URL=postgresql://user:password@localhost:5432/monitor
```
Install dependencies and generate the Prisma client:
```
npm install
npx prisma generate
```
Run the dev server:
```
npm run dev
```
To apply the starter schema in Postgres, run:
```
psql "$DATABASE_URL" -f prisma/migrations/0001_init/migration.sql
```
Set a browser cookie `admin-session=ADMIN_SECRET` to access admin endpoints/pages.
