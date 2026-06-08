from __future__ import annotations

import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from django.conf import settings

from .pdf_generator import _apply_selections, _ensure_base_tag


class ScreenshotGenerationError(Exception):
    """Raised when screenshot generation cannot be completed."""


@dataclass
class GeneratedScreenshot:
    title: str
    relative_path: str


def generate_screenshot_from_url(
    url: str,
    timeout_ms: int = 60000,
    selectors: list[str] | None = None,
    width: int = 1440,
) -> GeneratedScreenshot:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        raise ScreenshotGenerationError(
            "Browser screenshot engine is unavailable. Install Playwright and Chromium."
        ) from exc

    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}.png"
    output_path = exports_dir / filename

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": width, "height": 900},
                ignore_https_errors=True,
                device_scale_factor=2,
            )
            page = context.new_page()
            response = page.goto(url, wait_until="networkidle", timeout=timeout_ms)

            if response is not None and response.status >= 400:
                raise ScreenshotGenerationError(
                    f"Failed to load URL (status {response.status})"
                )

            _apply_selections(page, selectors)

            title = page.title().strip() or "Screenshot"
            page.screenshot(
                path=str(output_path),
                full_page=True,
                type="png",
            )

            context.close()
            browser.close()
    except ScreenshotGenerationError:
        raise
    except Exception as exc:
        raise ScreenshotGenerationError("Failed to capture screenshot") from exc

    return GeneratedScreenshot(title=title, relative_path=f"exports/{filename}")


def generate_screenshot_from_snapshot(
    html_snapshot: str,
    base_url: str,
    timeout_ms: int = 60000,
    selectors: list[str] | None = None,
    width: int = 1440,
) -> GeneratedScreenshot:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        raise ScreenshotGenerationError(
            "Browser screenshot engine is unavailable. Install Playwright and Chromium."
        ) from exc

    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}.png"
    output_path = exports_dir / filename
    html_with_base = _ensure_base_tag(html_snapshot, base_url)

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": width, "height": 900},
                ignore_https_errors=True,
                device_scale_factor=2,
            )
            page = context.new_page()
            page.set_content(html_with_base, wait_until="load", timeout=timeout_ms)

            _apply_selections(page, selectors)

            title = page.title().strip() or "Screenshot"
            page.screenshot(
                path=str(output_path),
                full_page=True,
                type="png",
            )

            context.close()
            browser.close()
    except ScreenshotGenerationError:
        raise
    except Exception as exc:
        raise ScreenshotGenerationError("Failed to capture screenshot from snapshot") from exc

    return GeneratedScreenshot(title=title, relative_path=f"exports/{filename}")


# ---------------------------------------------------------------------------
# Bulk export helper
# ---------------------------------------------------------------------------

def generate_bulk_screenshots_zip(
    urls: list[str],
    width: int = 1440,
) -> tuple[list[str], str]:
    """Generate screenshots for each URL and bundle them into a ZIP archive.

    Returns (titles, zip_relative_path).
    """
    exports_dir = Path(settings.MEDIA_ROOT) / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)

    zip_filename = f"bulk_ss_{uuid4().hex}.zip"
    zip_path = exports_dir / zip_filename
    titles: list[str] = []

    with zipfile.ZipFile(str(zip_path), "w", zipfile.ZIP_DEFLATED) as zf:
        for i, url in enumerate(urls, 1):
            try:
                generated = generate_screenshot_from_url(url, width=width)
                titles.append(generated.title)
                img_path = Path(settings.MEDIA_ROOT) / generated.relative_path
                sanitized = re.sub(r"[^\w\- ]", "", generated.title)[:80].strip() or f"page_{i}"
                zf.write(str(img_path), f"{i:02d}_{sanitized}.png")
                img_path.unlink(missing_ok=True)
            except ScreenshotGenerationError:
                titles.append(f"Page {i} (failed)")

    return titles, f"exports/{zip_filename}"
