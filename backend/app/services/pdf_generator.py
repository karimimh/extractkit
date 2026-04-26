from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from django.conf import settings


PDF_BASE_STYLE = """
@page {
  size: A4;
  margin: 18mm 16mm;
}
body {
  font-family: "Helvetica", "Arial", sans-serif;
  line-height: 1.6;
  color: #1f2937;
  font-size: 12pt;
}
h1, h2, h3, h4 {
  line-height: 1.25;
  margin-top: 1.2em;
  margin-bottom: 0.6em;
  color: #111827;
}
p, li {
  margin: 0.45em 0;
}
img {
  max-width: 100%;
  height: auto;
}
a {
  color: #2563eb;
  text-decoration: none;
}
pre, code {
  white-space: pre-wrap;
  word-break: break-word;
}
"""


class PdfGenerationError(Exception):
  """Raised when PDF generation cannot be completed."""


def generate_pdf(title: str, article_html: str) -> str:
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

    wrapped_html = f"""
    <html>
      <head>
        <meta charset=\"utf-8\" />
        <title>{title}</title>
      </head>
      <body>
        <h1>{title}</h1>
        {article_html}
      </body>
    </html>
    """

    try:
      HTML(string=wrapped_html, base_url=str(settings.BASE_DIR)).write_pdf(
        str(output_path),
        stylesheets=[CSS(string=PDF_BASE_STYLE)],
      )
    except Exception as exc:
      raise PdfGenerationError("Failed to render PDF") from exc

    return f"exports/{filename}"
