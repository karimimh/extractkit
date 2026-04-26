from bs4 import BeautifulSoup

BLOCKED_TAGS = [
    "script",
    "style",
    "noscript",
    "iframe",
    "header",
    "footer",
    "nav",
    "aside",
    "form",
    "button",
    "input",
    "svg",
]


def clean_html(raw_html: str) -> str:
    soup = BeautifulSoup(raw_html, "html.parser")

    for tag_name in BLOCKED_TAGS:
        for element in soup.find_all(tag_name):
            element.decompose()

    for element in soup.find_all(attrs={"style": True}):
        del element["style"]

    for element in soup.find_all(True):
        for attr in ["class", "id", "onclick", "onload", "onerror", "role"]:
            if attr in element.attrs:
                del element.attrs[attr]

    body_html = soup.decode()
    return f"<article>{body_html}</article>"
