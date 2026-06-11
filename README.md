# DistillPage

A platform for extracting, transforming, exporting, and monitoring webpages.

| Tool | Route | Description |
|------|-------|-------------|
| **Web → PDF** | `/web-to-pdf` | Export a full page, use AI Cleanup, or manually remove elements before generating a PDF |
| **Web → Markdown** | `/web-to-markdown` | Convert a full or AI-cleaned web page into portable Markdown |
| **Web → JSON** | `/web-to-json` | Extract standard page fields or custom prompt/schema-driven structured data |
| **Web → Screenshot** | `/web-to-screenshot` | Export full, AI-cleaned, or manually edited webpages as high-resolution PNG images |
| **Website Bulk Export** | `/website-bulk-export` | Discover same-domain pages from sitemaps and internal links, then export the selected site pages |
| **Webpage Monitoring** | `/change-monitoring` | Monitor webpage text, selected elements, structured fields, or visual captures and receive change notifications |
| **Export History** | `/export-history` | Review, download, rerun, and schedule previous exports |
| **Web → CSV** | `/web-to-csv` | Export webpage tables, listings, or custom extracted records as CSV |
| **Web → Excel** | `/web-to-excel` | Export records plus metadata, links, images, and tables as an Excel workbook |
| **Developer API** | `/developer-api` | Manage API keys, usage, webhooks, and integrations |

---

## Architecture

```
frontend/          React 19 + Vite 8 SPA
  src/
    App.tsx        Router and shared layout
    components/    Navigation, auth, billing, and shared UI
    context/       Shared authentication context
    lib/           API clients and shared utilities
    pages/         Webpage tools, history, monitoring, developer API, and blog

backend/           Django 5 + Django REST Framework
  app/             Web extraction, exports, jobs, monitoring, auth, and billing
  backend/
    settings.py    Single settings module
    urls.py        API, admin, schema, and Swagger routes
```

---

## Auth & Billing

**Authentication** provides one account and session across the webpage tools.

- `POST /api/auth/register/` — email + password → JWT pair
- `POST /api/auth/login/` — email + password → JWT pair
- `POST /api/auth/google/` — Google ID token → JWT pair
- `POST /api/auth/refresh/` — rotate access token
- `GET  /api/auth/me/` — current user + wallet balance

**Billing** uses a USD-cent wallet funded through NOWPayments.

| Action | Cost |
|--------|------|
| PDF export | $0.20 per URL |
| Markdown export | $0.20 per URL |
| Structured JSON export | $0.20 per URL |
| CSV or Excel export | $0.20 per URL |
| Screenshot export | $0.20 per URL |

Prices are configurable in `settings.USAGE_PRICES_CENTS` without migrations.

**Wallet packages:**

| Wallet balance | Price |
|----------------|-------|
| $5 | $5 |
| $10 | $10 |
| $25 | $25 |
| $50 | $50 |
| $100 | $100 |
| $250 | $250 |

---

## Web conversion tools

1. User enters a URL.
2. User chooses a cleanup method:
   - **Full Page export**: export the page without cleanup.
   - **AI Cleanup**: OpenAI analyzes a compact DOM outline and identifies navigation, ads, cookie banners, popups, footers, unrelated sidebars, and other interruptions while preserving primary content.
   - **Manual Interaction**: render a sandboxed preview, browse the page, and click elements to remove them. This is the default for single-page exports.
3. The frontend sends the URL, cleanup choice, optional DOM snapshot, and manual selectors to the selected export endpoint.
4. The backend generates PDF, Markdown, structured JSON, or a screenshot.

Web → JSON also supports **Custom extraction** for single URLs. Describe the records
and fields to extract, optionally provide an object-rooted JSON Schema, and the backend
uses `CUSTOM_EXTRACTION_MODEL` (default `gpt-4o-mini`) to produce and validate the result.

AI Cleanup uses `OPENAI_API_KEY` and defaults to `gpt-4o-mini`. Override the model with `AI_CLEANUP_MODEL`. The model receives a bounded DOM outline rather than the full raw page, and returns candidate IDs to remove. AI Cleanup fails with a clear API error when the key is missing or OpenAI cannot analyze the page; it does not silently remove elements using heuristics.

