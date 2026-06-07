"""
Views for downloading notes in various formats (txt, md, pdf)
"""
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from django.utils import timezone
from drf_yasg.utils import swagger_auto_schema
from .base import BaseNoteView
from ..pdf_utils import generate_pdf_response
from ..schemas import (DOWNLOAD_FORMAT_PARAMETER, USE_COLORS_PARAMETER,
                       DOWNLOAD_FILE_RESPONSE_SCHEMA,
                       DOWNLOAD_INVALID_FORMAT_RESPONSE_SCHEMA,
                       NOTE_NOT_FOUND_RESPONSE_SCHEMA)


class NoteDownloadView(BaseNoteView):
    """Download a note in txt, md, or pdf format."""

    @swagger_auto_schema(
        operation_description=
        "Download a note in the specified format (txt, md, or pdf).",
        manual_parameters=[DOWNLOAD_FORMAT_PARAMETER, USE_COLORS_PARAMETER],
        responses={
            200: DOWNLOAD_FILE_RESPONSE_SCHEMA,
            400: DOWNLOAD_INVALID_FORMAT_RESPONSE_SCHEMA,
            404: NOTE_NOT_FOUND_RESPONSE_SCHEMA
        })
    def get(self, request, note_id):
        # Defensive: ensure permissions are enforced before any lookup.
        # (Some clients, notably Swagger UI, can otherwise appear to always get a 404.)
        self.check_permissions(request)

        # Get the note
        note = self.get_note(note_id, request.user)

        # NOTE: Do not use query param name 'format' here.
        # DRF uses it for response renderer selection (URL_FORMAT_OVERRIDE).
        download_format = request.query_params.get('download_format',
                                                   'txt').lower()

        if download_format not in ['txt', 'md', 'pdf']:
            return Response(
                {'error': 'Invalid format. Must be txt, md, or pdf'},
                status=status.HTTP_400_BAD_REQUEST)

        # Generate filename
        if note.title:
            # Sanitize title
            sanitized_title = ''.join(
                c for c in note.title
                if c.isalnum() or c in (' ', '-', '_')).rstrip()
            sanitized_title = sanitized_title[:40]  # Limit title length
            base_filename = sanitized_title if sanitized_title else f"note-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        else:
            base_filename = f"note-{timezone.now().strftime('%Y%m%d%H%M%S')}"

        if download_format == 'txt':
            return self._download_as_txt(note, base_filename)
        elif download_format == 'md':
            return self._download_as_md(note, base_filename)
        elif download_format == 'pdf':
            # Get use_colors parameter (default to True)
            use_colors = request.query_params.get(
                'use_colors', 'false').lower() in ['true', '1', 'yes']
            return self._download_as_pdf(note, base_filename, use_colors)

    def _download_as_txt(self, note, filename):
        """Download note as plain text file."""
        content = []
        if note.title:
            content.append(note.title)
            content.append('=' * len(note.title))
            content.append('')
        content.append(note.content)

        text_content = '\n'.join(content)

        response = HttpResponse(text_content,
                                content_type='text/plain; charset=utf-8')
        response[
            'Content-Disposition'] = f'attachment; filename="{filename}.txt"'
        return response

    def _download_as_md(self, note, filename):
        """Download note as markdown file."""
        content = []
        if note.title:
            content.append(f'# {note.title}')
            content.append('')
        content.append(note.content)

        # Add labels if present
        if note.labels.exists():
            content.append('')
            content.append('---')
            content.append(
                '**Labels:** ' +
                ', '.join([label.name for label in note.labels.all()]))

        markdown_content = '\n'.join(content)

        response = HttpResponse(markdown_content,
                                content_type='text/markdown; charset=utf-8')
        response[
            'Content-Disposition'] = f'attachment; filename="{filename}.md"'
        return response

    def _download_as_pdf(self, note, filename, use_colors=True):
        """Download note as PDF file."""
        return generate_pdf_response(note, filename, use_colors=use_colors)
