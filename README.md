# SBI CMS Agentic Operator Prototype

Presentation-ready Centralised Monitoring System prototype for SBI's technical evaluation. It combines evidence-linked incident workflows, cached Gemini video understanding, a grounded Mistral operator assistant, an SBI-branded command interface, and a richly seeded Supabase operational model.

> **DEMO / ON-PREM SIMULATION** — Cloudflare, Supabase, Gemini and Mistral are presentation services. Production maps to on-prem PostgreSQL/pgvector, private object storage, an API/AI gateway and approved inference endpoints.

## Demo experience

The six routes are Command Dashboard, Live Alerts, Incident Workspace, Cameras & Digital Twin, Agentic Operator, and Audit & Compliance. The two scripted golden paths cover U.12 frisking compliance and U.17 threat/panic escalation.

The UI uses SBI blue (`#0CB1F2`), white and black. Seeded operational content is labelled **Representative pilot data**. AI results distinguish observed evidence from inferences and cite incident, timestamp and SOP references.

## Architecture

```text
React/Vite UI
    │ authenticated requests
Cloudflare Worker API gateway
    ├── Gemini 3.1 Flash-Lite video analysis → SHA-256 keyed KV cache
    ├── Mistral operator answers → evidence and SOP citations
    └── Supabase service binding (deployment handoff)
            ├── Auth + RLS
            ├── PostgreSQL + pgvector(1024)
            ├── Realtime incident updates
            └── private evidence Storage + signed URLs
```

The Worker enforces an internal limit of 12 requests/minute and 200K estimated input tokens/minute with one `Retry-After`-aware retry. The primary CCTV result is pre-warmed; cache hits do not call Gemini and retain the original analysis timestamp.

## Local run

Requirements: Node.js 22 and npm.

```powershell
npm ci
Copy-Item .env.example .env.development.local
npm run dev
```

Set `PRIMARY_VIDEO_PATH` only in the ignored local environment file. The private primary CCTV clip is served by development middleware and is never copied to `public` or committed. Set `VITE_WORKER_URL` to the deployed gateway.

Quality gates:

```powershell
npm run lint
npm run build
npm run worker:check
```

## Live infrastructure

- Cloudflare Worker: `https://sbi-cms-agentic-gateway.thevikram123.workers.dev`
- GitHub Pages: `https://thevikram123.github.io/sbi-cms-agentic-demo/`
- Supabase project ref: `dxcelfokjazxkmmfoxgq` (`ap-south-1`)
- Migration source: `supabase/migrations/`
- Seed totals: 17 circles, 250 branches, 1,200 cameras, 800 devices, 30,000 alerts, 7,500 incidents, 25,000 lifecycle events and 25,000 immutable audit events.

API contracts:

```text
POST /api/video/analyze
GET  /api/dashboard
GET  /api/incidents
GET  /api/incidents/:id
POST /api/incidents/:id/actions
POST /api/agent/query
GET  /api/evidence/:id/url
```

Mutation requests require `X-Confirmation-Token`. The evidence endpoint fails closed until a Supabase server secret is bound to the Worker; it never falls back to a public URL.

## Deployment handoff

The site is published through GitHub Actions, and its origin is allowlisted by the Worker. `SUPABASE_SECRET_KEY` is bound through Cloudflare Secrets Store and never exposed to the browser. Private evidence upload and authenticated playback remain an explicit operational provisioning step.

## Presentation sequence

Open `SBI-INC-00421`, play the private evidence, show the cached Gemini analysis and original timestamp, ask the operator agent why it was escalated, retrieve the applicable SOP, confirm a lifecycle action, and finish on the immutable audit ledger and on-prem architecture mapping.
