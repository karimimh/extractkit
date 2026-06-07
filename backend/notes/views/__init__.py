"""
Views module for the notes app.

This module organizes all views into logical submodules:
- base: Common base classes and helper methods
- notes: Main note CRUD operations
- actions: Note action operations (pin)
- images: Image upload and delete operations
- downloads: Note download functionality
- labels: Label management
- statistics: User storage and usage statistics
- ai: AI-powered features (generate, summarize, translate)
"""

# Import from submodules for easy access
from .base import BaseNoteView
from .notes import NoteView, NoteDetailView, NotesVersionView
from .actions import NotePinView, NoteBulkOrderView
from .images import (
    NoteImageUploadView,
    NoteImageDeleteView,
    UserNoteImagesView,
    UserNoteImageDeleteView,
)
from .downloads import NoteDownloadView
from .labels import LabelView, LabelDetailView
from .ai import GenerateNoteView, SummarizeNoteView, TranslateNoteView
from .assistant import AIAssistantView
from .history import NoteHistoryView, NoteHistoryRestoreView

# Export all views
__all__ = [
    # Base
    "BaseNoteView",
    # Note views
    "NoteView",
    "NoteDetailView",
    "NotesVersionView",
    # Action views
    "NotePinView",
    "NoteBulkOrderView",
    # Image views
    "NoteImageUploadView",
    "NoteImageDeleteView",
    "UserNoteImagesView",
    "UserNoteImageDeleteView",
    # Download views
    "NoteDownloadView",
    # Label views
    "LabelView",
    "LabelDetailView",
    # AI views
    "GenerateNoteView",
    "SummarizeNoteView",
    "TranslateNoteView",
    "AIAssistantView",
    # History views
    "NoteHistoryView",
    "NoteHistoryRestoreView",
]
