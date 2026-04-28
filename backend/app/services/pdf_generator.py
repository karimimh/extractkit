from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from bs4 import BeautifulSoup
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


def _apply_selections(page, selectors: list[str] | None, mode: str) -> None:
  if not selectors:
    return

  page.evaluate(
    """
    (payload) => {
      const selectors = payload.selectors || [];
      const mode = payload.mode || "exclude";

      const markKeep = (element) => {
        let node = element;
        while (node && node !== document.documentElement) {
          node.dataset.pdfKeep = "true";
          node = node.parentElement;
        }
      };

      if (mode === "include") {
        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((element) => {
            markKeep(element);
          });
        });

        const toRemove = [];
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT
        );
        while (walker.nextNode()) {
          const element = walker.currentNode;
          if (!element.dataset.pdfKeep) {
            toRemove.push(element);
          }
        }
        toRemove.forEach((element) => element.remove());
      } else {
        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((element) => {
            element.remove();
          });
        });
      }
    }
    """,
    {"selectors": selectors, "mode": mode},
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
  mode: str = "exclude",
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
      response = page.goto(url, wait_until="networkidle", timeout=timeout_ms)

      if response is not None and response.status >= 400:
        raise PdfGenerationError(f"Failed to load URL (status {response.status})")

      page.emulate_media(media="print" if use_print_css else "screen")

      _apply_selections(page, selectors, mode)

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


def generate_pdf_from_snapshot(
  html_snapshot: str,
  base_url: str,
  timeout_ms: int = 60000,
  selectors: list[str] | None = None,
  mode: str = "exclude",
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
      page.set_content(html_with_base, wait_until="load", timeout=timeout_ms)

      page.emulate_media(media="print" if use_print_css else "screen")
      _apply_selections(page, selectors, mode)

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
