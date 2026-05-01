# Clean PDF Export Tool

## Overview

This project is a web-based tool that allows users to input a webpage URL and generate a clean, readable, and well-formatted PDF version of that page.

The tool removes:

- Ads
- Popups
- Navigation bars
- Unnecessary styling

And keeps:

- Main article/content
- Images (optional)
- Proper formatting for reading

suggested name: Web2TailoredPDF

---

## Core Features (MVP)

### 1. URL to Clean HTML

- User inputs a URL
- Backend fetches the page
- Extract main content using readability logic

### 2. Clean Formatting

- Strip unnecessary CSS
- Apply consistent typography
- Optional dark/light mode

### 3. PDF Generation

- Convert cleaned HTML → PDF
- Ensure:
  - Proper margins
  - Pagination
  - Embedded fonts

### 4. Download / Paywall

- Free: limited usage (e.g., 2 per day)
- Paid: unlimited or credits
- Payment via crypto (manual or automated)

---

## Tech Stack

### Frontend

- React (Vite)
- TailwindCSS (optional)
- Axios for API calls

### Backend

- Django + Django REST Framework
- Celery (optional for async processing)
- PostgreSQL

#### PostgreSQL Configuration

Set these environment variables before running the backend:

- `POSTGRES_DB` (default: `web_to_pdf`)
- `POSTGRES_USER` (default: `postgres`)
- `POSTGRES_PASSWORD` (default: `postgres`)
- `POSTGRES_HOST` (default: `localhost`)
- `POSTGRES_PORT` (default: `5432`)

Then run migrations:

```bash
cd backend
python manage.py migrate
```

### PDF Generation Options

- WeasyPrint (recommended for Django)
- Playwright (for better rendering)
- wkhtmltopdf (fallback)

#### Playwright runtime setup

For full-page rendering similar to browser "Print as PDF", install Playwright browser binaries after dependencies:

```bash
cd backend
pip install -r requirements.txt
python -m playwright install chromium
```

### Content Extraction

- readability-lxml
- newspaper3k (optional fallback)

---

## Project Structure

```
project-root/
│
├── backend/
│   ├── manage.py
│   ├── app/
│   │   ├── views.py
│   │   ├── services/
│   │   │   ├── extractor.py
│   │   │   ├── cleaner.py
│   │   │   └── pdf_generator.py
│   │   ├── models.py
│   │   └── urls.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── index.html
│
└── README.md
```

---

## Backend Flow

1. Receive URL from frontend
2. Fetch HTML content
3. Extract main article content
4. Clean and sanitize HTML
5. Convert to PDF
6. Return file URL or stream

---

## API Design

### POST /api/export

Request:

```
{
  "url": "https://example.com/article"
}
```

Response:

```
{
  "pdf_url": "https://yourdomain.com/media/file.pdf"
}
```

---

## Frontend Flow

1. Input field for URL
2. Submit button
3. Loading state
4. Show download button when ready

---

## Monetization Strategy

### Option 1: Credits System

- 3 free exports
- Pay with crypto for credits

### Option 2: Pay Per Download

- Lock download
- User pays → unlock link

### Option 3: Freemium

- Low-quality PDF free
- High-quality PDF paid

---

## Crypto Payment (Simple Start)

### Phase 1 (Manual)

- Show wallet address
- User pays
- Admin verifies
- Unlock feature

### Phase 2 (Automated)

- Use payment APIs (e.g., Coinbase Commerce)
- Webhook to unlock access

---

## MVP Scope (Keep it small)

Build ONLY:

- URL input
- Basic extraction
- Basic PDF generation
- Download link

DO NOT build yet:

- Accounts
- Complex UI
- Advanced formatting
- Payment automation

---

## Future Enhancements

- Batch URL processing
- Browser extension integration
- Save history
- API access for developers

---

## Development Steps

1. Setup Django project
2. Implement URL fetch + extraction
3. Generate PDF from static HTML
4. Connect API to React frontend
5. Improve formatting
6. Add simple rate limiting

---

## Notes for Copilot

- Keep functions small and modular
- Prefer service-based structure in backend
- Avoid overengineering
- Focus on working pipeline first

Key pipeline: URL → HTML → Extract → Clean → PDF → Response

---

## Example Libraries

Backend:

- requests
- readability-lxml
- weasyprint

Frontend:

- axios

---

## Goal

Build a fast, minimal, and useful tool that users can use instantly without signup.

Speed of development and simplicity is more important than perfection.
