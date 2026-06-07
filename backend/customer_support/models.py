from django.db import models
from django.contrib.auth.models import User


class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]

    user = models.ForeignKey(User,
                             on_delete=models.CASCADE,
                             related_name='support_tickets')
    subject = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=10,
                              choices=STATUS_CHOICES,
                              default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Ticket #{self.id} - {self.user.username}"


class SupportMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket,
                               on_delete=models.CASCADE,
                               related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender.username} at {self.created_at}"
