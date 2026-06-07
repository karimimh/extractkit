from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..models import Label
from ..utils import is_valid_hex_color
from ..schemas import (LABEL_LIST_RESPONSE_SCHEMA, LABEL_CREATE_REQUEST_SCHEMA,
                       LABEL_DETAIL_RESPONSE_SCHEMA,
                       LABEL_UPDATE_REQUEST_SCHEMA,
                       LABEL_NOT_FOUND_RESPONSE_SCHEMA,
                       LABEL_DELETED_RESPONSE_SCHEMA,
                       LABEL_LIST_FILTER_PARAMETERS)


class LabelView(APIView):
    permission_classes = [IsAuthenticated]

    def get_query_param(self, request, param_name):
        """Helper method to get query parameters from request"""
        if hasattr(request, 'query_params'):
            return request.query_params.get(param_name)
        return request.GET.get(param_name)

    def serialize_label(self, label):
        """Helper method to serialize label data"""
        return {
            'id': label.id,
            'name': label.name,
            'color': label.color,
            'created_at': label.created_at,
            'updated_at': label.updated_at,
            'notes_count': label.notes.count()
        }

    @swagger_auto_schema(
        operation_description=
        "Get all labels for the authenticated user with optional filters.",
        manual_parameters=LABEL_LIST_FILTER_PARAMETERS,
        responses={200: LABEL_LIST_RESPONSE_SCHEMA})
    def get(self, request):
        # Start with base queryset
        labels = Label.objects.filter(user=request.user)

        # Apply search filter
        search = self.get_query_param(request, 'search')
        if search:
            labels = labels.filter(name__icontains=search)

        # Apply color filter
        color = self.get_query_param(request, 'color')
        if color and is_valid_hex_color(color):
            labels = labels.filter(color=color)

        # Handle ordering
        order_by = self.get_query_param(request, 'order_by')
        order_direction = self.get_query_param(request, 'order_direction')

        # Valid ordering fields
        valid_order_fields = ['name', 'color', 'created_at', 'updated_at']

        # Default ordering
        if not order_by or order_by not in valid_order_fields:
            order_by = 'name'

        # Default direction is ascending for labels
        if not order_direction or order_direction not in ['asc', 'desc']:
            order_direction = 'asc'

        # Apply ordering
        if order_direction == 'desc':
            order_field = f'-{order_by}'
        else:
            order_field = order_by

        labels = labels.order_by(order_field)

        labels_data = [self.serialize_label(label) for label in labels]

        return Response({'labels': labels_data})

    @swagger_auto_schema(
        operation_description="Create a new label for the authenticated user.",
        request_body=LABEL_CREATE_REQUEST_SCHEMA,
        responses={201: LABEL_DETAIL_RESPONSE_SCHEMA})
    def post(self, request):
        name = request.data.get('name')
        color = request.data.get('color', '#2196F3')

        if not name:
            return Response({'error': 'Name is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Validate name length
        if len(name) > 50:
            return Response({'error': 'Name must be 50 characters or less'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Validate color format (hex color with #)
        if not is_valid_hex_color(color):
            return Response(
                {'error': 'color must be a valid hex color (e.g., #2196F3)'},
                status=status.HTTP_400_BAD_REQUEST)

        # Check if label with this name already exists for the user
        if Label.objects.filter(user=request.user, name=name).exists():
            return Response({'error': 'A label with this name already exists'},
                            status=status.HTTP_400_BAD_REQUEST)

        label = Label.objects.create(user=request.user, name=name, color=color)

        return Response(self.serialize_label(label),
                        status=status.HTTP_201_CREATED)


class LabelDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_label(self, label_id, user):
        """Helper method to get a label and ensure it belongs to the user"""
        return get_object_or_404(Label, id=label_id, user=user)

    def serialize_label(self, label):
        """Helper method to serialize label data"""
        return {
            'id': label.id,
            'name': label.name,
            'color': label.color,
            'created_at': label.created_at,
            'updated_at': label.updated_at,
            'notes_count': label.notes.count()
        }

    @swagger_auto_schema(operation_description=
                         "Get a specific label for the authenticated user.",
                         responses={
                             200: LABEL_DETAIL_RESPONSE_SCHEMA,
                             404: LABEL_NOT_FOUND_RESPONSE_SCHEMA
                         })
    def get(self, request, label_id):
        label = self.get_label(label_id, request.user)
        return Response(self.serialize_label(label))

    @swagger_auto_schema(operation_description=
                         "Update a specific label for the authenticated user.",
                         request_body=LABEL_UPDATE_REQUEST_SCHEMA,
                         responses={
                             200: LABEL_DETAIL_RESPONSE_SCHEMA,
                             404: LABEL_NOT_FOUND_RESPONSE_SCHEMA
                         })
    def put(self, request, label_id):
        label = self.get_label(label_id, request.user)

        name = request.data.get('name')
        color = request.data.get('color')

        # Update fields if provided
        if name is not None:
            if len(name) > 50:
                return Response(
                    {'error': 'Name must be 50 characters or less'},
                    status=status.HTTP_400_BAD_REQUEST)

            # Check if another label with this name already exists for the user
            if Label.objects.filter(user=request.user,
                                    name=name).exclude(id=label.id).exists():
                return Response(
                    {'error': 'A label with this name already exists'},
                    status=status.HTTP_400_BAD_REQUEST)

            label.name = name

        if color is not None:
            if not is_valid_hex_color(color):
                return Response(
                    {
                        'error':
                        'color must be a valid hex color (e.g., #2196F3)'
                    },
                    status=status.HTTP_400_BAD_REQUEST)
            label.color = color

        label.save()

        return Response(self.serialize_label(label))

    @swagger_auto_schema(operation_description=
                         "Delete a specific label for the authenticated user.",
                         responses={
                             204: LABEL_DELETED_RESPONSE_SCHEMA,
                             404: LABEL_NOT_FOUND_RESPONSE_SCHEMA
                         })
    def delete(self, request, label_id):
        label = self.get_label(label_id, request.user)
        label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
