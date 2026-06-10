from __future__ import annotations

import fnmatch
import gzip
from collections import deque
from dataclasses import dataclass
from urllib.parse import urldefrag, urljoin, urlparse, urlunparse
from xml.etree import ElementTree

import requests
from bs4 import BeautifulSoup

from .extractor import DEFAULT_HEADERS


class WebsiteCrawlError(Exception):
    """Raised when a website cannot be crawled."""


@dataclass
class CrawlResult:
    urls: list[str]
    source: str
    truncated: bool
    failed_urls: list[str]


def _normalize_url(url: str) -> str | None:
    clean_url, _fragment = urldefrag(url.strip())
    parsed = urlparse(clean_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return None

    path = parsed.path or "/"
    if path != "/":
        path = path.rstrip("/")
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), path, "", parsed.query, ""))


def _same_host(url: str, hostname: str) -> bool:
    return (urlparse(url).hostname or "").lower() == hostname.lower()


def _matches_patterns(url: str, include_patterns: list[str], exclude_patterns: list[str]) -> bool:
    parsed = urlparse(url)
    candidate = parsed.path or "/"
    if parsed.query:
        candidate += f"?{parsed.query}"
    if include_patterns and not any(fnmatch.fnmatch(candidate, pattern) for pattern in include_patterns):
        return False
    return not any(fnmatch.fnmatch(candidate, pattern) for pattern in exclude_patterns)


def _parse_sitemap(xml_text: str) -> tuple[list[str], list[str]]:
    try:
        root = ElementTree.fromstring(xml_text)
    except ElementTree.ParseError:
        return [], []

    locations = [
        element.text.strip()
        for element in root.iter()
        if element.tag.rsplit("}", 1)[-1] == "loc" and element.text
    ]
    tag_name = root.tag.rsplit("}", 1)[-1]
    if tag_name == "sitemapindex":
        return [], locations
    if tag_name == "urlset":
        return locations, []
    return [], []


def _sitemap_response_text(response: requests.Response) -> str:
    content = response.content
    if isinstance(content, bytes) and content.startswith(b"\x1f\x8b"):
        try:
            return gzip.decompress(content).decode(response.encoding or "utf-8")
        except (OSError, UnicodeDecodeError):
            return ""
    return response.text


def _discover_sitemap_urls(
    session: requests.Session,
    start_url: str,
    hostname: str,
    timeout: int,
) -> list[str]:
    parsed = urlparse(start_url)
    sitemap_url = (
        start_url
        if parsed.path.lower().endswith((".xml", ".xml.gz"))
        else urljoin(f"{parsed.scheme}://{parsed.netloc}", "/sitemap.xml")
    )
    sitemap_queue = deque([sitemap_url])
    visited_sitemaps: set[str] = set()
    discovered: list[str] = []

    while sitemap_queue and len(visited_sitemaps) < 25:
        sitemap_url = sitemap_queue.popleft()
        if sitemap_url in visited_sitemaps or not _same_host(sitemap_url, hostname):
            continue
        visited_sitemaps.add(sitemap_url)
        try:
            response = session.get(sitemap_url, timeout=timeout, headers=DEFAULT_HEADERS)
            response.raise_for_status()
        except requests.RequestException:
            continue

        page_urls, nested_sitemaps = _parse_sitemap(_sitemap_response_text(response))
        for page_url in page_urls:
            normalized = _normalize_url(page_url)
            if normalized and _same_host(normalized, hostname):
                discovered.append(normalized)
        for nested_url in nested_sitemaps:
            normalized = _normalize_url(nested_url)
            if normalized and normalized not in visited_sitemaps:
                sitemap_queue.append(normalized)

    return discovered


def crawl_website(
    start_url: str,
    *,
    max_pages: int = 50,
    max_depth: int = 2,
    include_patterns: list[str] | None = None,
    exclude_patterns: list[str] | None = None,
    sitemap_only: bool = False,
    timeout: int = 12,
) -> CrawlResult:
    normalized_start = _normalize_url(start_url)
    if not normalized_start:
        raise WebsiteCrawlError("Enter a valid HTTP or HTTPS website URL.")

    include_patterns = [pattern.strip() for pattern in include_patterns or [] if pattern.strip()]
    exclude_patterns = [pattern.strip() for pattern in exclude_patterns or [] if pattern.strip()]
    hostname = urlparse(normalized_start).hostname or ""
    session = requests.Session()

    sitemap_urls = _discover_sitemap_urls(session, normalized_start, hostname, timeout)
    ordered_urls: list[str] = []
    seen: set[str] = set()

    def add_url(url: str) -> None:
        if url not in seen and _matches_patterns(url, include_patterns, exclude_patterns):
            seen.add(url)
            ordered_urls.append(url)

    for url in sitemap_urls:
        add_url(url)

    if sitemap_only:
        if not ordered_urls:
            raise WebsiteCrawlError("No matching pages were found in the website sitemap.")
        return CrawlResult(ordered_urls[:max_pages], "sitemap", len(ordered_urls) > max_pages, [])

    queue = deque([(normalized_start, 0)])
    crawled: set[str] = set()
    failed_urls: list[str] = []

    while queue and len(crawled) < max_pages:
        current_url, depth = queue.popleft()
        if current_url in crawled:
            continue
        crawled.add(current_url)
        add_url(current_url)

        if depth >= max_depth:
            continue
        try:
            response = session.get(current_url, timeout=timeout, headers=DEFAULT_HEADERS)
            response.raise_for_status()
        except requests.RequestException:
            failed_urls.append(current_url)
            continue

        content_type = response.headers.get("content-type", "")
        if content_type and "html" not in content_type.lower():
            continue
        soup = BeautifulSoup(response.text, "html.parser")
        for anchor in soup.select("a[href]"):
            normalized = _normalize_url(urljoin(current_url, anchor.get("href", "")))
            if normalized and _same_host(normalized, hostname) and normalized not in crawled:
                queue.append((normalized, depth + 1))

    if not ordered_urls:
        raise WebsiteCrawlError("No matching pages were discovered.")

    return CrawlResult(
        ordered_urls[:max_pages],
        "sitemap_and_links" if sitemap_urls else "links",
        len(ordered_urls) > max_pages or bool(queue),
        failed_urls[:20],
    )
