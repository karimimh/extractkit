from bs4 import BeautifulSoup

BLOCKED_TAGS = [
    "noscript",
]

def clean_html(raw_html: str) -> str:
    # Retain scripts so the interactive bits of the page work in the iframe
    soup = BeautifulSoup(raw_html, "html.parser")

    for tag_name in BLOCKED_TAGS:
        for element in soup.find_all(tag_name):
            element.decompose()

    return str(soup)
