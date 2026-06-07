"""
Base views with common helper methods used across note views
"""
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from ..models import Note
from ..utils import process_markdown


class BaseNoteView(APIView):
    """Base view with common helper methods for note operations"""
    permission_classes = [IsAuthenticated]

    def get_query_param(self, request, param_name):
        """Helper method to get query parameters from request"""
        if hasattr(request, 'query_params'):
            return request.query_params.get(param_name)
        return request.GET.get(param_name)

    def get_note(self, note_id, user):
        """Helper method to get a note and ensure it belongs to the user"""
        return get_object_or_404(Note, id=note_id, user=user)

    def serialize_note(self, note):
        """Helper method to serialize note data"""
        data = {
            'id': note.id,
            'title': note.title,
            'content': note.content,
            'content_type': note.content_type,
            'is_pinned': note.is_pinned,
            'pin_order': note.pin_order,
            'color': note.color,
            'bg_color': note.bg_color,
            'order': note.order,
            'created_at': note.created_at,
            'updated_at': note.updated_at,
            'images': [],
            'labels': []
        }

        # Add rendered content for markdown
        if note.content_type == 'markdown':
            data['rendered_content'] = process_markdown(note.content)

        # Add associated images
        for image in note.images.all():
            data['images'].append({
                'id': image.id,
                'image': image.image.url,
                'alt_text': image.alt_text,
                'uploaded_at': image.uploaded_at
            })

        # Add associated labels
        for label in note.labels.all():
            data['labels'].append({
                'id': label.id,
                'name': label.name,
                'color': label.color
            })

        return data
