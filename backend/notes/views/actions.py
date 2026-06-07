"""
Views for note action operations (pin)
"""
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Min
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .base import BaseNoteView
from ..models import Note
from ..schemas import (NOTE_PIN_RESPONSE_SCHEMA,
                       NOTE_NOT_FOUND_RESPONSE_SCHEMA)


class NotePinView(BaseNoteView):
    """View for pinning/unpinning notes"""

    @swagger_auto_schema(
        operation_description=
        "Toggle the pin status of a note. Newly pinned notes get the smallest pin_order.",
        responses={
            200: NOTE_PIN_RESPONSE_SCHEMA,
            404: NOTE_NOT_FOUND_RESPONSE_SCHEMA
        })
    def post(self, request, note_id):
        note = self.get_note(note_id, request.user)

        if note.is_pinned:
            # Unpin the note
            note.is_pinned = False
            note.pin_order = 0
            action = "unpinned"
        else:
            # Pin the note - get the smallest pin_order among pinned notes
            min_pin_order = Note.objects.filter(
                user=request.user,
                is_pinned=True).aggregate(Min('pin_order'))['pin_order__min']

            # If there are no pinned notes, start at 0, otherwise use min - 1
            if min_pin_order is None:
                note.pin_order = 0
            else:
                note.pin_order = min_pin_order - 1

            note.is_pinned = True
            action = "pinned"

        # Save only is_pinned and pin_order fields without updating updated_at
        note.save(update_fields=['is_pinned', 'pin_order'])

        return Response({
            'id': note.id,
            'is_pinned': note.is_pinned,
            'pin_order': note.pin_order,
            'message': f'Note {action} successfully'
        })


class NoteBulkOrderView(BaseNoteView):
    """View for reordering notes via drag and drop"""

    @swagger_auto_schema(
        operation_description=
        "Reorder a note by dragging it to another position. Only send the dragged note ID and target note ID.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'dragged_id':
                openapi.Schema(type=openapi.TYPE_INTEGER,
                               description="ID of the note being dragged"),
                'target_id':
                openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the note at the target position"),
            },
            required=['dragged_id', 'target_id']),
        responses={
            200:
            openapi.Response(description="Note reordered successfully",
                             schema=openapi.Schema(
                                 type=openapi.TYPE_OBJECT,
                                 properties={
                                     'message':
                                     openapi.Schema(type=openapi.TYPE_STRING),
                                 })),
            400:
            openapi.Response(description="Bad request"),
            404:
            openapi.Response(description="Note not found")
        })
    def post(self, request):
        dragged_id = request.data.get('dragged_id')
        target_id = request.data.get('target_id')

        if not dragged_id or not target_id:
            return Response(
                {'error': 'Both dragged_id and target_id are required'},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            dragged_id = int(dragged_id)
            target_id = int(target_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'dragged_id and target_id must be valid integers'},
                status=status.HTTP_400_BAD_REQUEST)

        if dragged_id == target_id:
            return Response({'error': 'Cannot drag note to its own position'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            dragged_note = Note.objects.get(id=dragged_id, user=request.user)
            target_note = Note.objects.get(id=target_id, user=request.user)
        except Note.DoesNotExist:
            return Response({'error': 'Note not found'},
                            status=status.HTTP_404_NOT_FOUND)

        old_order = dragged_note.order
        new_order = target_note.order

        if old_order == new_order:
            return Response({'message': 'Note is already in position'})

        # Determine direction of movement
        if old_order < new_order:
            # Dragging down: shift notes between old_order+1 and new_order left (decrease by 1)
            notes_to_shift = Note.objects.filter(
                user=request.user, order__gt=old_order,
                order__lte=new_order).exclude(id=dragged_id)

            for note in notes_to_shift:
                note.order -= 1
            Note.objects.bulk_update(notes_to_shift, ['order'])
        else:
            # Dragging up: shift notes between new_order and old_order-1 right (increase by 1)
            notes_to_shift = Note.objects.filter(
                user=request.user, order__gte=new_order,
                order__lt=old_order).exclude(id=dragged_id)

            for note in notes_to_shift:
                note.order += 1
            Note.objects.bulk_update(notes_to_shift, ['order'])

        # Move the dragged note to the target position
        dragged_note.order = new_order
        dragged_note.save(update_fields=['order'])

        return Response({'message': 'Note reordered successfully'})