---

## API

Interactive docs at `GET /api/docs/` (Swagger UI, drf-spectacular).

Core endpoints:

```
POST /api/preview/                     Fetch URL for iframe preview
POST /api/export/                      Generate PDF
POST /api/export-markdown/             Generate Markdown
POST /api/export-json/                 Generate structured JSON
POST /api/export-tabular/              Generate CSV or Excel
POST /api/export-screenshot/           Generate a PNG screenshot
POST /api/export/bulk-pdf/             Generate bulk PDF output
POST /api/export/bulk-markdown/        Generate bulk Markdown output
POST /api/export/bulk-json/            Generate bulk JSON output
POST /api/export/bulk-screenshot/      Generate bulk screenshot output
POST /api/crawl/                       Discover same-domain website pages
GET  /api/jobs/                        List export job history
POST /api/jobs/                        Queue an asynchronous export
GET  /api/developer/keys/              List developer API keys
POST /api/developer/keys/              Create a developer API key
GET  /api/developer/usage/             Get 30-day API usage
POST /api/mcp/                         MCP JSON-RPC endpoint for AI agents
GET  /api/schedules/                   List recurring export schedules
POST /api/schedules/                   Create a recurring export schedule
PATCH /api/schedules/{id}/             Pause, resume, or update a schedule
DELETE /api/schedules/{id}/            Delete a schedule
GET  /api/monitors/                    List webpage change monitors
POST /api/monitors/                    Create a change monitor and baseline
PATCH /api/monitors/{id}/              Pause, resume, or update a monitor
POST /api/monitors/{id}/run/           Queue an immediate monitor check
GET  /api/monitors/{id}/changes/       List detected changes
POST /api/auth/register/               Create account
POST /api/auth/login/                  Sign in
POST /api/auth/google/                 Google sign-in
POST /api/auth/refresh/                Refresh JWT
GET  /api/auth/me/                     Current user + wallet balance
POST /api/auth/change-password/        Change password
POST /api/payments/create/             Create NOWPayments invoice
POST /api/payments/webhook/            NOWPayments IPN callback
```

All web conversion export endpoints accept `ai_cleanup: true` to enable AI Cleanup. Single-page endpoints also accept `selectors` for Manual Interaction exports. Omitting both produces a Full Page export.

Scheduled exports require a continuously running scheduler process:

```bash
cd backend
python manage.py run_scheduled_exports --loop --interval 60
```

Webhook deliveries use the `export.completed` or `export.failed` event name. When a webhook is configured, the schedule creation response returns its signing secret once. Verify the raw request body using HMAC-SHA256 against the `X-DistillPage-Signature: sha256=...` header. Deliveries also include `X-DistillPage-Event` and `X-DistillPage-Job-Id`.

Developer API keys use the `X-API-Key` header. Async job requests support an `Idempotency-Key` header and optional `webhook_url` / `webhook_secret` fields. The MCP endpoint exposes create, get, and list export-job tools over authenticated JSON-RPC.

Webpage monitors use the same scheduler process. They support cleaned text, selected CSS elements, structured JSON fields, and visual screenshots. The first check creates a baseline; later changes create downloadable before/after comparisons and send the `monitor.changed` webhook event. Generic webhooks, Slack webhooks, Discord webhooks, and account-email notifications are supported.

---

## Local development

**Backend:**

```bash
cd /path/to/distillpage
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env    # fill in required keys
cd backend
python manage.py migrate
python manage.py runserver
```

Required `.env` keys for full functionality — see DEPLOY.md for the complete list.

For AI Cleanup:

```bash
OPENAI_API_KEY=<your-openai-api-key>
AI_CLEANUP_MODEL=gpt-4o-mini
AI_CLEANUP_RENDER_WAIT_MS=5000
# OPENAI_BASE_URL=<optional-compatible-api-base-url>
```

**Frontend:**

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

**Type-check (app shell only, excludes vendored tools):**

```bash
cd frontend && npx tsc -b
```

**Production build:**

```bash
cd frontend && npm run build   # outputs to frontend/dist/
```
