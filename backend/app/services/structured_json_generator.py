from __future__ import annotations

import json
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urljoin
from uuid import uuid4

from bs4 import BeautifulSoup
from django.conf import settings


@dataclass
class GeneratedStructuredJson:
    title: str
    data: dict


class StructuredJsonGenerationError(Exception):
    """Raised when structured JSON generation fails."""


def _text(value) -> str:
    return re.sub(r"\s+", " ", value.get_text(" ", strip=True)).strip()


def _meta_content(soup: BeautifulSoup, *selectors: str) -> str:
    for selector in selectors:
        tag = soup.select_one(selector)
        if tag:
            content = tag.get("content") or tag.get("value") or _text(tag)
            if content:
                return str(content).strip()
    return ""


def _absolute_url(value: str, base_url: str | None) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    return urljoin(base_url or "", value)


def _extract_json_ld(soup: BeautifulSoup) -> list[dict | list]:
    items: list[dict | list] = []
    for script in soup.find_all("script", type=lambda value: value and "ld+json" in value):
        raw = script.string or script.get_text(strip=True)
        if not raw:
            continue
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, (dict, list)):
            items.append(parsed)
    return items


def _extract_metadata(soup: BeautifulSoup, base_url: str | None) -> dict:
    open_graph: dict[str, str] = {}
    twitter: dict[str, str] = {}
    meta_tags: dict[str, str] = {}

    for tag in soup.find_all("meta"):
        key = tag.get("property") or tag.get("name") or tag.get("itemprop")
        content = tag.get("content")
        if not key or not content:
            continue
        key = str(key).strip()
        content = str(content).strip()
        meta_tags[key] = content
        if key.startswith("og:"):
            open_graph[key.removeprefix("og:")] = content
        elif key.startswith("twitter:"):
            twitter[key.removeprefix("twitter:")] = content

    canonical_tag = soup.find("link", rel=lambda value: value and "canonical" in value)
    canonical = _absolute_url(canonical_tag.get("href", ""), base_url) if canonical_tag else ""

    return {
        "description": meta_tags.get("description", ""),
        "keywords": meta_tags.get("keywords", ""),
        "canonical": canonical,
        "language": soup.html.get("lang", "") if soup.html else "",
        "open_graph": open_graph,
        "twitter": twitter,
        "json_ld": _extract_json_ld(soup),
        "meta_tags": meta_tags,
    }


def _extract_author(soup: BeautifulSoup) -> str:
    author = _meta_content(
        soup,
        'meta[name="author"]',
        'meta[property="article:author"]',
        'meta[name="article:author"]',
        'meta[itemprop="author"]',
    )
    if author:
        return author

    rel_author = soup.find("a", rel=lambda value: value and "author" in value)
    if rel_author:
        author = _text(rel_author)
        if author:
            return author

    byline = soup.find(class_=re.compile(r"(author|byline|writer)", re.I)) or soup.find(
        id=re.compile(r"(author|byline|writer)", re.I)
    )
    return _text(byline) if byline else ""


def _extract_date(soup: BeautifulSoup) -> str:
    published = _meta_content(
        soup,
        'meta[property="article:published_time"]',
        'meta[name="article:published_time"]',
        'meta[name="date"]',
        'meta[name="publish-date"]',
        'meta[itemprop="datePublished"]',
    )
    if published:
        return published

    time_tag = soup.find("time")
    if time_tag:
        return str(time_tag.get("datetime") or _text(time_tag)).strip()
    return ""


def _extract_headings(soup: BeautifulSoup) -> list[dict]:
    headings: list[dict] = []
    for tag in soup.find_all(re.compile(r"^h[1-6]$")):
        text = _text(tag)
        if text:
            headings.append({"level": int(tag.name[1]), "text": text})
    return headings


def _extract_paragraphs(soup: BeautifulSoup) -> list[str]:
    paragraphs: list[str] = []
    for tag in soup.find_all("p"):
        text = _text(tag)
        if text:
            paragraphs.append(text)
    return paragraphs


def _extract_tables(soup: BeautifulSoup) -> list[dict]:
    tables: list[dict] = []
    for table in soup.find_all("table"):
        caption_tag = table.find("caption")
        headers = [_text(cell) for cell in table.find_all("th") if _text(cell)]
        rows: list[list[str]] = []
        for row in table.find_all("tr"):
            cells = [_text(cell) for cell in row.find_all(["td", "th"])]
            if any(cells):
                rows.append(cells)
        if headers or rows:
            tables.append({
                "caption": _text(caption_tag) if caption_tag else "",
                "headers": headers,
                "rows": rows,
            })
    return tables


