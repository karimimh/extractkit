import os
from unittest import TestCase
from unittest.mock import patch

from bs4 import BeautifulSoup

from .services.cleaner import (
    AiCleanupError,
    _candidate_outline,
    _safe_cleanup_selectors,
    _ai_cleanup_render_wait_ms,
    apply_ai_cleanup,
    apply_ai_cleanup_to_soup,
    get_ai_cleanup_selectors,
)


class AiCleanupTests(TestCase):
    def test_candidate_outline_maps_dom_containers_to_selectors(self):
        selectors, outline = _candidate_outline(
            """
            <html><body>
              <nav id="primary-nav">Navigation</nav>
              <main><article><p>Primary content</p></article></main>
              <div class="unknown-cookie-class">Privacy choices</div>
            </body></html>
            """
        )

        self.assertIn("#primary-nav", selectors)
        self.assertIn("Privacy choices", outline)

    def test_ai_cleanup_requires_api_key(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(AiCleanupError, "OPENAI_API_KEY"):
                get_ai_cleanup_selectors("<html><body><nav>Navigation</nav></body></html>")

    def test_ai_cleanup_removes_only_returned_selectors(self):
        soup = BeautifulSoup(
            """
            <html><body>
              <nav id="primary-nav">Navigation</nav>
              <main><article><p>Primary content</p></article></main>
            </body></html>
            """,
            "html.parser",
        )

        with patch("app.services.cleaner.get_ai_cleanup_selectors", return_value=["#primary-nav"]):
            apply_ai_cleanup_to_soup(soup)

        self.assertIsNone(soup.select_one("#primary-nav"))
        self.assertEqual(soup.select_one("article").get_text(strip=True), "Primary content")

    def test_over_removal_response_preserves_primary_article(self):
        html = """
        <html><body>
          <header id="site-header">Navigation and account links</header>
          <div id="page">
            <article id="article">
              <h1>Best Display Ad Examples</h1>
              <section id="intro">
                <h2>Introduction</h2>
                <p>This is a long introduction explaining the article and its examples in detail.</p>
                <p>It contains important primary content that must remain in the clean export.</p>
              </section>
              <section id="examples">
                <h2>Display ad examples</h2>
                <div id="example-image"><img src="example.png" alt="Display ad example"></div>
                <p>Example one includes a detailed explanation of the campaign and its results.</p>
                <p>Example two includes another detailed explanation that readers need.</p>
              </section>
            </article>
          </div>
          <aside id="sidebar">Related links and promotion</aside>
          <footer id="site-footer">Footer links</footer>
        </body></html>
        """

        selectors, _outline = _candidate_outline(html)
        safe = _safe_cleanup_selectors(html, selectors)
        cleaned = BeautifulSoup(html, "html.parser")
        for selector in safe:
            for element in cleaned.select(selector):
                element.decompose()

        self.assertIsNotNone(cleaned.select_one("#article"))
        self.assertIsNotNone(cleaned.select_one("#intro"))
        self.assertIsNotNone(cleaned.select_one("#examples"))
        self.assertIsNotNone(cleaned.select_one("#example-image"))
        self.assertIn("Best Display Ad Examples", cleaned.get_text())

    def test_cleanup_never_removes_container_wrapping_primary_article(self):
        html = """
        <html><body>
          <div id="outer">
            <div id="content">
              <article><h1>Article</h1><p>Important article paragraph with useful content.</p></article>
            </div>
          </div>
          <div id="popup">Subscribe now</div>
        </body></html>
        """

        safe = _safe_cleanup_selectors(html, ["#outer", "#content", "#popup"])

        self.assertNotIn("#outer", safe)
        self.assertNotIn("#content", safe)
        self.assertIn("#popup", safe)

    def test_browser_ai_cleanup_waits_for_delayed_overlays(self):
        class FakePage:
            def __init__(self):
                self.calls = []

            def wait_for_timeout(self, wait_ms):
                self.calls.append(("wait", wait_ms))

            def content(self):
                self.calls.append(("content",))
                return "<html><body><div id='cookie-banner'>Cookie choices</div></body></html>"

            def evaluate(self, _script, selectors):
                self.calls.append(("evaluate", selectors))

        page = FakePage()
        with patch.dict(os.environ, {"AI_CLEANUP_RENDER_WAIT_MS": "4200"}):
            with patch("app.services.cleaner.get_ai_cleanup_selectors", return_value=["#cookie-banner"]):
                apply_ai_cleanup(page)

        self.assertEqual(page.calls[0], ("wait", 4200))
        self.assertEqual(page.calls[1], ("content",))

    def test_snapshot_ai_cleanup_skips_delayed_content_wait(self):
        class FakePage:
            def __init__(self):
                self.waited = False

            def wait_for_timeout(self, _wait_ms):
                self.waited = True

            def content(self):
                return "<html><body><div id='cookie-banner'>Cookie choices</div></body></html>"

            def evaluate(self, _script, _selectors):
                pass

        page = FakePage()
        with patch("app.services.cleaner.get_ai_cleanup_selectors", return_value=["#cookie-banner"]):
            apply_ai_cleanup(page, wait_for_delayed_content=False)

        self.assertFalse(page.waited)

    def test_ai_cleanup_wait_is_bounded(self):
        with patch.dict(os.environ, {"AI_CLEANUP_RENDER_WAIT_MS": "99999"}):
            self.assertEqual(_ai_cleanup_render_wait_ms(), 15000)

    def test_late_cookie_banner_is_prioritized_into_candidate_outline(self):
        ordinary = "".join(
            f"<div id='ordinary-{index}'>Ordinary container {index}</div>"
            for index in range(500)
        )
        html = (
            "<html><body>"
            f"{ordinary}"
            "<div id='late-cookie-banner'>We use cookies and other trackers. Manage Cookies.</div>"
            "</body></html>"
        )

        selectors, outline = _candidate_outline(html)

        self.assertIn("#late-cookie-banner", selectors)
        self.assertIn("Manage Cookies", outline)
