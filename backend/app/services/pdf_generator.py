from __future__ import annotations

import logging
import re
import zipfile
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from uuid import uuid4

from bs4 import BeautifulSoup
from django.conf import settings

logger = logging.getLogger(__name__)


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


def _ensure_base_tag(html: str, base_url: str) -> str:
  soup = BeautifulSoup(html, "html.parser")
  head = soup.head
  if head is None:
    head = soup.new_tag("head")
    if soup.html:
      soup.html.insert(0, head)
    else:
      html_tag = soup.new_tag("html")
      html_tag.insert(0, head)
      if soup.body:
        html_tag.append(soup.body)
      soup.append(html_tag)

  if not head.find("base"):
    base_tag = soup.new_tag("base", href=base_url)
    head.insert(0, base_tag)

  return str(soup)


def _apply_selections(page, selectors: list[str] | None) -> None:
  if not selectors:
    return

  page.evaluate(
    """
    (selectors) => {
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          element.remove();
        });
      });
    }
    """,
    selectors,
  )


def _inline_computed_styles(page) -> None:
  page.evaluate(
    """
    () => {
      const elements = Array.from(document.body.querySelectorAll("*"));
      elements.forEach((element) => {
        const computed = window.getComputedStyle(element);
        let cssText = "";
        for (const prop of computed) {
          cssText += prop + ":" + computed.getPropertyValue(prop) + ";";
        }
        element.setAttribute("style", cssText);
      });
    }
    """
  )


def render_html_snapshot(
  url: str,
  timeout_ms: int = 60000,
  use_print_css: bool = False,
) -> tuple[str, str]:
  try:
    from playwright.sync_api import sync_playwright
  except Exception as exc:
    raise PdfGenerationError(
      "Browser preview engine is unavailable. Install Playwright and Chromium."
    ) from exc

  try:
    with sync_playwright() as playwright:
      browser = playwright.chromium.launch(headless=True)
      context = browser.new_context(ignore_https_errors=True)
      page = context.new_page()
      response = page.goto(url, wait_until="networkidle", timeout=timeout_ms)

      if response is not None and response.status >= 400:
        raise PdfGenerationError(f"Failed to load URL (status {response.status})")

      page.emulate_media(media="print" if use_print_css else "screen")

      if use_print_css:
        _inline_computed_styles(page)

      title = page.title().strip() or "Exported Website"
      content = page.content()

      context.close()
      browser.close()
  except PdfGenerationError:
    raise
  except Exception as exc:
    raise PdfGenerationError("Failed to render preview snapshot") from exc

  return title, content


def generate_pdf_from_url(
  url: str,
  timeout_ms: int = 60000,
  selectors: list[str] | None = None,
  use_print_css: bool = False,
) -> GeneratedPdf:
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
      
      try:
        response = page.goto(url, wait_until="networkidle", timeout=timeout_ms)
      except Exception as e:
        logger.error(f"Failed to load URL {url}: {e}")
        raise PdfGenerationError(f"Failed to load URL: {str(e)}") from e

      if response is not None and response.status >= 400:
        raise PdfGenerationError(f"Failed to load URL (status {response.status})")

      page.emulate_media(media="print" if use_print_css else "screen")

      _apply_selections(page, selectors)

      title = page.title().strip() or "Exported Website"
      
      try:
        page.pdf(
          path=str(output_path),
          format="A4",
          print_background=True,
          prefer_css_page_size=True,
        )
      except Exception as e:
        logger.error(f"Failed to generate PDF: {e}")
        raise PdfGenerationError(f"PDF generation failed: {str(e)}") from e

      context.close()
      browser.close()
      
      # Verify PDF was created and is not empty
      if not output_path.exists():
        logger.error(f"PDF file not created at {output_path}")
        raise PdfGenerationError("PDF file was not created")
      
      file_size = output_path.stat().st_size
      if file_size == 0:
        logger.error(f"PDF file is empty at {output_path}")
        output_path.unlink()  # Delete empty file
        raise PdfGenerationError("PDF file is empty")
      
      logger.info(f"PDF generated successfully: {filename} ({file_size} bytes)")
      
  except PdfGenerationError:
    raise
  except Exception as exc:
    logger.error(f"Unexpected error during PDF generation: {exc}", exc_info=True)
    raise PdfGenerationError("Failed to render full page PDF") from exc

  return GeneratedPdf(title=title, relative_path=f"exports/{filename}")