def _extract_images(soup: BeautifulSoup, base_url: str | None) -> list[dict]:
    images: list[dict] = []
    for image in soup.find_all("img"):
        src = image.get("src") or image.get("data-src") or image.get("data-lazy-src") or ""
        absolute_src = _absolute_url(str(src), base_url)
        if not absolute_src:
            continue
        images.append({
            "src": absolute_src,
            "alt": str(image.get("alt") or "").strip(),
            "title": str(image.get("title") or "").strip(),
            "width": str(image.get("width") or "").strip(),
            "height": str(image.get("height") or "").strip(),
        })
    return images


def _extract_links(soup: BeautifulSoup, base_url: str | None) -> list[dict]:
    links: list[dict] = []
    for link in soup.find_all("a", href=True):
        href = _absolute_url(str(link.get("href") or ""), base_url)
        if not href:
            continue
        links.append({
            "href": href,
            "text": _text(link),
            "title": str(link.get("title") or "").strip(),
        })
    return links


def html_to_structured_json(
    html: str,
    title: str,
    *,
    source_url: str | None = None,
    selectors: list[str] | None = None,
) -> GeneratedStructuredJson:
    """Extract common webpage fields from HTML into a JSON-serializable dict."""
    try:
        soup = BeautifulSoup(html, "html.parser")

        for selector in selectors or []:
            for element in soup.select(selector):
                element.decompose()

        extracted_title = title.strip() or _meta_content(soup, 'meta[property="og:title"]')
        if not extracted_title and soup.title and soup.title.string:
            extracted_title = soup.title.string.strip()
        if not extracted_title:
            extracted_title = "Exported Website"

        metadata = _extract_metadata(soup, source_url)

        for tag in soup.find_all(["script", "style", "noscript", "iframe", "svg"]):
            tag.decompose()

        paragraphs = _extract_paragraphs(soup)
        data = {
            "source_url": source_url or "",
            "title": extracted_title,
            "author": _extract_author(soup),
            "date": _extract_date(soup),
            "headings": _extract_headings(soup),
            "paragraphs": paragraphs,
            "content": "\n\n".join(paragraphs),
            "tables": _extract_tables(soup),
            "images": _extract_images(soup, source_url),
            "links": _extract_links(soup, source_url),
            "metadata": metadata,
        }
        return GeneratedStructuredJson(title=extracted_title, data=data)
    except Exception as exc:
        raise StructuredJsonGenerationError("Failed to extract structured JSON") from exc


def _safe_json_filename(title: str, index: int) -> str:
    sanitized = re.sub(r"[^\w\- ]", "", title)[:80].strip() or f"page_{index}"
    return f"{index:02d}_{sanitized}.json"


def generate_bulk_structured_json_zip(urls: list[str]) -> tuple[list[str], str]:
    """Generate one JSON file per URL and bundle them into a ZIP.

    Returns (titles, zip_relative_path).
    """
    from .extractor import ContentExtractionError, extract_main_content

    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)

    zip_filename = f"bulk_json_{uuid4().hex}.zip"
    zip_path = exports_dir / zip_filename
    titles: list[str] = []

    with zipfile.ZipFile(str(zip_path), "w", zipfile.ZIP_DEFLATED) as zf:
        for index, url in enumerate(urls, 1):
            try:
                extracted = extract_main_content(url)
                generated = html_to_structured_json(
                    extracted.html,
                    extracted.title,
                    source_url=url,
                    selectors=[],
                )
                titles.append(generated.title)
                zf.writestr(
                    _safe_json_filename(generated.title, index),
                    json.dumps(generated.data, ensure_ascii=False, indent=2).encode("utf-8"),
                )
            except (ContentExtractionError, StructuredJsonGenerationError, Exception):
                titles.append(f"Page {index} (failed)")

    return titles, f"exports/{zip_filename}"


def generate_combined_structured_json(urls: list[str]) -> tuple[str, str]:
    """Generate one JSON array containing extracted data for all successful URLs.

    Returns (title, relative_path).
    """
    from .extractor import ContentExtractionError, extract_main_content

    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)

    pages: list[dict] = []
    for url in urls:
        try:
            extracted = extract_main_content(url)
            generated = html_to_structured_json(
                extracted.html,
                extracted.title,
                source_url=url,
                selectors=[],
            )
            pages.append(generated.data)
        except (ContentExtractionError, StructuredJsonGenerationError, Exception):
            pass

    if not pages:
        raise StructuredJsonGenerationError("No structured JSON could be generated from the provided URLs.")

    filename = f"combined_json_{uuid4().hex}.json"
    output_path = exports_dir / filename
    output_path.write_text(
        json.dumps({"pages": pages}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return "Bulk JSON Export", f"exports/{filename}"