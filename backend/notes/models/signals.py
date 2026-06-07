from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_user_storage_stats(sender, instance, created, **kwargs):
    if created:
        from .stats import UserStorageStats

        UserStorageStats.objects.create(user=instance)


@receiver(post_save, sender=User)
def create_default_labels(sender, instance, created, **kwargs):
    if created:
        from .base import Label

        default_labels = [
            {"name": "Work", "color": "#FF6B6B"},
            {"name": "Personal", "color": "#4ECDC4"},
            {"name": "Ideas", "color": "#FFD93D"},
            {"name": "Important", "color": "#FF8B94"},
            {"name": "Todo", "color": "#95E1D3"},
            {"name": "Learning", "color": "#A8E6CF"},
        ]

        for label_data in default_labels:
            Label.objects.create(
                user=instance, name=label_data["name"], color=label_data["color"]
            )


@receiver(post_save, sender="notes.Note")
def update_note_count_on_save(sender, instance, created, **kwargs):
    from .base import Note
    from .stats import UserStorageStats

    try:
        stats = UserStorageStats.objects.get(user=instance.user)
    except UserStorageStats.DoesNotExist:
        return

    stats.note_count = Note.objects.filter(user=instance.user).count()

    if not created:
        try:
            stats.recalculate_stats()
        except (FileNotFoundError, OSError):
            stats.save()
    else:
        text_size = 0
        if instance.title:
            text_size += len(instance.title.encode("utf-8"))
        if instance.content:
            text_size += len(instance.content.encode("utf-8"))
        stats.storage_used_bytes += text_size
        stats.save()


@receiver(post_delete, sender="notes.Note")
def update_note_count_on_delete(sender, instance, **kwargs):
    from .base import Note
    from .stats import UserStorageStats

    try:
        stats = UserStorageStats.objects.get(user=instance.user)
    except UserStorageStats.DoesNotExist:
        return
    stats.note_count = Note.objects.filter(user=instance.user).count()

    text_size = 0
    if instance.title:
        text_size += len(instance.title.encode("utf-8"))
    if instance.content:
        text_size += len(instance.content.encode("utf-8"))
    stats.storage_used_bytes = max(0, stats.storage_used_bytes - text_size)
    stats.save()


@receiver(post_save, sender="notes.Label")
def update_label_count_on_save(sender, instance, created, **kwargs):
    from .base import Label
    from .stats import UserStorageStats

    if created:
        try:
            stats = UserStorageStats.objects.get(user=instance.user)
        except UserStorageStats.DoesNotExist:
            return
        stats.label_count = Label.objects.filter(user=instance.user).count()
        stats.save()


@receiver(post_delete, sender="notes.Label")
def update_label_count_on_delete(sender, instance, **kwargs):
    from .base import Label
    from .stats import UserStorageStats

    try:
        stats = UserStorageStats.objects.get(user=instance.user)
    except UserStorageStats.DoesNotExist:
        return
    stats.label_count = Label.objects.filter(user=instance.user).count()
    stats.save()


@receiver(post_save, sender="notes.NoteImage")
def update_storage_on_image_save(sender, instance, created, **kwargs):
    from .stats import UserStorageStats

    if created and instance.image:
        try:
            stats = UserStorageStats.objects.get(user=instance.note.user)
        except UserStorageStats.DoesNotExist:
            return
        try:
            if instance.image:
                file_size = instance.image.size
                stats.storage_used_bytes += file_size
                stats.save()
        except (FileNotFoundError, OSError, ValueError) as e:
            logger.warning(
                f"Could not update storage for note image {instance.id}: {e}"
            )


@receiver(pre_save, sender="notes.Note")
def capture_note_history(sender, instance, **kwargs):
    if not instance.pk:
        return

    from .base import Note, NoteHistory

    try:
        previous = Note.objects.get(pk=instance.pk)
    except Note.DoesNotExist:
        return

    if (
        previous.title == instance.title
        and previous.content == instance.content
        and previous.content_type == instance.content_type
    ):
        return

    NoteHistory.objects.create(
        note=previous,
        title=previous.title,
        content=previous.content,
        content_type=previous.content_type,
    )

    excess = (
        NoteHistory.objects.filter(note=previous)
        .order_by("-saved_at")
        .values_list("id", flat=True)[NoteHistory.MAX_HISTORY_PER_NOTE :]
    )
    if excess:
        NoteHistory.objects.filter(id__in=list(excess)).delete()
