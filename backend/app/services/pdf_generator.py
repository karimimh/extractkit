from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from django.conf import settings


PDF_BASE_STYLE = """
@page {
  size: A4;
  margin: 10mm;
}
img {
  max-width: 100%;
  height: auto;
}
pre, code {
  white-space: pre-wrap;
  word-break: break-word;
}
"""


class PdfGenerationError(Exception):
  """Raised when PDF generation cannot be completed."""


@dataclass
class GeneratedPdf:
  title: str
  relative_path: str


def generate_pdf_from_url(url: str, timeout_ms: int = 60000) -> GeneratedPdf:
  try:
    from playwright.sync_api import sync_playwright
  except Exception as exc:
    raise PdfGenerationError(
      "Browser PDF engine is unavailable. Install Playwright and Chromium."
    ) from exc

  exports_dir = Path(settings.MEDIA_ROOT) / "exports"
  exports_dir.mkdir(parents=True, exist_ok=True)

  filename = f"{uuid4().hex}.pdf"
  output_path = exports_dir / filename

  try:
    with sync_playwright() as playwright:
      browser = playwright.chromium.launch(headless=True)
      context = browser.new_context(ignore_https_errors=True)
      page = context.new_page()
      response = page.goto(url, wait_until="networkidle", timeout=timeout_ms)

      if response is not None and response.status >= 400:
        raise PdfGenerationError(f"Failed to load URL (status {response.status})")

      page.emulate_media(media="print")
      title = page.title().strip() or "Exported Website"
      page.pdf(
        path=str(output_path),
        format="A4",
        print_background=True,
        prefer_css_page_size=True,
      )

      context.close()
      browser.close()
  except PdfGenerationError:
    raise
  except Exception as exc:
    raise PdfGenerationError("Failed to render full page PDF") from exc

  return GeneratedPdf(title=title, relative_path=f"exports/{filename}")


def generate_pdf(title: str, article_html: str, base_url: str | None = None) -> str:
    try:
      from weasyprint import CSS, HTML
    except Exception as exc:
      raise PdfGenerationError(
        "PDF engine is unavailable. Install WeasyPrint system dependencies."
      ) from exc

    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}.pdf"
    output_path = exports_dir / filename

    html_lower = article_html.lower()
    has_html_shell = "<html" in html_lower and "</html>" in html_lower
    wrapped_html = article_html if has_html_shell else f"""
    <html>
      <head>
        <meta charset=\"utf-8\" />
        <title>{title}</title>
      </head>
      <body>
        {article_html}
      </body>
    </html>
    """

    try:
      HTML(string=wrapped_html, base_url=base_url or str(settings.BASE_DIR)).write_pdf(
        str(output_path),
        stylesheets=[CSS(string=PDF_BASE_STYLE)],
      )
    except Exception as exc:
      raise PdfGenerationError("Failed to render PDF") from exc

    return f"exports/{filename}"
