from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import SupportTicket, SupportMessage
from .serializers import (SupportTicketSerializer, SupportTicketListSerializer,
                          SupportMessageSerializer)


class SupportTicketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return SupportTicketListSerializer
        return SupportTicketSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        ticket = self.get_object()
        message_text = request.data.get('message')

        if not message_text:
            return Response({'error': 'Message is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        is_admin = request.user.is_staff
        message = SupportMessage.objects.create(ticket=ticket,
                                                sender=request.user,
                                                message=message_text,
                                                is_admin=is_admin)

        ticket.save()

        serializer = SupportMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def close_ticket(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = 'closed'
        ticket.save()
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reopen_ticket(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = 'open'
        ticket.save()
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
