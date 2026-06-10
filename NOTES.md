## SEO

**Backlinks — what you need to do manually (code can't do this):**

- Submit to [Product Hunt](https://producthunt.com), [AlternativeTo](https://alternativeto.net), [There's an AI for That](https://theresanaiforthat.com), and similar tool directories
- Add the site to "awesome-\*" GitHub lists for web tools
- Write a short dev.to / Medium post about the stack — links from those rank well
- Get listed on sites like [Uneed](https://www.uneed.best) and [Futurepedia](https://www.futurepedia.io)

---

Your strongest opportunity is not adding many unrelated converters. Build DistillPage into a **web-content extraction, monitoring, and delivery platform**.

You already have reusable foundations:

- Browser rendering and screenshots
- AI cleanup and manual selectors
- Bulk processing
- Structured extraction
- Authentication, credits, and billing

## Recommended Roadmap

### 1. Custom Structured Data Extraction

Let users describe the data they need or provide a JSON Schema.

Examples:

- “Extract every product’s name, price, rating, and availability.”
- “Extract job title, company, location, and salary.”
- “Extract this page using my JSON Schema.”

Outputs:

- JSON
- CSV
- Excel
- API response

This is significantly more useful than your current fixed JSON structure in [structured_json_generator.py](/Users/mhk/dev/distillpage/backend/app/services/structured_json_generator.py).

**Why build it first:** it targets developers, researchers, sales teams, and businesses willing to pay more per extraction. Firecrawl similarly supports prompt/schema-based structured extraction across URLs.

---

### 2. Website Crawler

Instead of requiring users to paste URLs individually:

1. Enter a domain or sitemap.
2. Discover its pages.
3. Filter by path, page depth, or URL pattern.
4. Export the entire site as Markdown, JSON, PDF, or ZIP.

Useful options:

- Include/exclude URL patterns
- Maximum pages and depth
- Sitemap-only mode
- Deduplicate pages
- Crawl progress screen
- Failed-page report

Your bulk exporters already provide much of the output pipeline. Firecrawl’s crawler demonstrates demand for sitemap discovery, recursive crawling, path filtering, webhooks, and structured outputs.

---

### 3. Webpage Change Monitoring

Allow users to schedule a URL and receive notifications when it changes.

Monitor:

- Cleaned text
- Selected page elements
- Product prices
- Structured JSON fields
- Visual screenshot differences

Notifications:

- Email
- Webhook
- Slack or Discord
- Downloadable before/after comparison

This creates recurring usage and subscription revenue rather than one-time conversions.

---

### 4. CSV and Excel Export

Add **Web → CSV** and **Web → Excel** as output options for:

- HTML tables
- Product listings
- Search results
- Job listings
- Custom-schema extraction results

Excel could generate separate sheets for:

- Main extracted records
- Metadata
- Links
- Images
- Tables

This should share the custom extraction engine rather than becoming another isolated converter.

---

### 5. Scheduled Exports and Webhooks

Let users run conversion jobs:

- Hourly, daily, weekly, or monthly
- Through an API
- Delivered by webhook, email, or downloadable archive

Examples:

- Generate a weekly PDF of a dashboard.
- Send cleaned Markdown to a knowledge base daily.
- Extract competitor pricing every morning.

This requires an asynchronous job model, but it unlocks automation and API customers.

---

### 6. Visual Regression and Page Diff

Use your screenshot capability to compare two URLs or two captures of the same URL.

Outputs:

- Side-by-side screenshots
- Pixel-difference overlay
- Cleaned-text diff
- DOM/content change summary
- Percentage changed

Target users include developers, QA teams, marketers, and compliance teams.

---

### 7. Developer API and Integrations

Expose the conversion tools as a proper developer product:

- API keys
- Usage dashboard
- Async jobs
- Idempotency keys
- Webhooks
- Job history
- Zapier, Make, and n8n integrations
- MCP server for AI agents

Your backend endpoints already provide a useful starting point, but API-key authentication and persistent job tracking would make them commercially usable.

## Improve Existing Tools First

Before adding several new pages, I would add these shared capabilities:

- Export history with rerun and download
- Saved cleanup presets per domain
- Reusable manual selectors
- Desktop, tablet, and mobile viewport presets
- Cookie-banner removal
- Wait-for-selector and custom delay
- Light/dark mode capture
- Page ranges and PDF headers/footers
- Markdown with locally downloaded images
- Partial-failure reports for bulk jobs
- Preview extracted JSON before charging/exporting

## Suggested Build Order

1. **Custom-schema JSON extraction**
2. **CSV and Excel outputs**
3. **Site crawler**
4. **Job history and asynchronous processing**
5. **Scheduled monitoring and change alerts**
6. **Developer API, webhooks, and integrations**
7. **Visual regression tools**

I would avoid prioritizing Web → Summary, Slides, Audio, or Social Posts yet. Those are crowded AI-generation features and do not leverage your strongest differentiation: reliable webpage rendering, cleanup, extraction, and export.

Sources: [Firecrawl Crawl](https://docs.firecrawl.dev/features/crawl), [Firecrawl Extract](https://docs.firecrawl.dev/features/extract), [Browserless Screenshot API](https://docs.browserless.io/rest-apis/screenshot-api), [changedetection.io](https://changedetection.io/)

## VISION

Instead of becoming “a collection of converters,” DistillPage could become:

“The operating system for web knowledge.”

A user gives a URL and chooses an output:

- PDF
- Markdown
- Screenshot
- Summary
- Notes
- Flashcards
- Mind Map
- Audio
- Slides
- Report
- FAQ
- Newsletter
- JSON

## VISION 2

A stronger vision could be:

DistillPage = Your Knowledge Workspace

Users can:

- Capture websites
- Save notes
- Store PDFs
- Create summaries
- Generate flashcards
- Build study materials
- Search everything

This is much more valuable than a collection of unrelated converters.
