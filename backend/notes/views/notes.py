"""
Views for main note CRUD operations (Create, Read, Update, Delete)
"""

from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Max
from django.utils.dateparse import parse_date
from django.core.paginator import Paginator
from drf_yasg.utils import swagger_auto_schema
from .base import BaseNoteView
from ..models import Note, NoteImage, Label
from ..utils import is_valid_hex_color
from ..permissions import (
    HasNoteLimitPermission,
    HasCharacterLimitPermission,
    HasStorageLimitPermission,
)
from ..schemas import (
    NOTES_LIST_RESPONSE_SCHEMA,
    NOTE_CREATE_REQUEST_SCHEMA,
    NOTE_DETAIL_RESPONSE_SCHEMA,
    NOTE_UPDATE_REQUEST_SCHEMA,
    NOTE_NOT_FOUND_RESPONSE_SCHEMA,
    NOTE_DELETED_RESPONSE_SCHEMA,
    NOTES_LIST_FILTER_PARAMETERS,
    NOTES_VERSION_RESPONSE_SCHEMA,
)


class NoteView(BaseNoteView):
    """View for listing and creating notes"""

    def get_permissions(self):
        """Set permissions based on the request method"""
        if self.request.method == "POST":
            return [
                IsAuthenticated(),
                HasNoteLimitPermission(),
                HasCharacterLimitPermission(),
                HasStorageLimitPermission(),
            ]
        return [IsAuthenticated()]

    @swagger_auto_schema(
        operation_description="Get all notes for the authenticated user with optional filters and pagination.",
        manual_parameters=NOTES_LIST_FILTER_PARAMETERS,
        responses={200: NOTES_LIST_RESPONSE_SCHEMA},
    )
    def get(self, request):
        # Start with base queryset
        notes = Note.objects.filter(user=request.user).prefetch_related(
            "images", "labels"
        )

        # Apply filters based on query parameters
        search = self.get_query_param(request, "search")
        if search:
            notes = notes.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )

        is_pinned = self.get_query_param(request, "is_pinned")
        if is_pinned is not None:
            is_pinned_bool = is_pinned.lower() in ["true", "1", "yes"]
            notes = notes.filter(is_pinned=is_pinned_bool)

        content_type = self.get_query_param(request, "content_type")
        if content_type and content_type in ["text", "markdown"]:
            notes = notes.filter(content_type=content_type)

        # Label filter
        labels = self.get_query_param(request, "labels")
        if labels:
            try:
                label_ids = [int(id.strip()) for id in labels.split(",") if id.strip()]
                if label_ids:
                    notes = notes.filter(labels__id__in=label_ids).distinct()
            except ValueError:
                pass  # Invalid label IDs, ignore filter

        # Date filters
        created_after = self.get_query_param(request, "created_after")
        if created_after:
            try:
                created_after_date = parse_date(created_after)
                if created_after_date:
                    notes = notes.filter(created_at__date__gte=created_after_date)
            except ValueError:
                pass  # Invalid date format, ignore filter

        created_before = self.get_query_param(request, "created_before")
        if created_before:
            try:
                created_before_date = parse_date(created_before)
                if created_before_date:
                    notes = notes.filter(created_at__date__lte=created_before_date)
            except ValueError:
                pass  # Invalid date format, ignore filter

        updated_after = self.get_query_param(request, "updated_after")
        if updated_after:
            try:
                updated_after_date = parse_date(updated_after)
                if updated_after_date:
                    notes = notes.filter(updated_at__date__gte=updated_after_date)
            except ValueError:
                pass  # Invalid date format, ignore filter

        updated_before = self.get_query_param(request, "updated_before")
        if updated_before:
            try:
                updated_before_date = parse_date(updated_before)
                if updated_before_date:
                    notes = notes.filter(updated_at__date__lte=updated_before_date)
            except ValueError:
                pass  # Invalid date format, ignore filter

        # Color filters
        color = self.get_query_param(request, "color")
        if color:
            if is_valid_hex_color(color):
                notes = notes.filter(color=color)

        bg_color = self.get_query_param(request, "bg_color")
        if bg_color:
            if is_valid_hex_color(bg_color):
                notes = notes.filter(bg_color=bg_color)

        # Handle ordering
        order_by = self.get_query_param(request, "order_by")
        order_direction = self.get_query_param(request, "order_direction")

        # Valid ordering fields
        valid_order_fields = [
            "updated_at",
            "created_at",
            "title",
            "content_type",
            "color",
            "bg_color",
            "order",
        ]

        # Default ordering
        if not order_by or order_by not in valid_order_fields:
            order_by = "updated_at"

        # Default direction is descending
        if not order_direction or order_direction not in ["asc", "desc"]:
            order_direction = "desc"

        # Apply ordering - pinned notes first (by pin_order), then regular notes
        if order_direction == "desc":
            order_field = f"-{order_by}"
        else:
            order_field = order_by

        # For custom order, skip pinned notes grouping
        if order_by == "order":
            notes = notes.order_by(order_field)
        else:
            # Order by: is_pinned (descending), then pin_order (ascending for pinned), then user's choice
            notes = notes.order_by("-is_pinned", "pin_order", order_field)

        # Handle pagination
        page = self.get_query_param(request, "page")
        page_size = self.get_query_param(request, "page_size")

        # Set default values
        try:
            page = int(page) if page else 1
        except (ValueError, TypeError):
            page = 1

        try:
            page_size = int(page_size) if page_size else 20
            # Limit maximum page size to prevent abuse
            page_size = min(page_size, 100)
        except (ValueError, TypeError):
            page_size = 20

        # Apply pagination
        paginator = Paginator(notes, page_size)
        page_obj = paginator.get_page(page)

        notes_data = [self.serialize_note(note) for note in page_obj]

        # Prepare pagination metadata
        pagination_data = {
            "page": page_obj.number,
            "page_size": page_size,
            "total_pages": paginator.num_pages,
            "total_count": paginator.count,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }

        return Response({"notes": notes_data, "pagination": pagination_data})

    @swagger_auto_schema(
        operation_description="Create a new note for the authenticated user.",
        request_body=NOTE_CREATE_REQUEST_SCHEMA,
        responses={201: NOTE_DETAIL_RESPONSE_SCHEMA},
    )
    def post(self, request):
        title = request.data.get("title", "")  # Default to empty string if not provided
        content = request.data.get(
            "content", ""
        )  # Default to empty string if not provided
        content_type = request.data.get("content_type", "markdown")
        labels = request.data.get("labels", [])
        color = request.data.get("color", "#000000")
        bg_color = request.data.get("bg_color", "#ffffff")
        order = request.data.get("order", 0)

        # Validate content_type
        if content_type not in ["text", "markdown"]:
            return Response(
                {"error": 'content_type must be either "text" or "markdown"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate labels
        if labels:
            if not isinstance(labels, list):
                return Response(
                    {"error": "labels must be an array of label IDs"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Verify all label IDs exist and belong to the user
            try:
                label_objects = Label.objects.filter(id__in=labels, user=request.user)
                if len(label_objects) != len(
                    set(labels)
                ):  # Check for invalid or duplicate IDs
                    return Response(
                        {"error": "One or more label IDs are invalid"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": "labels must be an array of valid integers"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Validate color format (hex color with #)
        if color and not is_valid_hex_color(color):
            return Response(
                {"error": "color must be a valid hex color (e.g., #000000)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if bg_color and not is_valid_hex_color(bg_color):
            return Response(
                {"error": "bg_color must be a valid hex color (e.g., #ffffff)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate order (must be an integer)
        if order is not None:
            try:
                order = int(order)
            except (ValueError, TypeError):
                return Response(
                    {"error": "order must be a valid integer"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # Auto-assign next available order value
            max_order = Note.objects.filter(user=request.user).aggregate(
                max_order=Max("order")
            )["max_order"]
            order = (max_order or 0) + 1

        note = Note.objects.create(
            user=request.user,
            title=title,
            content=content,
            content_type=content_type,
            color=color,
            bg_color=bg_color,
            order=order,
        )

        # Add labels to the note
        if labels:
            note.labels.set(label_objects)

        return Response(self.serialize_note(note), status=status.HTTP_201_CREATED)


class NoteDetailView(BaseNoteView):
    """View for retrieving, updating, and deleting individual notes"""

    def get_permissions(self):
        """Set permissions based on the request method"""
        if self.request.method in ["PUT", "PATCH"]:
            return [
                IsAuthenticated(),
                HasCharacterLimitPermission(),
                HasStorageLimitPermission(),
            ]
        return [IsAuthenticated()]

    @swagger_auto_schema(
        operation_description="Get a specific note for the authenticated user.",
        responses={
            200: NOTE_DETAIL_RESPONSE_SCHEMA,
            404: NOTE_NOT_FOUND_RESPONSE_SCHEMA,
        },
    )
    def get(self, request, note_id):
        note = self.get_note(note_id, request.user)
        return Response(self.serialize_note(note))

    @swagger_auto_schema(
        operation_description="Update a specific note for the authenticated user.",
        request_body=NOTE_UPDATE_REQUEST_SCHEMA,
        responses={
            200: NOTE_DETAIL_RESPONSE_SCHEMA,
            404: NOTE_NOT_FOUND_RESPONSE_SCHEMA,
        },
    )
    def put(self, request, note_id):
        note = self.get_note(note_id, request.user)

        title = request.data.get("title")
        content = request.data.get("content")
        content_type = request.data.get("content_type")
        labels = request.data.get("labels")
        color = request.data.get("color")
        bg_color = request.data.get("bg_color")
        order = request.data.get("order")

        # Validate labels if provided
        if labels is not None:
            if not isinstance(labels, list):
                return Response(
                    {"error": "labels must be an array of label IDs"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Verify all label IDs exist and belong to the user
            try:
                if labels:  # Only validate if not empty
                    label_objects = Label.objects.filter(
                        id__in=labels, user=request.user
                    )
                    if len(label_objects) != len(
                        set(labels)
                    ):  # Check for invalid or duplicate IDs
                        return Response(
                            {"error": "One or more label IDs are invalid"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
            except (ValueError, TypeError):
                return Response(
                    {"error": "labels must be an array of valid integers"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Track if note fields (not labels) have been modified
        note_modified = False

        # Update fields if provided
        if title is not None:
            note.title = title
            note_modified = True
        if content is not None:
            note.content = content
            note_modified = True
        if content_type is not None:
            if content_type not in ["text", "markdown"]:
                return Response(
                    {"error": 'content_type must be either "text" or "markdown"'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            note.content_type = content_type
            note_modified = True
        if labels is not None:
            if labels:  # If labels provided, set them
                note.labels.set(label_objects)
            else:  # If empty array provided, clear all labels
                note.labels.clear()
        if color is not None:
            if not is_valid_hex_color(color):
                return Response(
                    {"error": "color must be a valid hex color (e.g., #000000)"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            note.color = color
            note_modified = True
        if bg_color is not None:
            if not is_valid_hex_color(bg_color):
                return Response(
                    {"error": "bg_color must be a valid hex color (e.g., #ffffff)"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            note.bg_color = bg_color
            note_modified = True
        if order is not None:
            try:
                order = int(order)
                note.order = order
                note_modified = True
            except (ValueError, TypeError):
                return Response(
                    {"error": "order must be a valid integer"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Only save if fields other than labels were modified
        if note_modified:
            note.save()

        return Response(self.serialize_note(note))

    @swagger_auto_schema(
        operation_description="Delete a specific note for the authenticated user.",
        responses={
            204: NOTE_DELETED_RESPONSE_SCHEMA,
            404: NOTE_NOT_FOUND_RESPONSE_SCHEMA,
        },
    )
    def delete(self, request, note_id):
        note = self.get_note(note_id, request.user)
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotesVersionView(BaseNoteView):
    """Lightweight endpoint to check if notes have been modified."""

    @swagger_auto_schema(
        operation_description="Get version information for user's notes. "
        "Returns the latest update timestamp and count to detect changes without fetching all notes.",
        responses={200: NOTES_VERSION_RESPONSE_SCHEMA},
    )
    def get(self, request):
        # Get notes for the user
        notes = Note.objects.filter(user=request.user)

        # Get the latest update timestamp
        latest_update = notes.aggregate(Max("updated_at"))
        latest_timestamp = latest_update.get("updated_at__max")

        # Get the count of notes
        count = notes.count()

        return Response(
            {
                "version": latest_timestamp.isoformat() if latest_timestamp else None,
                "count": count,
            }
        )
