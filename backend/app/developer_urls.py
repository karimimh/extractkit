"""Public URL surface used to generate the developer OpenAPI schema."""

from django.urls import path

from .views_jobs import (
    ExportJobDetailView,
    ExportJobDownloadView,
    ExportJobListCreateView,
    ExportJobRerunView,
)
from .views_mcp import MCPView

urlpatterns = [
    path("api/jobs/", ExportJobListCreateView.as_view(), name="public-export-jobs"),
    path("api/jobs/<uuid:public_id>/", ExportJobDetailView.as_view(), name="public-export-job-detail"),
    path("api/jobs/<uuid:public_id>/rerun/", ExportJobRerunView.as_view(), name="public-export-job-rerun"),
    path("api/jobs/<uuid:public_id>/download/", ExportJobDownloadView.as_view(), name="public-export-job-download"),
    path("api/mcp/", MCPView.as_view(), name="public-mcp"),
]
