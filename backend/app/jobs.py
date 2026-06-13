import hashlib
import hmac
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit

import requests
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
        "schedule_id": str(job.schedule.public_id) if job.schedule_id else None,
        "idempotency_key": job.idempotency_key,
        "webhook_configured": bool(job.webhook_url or (job.schedule_id and job.schedule.webhook_url)),
        "webhook_status": job.webhook_status,
        "webhook_error": job.webhook_error,
        "webhook_delivered_at": job.webhook_delivered_at,
        "created_at": job.created_at,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
    }


def enqueue(job_id):
    executor.submit(run_job, job_id)


def deliver_webhook(job):
    webhook_url = job.webhook_url or (job.schedule.webhook_url if job.schedule_id else "")
    webhook_secret = job.webhook_secret or (job.schedule.webhook_secret if job.schedule_id else "")
    if not webhook_url:
        return

    body = json.dumps(
        {"event": f"export.{job.status}", "job": serialize_job(job)},
        default=str,
        separators=(",", ":"),
    ).encode()
    headers = {
        "Content-Type": "application/json",
        "X-ExtractKit-Event": f"export.{job.status}",
        "X-ExtractKit-Job-Id": str(job.public_id),
    }
    if webhook_secret:
        headers["X-ExtractKit-Signature"] = "sha256=" + hmac.new(
            webhook_secret.encode(), body, hashlib.sha256
        ).hexdigest()

    try:
        response = requests.post(webhook_url, data=body, headers=headers, timeout=10)
        job.webhook_status = response.status_code
        response.raise_for_status()
        job.webhook_delivered_at = timezone.now()
        job.webhook_error = ""
    except requests.RequestException as exc:
        job.webhook_error = str(exc)[:1000]
    job.save(update_fields=["webhook_status", "webhook_delivered_at", "webhook_error"])


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
        job = ExportJob.objects.select_related("user", "schedule").get(pk=job_id)

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
        job = job or ExportJob.objects.select_related("schedule").get(pk=job_id)
        job.status = ExportJob.FAILED
        job.response_status = 500
        job.error = "The export job failed unexpectedly."
    finally:
        if job:
            job.finished_at = timezone.now()
            job.save(update_fields=["status", "title", "result", "error", "response_status", "finished_at"])
            deliver_webhook(job)
        close_old_connections()
