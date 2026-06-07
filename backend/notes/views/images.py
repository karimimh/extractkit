"""  
Views for image upload and delete operations
"""
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .base import BaseNoteView
from ..models import Note, NoteImage
from ..permissions import HasStorageLimitPermission
from ..schemas import (IMAGE_UPLOAD_REQUEST_PARAMETERS,
                       IMAGE_UPLOAD_RESPONSE_SCHEMA,
                       NOTE_NOT_FOUND_RESPONSE_SCHEMA)


class UserNoteImagesView(BaseNoteView):
    """View for listing all images uploaded by the authenticated user"""

    @swagger_auto_schema(
        operation_description=
        "List uploaded note images for the authenticated user.",
        responses={
            200:
            openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'total_images':
                    openapi.Schema(type=openapi.TYPE_INTEGER),
                    'total_size_bytes':
                    openapi.Schema(type=openapi.TYPE_INTEGER),
                    'images':
                    openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'id':
                                openapi.Schema(type=openapi.TYPE_INTEGER),
                                'note_id':
                                openapi.Schema(type=openapi.TYPE_INTEGER),
                                'note_title':
                                openapi.Schema(type=openapi.TYPE_STRING,
                                               nullable=True),
                                'image':
                                openapi.Schema(type=openapi.TYPE_STRING),
                                'size_bytes':
                                openapi.Schema(type=openapi.TYPE_INTEGER),
                                'uploaded_at':
                                openapi.Schema(type=openapi.TYPE_STRING,
                                               format='date-time'),
                            }))
                })
        })
    def get(self, request):
        images = (NoteImage.objects.filter(note__user=request.user).
                  select_related('note').order_by('-uploaded_at'))

        serialized_images = []
        total_size_bytes = 0

        for image in images:
            size_bytes = 0
            try:
                if image.image:
                    size_bytes = image.image.size
            except (FileNotFoundError, OSError, ValueError):
                size_bytes = 0

            image_url = ''
            try:
                if image.image:
                    image_url = image.image.url
            except ValueError:
                image_url = ''

            total_size_bytes += size_bytes

            serialized_images.append({
                'id': image.id,
                'note_id': image.note.id,
                'note_title': image.note.title,
                'image': image_url,
                'size_bytes': size_bytes,
                'uploaded_at': image.uploaded_at
            })

        return Response(
            {
                'total_images': len(serialized_images),
                'total_size_bytes': total_size_bytes,
                'images': serialized_images,
            },
            status=status.HTTP_200_OK)


class NoteImageUploadView(BaseNoteView):
    """View for uploading images to existing notes"""
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, HasStorageLimitPermission]

    @swagger_auto_schema(
        operation_description="Upload an image for a specific note.",
        manual_parameters=[
            openapi.Parameter('note_id',
                              openapi.IN_PATH,
                              description="ID of the note to upload image for",
                              type=openapi.TYPE_INTEGER)
        ] + IMAGE_UPLOAD_REQUEST_PARAMETERS,
        responses={
            201: IMAGE_UPLOAD_RESPONSE_SCHEMA,
            404: NOTE_NOT_FOUND_RESPONSE_SCHEMA,
            400: "Bad request"
        })
    def post(self, request, note_id):
        # Get the note and ensure it belongs to the user
        note = get_object_or_404(Note, id=note_id, user=request.user)

        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'},
                            status=status.HTTP_400_BAD_REQUEST)

        image_file = request.FILES['image']
        alt_text = request.data.get('alt_text', '')

        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response(
                {
                    'error':
                    f'Invalid image type: {image_file.content_type}. Allowed types: JPEG, PNG, GIF, WebP'
                },
                status=status.HTTP_400_BAD_REQUEST)

        # Create the image record
        note_image = NoteImage.objects.create(note=note,
                                              image=image_file,
                                              alt_text=alt_text)

        return Response(
            {
                'id': note_image.id,
                'image': note_image.image.url,
                'alt_text': note_image.alt_text,
                'uploaded_at': note_image.uploaded_at
            },
            status=status.HTTP_201_CREATED)


class NoteImageDeleteView(BaseNoteView):
    """View for deleting images from notes"""

    @swagger_auto_schema(operation_description="Delete an image from a note.",
                         responses={
                             204: "Image deleted successfully",
                             404: "Image not found",
                             403: "Permission denied"
                         })
    def delete(self, request, note_id, image_id):
        # Get the note and ensure it belongs to the user
        note = get_object_or_404(Note, id=note_id, user=request.user)

        # Get the image and ensure it belongs to the note
        image = get_object_or_404(NoteImage, id=image_id, note=note)

        # Delete the image file and record
        image.image.delete()  # This deletes the actual file
        image.delete()  # This deletes the database record

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserNoteImageDeleteView(BaseNoteView):
    """Delete an uploaded note image owned by the authenticated user"""

    @swagger_auto_schema(operation_description=
                         "Delete an uploaded note image for the current user.",
                         responses={
                             204: "Image deleted successfully",
                             404: "Image not found",
                             403: "Permission denied"
                         })
    def delete(self, request, image_id):
        image = get_object_or_404(NoteImage,
                                  id=image_id,
                                  note__user=request.user)

        if image.image:
            image.image.delete()
        image.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
