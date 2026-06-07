"""
Utility functions for notes app
"""
import markdown
import bleach
from markdown.extensions import codehilite, tables, fenced_code
from django.conf import settings


def process_markdown(text):
    """
    Process markdown text and return safe HTML
    """
    # Configure markdown extensions
    extensions = [
        'markdown.extensions.codehilite',
        'markdown.extensions.tables',
        'markdown.extensions.fenced_code',
        'markdown.extensions.nl2br',
        'markdown.extensions.toc',
    ]

    # Convert markdown to HTML
    md = markdown.Markdown(extensions=extensions)
    html = md.convert(text)

    # Define allowed HTML tags and attributes for safety
    allowed_tags = [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'strong',
        'em',
        'u',
        'del',
        'ins',
        'ul',
        'ol',
        'li',
        'blockquote',
        'code',
        'pre',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'a',
        'img',
        'div',
        'span',
    ]

    allowed_attributes = {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        'code': ['class'],
        'pre': ['class'],
        'div': ['class'],
        'span': ['class'],
        'table': ['class'],
        'th': ['align'],
        'td': ['align'],
    }

    # Clean the HTML to prevent XSS attacks
    clean_html = bleach.clean(html,
                              tags=allowed_tags,
                              attributes=allowed_attributes,
                              strip=True)

    return clean_html


def extract_image_references(markdown_text):
    """
    Extract image references from markdown text
    Returns list of image URLs found in the markdown
    """
    import re

    # Pattern to match markdown images: ![alt](url)
    pattern = r'!\[([^\]]*)\]\(([^)]+)\)'
    matches = re.findall(pattern, markdown_text)

    # Return list of tuples (alt_text, url)
    return matches


def is_valid_hex_color(color_value):
    """
    Validate hex color format
    Returns True if the color is a valid hex color or empty/None
    """
    if color_value is None:
        return True  # Allow None values
    if color_value == '':
        return True  # Allow empty string to clear color

    import re
    return bool(re.match(r'^#[0-9A-Fa-f]{6}$', color_value))
