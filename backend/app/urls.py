from django.urls import path

from .views import ExportPdfView

urlpatterns = [
    path("export/", ExportPdfView.as_view(), name="export-pdf"),
]
