from django.db import models
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)


class UserStorageStats(models.Model):
    user = models.OneToOneField(User,
                                on_delete=models.CASCADE,
                                related_name='storage_stats')

    storage_used_bytes = models.BigIntegerField(
        default=0, help_text="Total storage used in bytes")

    note_count = models.IntegerField(
        default=0, help_text="Total number of notes (excluding trashed)")
    label_count = models.IntegerField(default=0,
                                      help_text="Total number of labels")

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Storage Statistics"
        verbose_name_plural = "User Storage Statistics"

    def __str__(self):
        return f"Stats for {self.user.username}"

    @property
    def storage_used_mb(self):
        return round(self.storage_used_bytes / (1024 * 1024), 2)

    def recalculate_stats(self):
        from .base import Note, Label
        from .images import NoteImage

        total_storage = 0

        note_images = NoteImage.objects.filter(note__user=self.user)
        for img in note_images:
            if img.image:
                try:
                    total_storage += img.image.size
                except (FileNotFoundError, OSError) as e:
                    logger.warning(
                        f"File not found for note image {img.id} (user: {self.user.username}): {e}"
                    )

        notes = Note.objects.filter(user=self.user)
        for note in notes:
            if note.title:
                total_storage += len(note.title.encode('utf-8'))
            if note.content:
                total_storage += len(note.content.encode('utf-8'))

        note_count = Note.objects.filter(user=self.user).count()
        label_count = Label.objects.filter(user=self.user).count()

        self.storage_used_bytes = total_storage
        self.note_count = note_count
        self.label_count = label_count
        self.save()

        return {
            'storage_used_bytes': self.storage_used_bytes,
            'storage_used_mb': self.storage_used_mb,
            'note_count': self.note_count,
            'label_count': self.label_count
        }
