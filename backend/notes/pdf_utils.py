"""
Utilities for generating PDF exports from notes.
"""

import io
import os
import re
import ssl
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import socket

from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    ListFlowable,
    ListItem,
    Image as RLImage,
    Preformatted,
)
from reportlab.pdfgen import canvas as canvasmod


def generate_pdf_response(note, filename, use_colors=True):
    """
    Generate a PDF file for a note and return as HttpResponse.

    Args:
        note: The Note model instance to export
        filename: Base filename for the PDF (without extension)
        use_colors: Whether to use note's background and text colors (default: True)

    Returns:
        HttpResponse with PDF content
    """
    # Create a BytesIO buffer to receive PDF data
    buffer = io.BytesIO()

    # Create the PDF object using ReportLab
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )

    # Container for the 'Flowable' objects
    elements = []

    # Define styles with note colors
    styles = _create_pdf_styles(note, use_colors=use_colors)

    # Add title
    if note.title:
        title_text = note.title.replace("<", "&lt;").replace(">", "&gt;")
        elements.append(Paragraph(title_text, styles["title"]))
        elements.append(Spacer(1, 12))

    # Add content - handle markdown if content_type is markdown
    if note.content_type == "markdown":
        elements.extend(_parse_markdown_to_pdf(note, styles))
    else:
        # Plain text handling
        content_paragraphs = note.content.split("\n")
        for para in content_paragraphs:
            if para.strip():
                # Escape HTML characters
                safe_para = (
                    para.replace("<", "&lt;").replace(">", "&gt;").replace("&", "&amp;")
                )
                elements.append(Paragraph(safe_para, styles["body"]))
            else:
                elements.append(Spacer(1, 12))

    # Build PDF with background color if specified
    bg_color = styles.get("bg_color")
    if bg_color:
        doc.build(
            elements,
            canvasmaker=lambda *args, **kwargs: _create_canvas_with_bg(
                bg_color, *args, **kwargs
            ),
        )
    else:
        doc.build(elements)

    # Get the value of the BytesIO buffer and write it to the response
    pdf_data = buffer.getvalue()
    buffer.close()

    response = HttpResponse(pdf_data, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}.pdf"'
    return response


def _create_pdf_styles(note, use_colors=True):
    """
    Create ReportLab paragraph styles based on note colors.

    Args:
        note: The Note model instance
        use_colors: Whether to use note's background and text colors (default: True)

    Returns:
        Dictionary of style objects
    """
    styles = getSampleStyleSheet()

    # Parse note colors (only if use_colors is True)
    if use_colors:
        text_color = HexColor(note.color) if note.color else HexColor("#000000")
        bg_color = HexColor(note.bg_color) if note.bg_color else None
    else:
        text_color = HexColor("#000000")
        bg_color = None

    return {
        "title": ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_LEFT,
            textColor=text_color,
        ),
        "body": ParagraphStyle(
            "CustomBody",
            parent=styles["BodyText"],
            fontSize=12,
            spaceAfter=12,
            alignment=TA_LEFT,
            textColor=text_color,
        ),
        "label": ParagraphStyle(
            "LabelStyle",
            parent=styles["BodyText"],
            fontSize=10,
            spaceAfter=12,
            textColor=text_color,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=styles["Heading1"],
            fontSize=18,
            spaceAfter=12,
            spaceBefore=12,
            alignment=TA_LEFT,
            textColor=text_color,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=styles["Heading2"],
            fontSize=16,
            spaceAfter=10,
            spaceBefore=10,
            alignment=TA_LEFT,
            textColor=text_color,
        ),
        "h3": ParagraphStyle(
            "H3",
            parent=styles["Heading3"],
            fontSize=14,
            spaceAfter=8,
            spaceBefore=8,
            alignment=TA_LEFT,
            textColor=text_color,
        ),
        "code": ParagraphStyle(
            "Code",
            parent=styles["Code"],
            fontSize=10,
            fontName="Courier",
            spaceAfter=12,
            spaceBefore=12,
            leftIndent=20,
            rightIndent=20,
            backColor=HexColor("#f4f4f4"),
            textColor=HexColor("#000000"),
        ),
        "blockquote": ParagraphStyle(
            "Blockquote",
            parent=styles["BodyText"],
            fontSize=12,
            spaceAfter=12,
            spaceBefore=12,
            leftIndent=20,
            rightIndent=10,
            backColor=HexColor("#f9f9f9"),
            textColor=text_color,
        ),
        "bg_color": bg_color,
    }


