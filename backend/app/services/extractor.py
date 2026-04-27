from __future__ import annotations

from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup


DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
    )
}


@dataclass
class ExtractedContent:
    title: str
    html: str


class ContentExtractionError(Exception):
    """Raised when page fetching or extraction fails."""


def extract_main_content(url: str, timeout: int = 20) -> ExtractedContent:
    try:
        response = requests.get(url, timeout=timeout, headers=DEFAULT_HEADERS)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise ContentExtractionError("Failed to fetch URL") from exc

    html = response.text
    soup = BeautifulSoup(html, "html.parser")
    title = (soup.title.string.strip() if soup.title and soup.title.string else "Exported Website")

    if not html or not html.strip():
        raise ContentExtractionError("Failed to extract content from the page")

    return ExtractedContent(title=title, html=html)
