from __future__ import annotations

import json
import os
import re

from bs4 import BeautifulSoup, Tag

BLOCKED_TAGS = ["noscript"]
AI_CANDIDATE_TAGS = {"header", "nav", "footer", "aside", "section", "div", "form"}
AI_CANDIDATE_LIMIT = 450
AI_OUTLINE_CHAR_LIMIT = 45000
MIN_RETAINED_TEXT_RATIO = 0.65
MIN_RETAINED_PARAGRAPH_RATIO = 0.70
DEFAULT_AI_CLEANUP_RENDER_WAIT_MS = 5000
MAX_AI_CLEANUP_RENDER_WAIT_MS = 15000
INTERRUPTION_PATTERN = re.compile(
    r"cookie|consent|privacy|tracker|personal data|manage cookies|accept all|reject all|"
    r"advert|newsletter|subscribe|sign up|popup|modal|overlay",
    re.I,
)


class AiCleanupError(Exception):
    """Raised when AI cleanup cannot classify the page."""


def clean_html(raw_html: str) -> str:
    # Retain scripts so the interactive bits of the page work in the iframe.
    soup = BeautifulSoup(raw_html, "html.parser")
    for tag_name in BLOCKED_TAGS:
        for element in soup.find_all(tag_name):
            element.decompose()
    return str(soup)


def _css_selector(element: Tag) -> str:
    element_id = str(element.get("id") or "").strip()
    if element_id and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_-]*", element_id):
        return f"#{element_id}"

    segments: list[str] = []
    current: Tag | None = element
    while current and current.name not in ("html", "[document]"):
        segment = current.name
        parent = current.parent if isinstance(current.parent, Tag) else None
        if parent:
            siblings = [child for child in parent.children if isinstance(child, Tag) and child.name == current.name]
            if len(siblings) > 1:
                segment += f":nth-of-type({siblings.index(current) + 1})"
        segments.insert(0, segment)
        if current.name == "body":
            break
        current = parent
    return " > ".join(segments)


def _candidate_outline(html: str) -> tuple[list[str], str]:
    soup = BeautifulSoup(html, "html.parser")
    selectors: list[str] = []
    lines: list[str] = []
    total_chars = 0

    candidates = list(soup.find_all(AI_CANDIDATE_TAGS))
    candidates.sort(key=_candidate_priority, reverse=True)

    for element in candidates:
        if len(selectors) >= AI_CANDIDATE_LIMIT:
            break

        text = re.sub(r"\s+", " ", element.get_text(" ", strip=True)).strip()
        attrs = {
            "id": element.get("id"),
            "class": element.get("class"),
            "role": element.get("role"),
            "aria-label": element.get("aria-label"),
            "style": element.get("style"),
        }
        attrs = {key: value for key, value in attrs.items() if value}
        if not text and not attrs and element.name not in {"header", "nav", "footer", "aside"}:
            continue

        inside_primary_content = element.find_parent(["main", "article"]) is not None
        paragraph_text = sum(
            len(re.sub(r"\s+", " ", paragraph.get_text(" ", strip=True)))
            for paragraph in element.find_all("p")
        )
        selector = _css_selector(element)
        preview = text[:280]
        line = json.dumps(
            {
                "candidate_id": len(selectors),
                "tag": element.name,
                "attributes": attrs,
                "text": preview,
                "text_length": len(text),
                "paragraph_text_length": paragraph_text,
                "inside_primary_content": inside_primary_content,
                "contains_h1": element.find("h1") is not None,
            },
            ensure_ascii=False,
        )
        if total_chars + len(line) > AI_OUTLINE_CHAR_LIMIT:
            break
        selectors.append(selector)
        lines.append(line)
        total_chars += len(line)

    if not selectors:
        raise AiCleanupError("No page elements were available for AI cleanup.")
    return selectors, "\n".join(lines)


def _candidate_priority(element: Tag) -> tuple[int, int]:
    text = re.sub(r"\s+", " ", element.get_text(" ", strip=True)).strip()
    attrs = " ".join(
        str(value)
        for key in ("id", "class", "role", "aria-label", "style")
        for value in ([element.get(key)] if element.get(key) else [])
    )
    score = 0
    if element.name in {"header", "nav", "footer", "aside", "form"}:
        score += 3
    if INTERRUPTION_PATTERN.search(f"{attrs} {text[:600]}"):
        score += 10
    if re.search(r"position\s*:\s*(fixed|sticky)", attrs, re.I):
        score += 5
    if element.get("role") in ("dialog", "alertdialog"):
        score += 8
    return score, -len(list(element.parents))


def _text_length(node: Tag | BeautifulSoup) -> int:
    return len(re.sub(r"\s+", " ", node.get_text(" ", strip=True)).strip())


def _paragraph_text_length(node: Tag | BeautifulSoup) -> int:
    return sum(_text_length(paragraph) for paragraph in node.find_all("p"))


def _protected_content_roots(soup: BeautifulSoup) -> list[Tag]:
    semantic_roots = [
        element
        for element in soup.find_all(["main", "article"])
        if _paragraph_text_length(element) >= 200 or element.find("h1")
    ]
    if semantic_roots:
        return semantic_roots

    h1 = soup.find("h1")
    if h1:
        ancestors = [
            ancestor
            for ancestor in h1.parents
            if isinstance(ancestor, Tag) and ancestor.name not in ("body", "html")
        ]
        substantial = [ancestor for ancestor in ancestors if _paragraph_text_length(ancestor) >= 400]
        if substantial:
            return [substantial[0]]
    return []


