from django.urls import path

from .views.statistics import UserStatisticsView
from .views import (
    NoteView,
    NoteDetailView,
    NotesVersionView,
    NotePinView,
    NoteBulkOrderView,
    NoteImageUploadView,
    NoteImageDeleteView,
    NoteDownloadView,
    LabelView,
    LabelDetailView,
    GenerateNoteView,
    SummarizeNoteView,
    TranslateNoteView,
    AIAssistantView,
    UserNoteImagesView,
    UserNoteImageDeleteView,
    NoteHistoryView,
    NoteHistoryRestoreView,
)

urlpatterns = [
    path("", NoteView.as_view(), name="notes"),
    path("version/", NotesVersionView.as_view(), name="notes-version"),
    path("bulk-order/", NoteBulkOrderView.as_view(), name="notes-bulk-order"),
    path("statistics/", UserStatisticsView.as_view(), name="user-statistics"),
    path("<int:note_id>/", NoteDetailView.as_view(), name="note-detail"),
    path("download/<int:note_id>/", NoteDownloadView.as_view(), name="note-download"),
    path("<int:note_id>/pin/", NotePinView.as_view(), name="note-pin"),
    path("images/", UserNoteImagesView.as_view(), name="user-note-images"),
    path(
        "images/<int:image_id>/",
        UserNoteImageDeleteView.as_view(),
        name="user-note-image-delete",
    ),
    path(
        "<int:note_id>/images/", NoteImageUploadView.as_view(), name="note-image-upload"
    ),
    path(
        "<int:note_id>/images/<int:image_id>/",
        NoteImageDeleteView.as_view(),
        name="note-image-delete",
    ),
    # Label endpoints
    path("labels/", LabelView.as_view(), name="labels"),
    path("labels/<int:label_id>/", LabelDetailView.as_view(), name="label-detail"),
    # AI endpoints
    path("generate/", GenerateNoteView.as_view(), name="generate-note"),
    path("assistant/", AIAssistantView.as_view(), name="ai-assistant"),
    path(
        "<int:note_id>/summarize/", SummarizeNoteView.as_view(), name="summarize-note"
    ),
    path(
        "<int:note_id>/translate/", TranslateNoteView.as_view(), name="translate-note"
    ),
    # History endpoints
    path("<int:note_id>/history/", NoteHistoryView.as_view(), name="note-history"),
    path(
        "<int:note_id>/history/<int:history_id>/restore/",
        NoteHistoryRestoreView.as_view(),
        name="note-history-restore",
    ),
]
