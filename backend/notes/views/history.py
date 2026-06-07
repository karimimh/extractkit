from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .base import BaseNoteView
from ..models import NoteHistory


class NoteHistoryView(BaseNoteView):
    def get(self, request, note_id):
        note = self.get_note(note_id, request.user)
        entries = note.history.all()
        data = [
            {
                "id": e.id,
                "title": e.title,
                "content": e.content,
                "content_type": e.content_type,
                "saved_at": e.saved_at,
            }
            for e in entries
        ]
        return Response(data)


class NoteHistoryRestoreView(BaseNoteView):
    def post(self, request, note_id, history_id):
        note = self.get_note(note_id, request.user)
        entry = get_object_or_404(NoteHistory, id=history_id, note=note)

        note.title = entry.title
        note.content = entry.content
        note.content_type = entry.content_type
        note.save()

        return Response(self.serialize_note(note))