def _is_unsafe_content_container(element: Tag, protected_roots: list[Tag]) -> bool:
    if element.name in ("html", "body", "main", "article"):
        return True
    if element.find("h1"):
        return True
    if any(element is root or root in element.descendants for root in protected_roots):
        return True

    inside_protected_root = any(root in element.parents for root in protected_roots)
    if inside_protected_root and (
        _paragraph_text_length(element) >= 180
        or _text_length(element) >= 700
        or element.find(["h2", "h3", "table", "pre", "code", "img", "picture", "figure", "video"])
    ):
        return True
    return False


def _safe_cleanup_selectors(html: str, proposed_selectors: list[str]) -> list[str]:
    original = BeautifulSoup(html, "html.parser")
    protected_roots = _protected_content_roots(original)
    safe: list[str] = []

    # Prefer parent removals and discard duplicate nested proposals.
    proposed_elements: list[tuple[str, Tag]] = []
    for selector in proposed_selectors:
        element = original.select_one(selector)
        if element and not _is_unsafe_content_container(element, protected_roots):
            proposed_elements.append((selector, element))

    proposed_elements.sort(key=lambda item: len(list(item[1].parents)))
    selected_elements: list[Tag] = []
    for selector, element in proposed_elements:
        if any(parent in selected_elements for parent in element.parents):
            continue
        safe.append(selector)
        selected_elements.append(element)

    original_text = max(_text_length(original), 1)
    original_paragraph_text = max(_paragraph_text_length(original), 1)
    original_has_h1 = original.find("h1") is not None
    accepted: list[str] = []
    for selector in safe:
        candidate = BeautifulSoup(html, "html.parser")
        _remove_selectors_from_soup(candidate, [*accepted, selector])

        text_ratio = _text_length(candidate) / original_text
        paragraph_ratio = _paragraph_text_length(candidate) / original_paragraph_text
        if (
            text_ratio >= MIN_RETAINED_TEXT_RATIO
            and paragraph_ratio >= MIN_RETAINED_PARAGRAPH_RATIO
            and (not original_has_h1 or candidate.find("h1") is not None)
        ):
            accepted.append(selector)

    return accepted


def _remove_selectors_from_soup(soup: BeautifulSoup, selectors: list[str]) -> None:
    targets: list[Tag] = []
    for selector in selectors:
        for element in soup.select(selector):
            if element not in targets:
                targets.append(element)
    for element in targets:
        element.decompose()


def get_ai_cleanup_selectors(html: str) -> list[str]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise AiCleanupError("AI Cleanup requires OPENAI_API_KEY to be configured on the backend.")

    selectors, outline = _candidate_outline(html)
    model = os.getenv("AI_CLEANUP_MODEL", "gpt-4o-mini")

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key, base_url=os.getenv("OPENAI_BASE_URL") or None)
        response = client.chat.completions.create(
            model=model,
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You classify webpage DOM containers for clean content export. "
                        "Remove only clear page chrome or interruptions: navigation, site headers/footers, "
                        "ads, cookie/privacy banners, newsletter/signup prompts, popups/modals, social sharing, "
                        "and unrelated sidebars. Preserve the primary article/page content, headings, author/date, "
                        "tables, images, code, and useful in-content callouts. When uncertain, preserve it. "
                        "Never remove a container marked inside_primary_content when it contains meaningful "
                        "paragraph text, headings, tables, code, or article examples. Select the fewest broad "
                        "containers necessary; do not select both a parent and its children. "
                        'Return JSON exactly as {"remove_candidate_ids":[integer,...]}.'
                    ),
                },
                {
                    "role": "user",
                    "content": f"Select unwanted containers from this DOM outline:\n{outline}",
                },
            ],
        )
        content = response.choices[0].message.content or "{}"
        payload = json.loads(content)
        candidate_ids = payload.get("remove_candidate_ids", [])
    except AiCleanupError:
        raise
    except Exception as exc:
        raise AiCleanupError("OpenAI could not analyze this page for cleanup.") from exc

    selected: list[str] = []
    for candidate_id in candidate_ids:
        if isinstance(candidate_id, int) and 0 <= candidate_id < len(selectors):
            selector = selectors[candidate_id]
            if selector not in selected:
                selected.append(selector)
    return _safe_cleanup_selectors(html, selected)


def apply_ai_cleanup_to_soup(soup: BeautifulSoup) -> None:
    selectors = get_ai_cleanup_selectors(str(soup))
    _remove_selectors_from_soup(soup, selectors)


def _ai_cleanup_render_wait_ms() -> int:
    raw_value = os.getenv("AI_CLEANUP_RENDER_WAIT_MS", str(DEFAULT_AI_CLEANUP_RENDER_WAIT_MS))
    try:
        wait_ms = int(raw_value)
    except ValueError:
        wait_ms = DEFAULT_AI_CLEANUP_RENDER_WAIT_MS
    return max(0, min(wait_ms, MAX_AI_CLEANUP_RENDER_WAIT_MS))


def apply_ai_cleanup(page, *, wait_for_delayed_content: bool = True) -> None:
    if wait_for_delayed_content:
        page.wait_for_timeout(_ai_cleanup_render_wait_ms())

    selectors = get_ai_cleanup_selectors(page.content())
    page.evaluate(
        """
        (selectors) => {
          const targets = new Set();
          selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((element) => targets.add(element));
          });
          targets.forEach((element) => element.remove());
        }
        """,
        selectors,
    )