def generate_pdf_from_snapshot(
  html_snapshot: str,
  base_url: str,
  timeout_ms: int = 60000,
  selectors: list[str] | None = None,
  use_print_css: bool = False,
) -> GeneratedPdf:
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
  html_with_base = _ensure_base_tag(html_snapshot, base_url)

  try:
    with sync_playwright() as playwright:
      browser = playwright.chromium.launch(headless=True)
      context = browser.new_context(ignore_https_errors=True)
      page = context.new_page()
      
      try:
        page.set_content(html_with_base, wait_until="load", timeout=timeout_ms)
      except Exception as e:
        logger.error(f"Failed to set page content: {e}")
        raise PdfGenerationError(f"Failed to load HTML content: {str(e)}") from e

      page.emulate_media(media="print" if use_print_css else "screen")
      _apply_selections(page, selectors)

      title = page.title().strip() or "Exported Website"
      
      try:
        page.pdf(
          path=str(output_path),
          format="A4",
          print_background=True,
          prefer_css_page_size=True,
        )
      except Exception as e:
        logger.error(f"Failed to generate PDF: {e}")
        raise PdfGenerationError(f"PDF generation failed: {str(e)}") from e

      context.close()
      browser.close()
      
      # Verify PDF was created and is not empty
      if not output_path.exists():
        logger.error(f"PDF file not created at {output_path}")
        raise PdfGenerationError("PDF file was not created")
      
      file_size = output_path.stat().st_size
      if file_size == 0:
        logger.error(f"PDF file is empty at {output_path}")
        output_path.unlink()  # Delete empty file
        raise PdfGenerationError("PDF file is empty")
      
      logger.info(f"PDF generated successfully: {filename} ({file_size} bytes)")
      
  except PdfGenerationError:
    raise
  except Exception as exc:
    logger.error(f"Unexpected error during PDF generation: {exc}", exc_info=True)
    raise PdfGenerationError("Failed to render preview PDF") from exc

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


# ---------------------------------------------------------------------------
# Bulk export helpers
# ---------------------------------------------------------------------------

def _safe_filename(title: str, index: int, ext: str) -> str:
    """Return a filesystem-safe filename for a given title."""
    sanitized = re.sub(r"[^\w\- ]", "", title)[:80].strip() or f"page_{index}"
    return f"{index:02d}_{sanitized}.{ext}"


