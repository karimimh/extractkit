from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from django.db.models import Sum
from .models import Note


class HasNoteLimitPermission(permissions.BasePermission):
    """
    Check if user has not exceeded their note count limit
    """
    message = "You have reached your note limit. Upgrade to Pro for unlimited notes."

    def has_permission(self, request, view):
        if request.method not in permissions.SAFE_METHODS:
            if request.method == 'POST':
                user_profile = getattr(request.user, 'profile', None)
                if not user_profile:
                    return True

                max_notes = user_profile.max_notes
                if max_notes is not None:
                    current_count = Note.objects.filter(
                        user=request.user).count()

                    if current_count >= max_notes:
                        raise PermissionDenied(self.message)

        return True


class HasCharacterLimitPermission(permissions.BasePermission):
    """
    Check if user has not exceeded their total character limit
    """
    message = "You have reached your character limit. Upgrade to Pro for unlimited characters."

    def has_permission(self, request, view):
        if request.method in ['POST', 'PUT', 'PATCH']:
            user_profile = getattr(request.user, 'profile', None)
            if not user_profile:
                return True

            max_characters = user_profile.max_characters
            if max_characters is not None:
                # Calculate current total characters
                notes = Note.objects.filter(user=request.user)
                total_chars = 0
                for note in notes:
                    if note.title:
                        total_chars += len(note.title)
                    if note.content:
                        total_chars += len(note.content)

                # Calculate new content characters
                new_chars = 0
                title = request.data.get('title', '')
                content = request.data.get('content', '')

                if title:
                    new_chars += len(title)
                if content:
                    new_chars += len(content)

                # For updates, subtract the old note's characters
                if request.method in ['PUT', 'PATCH'] and hasattr(
                        view, 'kwargs'):
                    note_id = view.kwargs.get('note_id') or view.kwargs.get(
                        'pk')
                    if note_id:
                        try:
                            old_note = Note.objects.get(id=note_id,
                                                        user=request.user)
                            old_chars = 0
                            if old_note.title:
                                old_chars += len(old_note.title)
                            if old_note.content:
                                old_chars += len(old_note.content)
                            total_chars -= old_chars
                        except Note.DoesNotExist:
                            pass

                if total_chars + new_chars > max_characters:
                    raise PermissionDenied(self.message)

        return True


class HasStorageLimitPermission(permissions.BasePermission):
    """
    Check if user has not exceeded their storage limit
    """
    message = "You have reached your storage limit. Upgrade to Pro for more storage."

    def has_permission(self, request, view):
        if request.method in ['POST', 'PUT', 'PATCH']:
            user_profile = getattr(request.user, 'profile', None)
            if not user_profile:
                return True

            max_storage = user_profile.max_storage_bytes
            if max_storage is not None:
                storage_stats = getattr(request.user, 'storage_stats', None)
                if storage_stats:
                    # For image uploads, check if adding this file would exceed limit
                    if hasattr(request.data,
                               'get') and request.data.get('image'):
                        image = request.data.get('image')
                        if hasattr(image, 'size'):
                            if storage_stats.storage_used_bytes + image.size > max_storage:
                                raise PermissionDenied(self.message)

        return True


class HasAIAccessPermission(permissions.BasePermission):
    """
    Check if user has access to AI features (Pro only)
    """
    message = "AI features are only available for Pro users. Upgrade to access AI capabilities."

    def has_permission(self, request, view):
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile or not user_profile.has_ai_access:
            raise PermissionDenied(self.message)
        return True
