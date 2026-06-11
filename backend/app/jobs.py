import logging
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit

from django.db import close_old_connections
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from .models import ExportJob

logger = logging.getLogger("app.jobs")
executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="export-job")


def _view_classes():
    from .views import (
        BulkExportMarkdownView,
        BulkExportPdfView,
        BulkExportScreenshotView,
        BulkExportStructuredJsonView,
        ExportMarkdownView,
        ExportPdfView,
        ExportScreenshotView,
        ExportStructuredJsonView,
        ExportTabularView,
        WebsiteCrawlView,
    )

    return {
        "crawl": WebsiteCrawlView,
        "pdf": ExportPdfView,
        "markdown": ExportMarkdownView,
        "json": ExportStructuredJsonView,
        "tabular": ExportTabularView,
        "screenshot": ExportScreenshotView,
        "bulk-pdf": BulkExportPdfView,
        "bulk-markdown": BulkExportMarkdownView,
        "bulk-json": BulkExportStructuredJsonView,
        "bulk-screenshot": BulkExportScreenshotView,
    }


def tool_for(endpoint, request_data):
    if endpoint == "tabular":
        return request_data.get("export_format", "csv")
    return endpoint.removeprefix("bulk-")


def serialize_job(job):
    result = job.result or {}
    return {
        "id": str(job.public_id),
        "tool": job.tool,
        "status": job.status,
        "title": job.title,
        "error": job.error,
        "response_status": job.response_status,
        "result": result if job.status == ExportJob.COMPLETED else None,
        "download_url": f"/api/jobs/{job.public_id}/download/" if job.status == ExportJob.COMPLETED else None,
        "created_at": job.created_at,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
    }


def enqueue(job_id):
    executor.submit(run_job, job_id)


def run_job(job_id):
    close_old_connections()
    job = None
    try:
        claimed = ExportJob.objects.filter(pk=job_id, status=ExportJob.PENDING).update(
            status=ExportJob.RUNNING,
            started_at=timezone.now(),
            error="",
        )
        if not claimed:
            return
        job = ExportJob.objects.select_related("user").get(pk=job_id)

        factory = APIRequestFactory()
        origin = urlsplit(job.origin)
        request = factory.post(
            f"/api/jobs/internal/{job.endpoint}/",
            data=job.request_data,
            format="json",
            REMOTE_ADDR=job.client_ip or "127.0.0.1",
            HTTP_HOST=origin.netloc or "localhost",
            secure=origin.scheme == "https",
        )
        if job.user:
            force_authenticate(request, user=job.user)
        response = _view_classes()[job.endpoint].as_view()(request)
        response.render()
        payload = response.data if isinstance(response.data, (dict, list)) else {"detail": str(response.data)}

        job.response_status = response.status_code
        job.result = payload
        job.title = payload.get("title", "") if isinstance(payload, dict) else ""
        if 200 <= response.status_code < 300:
            job.status = ExportJob.COMPLETED
        else:
            job.status = ExportJob.FAILED
            job.error = payload.get("detail", "Job failed.") if isinstance(payload, dict) else "Job failed."
    except Exception:
        logger.exception("Export job %s failed", job_id)
        job = job or ExportJob.objects.get(pk=job_id)
        job.status = ExportJob.FAILED
        job.response_status = 500
        job.error = "The export job failed unexpectedly."
    finally:
        if job:
            job.finished_at = timezone.now()
            job.save(update_fields=["status", "title", "result", "error", "response_status", "finished_at"])
        close_old_connections()
