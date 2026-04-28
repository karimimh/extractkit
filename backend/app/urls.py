from django.urls import path

from .views import ExportPdfView, PreviewPageView

urlpatterns = [
    path("export/", ExportPdfView.as_view(), name="export-pdf"),
    path("preview/", PreviewPageView.as_view(), name="preview-page"),
]
