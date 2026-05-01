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
- `POST /api/export/` — apply selections and generate PDF.
- `GET /api/docs/` — interactive Swagger UI (drf-spectacular / OpenAPI 3).

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
```

### API Docs

Open [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/) for the interactive Swagger UI.

---

## Future Enhancements

- Undo / redo for element selections in the preview
- Save and reuse selection profiles per domain
- Batch URL processing
- Usage quotas and payment integration (free tier / credits / crypto)
- Developer API access with API keys
- Browser extension for one-click export from any tab

---
