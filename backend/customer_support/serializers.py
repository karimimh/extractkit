from rest_framework import serializers
from .models import SupportTicket, SupportMessage


class SupportMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username',
                                            read_only=True)
    sender_email = serializers.EmailField(source='sender.email',
                                          read_only=True)

    class Meta:
        model = SupportMessage
        fields = [
            'id', 'ticket', 'sender', 'sender_username', 'sender_email',
            'message', 'is_admin', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'is_admin', 'created_at']


class SupportTicketSerializer(serializers.ModelSerializer):
    messages = SupportMessageSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.username',
                                          read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'user', 'user_username', 'subject', 'status', 'created_at',
            'updated_at', 'messages', 'unread_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.is_staff:
                return obj.messages.filter(is_admin=False).count()
            else:
                return obj.messages.filter(is_admin=True).count()
        return 0


class SupportTicketListSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username',
                                          read_only=True)
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'user', 'user_username', 'subject', 'status', 'created_at',
            'updated_at', 'last_message', 'message_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'message': last_msg.message,
                'created_at': last_msg.created_at,
                'is_admin': last_msg.is_admin
            }
        return None

    def get_message_count(self, obj):
        return obj.messages.count()
