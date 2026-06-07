from __future__ import annotations

from dataclasses import dataclass

from bs4 import BeautifulSoup
from markdownify import markdownify as md


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
) -> GeneratedMarkdown:
    """Convert an HTML string to Markdown, optionally removing matched elements."""
    try:
        soup = BeautifulSoup(html, "html.parser")

        # Remove selected elements
        for selector in selectors or []:
            for element in soup.select(selector):
                element.decompose()

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
    except Exception as exc:
        raise MarkdownGenerationError("Failed to convert HTML to Markdown") from exc
