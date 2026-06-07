from django.db import models
from django.contrib.auth.models import User


class Label(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="labels")
    name = models.CharField(max_length=50)
    color = models.CharField(
        max_length=7,
        default="#2196F3",
        help_text="Label color in hex format (e.g., #2196F3)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["user", "name"]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Note(models.Model):
    CONTENT_TYPE_CHOICES = [
        ("text", "Plain Text"),
        ("markdown", "Markdown"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="note_user")
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True)
    content_type = models.CharField(
        max_length=10, choices=CONTENT_TYPE_CHOICES, default="markdown"
    )
    labels = models.ManyToManyField(Label, blank=True, related_name="notes")
    color = models.CharField(
        max_length=7,
        default="#000000",
        help_text="Text color in hex format (e.g., #000000)",
    )
    bg_color = models.CharField(
        max_length=7,
        default="#ffffff",
        help_text="Background color in hex format (e.g., #ffffff)",
    )
    order = models.IntegerField(
        default=0, help_text="Custom order index for user-defined sorting"
    )
    is_pinned = models.BooleanField(default=False)
    pin_order = models.IntegerField(
        default=0, help_text="Order index for pinned notes (lower = higher priority)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title if self.title else f"Note {self.id}"


class NoteHistory(models.Model):
    MAX_HISTORY_PER_NOTE = 50

    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="history")
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True)
    content_type = models.CharField(max_length=10, default="markdown")
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-saved_at"]

    def __str__(self):
        return f"History for Note {self.note_id} at {self.saved_at}"
