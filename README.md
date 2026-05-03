# Web2TailoredPDF

## Overview

**Web2TailoredPDF** is a web-based tool that lets users generate a tailored PDF from any webpage by visually selecting which elements to keep or remove — directly inside a live preview of the page.

### Product Vision

The original idea was to automatically strip ads, popups, and navbars using readability heuristics. We pivoted to a better approach: **let the user decide**. Instead of guessing which elements are unwanted, the tool renders the target page inside an interactive iframe preview. The user clicks on individual UI sections (ads, navbars, cookie banners, sidebars, etc.) to mark them for removal or inclusion, then exports the result as a high-fidelity PDF.

**User flow:**

1. User enters a URL.
2. Backend fetches the page and returns the full HTML with a resolved `base_url`.
3. Frontend renders the page in a sandboxed iframe with an element-picker overlay injected via `<script>`.
4. User clicks elements to toggle their selection (hover = teal dashed outline; selected = solid orange outline).
5. User clicks elements to mark them for removal (hover = teal dashed outline; selected = solid orange outline).
6. Frontend sends the HTML snapshot, `base_url`, and CSS selectors to the export endpoint.
7. Backend applies selector-based DOM manipulation and generates a PDF via WeasyPrint or Playwright.
8. User downloads the PDF.

---

## Architecture

```
frontend/          React + Vite SPA
  src/
    App.tsx        Main UI: URL input, iframe preview, picker controls, export button

backend/           Django + DRF API
  app/
    views.py       PreviewView, ExportPdfView
    serializers.py PreviewRequestSerializer, ExportRequestSerializer
    services/
      extractor.py    Fetches URL, returns full HTML + base_url
      cleaner.py      DOM manipulation: removes selected elements by CSS selector
      pdf_generator.py  WeasyPrint/Playwright PDF rendering
  backend/
    settings.py    Django config (DB, CORS, installed apps)
    urls.py        Routes /api/ to app.urls, /api/docs/ for Swagger UI
```

---

## Core Features

### 1. Live Interactive Preview

- Backend fetches the page and returns the raw HTML and resolved `base_url`.
- Frontend injects a `<base href="...">` tag and a picker script into the document.
- Two interaction modes:
  - **Cursor mode** — normal browsing inside the iframe (scroll, read).
  - **Select mode** — hover highlights elements with a dashed teal outline; click locks the selection with a solid orange outline.

### 2. Element Selection (Exclude Mode)

- Selected elements are removed from the DOM before PDF generation.
- CSS selectors for each selected element are captured in the frontend and sent to the backend.

### 3. Render Mode

- **Screen CSS** (default): renders the page as seen in the browser.
- **Print CSS**: applies the page's `@media print` stylesheet for a print-optimised layout.

### 4. High-Fidelity PDF Generation

- Backend receives the HTML snapshot + `base_url` + selectors + mode.
- Applies DOM mutations (remove/keep elements) using BeautifulSoup.
- Renders the final HTML to PDF with WeasyPrint (primary) or Playwright (fallback).
- Returns the PDF file; frontend triggers a browser download.

### 5. REST API + Swagger UI

- `POST /api/preview/` — fetch and prepare page HTML for the preview iframe.
- `POST /api/export/` — apply selections and generate PDF (gated by download limits).
- `POST /api/auth/register/` — register with email + password, returns JWT pair.
- `POST /api/auth/login/` — sign in with email + password, returns JWT pair.
- `POST /api/auth/google/` — sign in with a Google ID token, returns JWT pair.
- `POST /api/auth/refresh/` — exchange refresh token for a new access token.
- `GET  /api/auth/me/` — get current user info + credit balance (requires auth).
- `POST /api/payments/create/` — create a NOWPayments invoice (requires auth).
- `POST /api/payments/webhook/` — IPN callback from NOWPayments to credit accounts.
- `GET /api/docs/` — interactive Swagger UI (drf-spectacular / OpenAPI 3).

---

## Authentication

Users can sign in with:
- **Email + password** — `POST /api/auth/register/` to create an account; `POST /api/auth/login/` to sign in.
- **Google** — frontend uses `@react-oauth/google` to obtain a Google ID token, which is verified server-side by `google.oauth2.id_token.verify_oauth2_token`.

JWTs are returned on sign-in: `access` token (15-minute lifetime) and `refresh` token (7-day lifetime). The frontend stores both in `localStorage`.

The `Authorization: Bearer <access_token>` header is sent with export requests.

---

## Download Limits

| User type | Limit |
|-----------|-------|
| Anonymous (not signed in) | **1 free download per IP address** |
| Signed-in user, 0 credits | Blocked (HTTP 402) with a "Buy Credits" prompt |
| Signed-in user, credits > 0 | Allowed; 1 credit deducted per successful export |

Credits are deducted **after** a PDF is successfully generated (no charge for failed exports).

---

## Credit Packages & Pricing

5 downloads per $1. Minimum purchase: $2 (10 downloads). Credits never expire.

| Package | Downloads | Price |
|---------|-----------|-------|
| Starter | 10 | $2 |
| Basic | 25 | $5 |
| Standard | 50 | $10 |
| Pro | 100 | $20 |
| Business | 500 | $100 |
| Enterprise | 1,000 | $200 |
| Unlimited | 10,000 | $2,000 |