def _create_canvas_with_bg(bg_color, *args, **kwargs):
    """
    Create a canvas with background color.

    Args:
        bg_color: HexColor object for background

    Returns:
        Custom Canvas instance
    """

    class ColoredCanvas(canvasmod.Canvas):

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.bg_color = bg_color
            self._draw_background()

        def _draw_background(self):
            """Draw background color behind all content."""
            self.saveState()
            self.setFillColor(self.bg_color)
            self.rect(0, 0, letter[0], letter[1], fill=True, stroke=False)
            self.restoreState()

        def showPage(self):
            # Finalize the page and start a new one
            super().showPage()
            # Draw background for the new page
            self._draw_background()

    return ColoredCanvas(*args, **kwargs)


def _parse_markdown_to_pdf(note, styles):
    """
    Parse markdown content and return list of ReportLab flowables.

    Args:
        note: The Note model instance
        styles: Dictionary of paragraph styles

    Returns:
        List of ReportLab flowable objects
    """
    elements = []
    content = note.content
    lines = content.split("\n")
    i = 0
    in_code_block = False
    code_lines = []
    current_list = []
    list_type = None  # 'bullet' or 'ordered'
    added_image_paths = set()  # Track images already added from markdown

    body_style = styles["body"]
    h1_style = styles["h1"]
    h2_style = styles["h2"]
    h3_style = styles["h3"]
    code_style = styles["code"]

    def flush_list():
        """Helper to flush accumulated list items."""
        nonlocal current_list, list_type
        if current_list:
            if list_type == "bullet":
                list_items = [
                    ListItem(Paragraph(item, body_style), bulletText="•")
                    for item in current_list
                ]
            else:  # ordered
                list_items = [
                    ListItem(Paragraph(item, body_style)) for item in current_list
                ]
            elements.append(
                ListFlowable(
                    list_items, bulletType="bullet" if list_type == "bullet" else "1"
                )
            )
            current_list = []
            list_type = None

    def escape_html(text):
        """Escape HTML special characters but preserve markdown formatting."""
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    def process_inline_markdown(text):
        """Process inline markdown (bold, italic, code, images)."""
        # Images - extract and handle separately
        image_pattern = r"!\[([^\]]*)\]\(([^\)]+)\)"
        images = re.findall(image_pattern, text)

        # Remove image markdown from text
        text = re.sub(image_pattern, "", text)

        # Code blocks (backticks)
        text = re.sub(
            r"`([^`]+)`", r'<font name="Courier" color="darkred">\1</font>', text
        )
        # Bold
        text = re.sub(r"\*\*([^\*]+)\*\*", r"<b>\1</b>", text)
        text = re.sub(r"__([^_]+)__", r"<b>\1</b>", text)
        # Italic
        text = re.sub(r"\*([^\*]+)\*", r"<i>\1</i>", text)
        text = re.sub(r"_([^_]+)_", r"<i>\1</i>", text)

        return text, images

    def add_image_to_pdf(image_url, alt_text=""):
        """Add an image to the PDF elements."""
        # Handle both relative paths and full URLs
        if image_url.startswith("/media/"):
            # Local media file
            from django.conf import settings

            try:
                image_path = os.path.join(
                    settings.MEDIA_ROOT, image_url.replace("/media/", "")
                )
                if os.path.exists(image_path):
                    # Track this image path
                    added_image_paths.add(image_path)
                    img = RLImage(
                        image_path, width=4 * inch, height=3 * inch, kind="proportional"
                    )
                    elements.append(img)
                    elements.append(Spacer(1, 12))
                else:
                    # File doesn't exist
                    elements.append(
                        Paragraph(
                            f"[Image not found: {alt_text or image_url}]", body_style
                        )
                    )
            except Exception as e:
                print(f"Error loading local image {image_url}: {e}")
                elements.append(
                    Paragraph(f"[Image error: {alt_text or image_url}]", body_style)
                )
        elif image_url.startswith("http://") or image_url.startswith("https://"):
            # External URL - download and add with proper error handling
            try:
                # Create request with headers to avoid being blocked by some servers
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
                req = Request(image_url, headers=headers)

                # Create SSL context - use unverified for HTTPS to avoid certificate issues
                ssl_context = None
                if image_url.startswith("https://"):
                    ssl_context = ssl._create_unverified_context()

                # Set timeout to avoid hanging on slow connections
                with urlopen(req, timeout=10, context=ssl_context) as response:
                    img_data = io.BytesIO(response.read())
                    img = RLImage(
                        img_data, width=4 * inch, height=3 * inch, kind="proportional"
                    )
                    elements.append(img)
                    elements.append(Spacer(1, 12))
            except (HTTPError, URLError, socket.timeout) as network_err:
                # Network-related errors
                error_msg = f'[Image unavailable: {alt_text or "web image"}]'
                elements.append(Paragraph(error_msg, body_style))
                print(f"Network error loading image {image_url}: {network_err}")
            except Exception as img_err:
                # Other image-related errors (invalid format, etc.)
                error_msg = f'[Image error: {alt_text or "web image"}]'
                elements.append(Paragraph(error_msg, body_style))
                print(f"Error processing image {image_url}: {img_err}")
        elif os.path.isabs(image_url) and os.path.exists(image_url):
            # Absolute file path (direct file system path)
            try:
                added_image_paths.add(image_url)
                img = RLImage(
                    image_url, width=4 * inch, height=3 * inch, kind="proportional"
                )
                elements.append(img)
                elements.append(Spacer(1, 12))
            except Exception as e:
                print(f"Error loading image from path {image_url}: {e}")
                elements.append(
                    Paragraph(f"[Image error: {alt_text or image_url}]", body_style)
                )
        else:
            # Unknown format or file not found
            elements.append(Paragraph(f"[Image: {alt_text or image_url}]", body_style))

    while i < len(lines):
        line = lines[i]

        # Code blocks
        if line.strip().startswith("```"):
            if in_code_block:
                # End of code block
                flush_list()
                code_text = "\n".join(code_lines)
                # Create a code block with proper styling using Preformatted
                code_para = Preformatted(code_text, code_style, maxLineLength=80)
                elements.append(code_para)
                elements.append(Spacer(1, 12))
                code_lines = []
                in_code_block = False
            else:
                # Start of code block
                flush_list()
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # Standalone images (on their own line)
        image_match = re.match(r"^\s*!\[([^\]]*)\]\(([^\)]+)\)\s*$", line)
        if image_match:
            flush_list()
            alt_text, image_url = image_match.groups()
            add_image_to_pdf(image_url, alt_text)
            i += 1
            continue

        # Headers
        if line.startswith("# ") and not line.startswith("## "):
            flush_list()
            header_text = escape_html(line[2:].strip())
            header_text, images = process_inline_markdown(header_text)
            elements.append(Paragraph(header_text, h1_style))
            for alt_text, image_url in images:
                add_image_to_pdf(image_url, alt_text)
            i += 1
            continue
        elif line.startswith("## ") and not line.startswith("### "):
            flush_list()
            header_text = escape_html(line[3:].strip())
            header_text, images = process_inline_markdown(header_text)
            elements.append(Paragraph(header_text, h2_style))
            for alt_text, image_url in images:
                add_image_to_pdf(image_url, alt_text)
            i += 1
            continue
        elif line.startswith("### "):
            flush_list()
            header_text = escape_html(line[4:].strip())
            header_text, images = process_inline_markdown(header_text)
            elements.append(Paragraph(header_text, h3_style))
            for alt_text, image_url in images:
                add_image_to_pdf(image_url, alt_text)
            i += 1
            continue

        # Unordered lists
        if re.match(r"^[\-\*\+]\s+", line):
            list_item_text = re.sub(r"^[\-\*\+]\s+", "", line)
            list_item_text = escape_html(list_item_text)
            list_item_text, images = process_inline_markdown(list_item_text)
            if list_type != "bullet":
                flush_list()
                list_type = "bullet"
            current_list.append(list_item_text)
            # Images in list items
            for alt_text, image_url in images:
                flush_list()
                add_image_to_pdf(image_url, alt_text)
            i += 1
            continue

        # Ordered lists
        if re.match(r"^\d+\.\s+", line):
            list_item_text = re.sub(r"^\d+\.\s+", "", line)
            list_item_text = escape_html(list_item_text)
            list_item_text, images = process_inline_markdown(list_item_text)
            if list_type != "ordered":
                flush_list()
                list_type = "ordered"
            current_list.append(list_item_text)
            # Images in list items
            for alt_text, image_url in images:
                flush_list()
                add_image_to_pdf(image_url, alt_text)
            i += 1
            continue

        # Blockquotes
        if line.strip().startswith(">"):
            flush_list()
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                # Remove the '>' and any leading space
                quote_line = lines[i].strip()[1:].lstrip()
                quote_lines.append(quote_line)
                i += 1
            # Join the quote lines and process inline markdown
            quote_text = " ".join(quote_lines)
            quote_text = escape_html(quote_text)
            quote_text, images = process_inline_markdown(quote_text)
            elements.append(Paragraph(quote_text, styles["blockquote"]))
            # Add any images found in the blockquote
            for alt_text, image_url in images:
                add_image_to_pdf(image_url, alt_text)
            continue

        # Empty lines
        if not line.strip():
            flush_list()
            elements.append(Spacer(1, 12))
            i += 1
            continue

        # Regular paragraphs
        flush_list()
        para_text = escape_html(line)
        para_text, images = process_inline_markdown(para_text)
        if para_text.strip():  # Only add if there's text left
            elements.append(Paragraph(para_text, body_style))
        for alt_text, image_url in images:
            add_image_to_pdf(image_url, alt_text)
        i += 1

    # Flush any remaining list items
    flush_list()

    return elements
