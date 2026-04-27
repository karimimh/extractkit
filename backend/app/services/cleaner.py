from bs4 import BeautifulSoup

BLOCKED_TAGS = [
    "script",
    "noscript",
]


def clean_html(raw_html: str) -> str:
    soup = BeautifulSoup(raw_html, "html.parser")

    for tag_name in BLOCKED_TAGS:
        for element in soup.find_all(tag_name):
            element.decompose()

    for element in soup.find_all(True):
        for attr in list(element.attrs):
            if attr.lower().startswith("on"):
                del element.attrs[attr]

    return str(soup)