---

## Crypto Payments (NOWPayments)

Payments are processed via [NOWPayments](https://nowpayments.io/) (100+ cryptocurrencies supported).

**Flow:**
1. Signed-in user opens the "Buy Credits" modal and selects a package.
2. Frontend calls `POST /api/payments/create/` → backend creates a NOWPayments invoice and stores a pending `CryptoPayment` record.
3. User is redirected to the NOWPayments hosted checkout page.
4. After payment, NOWPayments sends an IPN webhook to `POST /api/payments/webhook/`.
5. Backend verifies the HMAC-SHA512 signature, updates the `CryptoPayment` status, and adds credits to the user's `UserProfile`.
6. User is redirected back to the app (`?payment=success`); frontend calls `/api/auth/me/` to refresh the credit balance.

**NOWPayments sandbox testing:**

1. Register a separate account at [sandbox.nowpayments.io](https://sandbox.nowpayments.io) and generate a sandbox API key + IPN secret.
2. Set in `.env`:
   ```ini
   NOWPAYMENTS_SANDBOX=true
   NOWPAYMENTS_API_KEY=<sandbox-api-key>
   NOWPAYMENTS_IPN_SECRET=<sandbox-ipn-secret>
   NOWPAYMENTS_IPN_CALLBACK_URL=https://<ngrok-subdomain>.ngrok.io/api/payments/webhook/
   ```
3. Expose the local backend with `ngrok http 8000` and copy the HTTPS URL into `NOWPAYMENTS_IPN_CALLBACK_URL`.
4. Select a package in the UI → complete the checkout using a test coin (e.g. **BTCTEST** or **USDTTEST**).
5. Verify credits were added via Django admin → **Crypto Payments** (status should become `finished`).

---

## API Reference

### `POST /api/preview/`

**Request body:**

| Field           | Type    | Required | Description                             |
|-----------------|---------|----------|-----------------------------------------|
| `url`           | string  | Yes      | Full URL of the page to preview         |
| `use_print_css` | boolean | No       | Use print stylesheet (default: `false`) |

**Response:**

```json
{
  "title": "Page Title",
  "html": "<html>...</html>",
  "base_url": "https://example.com/"
}
```

---

### `POST /api/export/`

**Request body:**

| Field           | Type            | Required | Description                                              |
|-----------------|-----------------|----------|----------------------------------------------------------|
| `url`           | string          | Yes      | Original page URL (used if no snapshot provided)         |
| `html_snapshot` | string          | No       | Full HTML string captured from the preview (preferred)   |
| `base_url`      | string          | No*      | Required when `html_snapshot` is provided                |
| `selectors`     | array of string | No       | CSS selectors of the targeted elements (will be removed)  |
| `use_print_css` | boolean         | No       | Apply `@media print` styles (default: `false`)           |

> `base_url` is required when `html_snapshot` is provided.

**Response:** PDF file (binary, `Content-Type: application/pdf`)

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Lucide icons        |
| Backend    | Python, Django 4, Django REST Framework         |
| PDF Engine | WeasyPrint (primary), Playwright (fallback)     |
| API Docs   | drf-spectacular (OpenAPI 3 / Swagger UI)        |
| Database   | PostgreSQL                                      |

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally (or override via environment variables)

### Backend

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Install Playwright browser binaries (for Playwright PDF fallback)
python -m playwright install chromium

# Configure database — set env vars to override defaults:
#   POSTGRES_DB       (default: web_to_pdf)
#   POSTGRES_USER     (default: postgres)
#   POSTGRES_PASSWORD (default: postgres)
#   POSTGRES_HOST     (default: localhost)
#   POSTGRES_PORT     (default: 5432)

cd backend
python manage.py migrate
python manage.py runserver
```

> **macOS note:** WeasyPrint requires native libraries. Install via Homebrew:
> ```bash
> brew install pango cairo gdk-pixbuf libffi
> ```
> The API returns a clear error at runtime if these are missing.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

To point the frontend at a non-default backend, create `frontend/.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

### Backend environment variables

Create `.env` in the project root (next to `backend/`):

```
# Database
POSTGRES_DB=web_to_pdf
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Google OAuth (get from Google Cloud Console → Credentials → OAuth 2.0 Client IDs)
GOOGLE_CLIENT_ID=your-google-oauth-client-id

# NOWPayments (get from https://nowpayments.io → API Keys)
NOWPAYMENTS_API_KEY=your-nowpayments-api-key
NOWPAYMENTS_IPN_SECRET=your-ipn-secret
NOWPAYMENTS_SANDBOX=true                       # set to false in production
NOWPAYMENTS_IPN_CALLBACK_URL=https://your-public-domain/api/payments/webhook/
NOWPAYMENTS_SUCCESS_URL=https://your-frontend-domain?payment=success
NOWPAYMENTS_CANCEL_URL=https://your-frontend-domain
```

### API Docs

Open [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/) for the interactive Swagger UI.

---

## Future Enhancements

- Undo / redo for element selections in the preview
- Save and reuse selection profiles per domain
- Batch URL processing
- Developer API access with API keys
- Browser extension for one-click export from any tab
- Admin dashboard for monitoring payments and user credits
- Fiat payment option (Stripe) in addition to crypto

---
