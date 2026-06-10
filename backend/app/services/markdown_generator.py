from __future__ import annotations

import re
import zipfile
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from uuid import uuid4

from bs4 import BeautifulSoup
from django.conf import settings
from markdownify import markdownify as md

from .cleaner import AiCleanupError, apply_ai_cleanup_to_soup


@dataclass
class GeneratedMarkdown:
    title: str
    content: str


class MarkdownGenerationError(Exception):
    """Raised when markdown generation fails."""


def html_to_markdown(
    html: str,
    title: str,
    selectors: list[str] | None = None,
    ai_cleanup: bool = False,
) -> GeneratedMarkdown:
    """Convert an HTML string to Markdown, optionally removing matched elements."""
    try:
        soup = BeautifulSoup(html, "html.parser")

        # Remove selected elements
        for selector in selectors or []:
            for element in soup.select(selector):
                element.decompose()

        if ai_cleanup:
            apply_ai_cleanup_to_soup(soup)

        # Remove scripts, styles, and navigation noise
        for tag in soup.find_all(["script", "style", "noscript", "iframe", "svg"]):
            tag.decompose()

        # Use full body content — the user can remove unwanted elements via selectors
        content_node = soup.find("body") or soup

        markdown_text = md(
            str(content_node),
            heading_style="ATX",
            bullets="-",
        )

        # Clean up excessive blank lines
        lines = markdown_text.splitlines()
        cleaned: list[str] = []
        blank_count = 0
        for line in lines:
            if line.strip() == "":
                blank_count += 1
                if blank_count <= 2:
                    cleaned.append(line)
            else:
                blank_count = 0
                cleaned.append(line)

        content = "\n".join(cleaned).strip()

        return GeneratedMarkdown(title=title, content=content)
    except AiCleanupError as exc:
        raise MarkdownGenerationError(str(exc)) from exc
    except Exception as exc:
        raise MarkdownGenerationError("Failed to convert HTML to Markdown") from exc


# ---------------------------------------------------------------------------
# Bulk export helpers
# ---------------------------------------------------------------------------

def _safe_md_filename(title: str, index: int) -> str:
    sanitized = re.sub(r"[^\w\- ]", "", title)[:80].strip() or f"page_{index}"
    return f"{index:02d}_{sanitized}.md"


def generate_bulk_markdown_zip(urls: list[str], ai_cleanup: bool = False) -> tuple[list[str], str]:
    """Generate individual Markdown files for each URL and bundle into a ZIP.

    Returns (titles, zip_relative_path).
    """
    from .extractor import ContentExtractionError, extract_main_content

    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)

    zip_filename = f"bulk_md_{uuid4().hex}.zip"
    zip_path = exports_dir / zip_filename
    titles: list[str] = []

    with zipfile.ZipFile(str(zip_path), "w", zipfile.ZIP_DEFLATED) as zf:
        for i, url in enumerate(urls, 1):
            try:
                extracted = extract_main_content(url)
                generated = html_to_markdown(extracted.html, extracted.title, selectors=[], ai_cleanup=ai_cleanup)
                titles.append(generated.title)
                zf.writestr(_safe_md_filename(generated.title, i), generated.content.encode("utf-8"))
            except Exception:
                if ai_cleanup:
                    raise
                titles.append(f"Page {i} (failed)")

    return titles, f"exports/{zip_filename}"


def generate_combined_markdown(urls: list[str], ai_cleanup: bool = False) -> tuple[str, str]:
    """Generate a single Markdown file combining all articles with a cover and TOC.

    Returns (title, relative_path).
    """
    from .extractor import ContentExtractionError, extract_main_content

    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)

    articles: list[dict] = []
    for url in urls:
        try:
            extracted = extract_main_content(url)
            generated = html_to_markdown(extracted.html, extracted.title, selectors=[], ai_cleanup=ai_cleanup)
            articles.append({"title": generated.title, "url": url, "content": generated.content})
        except Exception:
            if ai_cleanup:
                raise
            pass

    if not articles:
        raise MarkdownGenerationError("No Markdown could be generated from the provided URLs.")

    today = date.today().strftime("%B %d, %Y")
    toc_lines = ["## Table of Contents\n"]
    for i, article in enumerate(articles, 1):
        slug = re.sub(r"[^a-z0-9]+", "-", article["title"].lower()).strip("-")[:60]
        toc_lines.append(f"{i}. [{article['title']}](#{slug})")

    combined = f"# Bulk Export\n\n*Generated on {today} — {len(articles)} articles*\n\n"
    combined += "\n".join(toc_lines) + "\n\n---\n\n"

    for article in articles:
        combined += f"# {article['title']}\n\n"
        combined += f"*Source: {article['url']}*\n\n"
        combined += article["content"] + "\n\n---\n\n"

    filename = f"combined_md_{uuid4().hex}.md"
    output_path = exports_dir / filename
    output_path.write_text(combined, encoding="utf-8")

    return "Bulk Export", f"exports/{filename}"