def _build_cover_toc_html(articles: list[dict]) -> str:
    """Build an HTML document for the cover page and table of contents."""
    today = date.today().strftime("%B %d, %Y")
    toc_rows = ""
    for article in articles:
        title = article["title"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        url = article["url"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        toc_rows += (
            f'<tr>'
            f'<td class="toc-title">{title}</td>'
            f'<td class="toc-url">{url}</td>'
            f'<td class="toc-page">{article["start_page"]}</td>'
            f'</tr>\n'
        )

    count = len(articles)
    label = f"{count} article{'s' if count != 1 else ''} compiled from the web"
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @page {{ size: A4; margin: 20mm; }}
  body {{ font-family: Georgia, serif; color: #1a202c; margin: 0; }}
  .cover {{ page-break-after: always; min-height: 80vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; }}
  .cover h1 {{ font-size: 2.5em; margin-bottom: 0.4em; color: #2d3748; }}
  .cover .subtitle {{ font-size: 1.1em; color: #718096; margin-top: 0.8em; }}
  .cover .date {{ font-size: 0.9em; color: #a0aec0; margin-top: 2em; }}
  .toc {{ padding: 10px 0; }}
  .toc h2 {{ font-size: 1.8em; color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5em; margin-bottom: 1em; }}
  .toc table {{ width: 100%; border-collapse: collapse; }}
  .toc tr {{ border-bottom: 1px solid #e2e8f0; }}
  .toc td {{ padding: 8px 6px; vertical-align: top; font-size: 0.88em; }}
  .toc-title {{ width: 45%; font-weight: 600; color: #2d3748; }}
  .toc-url {{ width: 45%; color: #718096; font-size: 0.78em; word-break: break-all; }}
  .toc-page {{ width: 10%; text-align: right; color: #4a5568; font-weight: bold; }}
  th {{ text-align: left; padding: 8px 6px; border-bottom: 2px solid #2d3748; font-size: 0.85em; color: #4a5568; text-transform: uppercase; letter-spacing: 0.05em; }}
  th:last-child {{ text-align: right; }}
</style></head><body>
  <div class="cover">
    <h1>Bulk Export</h1>
    <p class="subtitle">{label}</p>
    <p class="date">Generated {today}</p>
  </div>
  <div class="toc">
    <h2>Table of Contents</h2>
    <table>
      <thead><tr><th>Article</th><th>Source</th><th>Page</th></tr></thead>
      <tbody>{toc_rows}</tbody>
    </table>
  </div>
</body></html>"""


def generate_bulk_pdfs_zip(
    urls: list[str],
    use_print_css: bool = False,
) -> tuple[list[str], str]:
    """Generate individual PDFs for each URL and bundle them into a ZIP archive.

    Returns (titles, zip_relative_path).
    """
    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)

    zip_filename = f"bulk_{uuid4().hex}.zip"
    zip_path = exports_dir / zip_filename
    titles: list[str] = []

    with zipfile.ZipFile(str(zip_path), "w", zipfile.ZIP_DEFLATED) as zf:
        for i, url in enumerate(urls, 1):
            try:
                generated = generate_pdf_from_url(url, use_print_css=use_print_css)
                titles.append(generated.title)
                pdf_path = Path(settings.MEDIA_ROOT) / generated.relative_path
                zf.write(str(pdf_path), _safe_filename(generated.title, i, "pdf"))
                pdf_path.unlink(missing_ok=True)
            except PdfGenerationError:
                titles.append(f"Page {i} (failed)")

    return titles, f"exports/{zip_filename}"


def generate_combined_pdf(
    urls: list[str],
    use_print_css: bool = False,
) -> tuple[str, str]:
    """Generate a combined PDF with cover page, table of contents, and all articles.

    Returns (title, relative_path).
    """
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:
        raise PdfGenerationError("PDF merge engine unavailable. Install PyMuPDF.") from exc

    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Generate each article PDF
    articles: list[dict] = []
    for url in urls:
        try:
            generated = generate_pdf_from_url(url, use_print_css=use_print_css)
            articles.append({
                "title": generated.title,
                "url": url,
                "path": Path(settings.MEDIA_ROOT) / generated.relative_path,
            })
        except PdfGenerationError:
            pass

    if not articles:
        raise PdfGenerationError("No PDFs could be generated from the provided URLs.")

    # Step 2: Open each article PDF and count pages to build TOC
    # The cover+TOC is assumed to occupy 2 pages (1 cover + 1 TOC).
    article_docs: list[object] = []
    page_offset = 2  # pages occupied by cover+TOC
    for article in articles:
        doc = fitz.open(str(article["path"]))
        article["page_count"] = doc.page_count
        article["start_page"] = page_offset + 1
        page_offset += doc.page_count
        article_docs.append(doc)

    # Step 3: Generate cover + TOC as a Playwright PDF
    cover_html = _build_cover_toc_html(articles)
    cover_filename = f"cover_{uuid4().hex}.pdf"
    cover_path = exports_dir / cover_filename

    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_content(cover_html, wait_until="load")
            page.pdf(path=str(cover_path), format="A4", print_background=True)
            browser.close()
    except Exception as exc:
        for doc in article_docs:
            doc.close()  # type: ignore[attr-defined]
        for article in articles:
            article["path"].unlink(missing_ok=True)
        raise PdfGenerationError("Failed to generate cover page.") from exc

    # Step 4: Merge cover+TOC + all articles into one PDF
    output_filename = f"combined_{uuid4().hex}.pdf"
    output_path = exports_dir / output_filename

    merged = fitz.open()
    cover_doc = fitz.open(str(cover_path))
    merged.insert_pdf(cover_doc)
    cover_doc.close()
    cover_path.unlink(missing_ok=True)

    for i, doc in enumerate(article_docs):
        merged.insert_pdf(doc)  # type: ignore[attr-defined]
        doc.close()  # type: ignore[attr-defined]
        articles[i]["path"].unlink(missing_ok=True)

    merged.save(str(output_path))
    merged.close()

    return "Bulk Export", f"exports/{output_filename}"
