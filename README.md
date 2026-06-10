# DistillPage

A unified platform for working with web content. Multiple tools, one account, one credits balance.

| Tool | Route | Description |
|------|-------|-------------|
| **Web → PDF** | `/web-to-pdf` | Export a full page, use AI Cleanup, or manually remove elements before generating a PDF |
| **Web → Markdown** | `/web-to-markdown` | Convert a full or AI-cleaned web page into portable Markdown |
| **Web → JSON** | `/web-to-json` | Extract standard page fields or custom prompt/schema-driven structured data |
| **Web → Screenshot** | `/web-to-screenshot` | Export full, AI-cleaned, or manually edited webpages as high-resolution PNG images |
| **Web → CSV** | `/web-to-csv` | Export webpage tables, listings, or custom extracted records as CSV |
| **Web → Excel** | `/web-to-excel` | Export records plus metadata, links, images, and tables as an Excel workbook |
| **Study** | `/study` | Upload a PDF and generate summaries, quizzes, and flashcard decks powered by an LLM |
| **Notes** | `/notes` | Markdown note-taking with labels, history, AI generation/summarisation/translation, and an AI assistant |
| **Images** | `/images` | Client-side canvas image editor with adjustments, filters, white-balance correction, and super-resolution |

---

## Architecture

```
frontend/          React 19 + Vite 8 SPA (single build for all tools)
  src/
    App.tsx        Router — /web-to-pdf /web-to-markdown /web-to-json /web-to-screenshot /study /notes /images + layout
    components/    AppNav, UserHeader (auth + buy-credits modal)
    pages/         WebsiteToPdf
    context/       AuthContext (shared JWT)
    tools/
      study/       Readeb UI (ported from Next.js)
      notes/       Note-cards UI (Vite/React)
      images/      Picnice canvas UI (Vite/React)

backend/           Django 5 + DRF (single project, all tools as apps)
  app/             Core: auth, payments, PDF export, credits ledger
  study/           PDF → study materials (quiz, flashcards, summary)
  notes/           Notes CRUD + AI endpoints (Gemini)
  customer_support/ Support tickets
  project/         Image project management
  vision/          CV backend (brightness, white-balance, super-resolution)
  backend/
    settings.py    Single settings module
    urls.py        /api/ /api/study/ /api/notes/ /api/images/ /api/support/
```

---

## Auth & Billing

**Authentication** is shared across all tools — one account, one session.

- `POST /api/auth/register/` — email + password → JWT pair
- `POST /api/auth/login/` — email + password → JWT pair
- `POST /api/auth/google/` — Google ID token → JWT pair
- `POST /api/auth/refresh/` — rotate access token
- `GET  /api/auth/me/` — current user + credit balance

**Credits** are the single billing currency (NOWPayments, 100+ cryptos). 1 credit = 1 action.

| Action | Cost |
|--------|------|
| Web → PDF export | 1 credit |
| Notes AI: generate / summarise / translate / assistant | 1 credit each |
| Anonymous PDF export | 1 free (per IP) |

Credit costs are tunable in `settings.CREDIT_COSTS` without migrations.

**Packages** (5 credits/$1, minimum $2):

| Package | Credits | Price |
|---------|---------|-------|
| Starter | 10 | $2 |
| Basic | 25 | $5 |
| Standard | 50 | $10 |
| Pro | 100 | $20 |
| Business | 500 | $100 |
| Enterprise | 1,000 | $200 |

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

## Study tool

1. Upload a PDF (up to 50 MB by default).
2. Backend extracts text and runs it through the LLM pipeline (`study_assistant`).
3. Returns: chapter summary, multiple-choice quiz, and flashcard deck.
4. Results are cached on disk (`LLM_CACHE_DIR`) to avoid redundant API calls.

LLM provider is configurable via `LLM_PROVIDER` (openai / gemini) and `USE_REAL_LLM`. Falls back to a deterministic offline generator when disabled.

---

## Notes tool

Full-featured markdown note editor:

- CRUD with labels, pinning, bulk reorder, version history
- Download notes as PDF / Markdown
- AI actions (each costs 1 credit): generate from prompt, summarise, translate, free-form assistant
- Support ticket system

---

## Images tool

Client-side canvas editor (no server round-trips for most operations):

- Layers, selections, transform
- Adjustments, colour filters, white-balance correction
- AI super-resolution and auto-brightness via backend vision endpoints (`/api/images/`)

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
POST /api/auth/register/               Create account
POST /api/auth/login/                  Sign in
POST /api/auth/google/                 Google sign-in
POST /api/auth/refresh/                Refresh JWT
GET  /api/auth/me/                     Current user + credits
POST /api/auth/change-password/        Change password
POST /api/payments/create/             Create NOWPayments invoice
POST /api/payments/webhook/            NOWPayments IPN callback

GET  /api/study/documents/             List uploaded PDFs
POST /api/study/documents/             Upload PDF
GET  /api/study/documents/{id}/        Document + generated materials

GET  /api/notes/                       List notes
POST /api/notes/                       Create note
POST /api/notes/generate/              AI: generate note
POST /api/notes/{id}/summarize/        AI: summarise
POST /api/notes/{id}/translate/        AI: translate
POST /api/notes/assistant/             AI: free-form assistant
GET  /api/notes/labels/                Labels CRUD

GET  /api/images/auto-brightness/      Auto-brightness
GET  /api/images/auto-white-balance/   White-balance correction
GET  /api/images/super-resolution/     Super-resolution (Real-ESRGAN)
```

All web conversion export endpoints accept `ai_cleanup: true` to enable AI Cleanup. Single-page endpoints also accept `selectors` for Manual Interaction exports. Omitting both produces a Full Page export.

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
