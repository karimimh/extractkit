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


def _decoded_response_html(response: requests.Response) -> str:
    """Decode HTML without requests' ISO-8859-1 default corrupting UTF-8 pages."""
    if not response.encoding or response.encoding.lower() in {"iso-8859-1", "latin-1"}:
        try:
            return response.content.decode("utf-8")
        except UnicodeDecodeError:
            response.encoding = response.apparent_encoding or "utf-8"
    return response.text


def _has_meaningful_body(html: str) -> bool:
    soup = BeautifulSoup(html, "html.parser")
    body = soup.body or soup
    for tag in body.find_all(["script", "style", "noscript", "svg"]):
        tag.decompose()
    return len(body.get_text(" ", strip=True)) >= 80


def _render_page(url: str) -> ExtractedContent:
    try:
        from .pdf_generator import render_html_snapshot

        title, html = render_html_snapshot(url)
    except Exception as exc:
        raise ContentExtractionError(
            "The page requires browser rendering, but it could not be rendered."
        ) from exc
    return ExtractedContent(title=title, html=html)


def extract_main_content(url: str, timeout: int = 20) -> ExtractedContent:
    try:
        response = requests.get(url, timeout=timeout, headers=DEFAULT_HEADERS)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise ContentExtractionError("Failed to fetch URL") from exc

    html = _decoded_response_html(response)
    if not html or not html.strip():
        raise ContentExtractionError("Failed to extract content from the page")

    # Client-rendered apps commonly return only an empty HTML shell over HTTP.
    # Render those pages in Chromium so route-specific content is available.
    if not _has_meaningful_body(html):
        return _render_page(url)

    soup = BeautifulSoup(html, "html.parser")
    title = (soup.title.string.strip() if soup.title and soup.title.string else "Exported Website")

    return ExtractedContent(title=title, html=html)
