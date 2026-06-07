from django.db import models
from django.contrib.auth.models import User
import os
import uuid


def note_image_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('note_images', str(instance.note.user.id), filename)


def temp_image_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('temp_images', str(instance.user.id), filename)


class NoteImage(models.Model):
    note = models.ForeignKey('Note',
                             on_delete=models.CASCADE,
                             related_name='images')
    image = models.ImageField(upload_to=note_image_upload_path)
    alt_text = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        note_title = self.note.title if self.note.title else f"Note {self.note.id}"
        return f"Image for {note_title}"
